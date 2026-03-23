'use client';
import { useState } from 'react';
import { Dropdown, Modal, Button, Form, Input, Select, Spin, Popconfirm, Typography } from 'antd';
import { MoreOutlined, EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { showToastErrorMsg, showToastInfoMsg } from '@/helpers/frontend';
import { useProfiles, useUsers } from '@/hooks';
import userService from '@/services/(routes)/users';
import { Container, FlexBox, SpinWrapper, StyledButton, ColorTable } from '@/_components/layout/client/styled';
import { DEFAULT_PAGINATION_SIZE, USER_TABLE_COLUMNS_BASE } from '@/config/constants';

const menuItems = (record, openEdit, handleDelete) => [
  {
    key: 'edit',
    label: 'Edit',
    icon: <EditOutlined />,
    onClick: () => openEdit(record)
  },
  {
    key: 'delete',
    label: (
      <Popconfirm title='Delete this user?' okText='Yes' cancelText='No' onConfirm={() => handleDelete(record._id)}>
        Delete
      </Popconfirm>
    ),
    icon: <DeleteOutlined />,
    danger: true
  }
];

export const ActionDropdown = ({ record, openEdit, handleDelete }) => (
  <Dropdown trigger={['click']} menu={{ items: menuItems(record, openEdit, handleDelete) }}>
    <Button type='text' icon={<MoreOutlined />} />
  </Dropdown>
);

export default function Users() {
  const { users, isLoading, mutate } = useUsers();
  const { profiles: profileData } = useProfiles();
  const [search, setSearch] = useState('');
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form] = Form.useForm();

  const openEdit = (record) => {
    form.setFieldsValue({ ...record, profiles: record.profiles || [] });
    setEditingUser(record);
    setModalOpen(true);
  };

  const openAdd = () => {
    setEditingUser(null);
    form.resetFields();
    setModalOpen(true);
  };

  const USER_TABLE_COLUMNS = [
    {
      title: 'NO',
      key: 'index',
      width: 60,
      align: 'center',
      render: (_, __, index) => <span style={{ color: '#666', fontWeight: 500 }}>{index + 1}</span>
    },
    ...USER_TABLE_COLUMNS_BASE,
    {
      title: 'ACTIONS',
      key: 'actions',
      align: 'center',
      render: (_, record) => <ActionDropdown record={record} openEdit={openEdit} handleDelete={handleDelete} />
    }
  ];

  const filteredUsers = users?.filter((u) => {
    const term = search.toLowerCase();
    return u.username?.toLowerCase().includes(term) || u.email?.toLowerCase().includes(term);
  });

  const handleSubmit = async () => {
    if (isSubmitting) return; // prevent double click
    setIsSubmitting(true);
    try {
      const values = await form.validateFields();
      if (editingUser) {
        await userService.updateUser(editingUser._id, values);
        showToastInfoMsg('User updated successfully.');
      } else {
        await userService.createUser(values);
        showToastInfoMsg('User added successfully.');
      }
      setModalOpen(false);
      setEditingUser(null);
      form.resetFields();
      mutate();
    } catch (err) {
      console.error(err);
      showToastErrorMsg('Action failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await userService.deleteUser(id);
      showToastInfoMsg('User deleted.');
      mutate();
    } catch (err) {
      showToastErrorMsg('Failed to delete user.');
    }
  };

  return (
    <>
      <Container>
        <FlexBox style={{ margin: '24px 0', justifyContent: 'end' }}>
          <Input
            size='middle'
            placeholder='Search by name or email...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 240, marginRight: 24 }}
          />
          <StyledButton size='middle' type='primary' icon={<PlusOutlined />} onClick={openAdd}>
            Add User
          </StyledButton>
        </FlexBox>
        {isLoading ? (
          <SpinWrapper>
            <Spin size='large' delay={500} />
          </SpinWrapper>
        ) : (
          <ColorTable
            columns={USER_TABLE_COLUMNS}
            dataSource={Array.isArray(filteredUsers) ? filteredUsers : []}
            rowKey='_id'
            pagination={{ pageSize: DEFAULT_PAGINATION_SIZE }}
            locale={{ emptyText: 'No users found' }}
          />
        )}
      </Container>
      <Modal
        title={<Typography.Title level={4}>{editingUser ? 'Edit User' : 'Add User'}</Typography.Title>}
        open={isModalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        okText='Submit'
        cancelText='Cancel'
        okButtonProps={{ disabled: isSubmitting }}
        confirmLoading={isSubmitting}
      >
        <Form layout='vertical' form={form}>
          <Form.Item label='Full Name' name='username' rules={[{ required: true }]}>
            <Input placeholder='Full Name' />
          </Form.Item>
          <Form.Item label='Email' name='email' rules={[{ required: true, type: 'email' }]}>
            <Input placeholder='Email' />
          </Form.Item>
          <Form.Item label='Role' name='role' rules={[{ required: true }]}>
            <Select
              placeholder='Select Role'
              options={[
                { label: 'VA', value: 'VA' },
                { label: 'Caller', value: 'CALLER' }
              ]}
            />
          </Form.Item>
          <Form.Item label='Status' name='status'>
            <Select
              placeholder='Select Status'
              options={[
                { label: 'Active', value: 'ACTIVE' },
                { label: 'Inactive', value: 'INACTIVE' }
              ]}
            />
          </Form.Item>
          <Form.Item label='Profiles' name='profiles'>
            <Select
              mode='multiple'
              placeholder='Select Profiles'
              optionFilterProp='label'
              filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
              showSearch
              allowClear
              options={profileData.map((profile) => ({
                label: profile.profileName,
                value: profile._id
              }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
