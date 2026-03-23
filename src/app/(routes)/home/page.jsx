'use client';

import { useRouter } from 'next/navigation';
import { Card, Col, Flex, Row, Table, Typography, Button, Space, Tag } from 'antd';
import { UserOutlined, FileDoneOutlined, CalendarOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useGlobalContext } from '@/context/auth';
import { Container, ContentWrapper, LoginBtn } from '@/_components/layout/client/styled';
import { GradientStat } from '@/_components/layout/common/GradientStat';
import { CONSTANT_USER_ROLE_ADMIN, gradients } from '@/config/constants';

const { Title } = Typography;

const profileReports = [
  {
    id: '1',
    name: 'John Doe',
    monthlyApplications: 8,
    totalApplications: 42,
    interviewsScheduled: 4,
    interviewsActive: 2,
    interviewsCompleted: 6,
    lastActivity: '2026-01-25'
  },
  {
    id: '2',
    name: 'Jane Smith',
    monthlyApplications: 5,
    totalApplications: 30,
    interviewsScheduled: 2,
    interviewsActive: 1,
    interviewsCompleted: 3,
    lastActivity: '2026-01-26'
  }
];

export default function Home() {
  const router = useRouter();
  const { loginUser } = useGlobalContext();
  const { user } = loginUser;
  if (!loginUser.isLoggedIn) {
    return (
      <ContentWrapper>
        <Flex justify='center' align='center' style={{ height: '60vh' }}>
          <Space direction='vertical' align='center'>
            <Typography.Title level={2}>Welcome to our Tool! 👋</Typography.Title>
            {!loginUser.isLoggedIn && <LoginBtn onClick={() => router.push('/login')}>Login</LoginBtn>}
          </Space>
        </Flex>
      </ContentWrapper>
    );
  }

  return (
    <ContentWrapper>
      {user?.role === CONSTANT_USER_ROLE_ADMIN ? (
        <Container>
          <Space direction='vertical' size='large' style={{ width: '100%', margin: '48px 0' }}>
            <Row gutter={16}>
              <Col span={6}>
                <GradientStat title='Profiles' value={12} gradient={gradients.blue} icon={<UserOutlined />} />
              </Col>

              <Col span={6}>
                <GradientStat title='Jobs Applied (Month)' value={38} gradient={gradients.purple} icon={<FileDoneOutlined />} />
              </Col>

              <Col span={6}>
                <GradientStat title='Active Interviews' value={7} gradient={gradients.pink} icon={<CalendarOutlined />} />
              </Col>

              <Col span={6}>
                <GradientStat title='Completed Interviews' value={19} gradient={gradients.green} icon={<CheckCircleOutlined />} />
              </Col>
            </Row>

            <Flex justify='space-between' align='center'>
              <Title level={4}>Profiles Overview</Title>
            </Flex>

            <Card>
              <Table
                rowKey='id'
                dataSource={profileReports}
                pagination={false}
                columns={[
                  {
                    title: 'Profile',
                    dataIndex: 'name',
                    key: 'name'
                  },
                  {
                    title: 'Jobs Applied (Month)',
                    dataIndex: 'monthlyApplications'
                  },
                  {
                    title: 'Total Applications',
                    dataIndex: 'totalApplications'
                  },
                  {
                    title: 'Interviews',
                    render: (_, record) => (
                      <Space>
                        <Tag color='blue'>Scheduled: {record.interviewsScheduled}</Tag>
                        <Tag color='orange'>Active: {record.interviewsActive}</Tag>
                        <Tag color='green'>Done: {record.interviewsCompleted}</Tag>
                      </Space>
                    )
                  },
                  {
                    title: 'Last Activity',
                    dataIndex: 'lastActivity'
                  },
                  {
                    title: 'Action',
                    render: (_, record) => (
                      <Button type='link' onClick={() => router.push(`/profiles/${record.id}`)}>
                        View
                      </Button>
                    )
                  }
                ]}
              />
            </Card>
          </Space>
        </Container>
      ) : (
        <Flex justify='center' align='center'>
          <Space direction='vertical' align='center'>
            <Typography.Title level={2}>Welcome Back! 👋</Typography.Title>
          </Space>
        </Flex>
      )}
    </ContentWrapper>
  );
}
