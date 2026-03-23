'use client';
import { useEffect, useMemo, useState } from 'react';
import { Button, Input, Spin, Space, Typography, Tag, message, Popconfirm, Flex } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { showToastErrorMsg, showToastInfoMsg } from '@/helpers/frontend';
import { CONSTANT_USER_ROLE_ADMIN, DEFAULT_PAGINATION_SIZE, ERROR_FAILED, ERROR_SUCCESS } from '@/config/constants';
import { ColorTable, Container, FlexBox, SpinWrapper, StyledButton } from '@/_components/layout/client/styled';
import jobsService from '@/services/(routes)/jobs';
import { useJobs } from '@/hooks';
import { useGlobalContext } from '@/context/auth';
import config from '@/services/(routes)/config';

export default function JobsList() {
  const { loginUser } = useGlobalContext();
  const [isSyncing, setSyncing] = useState(false);
  const [keywords, setKeywords] = useState('');
  // Individual filter states
  const [companyFilter, setCompanyFilter] = useState('');
  const [titleFilter, setTitleFilter] = useState('');
  const [extFilter, setExtFilter] = useState('');
  const [debouncedExtFilter, setDebouncedExtFilter] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: DEFAULT_PAGINATION_SIZE,
    total: 0
  });

  const jobKey = useMemo(() => {
    const params = new URLSearchParams({
      page: pagination.current,
      limit: pagination.pageSize,
      title: titleFilter || '',
      extension: debouncedExtFilter || '',
      company: companyFilter || ''
    });

    return `${config.baseApiUrl}jobs/get?${params.toString()}`;
  }, [pagination.current, pagination.pageSize, extFilter, titleFilter, companyFilter, debouncedExtFilter]);

  const { jobs, total, isLoading } = useJobs(jobKey);

  useEffect(() => {
    setPagination((prev) => ({ ...prev, total }));
  }, [total]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedExtFilter(extFilter);
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(timeout);
  }, [extFilter]);

  const onSyncJobs = async () => {
    try {
      setSyncing(true);
      const { result, msg } = await jobsService.syncJobs(keywords);

      if (result === ERROR_SUCCESS) {
        showToastInfoMsg(msg);
      } else if (result === ERROR_FAILED) {
        showToastErrorMsg(msg);
      }
      setKeywords('');
      await fetchJobs(1);
    } catch (err) {
      showToastErrorMsg('Failed to sync jobs.');
    } finally {
      setSyncing(false);
    }
  };

  const parseTags = (ext) => {
    if (!ext) return [];

    const tags = [];
    let key = 0;

    if (/remote/i.test(ext)) tags.push({ label: 'Remote', color: 'green' });
    if (ext.match(/\d+k/i)) tags.push({ label: ext.match(/\d+k/i)[0] + ' Salary', color: 'blue' });
    if (ext.includes('Full-time')) tags.push({ label: 'Full-time', color: 'cyan' });
    if (ext.includes('Part-time')) tags.push({ label: 'Part-time', color: 'gold' });
    if (ext.includes('Health Insurance')) tags.push({ label: 'Health Insurance', color: 'purple' });
    if (ext.includes('Dental')) tags.push({ label: 'Dental', color: 'purple' });

    return tags.map((t, i) => (
      <Tag key={i} color={t.color}>
        {t.label}
      </Tag>
    ));
  };

  const TABLE_COLUMNS = [
    {
      title: 'REFERRAL CODE',
      dataIndex: '_id',
      render: (id) => `Ref_0x${id.slice(-8).toUpperCase()}`
    },
    {
      title: 'COMPAY',
      dataIndex: 'company_name',
      key: 'company_name',
      filteredValue: companyFilter ? [companyFilter] : null,
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <Space direction='vertical' style={{ padding: 8 }}>
          <Input
            value={selectedKeys[0]}
            onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
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
                setCompanyFilter(selectedKeys[0] || '');
                confirm();
              }}
            >
              Search
            </Button>
          </Space>
        </Space>
      ),
      onFilter: () => true,
      render: (name) => <Typography.Text style={{ fontSize: 16 }}>{name}</Typography.Text>
    },
    {
      title: 'TITLE',
      dataIndex: 'title',
      key: 'title',
      filteredValue: titleFilter ? [titleFilter] : null,
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <Space direction='vertical' style={{ padding: 8 }}>
          <Input
            value={selectedKeys[0]}
            onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={() => confirm()}
            placeholder='Search Title'
            style={{ width: 188, display: 'block' }}
          />
          <Space>
            <Button
              size='small'
              onClick={() => {
                clearFilters();
                setTitleFilter('');
                confirm();
              }}
            >
              Clear
            </Button>
            <Button
              type='primary'
              size='small'
              onClick={() => {
                setTitleFilter(selectedKeys[0] || '');
                confirm();
              }}
            >
              Search
            </Button>
          </Space>
        </Space>
      ),
      onFilter: () => true,
      render: (_, job) => (
        <div>
          <strong>{job.title}</strong>
          <div style={{ marginTop: 4 }}>{parseTags(job.extensions)}</div>
        </div>
      )
    },
    {
      title: 'POSTED',
      dataIndex: 'extensions',
      render: (e) => <span>{e.split(',')[0]}</span>
    },
    {
      title: 'ACTIONS',
      key: 'actions',
      align: 'center',
      render: (_, record) => (
        <Popconfirm
          title='Delete this job?'
          okText='Yes'
          cancelText='No'
          onConfirm={() => handleDelete(record._id)}
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            danger
            size='middle'
            icon={<DeleteOutlined style={{ color: 'red' }} />}
            style={{
              borderColor: 'red'
            }}
            onClick={(e) => e.stopPropagation()}
          />
        </Popconfirm>
      )
    }
  ];

  const handleDelete = async (id) => {
    try {
      await jobsService.deleteJob(id);
      showToastInfoMsg('Job is deleted.');
      fetchJobs();
    } catch (err) {
      showToastErrorMsg('Failed to delete job.');
    }
  };

  return (
    <Container>
      <Space direction='vertical' size='large' style={{ width: '100%', marginTop: '24px' }}>
        <FlexBox style={{ justifyContent: 'end' }}>
          <Input
            size='middle'
            value={keywords}
            disabled={isSyncing}
            style={{ marginRight: 5 }}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder='salesforce developer jobs in usa'
          />

          <StyledButton
            size='middle'
            type='primary'
            onClick={onSyncJobs}
            loading={isSyncing}
            disabled={loginUser?.user?.role !== CONSTANT_USER_ROLE_ADMIN}
          >
            {isSyncing ? 'UPDATING...' : 'UPDATE JOBS'}
          </StyledButton>
        </FlexBox>

        {isLoading ? (
          <SpinWrapper>
            <Spin size='large' delay={300} />
          </SpinWrapper>
        ) : (
          <Space direction='vertical' style={{ width: '100%' }}>
            <Flex justify='space-between'>
              <Typography.Title level={4} style={{ margin: 0 }}>
                Total Jobs: {total}
              </Typography.Title>
              <Input
                placeholder='Search by extension(5 days ago)...'
                value={extFilter}
                onChange={(e) => setExtFilter(e.target.value)}
                style={{ width: 320 }}
              />
            </Flex>
            <ColorTable
              columns={TABLE_COLUMNS}
              dataSource={jobs}
              rowKey='_id'
              expandable={{
                expandRowByClick: true,
                showExpandColumn: false,
                expandedRowRender: (job) => (
                  <div style={{ paddingLeft: 72, background: '#fafafa' }}>
                    <Typography.Text strong>Raw Metadata:</Typography.Text>
                    <Typography.Text>{job.extensions}</Typography.Text>
                    <Space>
                      <Typography.Text strong>Apply Options:</Typography.Text>
                      <Space wrap>
                        {job.apply_options?.map((o, i) => (
                          <Tag
                            key={i}
                            color='blue'
                            style={{ padding: '4px 8px', cursor: 'pointer' }}
                            onClick={() => {
                              navigator.clipboard.writeText(o.link);
                              message.success(`Copied: ${o.title}'s job URL!`);
                            }}
                          >
                            {o.title}
                          </Tag>
                        ))}
                      </Space>
                    </Space>
                  </div>
                )
              }}
              pagination={{ ...pagination, hideOnSinglePage: true }}
              onChange={(pagination) => setPagination({ ...pagination })}
            />
          </Space>
        )}
      </Space>
    </Container>
  );
}
