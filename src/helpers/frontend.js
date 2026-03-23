import Swal from 'sweetalert2';
import { isValidEmail } from './common';

export const showToastMsg = (title, iconClass) => {
  Swal.mixin({
    position: 'top-end',
    showConfirmButton: false,
    timer: 2000,
    toast: true,
    timerProgressBar: true
  }).fire(title, '', iconClass);
};

export function showToastInfoMsg(message) {
  showToastMsg(message, 'info');
}

export function showToastErrorMsg(message) {
  showToastMsg(message, 'error');
}

export function required(value) {
  if (!value) {
    showToastErrorMsg('This field is required!');
  }
}

export function validEmail(email) {
  if (!isValidEmail(email)) {
    showToastErrorMsg('This is not a valid email.');
    return false;
  }
  return true;
}

export const normalizeSummary = (summary) => {
  if (!summary) return [];
  if (Array.isArray(summary)) return summary;
  if (typeof summary === 'string') return [summary];
  return [];
};

export const normalizeAchievements = (achievements) => {
  if (!achievements) return [];
  if (Array.isArray(achievements)) {
    return achievements.map((a) =>
      typeof a === 'string' ? { text: a } : a
    );
  }
  return [];
};

export const normalizeWorkExperiences = (experiences) => {
  if (!Array.isArray(experiences)) return [];

  return experiences.map((exp) => ({
    ...exp,
    achievements: normalizeAchievements(exp.achievements)
  }));
};

export const normalizeTechnicalSkills = (skills) => {
  if (!skills || typeof skills !== 'object') return [];
  return Object.entries(skills).map(([category, values]) => ({
    category,
    skills: Array.isArray(values) ? values : []
  }));
};

export const isValidJobUrl = (url) => {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
};