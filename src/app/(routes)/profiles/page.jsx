'use client';
import Image from 'next/image';
import { useState } from 'react';
import { Dropdown, Modal, Button, Form, Input, Spin, Popconfirm, Row, Col, Select, Typography } from 'antd';
import { MoreOutlined, EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Country, State, City } from 'country-state-city';
import profileService from '@/services/(routes)/profiles';
import { usePhones, useProfiles } from '@/hooks';
import { showToastErrorMsg, showToastInfoMsg } from '@/helpers/frontend';
import { PROFILE_TABLE_COLUMNS_BASE, NON_STRUCTURED_COUNTRIES, DEFAULT_PAGINATION_SIZE, TEMPLATE_OPTIONS } from '@/config/constants';
import { Container, FlexBox, SpinWrapper, StyledButton, ColorTable } from '@/_components/layout/client/styled';
import SortableList from '@/_components/layout/common/SortableList';
import { formatPhoneNumber } from '@/helpers/common';

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
      <Popconfirm title='Delete this profile?' okText='Yes' cancelText='No' onConfirm={() => handleDelete(record._id)}>
        Delete
      </Popconfirm>
    ),
    icon: <DeleteOutlined />,
    danger: true
  }
];

export const ActionDropdown = ({ record, openEdit, handleDelete }) => (
  <Dropdown
    trigger={['click']}
    menu={{
      items: menuItems(record, openEdit, handleDelete)
    }}
  >
    <Button type='text' icon={<MoreOutlined />} />
  </Dropdown>
);

