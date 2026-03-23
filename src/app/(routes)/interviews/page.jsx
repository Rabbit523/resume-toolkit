'use client';
import { useEffect, useMemo, useState } from 'react';
import { Modal, Button, Form, Input, Select, DatePicker, Dropdown, Popconfirm, Typography, Spin, Tag, Badge, Row, Col } from 'antd';
import { MoreOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import interviewService from '@/services/(routes)/interviews';
import { showToastInfoMsg, showToastErrorMsg } from '@/helpers/frontend';
import { ColorTable, Container, FlexBox, SpinWrapper, StyledButton } from '@/_components/layout/client/styled';
import { useInterviews } from '@/hooks';
import { DEFAULT_PAGINATION_SIZE, RESULT_COLORS, STAGE_COLORS, TYPE_COLORS } from '@/config/constants';
import config from '@/services/(routes)/config';

const ActionDropdown = ({ record, openEdit, handleDelete }) => (
  <Dropdown
    trigger={['click']}
    menu={{
      items: [
        {
          key: 'edit',
          label: 'Edit',
          icon: <EditOutlined />,
          onClick: () => openEdit(record)
        },
        {
          key: 'delete',
          label: (
            <Popconfirm title='Delete this interview?' okText='Yes' cancelText='No' onConfirm={() => handleDelete(record._id)}>
              Delete
            </Popconfirm>
          ),
          icon: <DeleteOutlined />,
          danger: true
        }
      ]
    }}
  >
    <Button type='text' icon={<MoreOutlined />} />
  </Dropdown>
);

export default function Interviews() {
  const [pagination, setPagination] = useState({ current: 1, pageSize: DEFAULT_PAGINATION_SIZE, total: 0 });
  const [isModalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const filterKey = useMemo(() => {
    const params = new URLSearchParams({
      page: pagination.current,
      limit: pagination.pageSize
    });

    return `${config.baseApiUrl}interviews/get?${params.toString()}`;
  }, [pagination.current, pagination.pageSize]);

  const { interviews, total, isLoading, mutate } = useInterviews(filterKey);

  useEffect(() => {
    setPagination((prev) => ({ ...prev, total }));
  }, [total]);

  const openAdd = () => {
    setEditing(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (record) => {
    form.setFieldsValue({
      ...record,
      date: dayjs(record.date)
    });
    setEditing(record);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      const payload = {
        ...values,
        date: values.date.toISOString()
      };
      if (editing) {
        await interviewService.updateInterview(editing._id, payload);
        showToastInfoMsg('Interview updated');
      } else {
        await interviewService.createInterview(payload);
        showToastInfoMsg('Interview created');
      }

      setModalOpen(false);
      form.resetFields();
      mutate();
    } catch (e) {
      showToastErrorMsg('Action failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await interviewService.deleteInterview(id);
      showToastInfoMsg('Interview deleted');
      mutate();
    } catch {
      showToastErrorMsg('Delete failed');
    }
  };

  const columns = [
    {
      title: 'DATE',
      dataIndex: 'date',
      render: (v) => dayjs(v).format('MM/DD/YYYY')
    },
    { title: 'TIME (EST)', dataIndex: 'time_est' },
    {
      title: 'STAGE',
      dataIndex: 'stage',
      render: (stage) => <Tag color={STAGE_COLORS[stage] || 'default'}>{stage}</Tag>
    },
    {
      title: 'TYPE',
      dataIndex: 'interview_type',
      render: (type) => <Badge status={TYPE_COLORS[type] || 'default'} text={type} />
    },
    { title: 'ROLE', dataIndex: 'role' },
    {
      title: 'COMPANY',
      dataIndex: 'company',
      render: (company) => <Typography.Text strong>{company}</Typography.Text>
    },
    {
      title: 'MEETING',
      dataIndex: 'meeting_link',
      align: 'center',
      render: (link) => link || <Typography.Text type='secondary'>—</Typography.Text>
    },
    {
      title: 'RESULT',
      dataIndex: 'result',
      render: (result) => <Badge status={RESULT_COLORS[result]} text={result} />
    },

    {
      title: 'ACTIONS',
      render: (_, record) => <ActionDropdown record={record} openEdit={openEdit} handleDelete={handleDelete} />
    }
  ];

  return (
    <>
      <Container>
        <FlexBox style={{ margin: '24px 0', justifyContent: 'end' }}>
          <StyledButton type='primary' icon={<PlusOutlined />} onClick={openAdd}>
            Add Interview
          </StyledButton>
        </FlexBox>
        {isLoading ? (
          <SpinWrapper>
            <Spin size='large' delay={500} />
          </SpinWrapper>
        ) : (
          <ColorTable columns={columns} dataSource={interviews} rowKey='_id' pagination={{ ...pagination, hideOnSinglePage: true }} />
        )}
      </Container>

      <Modal
        title={<Typography.Title level={4}>{editing ? 'Edit Interview' : 'Add Interview'}</Typography.Title>}
        open={isModalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        confirmLoading={loading}
      >
        <Form layout='vertical' form={form}>
          <Row gutter={16}>
            <Col xs={24} xl={8}>
              <Form.Item name='date' label='Date' rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} xl={8}>
              <Form.Item name='time_est' label='Time (EST)'>
                <Input placeholder='3:00 PM' />
              </Form.Item>
            </Col>
            <Col xs={24} xl={8}>
              <Form.Item name='stage' label='Stage' rules={[{ required: true }]}>
                <Select
                  optionLabelProp='label'
                  options={Object.keys(STAGE_COLORS).map((stage) => ({
                    value: stage,
                    label: <Tag color={STAGE_COLORS[stage]}>{stage}</Tag>
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} xl={8}>
              <Form.Item name='interview_type' label='Interview Type' rules={[{ required: true }]}>
                <Select
                  optionLabelProp='label'
                  options={Object.keys(TYPE_COLORS).map((type) => ({
                    value: type,
                    label: <Tag color={TYPE_COLORS[type]}>{type}</Tag>
                  }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} xl={8}>
              <Form.Item name='role' label='Role' rules={[{ required: true }]}>
                <Input placeholder='Software Engineer' />
              </Form.Item>
            </Col>
            <Col xs={24} xl={8}>
              <Form.Item name='company' label='Company' rules={[{ required: true }]}>
                <Input placeholder='Microsoft' />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} xl={8}>
              <Form.Item name='interviewer' label='Interviewer'>
                <Input placeholder='Lucce' />
              </Form.Item>
            </Col>
            <Col xs={24} xl={8}>
              <Form.Item name='meeting_link' label='Meeting Link'>
                <Input placeholder='https://meet.google.com/' />
              </Form.Item>
            </Col>
            <Col xs={24} xl={8}>
              <Form.Item name='result' label='Result'>
                <Select
                  optionLabelProp='label'
                  options={Object.keys(RESULT_COLORS).map((result) => ({
                    value: result,
                    label: <Tag color={RESULT_COLORS[result]}>{result}</Tag>
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name='note' label='Note'>
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
