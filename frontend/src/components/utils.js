let activeLang = 'bn';
export function setActiveLang(l) {
  activeLang = l === 'en' ? 'en' : 'bn';
}
export function getActiveLang() {
  return activeLang;
}

export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

const BN_MONTHS = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];
const EN_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatDate(d) {
  if (!d) return '—';
  const dt = new Date(d);
  if (activeLang === 'en') {
    return `${EN_MONTHS[dt.getMonth()]} ${dt.getDate()}, ${dt.getFullYear()}`;
  }
  return `${dt.getDate()} ${BN_MONTHS[dt.getMonth()]}, ${dt.getFullYear()}`;
}

export function formatTimeAgo(d) {
  if (!d) return '';
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (activeLang === 'en') {
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins} min ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hr ago`;
    const days = Math.floor(hours / 24);
    return `${days} days ago`;
  }
  if (mins < 1) return 'এইমাত্র';
  if (mins < 60) return `${mins} মিনিট আগে`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ঘণ্টা আগে`;
  const days = Math.floor(hours / 24);
  return `${days} দিন আগে`;
}

export function formatTaka(n) {
  if (n == null) return '—';
  const locale = activeLang === 'en' ? 'en-US' : 'bn-BD';
  const fmt = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(n);
  return activeLang === 'en' ? `Tk ${fmt}` : `${fmt} টাকা`;
}

export function formatNumber(n, digits = 1) {
  if (n == null) return '—';
  const locale = activeLang === 'en' ? 'en-US' : 'bn-BD';
  return new Intl.NumberFormat(locale, { maximumFractionDigits: digits }).format(n);
}

const CROP_STATUS_EN = { PLANTED: 'Planted', GROWING: 'Growing', HARVESTED: 'Harvested' };
const CROP_STATUS_BN = { PLANTED: 'রোপণ করা হয়েছে', GROWING: 'বর্ধমান', HARVESTED: 'কাটা সম্পন্ন' };
export const CROP_STATUS_LABELS = (s) => (activeLang === 'en' ? CROP_STATUS_EN : CROP_STATUS_BN)[s] || s || '—';

export const CROP_STATUS_TONES = {
  PLANTED: 'blue',
  GROWING: 'green',
  HARVESTED: 'gray',
};

const SEVERITY_EN = { LOW: 'Low', MEDIUM: 'Medium', HIGH: 'High' };
const SEVERITY_BN = { LOW: 'কম', MEDIUM: 'মাঝারি', HIGH: 'উচ্চ' };
export const SEVERITY_LABELS = (s) => (activeLang === 'en' ? SEVERITY_EN : SEVERITY_BN)[s] || s || '—';

const DISEASE_STATUS_EN = { OPEN: 'Open', IN_PROGRESS: 'In Progress', RESOLVED: 'Resolved' };
const DISEASE_STATUS_BN = { OPEN: 'অমীমাংসিত', IN_PROGRESS: 'চলমান', RESOLVED: 'সমাধান হয়েছে' };
export const DISEASE_STATUS_LABELS = (s) => (activeLang === 'en' ? DISEASE_STATUS_EN : DISEASE_STATUS_BN)[s] || s || '—';

export const DISEASE_STATUS_TONES = {
  OPEN: 'red',
  IN_PROGRESS: 'amber',
  RESOLVED: 'green',
};

const ROLE_EN = { FARMER: 'Farmer', OFFICER: 'Agriculture Officer', ADMIN: 'Admin' };
const ROLE_BN = { FARMER: 'কৃষক', OFFICER: 'কৃষি কর্মকর্তা', ADMIN: 'অ্যাডমিন' };
export const ROLE_LABELS = (r) => (activeLang === 'en' ? ROLE_EN : ROLE_BN)[r] || r || '—';