'use client';
import styled from 'styled-components';
import { Button, Space, Table, Grid, Tabs } from 'antd';

export const Container = ({ children }) => {
  const screens = Grid.useBreakpoint();

  let maxWidth = '100%';

  if (screens.xl && !screens.xxl) {
    maxWidth = 1200; // xl
  }

  if (screens.xxl) {
    maxWidth = 1440; // or 1320 like Bootstrap 5
  }

  return (
    <div
      style={{
        margin: '0 auto',
        padding: '0 16px',
        width: '100%',
        maxWidth
      }}
    >
      {children}
    </div>
  );
};

export const BlankLayoutWrapper = styled.div.withConfig({
  displayName: 'main'
})({
  height: 'calc(100vh - 63px)',

  '& .content-center': {
    display: 'flex',
    minHeight: '100vh',
    alignItems: 'center',
    justifyContent: 'center'
  },

  '& .content-right': {
    display: 'flex',
    minHeight: '100vh',
    overflowX: 'hidden',
    position: 'relative'
  }
});

export const Header = styled.header.withConfig({
  displayName: 'header'
})({
  backgroundColor: '#fff', // needed for contrast
  boxShadow: '0 4px 8px -4px rgba(76, 78, 100, 0.42)',
  position: 'relative',
  zIndex: 10
});

export const HeaderWrapper = styled.div.withConfig({
  displayName: 'header-wrapper'
})({
  borderBottom: 'rgba(76, 78, 100, 0.12)',
  borderWidth: 1
});

export const NavbarHeader = styled.div.withConfig({
  displayName: 'navbar-header'
})({
  minHeight: 63,
  display: 'flex'
});

export const NavbarBrand = styled.a.withConfig({
  displayName: 'navbar-brand'
})({
  display: 'flex',
  alignItems: 'center',
  textDecoration: 'none',
  marginRight: '2rem',
  img: {
    width: '45px',
    height: '35px',
    objectFit: 'cover'
  }
});

export const NavbarBrandTypo = styled.div({
  fontSize: '1rem', // 16px
  fontWeight: 600, // not too heavy
  color: 'rgba(76,78,100,0.87)',
  marginLeft: '0.5rem',
  letterSpacing: '0.3px', // smoother, modern
  lineHeight: 1.4 // more breathing room
});

export const ContentWrapper = styled.div.withConfig({
  displayName: 'content-wrapper'
})({
  overflowX: 'hidden',
  position: 'relative',
  height: '100%',

  '&.resume': {
    paddingTop: 24,
    paddingBottom: 48,
    height: 'calc(100vh - 63px)'
  },

  '& .ant-space': {
    width: '100%'
  },

  '& > *': {
    height: '100%', // all direct children get full height
    width: '100%'
  }
});

export const ImgWrapper = styled.div.withConfig({
  displayName: 'img-wrapper'
})({
  padding: '5rem',
  paddingRight: 0,
  maxWidth: '48rem',

  '@media (max-width: 1535.95px)': {
    maxWidth: '38rem'
  },

  // 🔹 Hide on screens smaller than 900px
  '@media (max-width: 900px)': {
    display: 'none'
  },

  img: {
    width: '100%',
    height: 'auto',
    objectFit: 'contain',
    display: 'block'
  }
});

export const LoginFormContent = styled.div.withConfig({
  displayName: 'login-content'
})({
  width: '100%',
  maxWidth: '380px',
  margin: '0 auto',
  backgroundColor: '#fff',
  padding: '2rem',
  borderRadius: '8px',
  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',

  // 🔹 Responsive breakpoints
  '@media (min-width: 900px)': {
    maxWidth: '400px'
  },
  '@media (min-width: 1200px)': {
    maxWidth: '450px'
  },

  // 🔹 Hide on screens smaller than 900px
  '@media (max-width: 900px)': {
    maxWidth: 'fit-content',
    margin: 'auto'
  },

  '& h5': {
    lineHeight: 1.334,
    color: 'rgba(76, 78, 100, 0.87)',
    letterSpacing: '0.18px',
    marginBottom: '0.375rem',
    fontWeight: 'bold'
  },

  '& p': {
    lineHeight: 1.429,
    letterSpacing: '0.15px',
    fontWeight: 400,
    fontSize: '0.875rem',
    color: 'rgba(76, 78, 100, 0.6)'
  },

  '& label': {
    paddingBottom: 8,
    color: 'rgba(76, 78, 100, 0.6)'
  }
});

export const FlexBox = styled.div.withConfig({
  displayName: 'flex-box'
})({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flex: 1
});

