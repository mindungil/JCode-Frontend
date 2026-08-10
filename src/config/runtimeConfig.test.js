const loadConfig = () => {
  jest.resetModules();
  return require('./runtimeConfig');
};

afterEach(() => {
  window.__JCODE_CONFIG__ = {};
  delete process.env.REACT_APP_API_URL;
});

test('runtime API URL overrides the build environment', () => {
  window.__JCODE_CONFIG__ = { API_URL: 'https://api.production.example/' };
  process.env.REACT_APP_API_URL = 'https://api.environment.example';

  expect(loadConfig().requireApiUrl()).toBe('https://api.production.example');
});

test('missing API URL fails with a clear startup error', () => {
  window.__JCODE_CONFIG__ = {};

  expect(() => loadConfig().requireApiUrl()).toThrow('JCODE_API_URL');
});
