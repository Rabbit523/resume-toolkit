import jwt from 'jsonwebtoken';
import {
  TOKEN_SECRET,
  CONSTANT_USER_ROLE_ADMIN,
  CONSTANT_USER_ROLE_SUPER,
  CONSTANT_USER_ROLE_USER,
  CONSTANT_USER_ROLE_CALLER
} from '@/config/constants';
import { headers } from 'next/headers';
import { jwtDecode } from '@/helpers/common';

export function sendError(res, options) {
  const code = options && options.code ? options.code : 400;

  let message = options && options.msg ? options.msg : null;
  let fm = 'Unknown error';

  if (message !== null && message !== undefined) {
    if (message.length && typeof message[0] === 'object' && message[0].msg && message[0].param) {
      fm = message[0].msg;
    } else if (typeof message === 'string') {
      fm = message;
    } else if (typeof message === 'object') {
      if (message.code && message.severity) {
        fm = message.severity + ' - ' + message.code;
      } else if (message.msg) {
        fm = message.msg;
      } else if (message.message) {
        fm = message.message;
      }
    }
  }
  if (!res.headersSent) {
    if (res) {
      return res.json({ msg: fm }, { status: 401 });
    }
  }
}

export function hasAuthorization(req) {
  return !!req.headers.authorization;
}

export function isAuthorized(req) {
  let rv = false;
  if (hasAuthorization(req)) {
    try {
      jwt.verify(getToken(req), TOKEN_SECRET);
      rv = true;
    } catch {
      rv = false;
    }
  } else {
    rv = false;
  }
  return rv;
}

export function getToken(req) {
  const headersList = headers();
  const authorization = headersList.get('authorization');
  return authorization.split(' ')[1];
}

export function decodedToken(req) {
  return jwtDecode(getToken(req));
}

export function isAdmin(req) {
  const token = decodedToken(req);
  return token && token.role && token.role.toUpperCase() === CONSTANT_USER_ROLE_ADMIN;
}

export function isUser(req) {
  const token = decodedToken(req);
  return token && token.role && token.role.toUpperCase() === CONSTANT_USER_ROLE_USER;
}

export function isSuper(req) {
  const token = decodedToken(req);
  return token && token.role && token.role.toUpperCase() === CONSTANT_USER_ROLE_SUPER;
}

export function isCaller(req) {
  const token = decodedToken(req);
  return token && token.role && token.role.toUpperCase() === CONSTANT_USER_ROLE_CALLER;
}

// Removes all problematic invisible unicode characters
export function sanitizeText(value) {
  if (value === null || value === undefined) return '';

  // If array → join into string
  if (Array.isArray(value)) {
    value = value.join(' ');
  }

  // Force string conversion
  const str = String(value);

  return str
    .replace(/\n/g, ' ')
    .replace(/—/g, '-')
    .replace(/–/g, '-')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[\u{1F000}-\u{1FAFF}]/gu, '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '');
}

const sanitizeASCII = (str) =>
  str
    .replace(/[\u2012-\u2015]/g, '-') // EM/EN dashes → hyphen
    .replace(/[^\x00-\x7F]/g, '') // Remove non-ASCII
    .trim();

export const formatASCIIPart = (str) =>
  sanitizeASCII(str)
    .replace(/ /g, '_')
    .replace(/-/g, '_')
    .replace(/[^a-zA-Z0-9_]/g, '')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');

export function shortenRole(str) {
  const s = str.toLowerCase();

  if (s.includes('full') && s.includes('stack')) return 'FullStack';
  if (s.includes('frontend')) return 'FE';
  if (s.includes('backend')) return 'BE';
  if (s.includes('software engineer')) return 'SWE';
  if (s.includes('staff')) return 'Staff_SWE';
  if (s.includes('senior')) return 'Sr_SWE';
  if (s.includes('founding')) return 'Founding_Eng';

  return str.replace(/[^a-zA-Z0-9]/g, '').slice(0, 20); // fallback
}

export function buildResumeFilename({ name, role, company, maxLength = 48 }) {
  const clean = (str) =>
    str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');

  const abbreviate = (str) => {
    if (!str) return '';
    if (str.length <= 10) return str;
    return str.slice(0, 3) + str.slice(-3);
  };

  const cleanName = clean(name);
  const cleanRole = shortenRole(role || '');
  const cleanCompany = clean(company || '');

  let base = `${cleanName}_${cleanRole}_${cleanCompany}`.replace(/_+$/g, '');

  if (base.length > maxLength) {
    base = `${cleanName}_${abbreviate(cleanRole)}_${cleanCompany}`.replace(/_+$/g, '');
  }
  if (base.length > maxLength) {
    base = `${abbreviate(cleanName)}_${abbreviate(cleanRole)}_${cleanCompany}`.replace(/_+$/g, '');
  }

  return base;
}

export function shortenLinkedIn(url) {
  if (!url) return '';

  let clean = url.trim();

  // Not LinkedIn → leave unchanged
  if (!clean.includes('linkedin.com')) return clean;

  // Remove protocol + www
  clean = clean.replace(/^https?:\/\//, '').replace(/^www\./, '');

  // Remove trailing slash
  clean = clean.replace(/\/+$/, '');

  // Remove "linkedin.com"
  clean = clean.replace(/^linkedin\.com/, '');

  // Ensure no accidental leading slashes duplication
  return clean.replace(/^\/+/, '/');
}

// helpers/endpoint.js (replace formatMonthYear with this)
export function formatMonthYear(input) {
  if (!input) return '';
  const raw = String(input).trim();
  if (!raw) return '';
  if (/present/i.test(raw)) return 'Present';

  // if already looks like "Jun 2022" or "June 2022" -> normalize to "MMM YYYY"
  const monthMap = {
    jan: 0,
    january: 0,
    feb: 1,
    february: 1,
    mar: 2,
    march: 2,
    apr: 3,
    april: 3,
    may: 4,
    jun: 5,
    june: 5,
    jul: 6,
    july: 6,
    aug: 7,
    august: 7,
    sep: 8,
    sept: 8,
    september: 8,
    oct: 9,
    october: 9,
    nov: 10,
    november: 10,
    dec: 11,
    december: 11
  };

  // "06/2019" or "2019/06"
  const cleaned = raw.replace(/[-.]/g, '/');
  const parts = cleaned.split('/').map((p) => p.trim());
  if (parts.length === 2 && (parts[0].length === 4 || parts[1].length === 4)) {
    let year, month;
    if (parts[0].length === 4) {
      year = parts[0];
      month = parts[1];
    } else {
      month = parts[0];
      year = parts[1];
    }

    const m = parseInt(month, 10);
    const y = parseInt(year, 10);
    if (!isNaN(m) && !isNaN(y) && m >= 1 && m <= 12) {
      const date = new Date(y, m - 1, 1);
      const mmm = date.toLocaleString('en-US', { month: 'short' });
      return `${mmm} ${y}`;
    }
  }

  // "June 2022" / "Feb 2018"
  const m = raw.match(/^([A-Za-z]+)\s+(\d{4})$/);
  if (m) {
    const key = m[1].toLowerCase();
    const idx = monthMap[key];
    if (idx !== undefined) {
      const date = new Date(parseInt(m[2], 10), idx, 1);
      const mmm = date.toLocaleString('en-US', { month: 'short' });
      return `${mmm} ${m[2]}`;
    }
  }

  // fallback
  return raw;
}

export function normalizeUrl(url) {
  if (!url) return '';

  // Trim spaces
  url = url.trim();

  // If it already starts with http:// or https://, return as is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // Otherwise add https://
  return 'https://' + url;
}
