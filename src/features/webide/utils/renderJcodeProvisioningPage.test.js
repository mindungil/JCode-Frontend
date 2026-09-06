import { renderJcodeProvisioningPage } from './renderJcodeProvisioningPage';

const createPopup = () => ({
  document: document.implementation.createHTMLDocument('')
});

test('renders a branded and accessible JCode provisioning page', () => {
  const popup = createPopup();

  renderJcodeProvisioningPage(popup, {
    isDarkMode: false,
    assetOrigin: 'https://jcode.jedutools.io'
  });

  expect(popup.document.title).toBe('JCode 실행 환경 생성 중');
  expect(popup.document.documentElement.dataset.theme).toBe('light');
  expect(popup.document.querySelector('h1').textContent).toContain('JCode 실행 환경');
  expect(popup.document.querySelector('[role="progressbar"]')).not.toBeNull();
  expect(popup.document.querySelector('[aria-live="polite"]')).not.toBeNull();
  expect(popup.document.body.textContent).toContain('자동으로 JCode에 연결');
  expect(popup.document.querySelector('.jcode-brand img').src)
    .toBe('https://jcode.jedutools.io/jcodeLogoLight-v1.png');
});

test('uses the current dark theme and dark logo', () => {
  const popup = createPopup();

  renderJcodeProvisioningPage(popup, {
    isDarkMode: true,
    assetOrigin: 'https://jcode.jedutools.io/'
  });

  expect(popup.document.documentElement.dataset.theme).toBe('dark');
  expect(popup.document.querySelector('.jcode-brand img').src)
    .toBe('https://jcode.jedutools.io/jcodeLogoDark-v1.png');
});