export default function Profiles() {
  const { profiles, isLoading, mutate } = useProfiles();
  const { phones: phoneNumbers } = usePhones();
  const [search, setSearch] = useState('');
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [form] = Form.useForm();

  const openEdit = (record) => {
    setEditingProfile(record);
    form.setFieldsValue(record);
    setSelectedTemplate(record.profileTemplate || null);
    setModalOpen(true);
  };

  const openAdd = () => {
    setEditingProfile(null);
    form.resetFields();
    setSelectedTemplate(null);
    setModalOpen(true);
  };

  const PROFILE_TABLE_COLUMNS = [
    {
      title: 'NO',
      key: 'index',
      width: 60,
      align: 'center',
      render: (_, __, index) => <span style={{ color: '#666', fontWeight: 500 }}>{index + 1}</span>
    },
    ...PROFILE_TABLE_COLUMNS_BASE,
    {
      title: 'MOBILE',
      dataIndex: 'profileMobile',
      key: 'mobile',
      width: '160px',
      render: (mobile) => {
        const phone = phoneNumbers.find((p) => p.phoneNumber === mobile);
        return phone ? formatPhoneNumber(phone.phoneNumber) : <span style={{ color: '#999' }}>N/A</span>;
      }
    },
    {
      title: 'ACTIONS',
      key: 'actions',
      align: 'center',
      render: (_, record) => <ActionDropdown record={record} openEdit={openEdit} handleDelete={handleDelete} />
    }
  ];

  const filteredProfiles = profiles?.filter((u) => {
    const term = search.toLowerCase();
    return u.profileName?.toLowerCase().includes(term) || u.profileEmail?.toLowerCase().includes(term);
  });

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const values = await form.validateFields();
      if (editingProfile) {
        await profileService.updateProfile(editingProfile._id, values);
        showToastInfoMsg('Profile updated successfully.');
      } else {
        await profileService.createProfile(values);
        showToastInfoMsg('Profile added successfully.');
      }
      setModalOpen(false);
      setEditingProfile(null);
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
      await profileService.deleteProfile(id);
      showToastInfoMsg('Profile deleted.');
      mutate();
    } catch (err) {
      showToastErrorMsg('Failed to delete profile.');
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
            Add Profile
          </StyledButton>
        </FlexBox>
        {isLoading ? (
          <SpinWrapper>
            <Spin size='large' delay={1000} />
          </SpinWrapper>
        ) : (
          <ColorTable
            columns={PROFILE_TABLE_COLUMNS}
            dataSource={Array.isArray(filteredProfiles) ? filteredProfiles : []} // ✅ always safe
            rowKey='_id'
            pagination={{ pageSize: DEFAULT_PAGINATION_SIZE }}
          />
        )}
      </Container>
      <Modal
        title={<Typography.Title level={4}>{editingProfile ? 'Edit Profile' : 'Add Profile'}</Typography.Title>}
        open={isModalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        okText='Submit'
        cancelText='Cancel'
        width='90vw'
        style={{ maxWidth: '1600px' }}
        okButtonProps={{ disabled: isSubmitting }}
        confirmLoading={isSubmitting}
      >
        <Form layout='vertical' form={form}>
          <Row gutter={16}>
            <Col xs={24} xl={6}>
              <Form.Item label='Profile Name' name='profileName' rules={[{ required: true }]}>
                <Input placeholder='Name' />
              </Form.Item>
            </Col>
            <Col xs={24} xl={6}>
              <Form.Item label='Title' name='profileTitle' rules={[{ required: true, message: 'Please enter title!' }]}>
                <Input placeholder='Title' />
              </Form.Item>
            </Col>
            <Col xs={24} xl={6}>
              <Form.Item label='Email' name='profileEmail' rules={[{ required: true, type: 'email' }]}>
                <Input placeholder='Email' type='email' />
              </Form.Item>
            </Col>
            <Col xs={24} xl={6}>
              <Form.Item label='Mobile' name='profileMobile'>
                <Select
                  placeholder='Select phone number'
                  showSearch
                  optionFilterProp='label'
                  filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                  options={phoneNumbers.map((p) => ({
                    label: formatPhoneNumber(p.phoneNumber),
                    value: p.phoneNumber
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label='LinkedIn' name='profileLinkedIn'>
            <Input placeholder='LinkedIn' />
          </Form.Item>
          <Form.Item label='Address'>
            <Row gutter={16}>
              <Col xs={24} xl={4}>
                <Form.Item name={['profileAddress', 'country']} label='Country'>
                  <Select
                    showSearch
                    placeholder='Select Country'
                    options={Country.getAllCountries().map((c) => ({
                      label: c.name,
                      value: c.isoCode
                    }))}
                    optionFilterProp='label'
                    filterOption={(input, option) => option.label.toLowerCase().includes(input.toLowerCase())}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} xl={3}>
                <Form.Item
                  label='State / Province'
                  shouldUpdate={(prev, curr) => prev.profileAddress?.country !== curr.profileAddress?.country}
                >
                  {({ getFieldValue }) => {
                    const country = getFieldValue(['profileAddress', 'country']);
                    const states = country ? State.getStatesOfCountry(country) : [];
                    const hasStates = country && !NON_STRUCTURED_COUNTRIES.includes(country) && states.length > 0;

                    return (
                      <Form.Item name={['profileAddress', 'state']} noStyle>
                        {hasStates ? (
                          <Select
                            placeholder='Select State'
                            showSearch
                            disabled={!country}
                            options={states.map((s) => ({
                              label: s.name,
                              value: s.isoCode
                            }))}
                            optionFilterProp='label'
                            filterOption={(input, option) => option.label.toLowerCase().includes(input.toLowerCase())}
                          />
                        ) : (
                          <Input placeholder='State / Province' />
                        )}
                      </Form.Item>
                    );
                  }}
                </Form.Item>
              </Col>
              <Col xs={24} xl={5}>
                <Form.Item
                  noStyle
                  shouldUpdate={(prev, curr) =>
                    prev.profileAddress?.state !== curr.profileAddress?.state ||
                    prev.profileAddress?.country !== curr.profileAddress?.country
                  }
                >
                  {({ getFieldValue }) => {
                    const country = getFieldValue(['profileAddress', 'country']);
                    const state = getFieldValue(['profileAddress', 'state']);
                    const states = country ? State.getStatesOfCountry(country) : [];
                    const hasStates = states.length > 0;

                    let cities = [];
                    if (hasStates && country && state) {
                      cities = City.getCitiesOfState(country, state);
                    }

                    return (
                      <Form.Item name={['profileAddress', 'city']} label='City'>
                        {hasStates && cities.length > 0 ? (
                          <Select
                            placeholder='Select City'
                            disabled={!state}
                            showSearch
                            options={cities.map((c) => ({
                              label: c.name,
                              value: c.name
                            }))}
                            optionFilterProp='label'
                            filterOption={(input, option) => option.label.toLowerCase().includes(input.toLowerCase())}
                          />
                        ) : (
                          <Input placeholder='City' />
                        )}
                      </Form.Item>
                    );
                  }}
                </Form.Item>
              </Col>
              <Col xs={24} xl={9}>
                <Form.Item name={['profileAddress', 'street']} label='Street'>
                  <Input placeholder='Street Address' />
                </Form.Item>
              </Col>
              <Col xs={24} xl={3}>
                <Form.Item name={['profileAddress', 'zip']} label='Zip Code'>
                  <Input placeholder='Postal Code' />
                </Form.Item>
              </Col>
            </Row>
          </Form.Item>
          <Form.List
            name='profileEducation'
            initialValue={editingProfile?.profileEducation || []}
            rules={[
              {
                validator: async (_, names) => {
                  if (!names || names.length < 1) {
                    return Promise.reject(new Error('At least one education field is required.'));
                  }
                }
              }
            ]}
          >
            {(fields, { add, remove }) => (
              <>
                <Form.Item label='Education'>
                  {fields.map(({ key, fieldKey, name, field }) => (
                    <Row gutter={16} key={key}>
                      <Col xs={24} xl={7}>
                        <Form.Item {...field} name={[name, 'institution']} label='Institution' rules={[{ required: true }]}>
                          <Input placeholder='Institution Name' />
                        </Form.Item>
                      </Col>

                      <Col xs={24} xl={2}>
                        <Form.Item {...field} name={[name, 'finalEvaluationGrade']} label='FEG'>
                          <Input placeholder='Final Evaluation Grade' />
                        </Form.Item>
                      </Col>

                      <Col xs={24} xl={3}>
                        <Form.Item {...field} name={[name, 'startDate']} label='Start Date' rules={[{ required: true }]}>
                          <Input placeholder='Start Date' />
                        </Form.Item>
                      </Col>

                      <Col xs={24} xl={3}>
                        <Form.Item {...field} name={[name, 'yearOfCompletion']} label='End Date'>
                          <Input placeholder='Year Of Completion' />
                        </Form.Item>
                      </Col>

                      <Col xs={24} xl={4}>
                        <Form.Item {...field} name={[name, 'fieldOfStudy']} label='Field of Study' rules={[{ required: true }]}>
                          <Input placeholder='Field of Study' />
                        </Form.Item>
                      </Col>

                      <Col xs={24} xl={4}>
                        <Form.Item {...field} name={[name, 'educationLevel']} label='Education Level' rules={[{ required: true }]}>
                          <Input placeholder='Education Level' />
                        </Form.Item>
                      </Col>
                      <Col
                        xs={24}
                        xl={1}
                        style={{
                          display: 'flex',
                          alignItems: 'center', // vertical center
                          justifyContent: 'center' // optional: horizontal center
                        }}
                      >
                        <Button type='dashed' icon={<DeleteOutlined />} onClick={() => remove(name)} />
                      </Col>
                    </Row>
                  ))}
                  <Form.Item>
                    <Button type='dashed' onClick={() => add()} icon={<PlusOutlined />}>
                      Add Education
                    </Button>
                  </Form.Item>
                </Form.Item>
              </>
            )}
          </Form.List>
          <Form.List name='profileWorkExperience'>
            {(fields, { add, remove }) => {
              const items = fields.map((field) => ({
                key: field.key,
                index: field.name,
                children: (
                  <Row gutter={16} align='middle'>
                    <Col span={6}>
                      <Form.Item name={[field.name, 'employer']} label='Employer' rules={[{ required: true }]}>
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item name={[field.name, 'jobTitle']} label='Job Title' rules={[{ required: true }]}>
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col span={4}>
                      <Form.Item name={[field.name, 'startDate']} label='Start'>
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col span={4}>
                      <Form.Item name={[field.name, 'endDate']} label='End'>
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col span={3}>
                      <Form.Item name={[field.name, 'location']} label='Location'>
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col span={1}>
                      <Button danger type='text' icon={<DeleteOutlined />} onClick={() => remove(field.name)} />
                    </Col>
                  </Row>
                )
              }));

              return (
                <>
                  <Typography.Title level={5}>Work Experience</Typography.Title>
                  <SortableList
                    items={items}
                    onReorder={(newItems) => {
                      const reordered = newItems.map((item) => form.getFieldValue(['profileWorkExperience', item.index]));
                      form.setFieldValue('profileWorkExperience', reordered);
                    }}
                  />
                  <Button type='dashed' icon={<PlusOutlined />} onClick={() => add()} style={{ marginTop: 12, marginBottom: 12 }}>
                    Add Experience
                  </Button>
                </>
              );
            }}
          </Form.List>
          <Row gutter={16}>
            <Col xs={24} xl={6}>
              <Form.Item label='Template Type' name='profileTemplate'>
                <Select
                  value={selectedTemplate}
                  placeholder='Choose template'
                  options={TEMPLATE_OPTIONS.map((t) => ({
                    label: t.label,
                    value: t.value
                  }))}
                  onChange={(v) => setSelectedTemplate(v)}
                />
              </Form.Item>
            </Col>
          </Row>
          {selectedTemplate && (
            <Row gutter={16}>
              <Col xs={24} xl={6}>
                <Form.Item shouldUpdate>
                  <Image
                    src={TEMPLATE_OPTIONS.find((t) => t.value === selectedTemplate)?.img}
                    alt='Template Preview'
                    width={200}
                    height={260}
                    style={{ borderRadius: 6, border: '1px solid #eee' }}
                  />
                </Form.Item>
              </Col>
            </Row>
          )}
        </Form>
      </Modal>
    </>
  );
}
