'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { Button, Space, Input, Modal, DatePicker, Select, Popconfirm, Typography, Form, Row, Col } from 'antd';
import { DeleteOutlined, DownloadOutlined, EditOutlined, EyeTwoTone, PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  normalizeSummary,
  normalizeTechnicalSkills,
  normalizeWorkExperiences,
  showToastErrorMsg,
  showToastInfoMsg
} from '@/helpers/frontend';
import { useGlobalContext } from '@/context/auth';
import { useEffectiveProfiles, useResumes } from '@/hooks';
import resumeService from '@/services/(routes)/resume';
import config from '@/services/(routes)/config';
import { Container, FlexBox, StyledButton, ColorTable, ColorTabs } from '@/_components/layout/client/styled';
import SortableList from '@/_components/layout/common/SortableList';
import { CONSTANT_USER_ROLE_ADMIN, DEFAULT_PAGINATION_SIZE, REPORT_OPTIONS } from '@/config/constants';
const { Paragraph } = Typography;

export default function Applies() {
  const { loginUser } = useGlobalContext();
  const { user } = loginUser;
  const effectiveProfiles = useEffectiveProfiles(user);

  const [curResume, setResume] = useState();
  const [isModalOpen, setModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: DEFAULT_PAGINATION_SIZE, total: 0 });
  const [sortInfo, setSortInfo] = useState({ field: 'created_at', order: 'descend' });
  const [form] = Form.useForm();
  const technicalSkills = Form.useWatch('technical_skills', form) || [];
  const workExperiences = Form.useWatch('work_experiences', form) || [];
  // Individual filter states
  const [dateFilter, setDateFilter] = useState(null);
  const [companyFilter, setCompanyFilter] = useState('');
  const [profileFilter, setProfileFilter] = useState([]);
  const [desFilter, setDesFilter] = useState('');
  const [debouncedDesFilter, setDebouncedDesFilter] = useState('');
  const [isReportModalOpen, setReportModalOpen] = useState(false);
  const [reportRange, setReportRange] = useState(REPORT_OPTIONS[0].value);
  const [reportData, setReportData] = useState([]);
  const [reportLoading, setReportLoading] = useState(false);

  const resumeKey = useMemo(() => {
    const params = new URLSearchParams({
      page: pagination.current,
      limit: pagination.pageSize,
      sortby: sortInfo.field,
      order: sortInfo.order,
      startDate: dateFilter?.start || '',
      endDate: dateFilter?.end || '',
      companyName: companyFilter || '',
      profileId: profileFilter.join(',') || '',
      description: debouncedDesFilter || ''
    });

    return `${config.baseApiUrl}resume/get-resumes?${params.toString()}`;
  }, [pagination, sortInfo.field, sortInfo.order, dateFilter?.start, dateFilter?.end, companyFilter, profileFilter, debouncedDesFilter]);

  const { resumes, total, loading, mutate } = useResumes(resumeKey);

  useEffect(() => {
    setPagination((prev) => ({ ...prev, total }));
  }, [total]);

  const fetchReport = async (range) => {
    setReportLoading(true);
    setReportData([]);

    const data = await resumeService.getResumesReport(range);

    if (data.error) {
      showToastErrorMsg(data.msg);
      setReportLoading(false);
      return;
    }

    const formatted = (data.resumes || []).map((r) => {
      const profile = effectiveProfiles.find((p) => p._id === r._id);
      return {
        key: r._id || 'N/A',
        profileName: profile ? profile.profileName : 'N/A',
        count: r.count
      };
    });

    setReportData(formatted);
    setReportLoading(false);
  };

  const TABLE_COLUMNS = [
    {
      title: 'DATE',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (createdAt) => dayjs(createdAt).format('YYYY-MM-DD HH:mm:ss'),
      sorter: true,
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <DatePicker.RangePicker
            value={selectedKeys[0]}
            onChange={(dates) => setSelectedKeys(dates ? [dates] : [])}
            style={{ marginBottom: 8, display: 'block' }}
          />
          <Space>
            <Button
              type='primary'
              size='small'
              onClick={() => {
                if (selectedKeys[0]) {
                  const [start, end] = selectedKeys[0];
                  setDateFilter({
                    start: start.startOf('day').toISOString(),
                    end: end.endOf('day').toISOString()
                  });
                }
                confirm();
              }}
            >
              Filter
            </Button>
            <Button
              size='small'
              onClick={() => {
                clearFilters();
                setDateFilter(null);
                confirm();
              }}
            >
              Clear
            </Button>
          </Space>
        </div>
      ),
      onFilter: () => true
    },
    {
      title: 'COMPANY NAME',
      dataIndex: 'companyName',
      key: 'companyName',
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <Space direction='vertical' style={{ padding: 8 }}>
          <Input
            value={selectedKeys[0]}
            onChange={(e) => {
              const value = e.target.value.replace(/^\s+/, ''); // remove leading spaces
              setSelectedKeys(value ? [value] : []);
            }}
            onPressEnter={() => confirm()}
            placeholder='Search company'
            style={{ width: 188, display: 'block' }}
          />
          <Space>
            <Button
              size='small'
              onClick={() => {
                clearFilters();
                setCompanyFilter('');
                confirm();
              }}
            >
              Clear
            </Button>
            <Button
              type='primary'
              size='small'
              onClick={() => {
                const trimmed = (selectedKeys[0] || '').trim();
                setCompanyFilter(trimmed);
                confirm();
              }}
            >
              Search
            </Button>
          </Space>
        </Space>
      ),
      onFilter: () => true
    },
    {
      title: 'POSITION',
      dataIndex: 'jobTitle',
      key: 'jobTitle',
      render: (_, record) => (
        <Paragraph
          editable={{
            onChange: async (value) => {
              const trimmed = value.trim();
              const currentValue = (record.resumeResponse?.target_position || '').trim();

              if (!trimmed) {
                showToastInfoMsg('Position is required.');
                return;
              }

              if (trimmed === currentValue) {
                return;
              }

              try {
                const payload = {
                  ...record,
                  jobTitle: trimmed,
                  resumeResponse: {
                    ...(record.resumeResponse || {}),
                    target_position: trimmed
                  }
                };

                const res = await resumeService.updateResume(record._id, payload);

                if (res?.error) {
                  showToastErrorMsg(res.msg || 'Failed to update position.');
                  return;
                }

                showToastInfoMsg('Position updated successfully.');
                mutate();
              } catch (error) {
                showToastErrorMsg('Failed to update position.');
              }
            }
          }}
          style={{ marginBottom: 0 }}
        >
          {record.resumeResponse?.target_position || record.jobTitle || 'N/A'}
        </Paragraph>
      )
    },
    {
      title: 'PROFILE',
      dataIndex: 'associatedProfileId',
      key: 'associatedProfileId',
      render: (profileId) => {
        const profile = effectiveProfiles.find((p) => p._id === profileId);
        return profile ? profile.profileName : 'N/A';
      },
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <Space direction='vertical' style={{ padding: 8 }}>
          <Select
            mode='multiple'
            allowClear
            showSearch
            maxTagCount='responsive'
            placeholder='Select Profiles'
            onChange={(value) => setSelectedKeys(value?.length ? [value] : [])}
            optionFilterProp='label'
            filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
            style={{ width: 200 }}
            options={effectiveProfiles.map((p) => ({
              label: p.profileName,
              value: p._id
            }))}
          />
          <Space>
            <Button
              size='small'
              onClick={() => {
                clearFilters();
                setProfileFilter([]);
                confirm();
              }}
            >
              Clear
            </Button>
            <Button
              type='primary'
              size='small'
              onClick={() => {
                setProfileFilter(selectedKeys[0] || []);
                confirm();
              }}
            >
              Search
            </Button>
          </Space>
        </Space>
      ),
      onFilter: () => true
    },
    {
      title: 'ACTIONS',
      key: 'actions',
      align: 'center',
      render: (_, record) => (
        <Space size='middle'>
          <Button type='text' icon={<EyeTwoTone />} onClick={() => handleView(record)} />
          <Button type='text' icon={<EditOutlined />} onClick={() => openEdit(record)} />
          {user?.role === CONSTANT_USER_ROLE_ADMIN && (
            <Popconfirm title='Delete this record?' okText='Yes' cancelText='No' onConfirm={() => handleDelete(record._id)}>
              <Button type='text' icon={<DeleteOutlined />} danger />
            </Popconfirm>
          )}
          <StyledButton onClick={() => handleDownload(record)} type='primary'>
            <DownloadOutlined />
          </StyledButton>
        </Space>
      )
    }
  ];

  const REPORT_COLUMNS = [
    {
      title: 'Profile',
      dataIndex: 'profileName',
      key: 'profileName',
      filters: reportData.map((r) => ({
        text: r.profileName,
        value: r.profileName
      })),
      filterSearch: true,
      onFilter: (value, record) => record.profileName.toLowerCase().includes(value.toLowerCase()),
      sorter: (a, b) => a.profileName.localeCompare(b.profileName)
    },
    {
      title: 'Applies',
      dataIndex: 'count',
      key: 'count',
      align: 'right',
      sorter: (a, b) => a.count - b.count,
      defaultSortOrder: 'descend'
    }
  ];

  const handleView = (record) => {
    setResume(record);
    setModalOpen(true);
  };

  const openEdit = (record) => {
    const r = record.resumeResponse || {};

    form.setFieldsValue({
      summary: normalizeSummary(r.summary),
      jobDescription: record.jobDescription || '',
      work_experiences: normalizeWorkExperiences(r.work_experiences),
      technical_skills: normalizeTechnicalSkills(r.technical_skills),
      target_company_name: r.target_company_name || '',
      target_position: r.target_position || ''
    });

    setEditModalOpen(true);
    setResume(record);
  };

  const handleDelete = async (id) => {
    try {
      await resumeService.deleteResume(id);
      showToastInfoMsg('Resume deleted.');
      mutate();
    } catch (err) {
      showToastErrorMsg('Failed to delete resume.');
    }
  };

  const handleDownload = async (record) => {
    try {
      const res = await fetch('/api/resume/download-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId: record.associatedProfileId, resumeId: record._id })
      });
      if (!res.ok) {
        let errJson;
        try {
          errJson = await res.json();
        } catch (_) {
          errJson = { msg: 'Failed to download resume' };
        }
        throw new Error(errJson.msg || 'Failed to download resume');
      }

      const blob = await res.blob();
      const disposition = res.headers.get('Content-Disposition');
      let filename = 'resume.pdf';
      if (disposition?.includes('filename=')) {
        filename = disposition.split('filename=')[1].replace(/"/g, '');
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      showToastInfoMsg('Your resume is ready for download!');
    } catch (err) {
      console.error(err);
      showToastErrorMsg(err.message || 'Failed to download resume.');
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedDesFilter(desFilter);
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(timeout);
  }, [desFilter]);

  useEffect(() => {
    if (!isEditModalOpen) {
      form.resetFields();
    }
  }, [form, isEditModalOpen]);

  const handleTableChange = (pagination, filters, sorter) => {
    if (sorter.field && sorter.order) {
      setSortInfo({ field: sorter.field, order: sorter.order });
    }
    setPagination({ ...pagination });
  };

  const handleSaveResume = async (values) => {
    // Convert technical skills array → object
    const techObj = {};
    values.technical_skills.forEach((item) => {
      techObj[item.category] = item.skills;
    });

    const payload = {
      ...curResume,
      companyName: values.target_company_name,
      jobTitle: values.target_position,
      jobDescription: values.jobDescription,
      resumeResponse: {
        summary: values.summary,
        work_experiences: values.work_experiences.map((exp) => ({
          ...exp,
          achievements: Array.isArray(exp.achievements) ? exp.achievements.map((a) => a?.text || '') : []
        })),
        technical_skills: techObj,
        companyName: values.target_company_name,
        jobTitle: values.target_position
      }
    };

    console.log('FINAL UPDATE PAYLOAD:', payload);

    await resumeService.updateResume(curResume._id, payload);

    showToastInfoMsg('Resume updated successfully!');
    mutate();
    setEditModalOpen(false);
  };

  const openReport = () => {
    setReportRange('today');
    setReportModalOpen(true);
    fetchReport('today');
  };

  return (
    <Container>
      <FlexBox style={{ margin: '24px 0', justifyContent: 'space-between' }}>
        <Typography.Title level={4} style={{ marginBottom: 0 }}>
          Total Jobs: {total}
        </Typography.Title>
        <Space>
          <Input
            placeholder='Search by description...'
            value={desFilter}
            onChange={(e) => setDesFilter(e.target.value)}
            style={{ width: 240 }}
          />
          <StyledButton onClick={openReport} type='primary'>
            Report
          </StyledButton>
        </Space>
      </FlexBox>
      <ColorTable
        columns={TABLE_COLUMNS}
        dataSource={resumes}
        rowKey='_id'
        pagination={{ ...pagination, hideOnSinglePage: true }}
        loading={loading}
        onChange={handleTableChange}
        style={{ margin: '24px 0' }}
      />
      <Modal title={<Typography.Title level={4}>Job Description</Typography.Title>} open={isModalOpen} onCancel={() => setModalOpen(false)}>
        <Space direction='vertical' style={{ width: '100%' }}>
          <Typography.Text style={{ margin: 0 }}>{curResume?.jobLink}</Typography.Text>
          <Input.TextArea rows={30} value={curResume?.jobDescription} readOnly style={{ resize: 'none' }} />
        </Space>
      </Modal>
      <Modal
        title={<Typography.Title level={4}>Edit Resume</Typography.Title>}
        open={isEditModalOpen}
        onCancel={() => setEditModalOpen(false)}
        onOk={() => form.submit()}
        width='90vw'
        style={{ maxWidth: '1600px' }}
      >
        <Form layout='vertical' form={form} onFinish={handleSaveResume}>
          <ColorTabs
            defaultActiveKey='summary'
            $isSecondary={true}
            type='card'
            items={[
              {
                key: 'summary',
                label: 'Summary',
                forceRender: true,
                children: (
                  <>
                    <Typography.Title level={5}>Summary</Typography.Title>
                    <Space direction='vertical' size='large' style={{ width: '100%' }}>
                      <Form.List name='summary'>
                        {(fields, { add, remove }) => {
                          const items = fields.map((field) => ({
                            key: field.key,
                            index: field.name,
                            children: (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Form.Item
                                  name={[field.name]}
                                  style={{ marginBottom: 0, flex: 1 }}
                                  rules={[{ required: true, message: 'Summary line cannot be empty' }]}
                                >
                                  <Input.TextArea placeholder='Summary bullet…' />
                                </Form.Item>
                                <Button danger type='text' icon={<DeleteOutlined />} onClick={() => remove(field.name)} />
                              </div>
                            )
                          }));
                          return (
                            <Space direction='vertical' style={{ width: '100%' }} size='middle'>
                              <SortableList
                                items={items}
                                onReorder={(newItems) => {
                                  const reordered = newItems.map((item) => form.getFieldValue(['summary', item.index]));
                                  form.setFieldValue('summary', reordered);
                                }}
                              />
                            </Space>
                          );
                        }}
                      </Form.List>
                      <Form.Item
                        label='Job Description'
                        name='jobDescription'
                        rules={[{ required: true, message: 'Job description is required' }]}
                      >
                        <Input.TextArea rows={10} />
                      </Form.Item>
                      {/* TARGET FIELDS */}
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item label='Target Company' name='target_company_name'>
                            <Input placeholder='Target Company Name' />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item label='Target Position' name='target_position'>
                            <Input placeholder='Target Position' />
                          </Form.Item>
                        </Col>
                      </Row>
                    </Space>
                  </>
                )
              },
              {
                key: 'skills',
                label: 'Technical Skills',
                forceRender: true,
                children: (
                  <Form.List name='technical_skills'>
                    {(fields, { add, remove }) => {
                      const tabItems = fields.map(({ key, name }, index) => {
                        const category = technicalSkills[index]?.category || `Category ${index + 1}`;
                        return {
                          key: String(key),
                          label: category,
                          forceRender: true,
                          children: (
                            <div style={{ paddingTop: 16 }}>
                              <Row gutter={16}>
                                <Col span={6}>
                                  <Form.Item label='Category' name={[name, 'category']} rules={[{ required: true }]}>
                                    <Input placeholder='Frontend / Backend / DevOps...' />
                                  </Form.Item>
                                </Col>
                                <Col span={17}>
                                  <Form.Item
                                    label='Skills'
                                    name={[name, 'skills']}
                                    getValueFromEvent={(e) => e.target.value}
                                    normalize={(value) => value.split(',').map((s) => s.trim())}
                                    rules={[{ required: true }]}
                                  >
                                    <Input placeholder='React, Docker...' />
                                  </Form.Item>
                                </Col>
                                <Col span={1}>
                                  <Button danger type='text' icon={<DeleteOutlined />} onClick={() => remove(name)} />
                                </Col>
                              </Row>
                            </div>
                          )
                        };
                      });
                      return (
                        <Space direction='vertical' style={{ width: '100%' }}>
                          <ColorTabs items={tabItems} type='card' />
                          <Button type='dashed' onClick={() => add()} icon={<PlusOutlined />}>
                            Add Skill Category
                          </Button>
                        </Space>
                      );
                    }}
                  </Form.List>
                )
              },
              {
                key: 'experience',
                label: 'Work Experiences',
                forceRender: true,
                children: (
                  <Form.List name='work_experiences'>
                    {(fields, { add, remove }) => {
                      const experienceTabs = fields.map(({ key, name }, index) => ({
                        key: String(key),
                        label: workExperiences?.[name]?.company_name?.trim() || `Experience ${index + 1}`,
                        forceRender: true,
                        children: (
                          <div style={{ paddingTop: 16 }}>
                            <Row gutter={16}>
                              <Col span={7}>
                                <Form.Item label='Job Title' name={[name, 'job_title']} rules={[{ required: true }]}>
                                  <Input placeholder='Senior Developer' />
                                </Form.Item>
                              </Col>
                              <Col span={7}>
                                <Form.Item label='Company' name={[name, 'company_name']} rules={[{ required: true }]}>
                                  <Input placeholder='Amazon, Google…' />
                                </Form.Item>
                              </Col>
                              <Col span={4}>
                                <Form.Item label='Start Date' name={[name, 'start_date_employment']}>
                                  <Input placeholder='MM/YYYY' />
                                </Form.Item>
                              </Col>
                              <Col span={4}>
                                <Form.Item label='End Date' name={[name, 'end_date_employment']}>
                                  <Input placeholder='MM/YYYY or Present' />
                                </Form.Item>
                              </Col>
                              <Col span={2}>
                                <Button danger type='text' icon={<DeleteOutlined />} onClick={() => remove(name)} />
                              </Col>
                            </Row>
                            <Form.List name={[name, 'achievements']}>
                              {(achFields, { add: addAch, remove: removeAch }) => {
                                const achItems = achFields.map((field) => ({
                                  key: field.key,
                                  index: field.name,
                                  children: (
                                    <div
                                      style={{
                                        display: 'flex',
                                        gap: 8,
                                        alignItems: 'center'
                                      }}
                                    >
                                      <Form.Item
                                        name={[field.name, 'text']}
                                        style={{ marginBottom: 0, flex: 1 }}
                                        rules={[{ required: true }]}
                                      >
                                        <Input placeholder='Achievement' />
                                      </Form.Item>
                                      <Button danger type='text' icon={<DeleteOutlined />} onClick={() => removeAch(field.name)} />
                                    </div>
                                  )
                                }));
                                return (
                                  <Space direction='vertical' size='small' style={{ width: '100%' }}>
                                    <Typography.Text strong>Achievements</Typography.Text>
                                    <SortableList
                                      items={achItems}
                                      onReorder={(newItems) => {
                                        const reordered = newItems.map((item) =>
                                          form.getFieldValue(['work_experiences', name, 'achievements', item.index])
                                        );
                                        form.setFieldValue(['work_experiences', name, 'achievements'], reordered);
                                      }}
                                    />
                                    <Button
                                      type='dashed'
                                      onClick={() => addAch({ text: '' })}
                                      icon={<PlusOutlined />}
                                      style={{ marginTop: 8 }}
                                    >
                                      Add Achievement
                                    </Button>
                                  </Space>
                                );
                              }}
                            </Form.List>
                          </div>
                        )
                      }));
                      return (
                        <Space direction='vertical' style={{ width: '100%' }}>
                          <ColorTabs items={experienceTabs} type='card' />
                          <Button type='dashed' onClick={() => add()} icon={<PlusOutlined />}>
                            Add Experience
                          </Button>
                        </Space>
                      );
                    }}
                  </Form.List>
                )
              }
            ]}
            style={{ marginTop: '32px' }}
          />
        </Form>
      </Modal>
      <Modal title='Applies by Profile' open={isReportModalOpen} onCancel={() => setReportModalOpen(false)} footer={null} width={520}>
        <Space direction='vertical' style={{ width: '100%' }}>
          <Select
            value={reportRange}
            onChange={(value) => {
              setReportRange(value);
              fetchReport(value);
            }}
            options={REPORT_OPTIONS}
            style={{ width: 200 }}
          />

          <ColorTable columns={REPORT_COLUMNS} dataSource={reportData} pagination={false} loading={reportLoading} size='middle' />

          <Typography.Text strong style={{ textAlign: 'right' }}>
            Total Applies: {reportData.reduce((s, r) => s + r.count, 0)}
          </Typography.Text>
        </Space>
      </Modal>
    </Container>
  );
}