export const HeaderItem = styled(Space).withConfig({
  displayName: 'space-wrapper'
})({
  height: '63px',

  // 🔹 target inner .ant-space-item
  '& .ant-space-item': {
    height: '90%', // make each item match header height
    display: 'flex',
    alignItems: 'center'
  },

  // optional: style button inside item
  '& .ant-btn': {
    height: '100%',
    borderRadius: 0,
    display: 'flex',
    alignItems: 'center',
    fontWeight: 500,
    color: 'rgba(76, 78, 100, 0.87) !important',
    borderRadius: '6px'
  },

  '& .ant-btn-active': {
    backgroundColor: '#787EFF',
    color: '#fff !important',
    fontWeight: 700
  }
});

export const StyledButton = styled(Button, {
  shouldForwardProp: (prop) => prop !== 'variant'
})(({ variant }) => {
  const primaryBg = '#666CFF';
  const primaryHover = '#5A5FE0';

  const secondaryBg = '#F4F5FA';
  const secondaryHover = '#E4E6F1';

  return {
    width: 'fit-content',
    borderRadius: '8px',
    fontWeight: 500,
    textTransform: 'uppercase',
    border: 'none',
    backgroundColor: variant === 'secondary' ? secondaryBg : primaryBg,
    color: variant === 'secondary' ? '#3A3A57' : '#fff !important',

    '&:hover, &:focus, &:active': {
      textDecoration: 'none',
      backgroundColor: variant === 'secondary' ? `${secondaryHover} !important` : `${primaryHover} !important`,
      boxShadow: variant === 'secondary' ? '0px 4px 12px -6px rgba(76, 78, 100, 0.25)' : '0px 6px 18px -8px rgba(76, 78, 100, 0.56)',
      border: 'none'
    },

    '& .ant-btn-icon': {
      display: 'flex'
    }
  };
});

export const LoginBtn = styled(Button).withConfig({
  displayName: 'login-btn'
})({
  width: '100%',
  backgroundColor: '#666CFF',
  borderRadius: '8px',
  color: '#fff !important',
  fontWeight: 500,
  fontSize: '0.9375rem !important',
  textTransform: 'uppercase',
  lineHeight: 1.734,
  padding: '1.2rem 1.625rem !important',
  marginTop: '16px',

  '&:hover, &:focus, &:active': {
    textDecoration: 'none',
    backgroundColor: '#5A5FE0 !important',
    boxShadow: '0px 6px 18px -8px rgba(76, 78, 100, 0.56)',
    border: 'none'
  },

  '& .ant-btn-icon': {
    display: 'flex'
  }
});

export const SpinWrapper = styled.div.withConfig({
  displayName: 'spin-wrapper'
})({
  display: 'flex',
  justifyContent: 'center',
  height: 'calc(100vh - 63px)',
  alignItems: 'center',

  '& .ant-spin-dot-holder': {
    color: '#666CFF'
  }
});

export const ColorTable = styled(Table).withConfig({
  displayName: 'antd-table'
})({
  // const primaryHover = '#5A5FE0';
  '.ant-table': {
    background: 'transparent',
    borderRadius: '8px',
    overflow: 'hidden'
  },

  '& .ant-table-thead > tr > th': {
    background: '#666CFF !important',
    color: '#fff !important',
    fontWeight: 600,
    border: 'none'
  },

  '& .ant-table-thead > tr:first-child > th:first-child': {
    borderTopLeftRadius: '8px',
    borderBottomLeftRadius: '8px'
  },

  '& .ant-table-thead > tr:first-child > th:last-child': {
    borderTopRightRadius: '8px',
    borderBottomRightRadius: '8px'
  },

  '& .ant-table-tbody > tr': {
    cursor: 'pointer'
  },

  '& .ant-table-tbody > tr:nth-child(odd)': {
    background: '#fafafa'
  },

  '& .ant-table-tbody > tr:hover': {
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
  },

  '& .ant-table-tbody > tr > td': {
    borderBottom: '1px solid #f0f0f0'
  },

  '& .ant-table-tbody > tr:hover > td': {
    background: '#f7f9ff !important'
  },

  '& .ant-table-cell': {
    padding: '10px 12px !important',
    borderRight: '1px solid #f0f0f0'
  },

  '& .ant-table-cell:last-child': {
    borderRight: 'none'
  },

  '& .ant-table-filter-trigger .anticon, .ant-table-column-sorter-inner .anticon': {
    color: '#fff !important'
  },

  '& .ant-table-filter-trigger.active .anticon': {
    color: '#ff4d4f !important'
  }
});

export const ColorTabs = styled(Tabs)`
  .ant-tabs-tab {
    user-select: none !important;
  }

  .ant-tabs-tab-active {
    background: ${(props) => (props.$isSecondary ? '#1bc0ff !important' : '#666CFF !important')};
  }

  .ant-tabs-tab-active .ant-tabs-tab-btn {
    color: #fff !important;
  }
`;
