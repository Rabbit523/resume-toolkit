'use client';
import Header from '@/_components/layout/client/Header';
import { BlankLayoutWrapper } from '@/_components/layout/client/styled';
import { useEffect } from 'react';

const ClientLayout = ({ props, pathname }) => {
  useEffect(() => {
    const interval = setInterval(() => {
      document.querySelectorAll('#owagent-div').forEach((el) => el.remove());
    }, 200);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <Header />
      <BlankLayoutWrapper className='layout-wrapper'>{props}</BlankLayoutWrapper>
    </>
  );
};
export default ClientLayout;
