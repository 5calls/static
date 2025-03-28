export const APP_NAME = '5 Calls';
export const APP_URL = 'https://5calls.org';
// export const APP_URL = 'http://localhost:8090';
export const API_URL = 'https://api.5calls.org/v1';
// export const API_URL = 'http://localhost:8090/v1';
export const ISSUES_API_URL = `${API_URL}/issues`;
export const REPS_API_URL = `${API_URL}/reps`;
export const COMPLETED_API_URL = `${API_URL}/issues/completed`;
export const REPORT_API_URL = `${API_URL}/report`;
export const STATS_API_URL = `${API_URL}/users/stats`;
export const PROFILE_API_URL = `${API_URL}/users/profile`;
export const API_TOKEN_URL = `${API_URL}/users/sendAPIToken`;
export const DONATIONS_API_URL = `${API_URL}/donations`;
export const MIDTERMS_API_URL = `${API_URL}/midterms`;
export const GROUP_API_URL = `${API_URL}/groups`;
export const CONTACTS_API_URL = `${API_URL}/contacts`;
export const REMINDER_API_URL = `${API_URL}/remind`;
export const DONATE_URL = 'https://secure.actblue.com/donate/5calls-donate';
export const ACTBLUE_EMBED_TOKEN = '5iuTAwr4Tnr8EvmUeAN5AsoQ';
export const WRITER_APPLY_URL = 'https://airtable.com/shrJBbpixnJ09iVb3';

export const SHARE_BUCKET_URL = 'https://shareimages.5calls.org/';

export const zipCodeRegex: RegExp = /^\d{5}(-\d{4})?$/;

export const cacheTimeout = {
  default: 24 * 60 * 60 * 1000, // 1 day
  groups: 24 * 60 * 60 * 1000 // 1 day
};

export const contact = {
  email: 'hello@5calls.org',
  github: 'https://github.com/5calls',
  twitter: 'https://twitter.com/make5calls',
  facebook: 'https://www.facebook.com/make5calls',
  apps: 'https://crgj.app.link/7R2bEB0R4F'
};

export const USER_ID_TOKEN_KEY = `userIdToken`;
