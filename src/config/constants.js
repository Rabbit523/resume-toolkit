export { default as Logo } from '/public/assets/client/images/logo.svg';
export { default as AvatarImg } from '/public/assets/client/images/avatar.png';
export { default as loginBanner } from '/public/assets/client/images/auth-login.png';
export { default as LOADER } from '/public/assets/loader.svg';
export { default as LOADER_BLACK } from '/public/assets/loader_black.svg';

export const TEMPLATE_OPTIONS = [
  { label: 'Template 1', value: 'template1', img: '/assets/client/images/template1.png' },
  { label: 'Template 2', value: 'template2', img: '/assets/client/images/template2.png' },
  { label: 'Template 3', value: 'template3', img: '/assets/client/images/template3.png' },
  { label: 'Template 4', value: 'template4', img: '/assets/client/images/template4.png' },
  { label: 'Template 5', value: 'template5', img: '/assets/client/images/template5.png' },
  { label: 'Template 6', value: 'template6', img: '/assets/client/images/template6.png' },
  { label: 'Template 7', value: 'template7', img: '/assets/client/images/template7.png' },
  { label: 'Template 8', value: 'template8', img: '/assets/client/images/template8.png' }
];

export const RESUME_TYPE_OPTIONS = [
  { label: 'Hybrid', value: 'hybrid' },
  { label: 'Engineering', value: 'engineering' }
];

export const GOOGLE_LOGIN_CLIENT_KEY = '547919628583-plt1588ht6a2vtjcnoo4sulhljeptfr6.apps.googleusercontent.com';

export const CONSTANT_USER_ROLE_SUPER = 'SUPER';
export const CONSTANT_USER_ROLE_ADMIN = 'ADMIN';
export const CONSTANT_USER_ROLE_USER = 'VA';
export const CONSTANT_USER_ROLE_CALLER = 'CALLER';
export const CONSTANT_USER_ROLE_GUEST = 'GUEST';

// config/constants.js
export const ACCESSLIST = {
  [CONSTANT_USER_ROLE_ADMIN]: [
    { path: '/', label: '' },
    { path: '/jobs', label: 'Jobs' },
    { path: '/resume', label: 'Resume' },
    { path: '/applies', label: 'Applies' },
    { path: 'interviews', label: 'Interviews' },
    { path: '/users', label: 'Users' },
    { path: '/profiles', label: 'Profiles' },
    { path: '/phones', label: 'Phones' }
  ],
  [CONSTANT_USER_ROLE_USER]: [
    { path: '/', label: '' },
    { path: '/jobs', label: 'Jobs' },
    { path: '/resume', label: 'Resume' },
    { path: '/applies', label: 'Applies' }
  ],
  [CONSTANT_USER_ROLE_CALLER]: [
    { path: '/', label: '' },
    { path: '/calls', label: 'Calls' }
  ]
};

export const USER_TABLE_COLUMNS_BASE = [
  { title: 'NAME', dataIndex: 'username', key: 'username' },
  { title: 'EMAIL', dataIndex: 'email', key: 'email' },
  { title: 'ROLE', dataIndex: 'role', key: 'role' },
  { title: 'STATUS', dataIndex: 'status', key: 'status' }
];

export const PROFILE_TABLE_COLUMNS_BASE = [
  { title: 'NAME', dataIndex: 'profileName', key: 'profileName' },
  { title: 'TITLE', dataIndex: 'profileTitle', key: 'title' },
  { title: 'EMAIL', dataIndex: 'profileEmail', key: 'email' },
  { title: 'LINKEDIN', dataIndex: 'profileLinkedIn', key: 'linkedin', ellipsis: true }
];

export const PHONE_TABLE_COLUMNS_BASE = [
  { title: 'SIP SERVER', dataIndex: 'sipServer', key: 'sipServer' },
  { title: 'SIP USERNAME', dataIndex: 'sipUsername', key: 'sipUsername' },
  {
    title: 'SIP PASSWORD',
    dataIndex: 'sipPassword',
    key: 'sipPassword',
    render: (sipPassword) => (!!sipPassword ? '******' : '')
  },
  { title: 'Status', dataIndex: 'status', key: 'status' }
];

///////////////////////////////////////////////////////
export const ERROR_SUCCESS = 'ok';
export const ERROR_FAILED = 'failed';
///////////////////////////////////////////////////////
export const DEFAULT_PAGINATION_SIZE = 50;

export const WEEK_DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const COOKIE_USER_KEY = 't_lpvt_1fc983b4c305d209e7e05d96e713939f';

export const TOKEN_SECRET = 'rXG1Xkpe2T0PAk7iTlXlo6CipStL3SNR';
export const NON_STRUCTURED_COUNTRIES = ['GB', 'SG', 'HK', 'IE', 'AE'];

export const REPORT_OPTIONS = [
  { label: 'Today', value: 'today' },
  { label: 'Last 7 days', value: 'week' },
  { label: 'Last 30 days', value: 'month' },
  { label: 'All time', value: 'all' }
];

export const STAGE_COLORS = {
  '1st Round': 'blue',
  '2nd Round': 'cyan',
  '3rd Round': 'geekblue',
  '4th Round': 'purple',
  '5th Round': 'magenta',
  Final: 'gold'
};

export const TYPE_COLORS = {
  Video: 'processing',
  Phone: 'default',
  Assessment: 'warning',
  AI: 'volcano'
};

export const RESULT_COLORS = {
  Pending: 'processing',
  Success: 'success',
  Failed: 'error'
};

export const gradients = {
  blue: 'linear-gradient(350deg, #6B73FF 0%, #000DFF 100%)',
  purple: 'linear-gradient(350deg, #ABDCFF 0%, #0396FF 100%)',
  pink: 'linear-gradient(350deg, #FEB692 0%, #EA5455 100%)',
  green: 'linear-gradient(350deg, #81FBB8 0%, #28C76F 100%)'
};
