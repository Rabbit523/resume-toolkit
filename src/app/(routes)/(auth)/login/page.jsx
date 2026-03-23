'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCookie, setCookie } from 'cookies-next';
import { Input, Row, Col, Typography, Space } from 'antd';
import { SyncOutlined } from '@ant-design/icons';
import { useGlobalContext } from '@/context/auth';
import { showToastErrorMsg, showToastInfoMsg, validEmail } from '@/helpers/frontend';
import userService from '@/services/(routes)/users';
import { COOKIE_USER_KEY, ERROR_SUCCESS, loginBanner } from '@/config/constants';
import { MSG_PROMPT_EMAIL_ADDRESS, MSG_PROMPT_EMAIL_PASSWORD, MSG_PROMPT_LOGIN_COMPLETED } from '@/config/messages';
import { ContentWrapper, ImgWrapper, LoginFormContent, LoginBtn } from '@/_components/layout/client/styled';

export default function Login() {
  const { setLoginUser } = useGlobalContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const cookie = getCookie(COOKIE_USER_KEY);
    if (cookie) router.push('/');
  }, []);

  const validateForm = () => {
    if (!email) {
      showToastErrorMsg(MSG_PROMPT_EMAIL_ADDRESS);
      return false;
    }
    if (!validEmail(email)) {
      return false;
    }
    if (!password) {
      showToastErrorMsg(MSG_PROMPT_EMAIL_PASSWORD);
      return false;
    }
    return true;
  };

  const onLoginClick = async () => {
    if (validateForm()) {
      setLoading(true);
      const data = await userService.login(email, password);
      if (data.result !== ERROR_SUCCESS) {
        showToastErrorMsg(data.msg);
      } else {
        const userData = data.data;
        if (userData.token) {
          const cookiePayload = {
            token: userData.token,
            role: userData.role,
            email: userData.email,
            username: userData.username,
            id: userData._id
          };
          setLoginUser({ isLoggedIn: true, user: cookiePayload });
          setCookie(COOKIE_USER_KEY, JSON.stringify(cookiePayload));
          showToastInfoMsg(MSG_PROMPT_LOGIN_COMPLETED);
          router.push('/');
        }
      }
      setLoading(false);
    }
  };

  return (
    <ContentWrapper>
      <Row>
        {/* LEFT IMAGE SIDE */}
        <Col xs={0} md={12} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ImgWrapper>
            <img src={loginBanner.src} alt='Login Banner' />
          </ImgWrapper>
        </Col>

        {/* RIGHT FORM SIDE */}
        <Col xs={24} md={12} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <LoginFormContent>
            <form
              onSubmit={(e) => {
                e.preventDefault(); // prevent reload
                onLoginClick(); // trigger your existing handler
              }}
            >
              <div>
                <Typography.Title level={4} style={{ marginBottom: 8 }}>{`Welcome to TopDevsLLC! 👋🏻`}</Typography.Title>
                <Typography.Paragraph type='secondary'> sign-in to your account and start the adventure</Typography.Paragraph>
              </div>
              <Space direction='vertical' size='large'>
                <Space direction='vertical'>
                  <label htmlFor={'email'}>Email</label>
                  <Input
                    id='email'
                    name='email'
                    type='email'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete='email'
                    size='large'
                  />
                </Space>
                <Space direction='vertical'>
                  <label htmlFor='password'>Password</label>
                  <Input.Password
                    id='password'
                    name='password'
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete='current-password'
                    onPressEnter={onLoginClick}
                    size='large'
                  />
                </Space>
              </Space>
              <LoginBtn loading={loading && { icon: <SyncOutlined spin /> }} onClick={onLoginClick}>
                Login
              </LoginBtn>
            </form>
          </LoginFormContent>
        </Col>
      </Row>
    </ContentWrapper>
  );
}
