const config = window.__JCODE_CONFIG__ || {};

const read = (runtimeName, buildName) => {
  const runtimeValue = config[runtimeName];
  if (typeof runtimeValue === 'string' && runtimeValue.trim()) {
    return runtimeValue.trim().replace(/\/$/, '');
  }

  const buildValue = process.env[buildName];
  return typeof buildValue === 'string' ? buildValue.trim().replace(/\/$/, '') : '';
};

export const runtimeConfig = Object.freeze({
  apiUrl: read('API_URL', 'REACT_APP_API_URL'),
  keycloakUrl: read('KEYCLOAK_URL', 'REACT_APP_KEYCLOAK_URL'),
  realm: read('REALM', 'REACT_APP_REALM'),
  clientId: read('CLIENT_ID', 'REACT_APP_CLIENT_ID'),
  redirectUri: read('REDIRECT_URI', 'REACT_APP_REDIRECT_URI'),
  scope: read('SCOPE', 'REACT_APP_SCOPE'),
});

export const requireApiUrl = () => {
  if (!runtimeConfig.apiUrl) {
    throw new Error('JCODE_API_URL runtime configuration is required.');
  }
  return runtimeConfig.apiUrl;
};
