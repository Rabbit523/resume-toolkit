'use client';
import React, { useState } from 'react';

import { COOKIE_USER_KEY, ERROR_SUCCESS, GOOGLE_LOGIN_CLIENT_KEY, loginBanner } from '@/config/constants';
import Link from 'next/link';
import { Input } from 'antd';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { jwtDecode, validUSPhone } from '@/helpers/common';
import userService from '@/services/(routes)/users';
import { showToastErrorMsg, showToastInfoMsg, validEmail } from '@/helpers/frontend';
import { setCookie } from 'cookies-next';
import { useRouter } from 'next/navigation';
import { useGlobalContext } from '@/context/auth';
import {
  MSG_PROMPT_EMAIL_ADDRESS,
  MSG_PROMPT_EMAIL_PASSWORD,
  MSG_PROMPT_FIRST_NAME,
  MSG_PROMPT_LAST_NAME,
  MSG_PROMPT_LOGIN_COMPLETED,
  MSG_PROMPT_USER_PHONE,
  MSG_PROMPT_VALID_EMAIL_ADDRESS,
  MSG_PROMPT_VALID_US_PHONE_NUMBER
} from '@/config/messages';
import PhoneInput from '@/_components/layout/common/PhoneInput';

export default function Register() {
  const { setLoginUser } = useGlobalContext();

  const [last_name, setLastName] = useState('');
  const [first_name, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [successful, setSuccessful] = useState(false);
  const router = useRouter();

  const onChangePhone = (e) => {
    if (e && e.length > 12) {
      return false;
    } else if (e && validUSPhone(e)) {
      setPhone(e);
    } else {
      return false;
    }
  };
  const onSuccessGoogle = async (credentialResponse) => {
    const userInfo = jwtDecode(credentialResponse.credential);
    const data = await userService.login_with_google({
      email: userInfo.email,
      email_verified: userInfo.email_verified,
      family_name: userInfo.family_name,
      given_name: userInfo.given_name,
      is_doctor: 0
    });
    if (data.error !== undefined) {
      showToastErrorMsg(data.msg);
    } else {
      if (data.token) {
        setLoginUser({ isLoggedIn: true, user: data });
        setCookie(COOKIE_USER_KEY, JSON.stringify(data));
        showToastInfoMsg(MSG_PROMPT_LOGIN_COMPLETED);
        router.push('/home');
      }
    }
  };
  const onPatientSignUp = async () => {
    if (validateForm()) {
      setSuccessful(true);
      const { result, msg } = await userService.register(first_name, last_name, phone, email, password, 0);
      if (result === ERROR_SUCCESS) {
        showToastInfoMsg(msg);
      } else {
        showToastErrorMsg(msg);
      }
      setSuccessful(false);
    }
  };
  const validateForm = () => {
    if (!first_name) {
      showToastErrorMsg(MSG_PROMPT_FIRST_NAME);
      return false;
    }
    if (!last_name) {
      showToastErrorMsg(MSG_PROMPT_LAST_NAME);
      return false;
    }
    if (!email) {
      showToastErrorMsg(MSG_PROMPT_EMAIL_ADDRESS);
      return false;
    }
    if (!validEmail(email)) {
      showToastErrorMsg(MSG_PROMPT_VALID_EMAIL_ADDRESS);
      return false;
    }
    if (!phone) {
      showToastErrorMsg(MSG_PROMPT_USER_PHONE);
      return false;
    }
    if (!validUSPhone(phone)) {
      showToastErrorMsg(MSG_PROMPT_VALID_US_PHONE_NUMBER);
      return false;
    }
    if (!password) {
      showToastErrorMsg(MSG_PROMPT_EMAIL_PASSWORD);
      return false;
    }
    return true;
  };

  const divFormStyle = {
    marginBottom: -15
  };
  return (
    <div className='content'>
      <div className='container-fluid'>
        <div className='row'>
          <div className='col-md-8 offset-md-2'>
            <div className='account-content'>
              <div className='row align-items-center justify-content-center'>
                <div className='col-md-7 col-lg-6 login-left'>
                  <img src={loginBanner.src} alt='Register' />
                </div>
                <div className='col-md-12 col-lg-6 login-right'>
                  <div className='login-header'>
                    <h3>
                      Patient Register <Link href='/doctor-register'>Are you a Doctor?</Link>
                    </h3>
                  </div>

                  <div className={'row form-row'} style={divFormStyle}>
                    <div className={'form-group col-6'}>
                      <label htmlFor='first_name'>First Name</label>
                      <Input
                        type='text'
                        className='form-control'
                        name='first_name'
                        id={'first_name'}
                        onChange={(e) => {
                          setFirstName(e.target.value);
                        }}
                      />
                    </div>
                    <div className={'form-group col-6'}>
                      <label htmlFor='last_name'>Last Name</label>
                      <Input
                        type='text'
                        className='form-control'
                        name='last_name'
                        id={'last_name'}
                        onChange={(e) => {
                          setLastName(e.target.value);
                        }}
                      />
                    </div>
                  </div>
                  <div className={'form-row'} style={divFormStyle}>
                    <div className='form-group col-12'>
                      <label htmlFor='email'>Email</label>
                      <Input
                        type='text'
                        className='form-control'
                        name='email'
                        id={'email'}
                        onChange={(e) => {
                          setEmail(e.target.value);
                        }}
                      />
                    </div>
                  </div>
                  <div className={'form-row'} style={divFormStyle}>
                    <div className='form-group col-12'>
                      <label htmlFor='phone'>Phone Number</label>
                      <PhoneInput className='form-control' name='phone' id='phone' value={phone} onChange={onChangePhone} />
                    </div>
                  </div>
                  <div className={'form-row'} style={divFormStyle}>
                    <div className='form-group col-12'>
                      <label htmlFor='password'>Create Password</label>
                      <Input
                        type='password'
                        className='form-control'
                        name='password'
                        id={'password'}
                        onChange={(e) => {
                          setPassword(e.target.value);
                        }}
                      />
                    </div>
                  </div>
                  <div
                    className={'text-center'}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-evenly',
                      paddingTop: 10
                    }}
                  >
                    <button className='btn btn-primary btn-block btn-lg login-btn' onClick={onPatientSignUp}>
                      Signup
                    </button>

                    <GoogleOAuthProvider buttonText='Login with Google' clientId={GOOGLE_LOGIN_CLIENT_KEY} text='log in'>
                      <GoogleLogin
                        onSuccess={onSuccessGoogle}
                        text=''
                        shape='circle'
                        logo_alignment={'left'}
                        width={80}
                        locale={'en-US'}
                        clientId={GOOGLE_LOGIN_CLIENT_KEY}
                      />
                    </GoogleOAuthProvider>
                  </div>
                  <div className={'login-or'}>
                    <span className={'or-line'}></span>
                    <span className={'span-or'}>or</span>
                  </div>
                  <div className={'text-center dont-have'}>
                    Do you have an account?
                    <Link href='/login'> Login</Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
