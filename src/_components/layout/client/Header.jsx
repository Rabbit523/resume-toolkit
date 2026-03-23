'use client';
import { usePathname, useRouter } from 'next/navigation';
import { deleteCookie } from 'cookies-next';

import {
  ACCESSLIST,
  COOKIE_USER_KEY,
  ERROR_SUCCESS,
  Logo,
  AvatarImg,
  CONSTANT_USER_ROLE_USER
} from '@/config/constants';
import { useGlobalContext } from '@/context/auth';
import { showToastErrorMsg, showToastInfoMsg } from '@/helpers/frontend';
import userService from '@/services/(routes)/users';
import { jwtDecode } from '@/helpers/common';
import {
  Header as Head,
  HeaderWrapper,
  NavbarHeader,
  NavbarBrand,
  NavbarBrandTypo,
  FlexBox,
  HeaderItem,
  Container
} from '@/_components/layout/client/styled';
import { Dropdown, Avatar, Space, Button, Badge } from 'antd';
import { LogoutOutlined, UserOutlined } from '@ant-design/icons';

const Header = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { loginUser, setLoginUser } = useGlobalContext();
  const { isLoggedIn, user: currentUser } = loginUser;

  let userinfo;
  if (currentUser && currentUser.token) {
    userinfo = jwtDecode(currentUser.token);
  }

  const onHandleLogOut = async () => {
    const data = await userService.logout();
    if (data.error !== undefined) {
      showToastErrorMsg(data.msg);
      return;
    }

    if (data.result === ERROR_SUCCESS) {
      setLoginUser({ isLoggedIn: false, user: null });
      deleteCookie(COOKIE_USER_KEY);
      router.push('/');
      showToastInfoMsg(data.msg);
    }
  };

  const handleMenuClick = ({ key }) => {
    if (key === 'profile') {
      router.push(`/profile/${currentUser?.id}`);
      return;
    }

    if (key === 'logout') {
      onHandleLogOut();
    }
  };

  const profileHeader = (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <Badge color='green' dot offset={[-4, 30]}>
        <Avatar src={AvatarImg.src} size={40} />
      </Badge>
      <div style={{ marginLeft: 12 }}>
        <div style={{ fontWeight: 600, lineHeight: 1.2 }}>{currentUser?.username}</div>
        <div
          style={{
            fontSize: '0.8rem',
            color: 'rgba(0,0,0,0.45)',
            lineHeight: 1.2
          }}
        >
          {currentUser?.role}
        </div>
      </div>
    </div>
  );

  const menuItems = [
    {
      key: 'header',
      label: profileHeader,
      disabled: true,
      style: { cursor: 'default', background: 'transparent' }
    },
    { type: 'divider' },

    ...(currentUser?.role === CONSTANT_USER_ROLE_USER
      ? [
          {
            key: 'profile',
            icon: <UserOutlined />,
            label: 'Profile'
          }
        ]
      : []),

    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      danger: true
    }
  ];

  return (
    <Head className='header header-custom header-one'>
      <HeaderWrapper>
        <Container>
          <FlexBox>
            <NavbarHeader className='navbar-header'>
              <NavbarBrand href='/' className='navbar-brand logo'>
                <img src={Logo.src} alt='Logo' />
                <NavbarBrandTypo>TopDevsLLC</NavbarBrandTypo>
              </NavbarBrand>
            </NavbarHeader>

            {isLoggedIn && (
              <HeaderItem size='middle' align='center'>
                {ACCESSLIST[currentUser.role.toUpperCase()]?.map(({ path, label }) => {
                  const isActive = pathname.startsWith(path);
                  return (
                    label && (
                      <Button key={path} type={isActive ? 'active' : 'text'} onClick={() => router.push(path)}>
                        {label}
                      </Button>
                    )
                  );
                })}

                <Dropdown trigger={['click']} menu={{ items: menuItems, onClick: handleMenuClick }}>
                  <Button type='text' shape='circle'>
                    <Space>
                      <Avatar src={AvatarImg.src} size={40} />
                    </Space>
                  </Button>
                </Dropdown>
              </HeaderItem>
            )}
          </FlexBox>
        </Container>
      </HeaderWrapper>
    </Head>
  );
};

export default Header;
