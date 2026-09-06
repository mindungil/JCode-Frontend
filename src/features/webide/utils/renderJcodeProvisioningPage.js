const appendElement = (document, parent, tagName, options = {}) => {
  const element = document.createElement(tagName);
  if (options.className) element.className = options.className;
  if (options.text) element.textContent = options.text;
  Object.entries(options.attributes || {}).forEach(([name, value]) => {
    element.setAttribute(name, value);
  });
  parent.appendChild(element);
  return element;
};

export const renderJcodeProvisioningPage = (
  ideWindow,
  { isDarkMode = false, assetOrigin = window.location.origin } = {}
) => {
  const document = ideWindow.document;
  const theme = isDarkMode ? 'dark' : 'light';
  const logoPath = isDarkMode ? '/jcodeLogoDark-v1.png' : '/jcodeLogoLight-v1.png';
  const logoUrl = new URL(logoPath, `${assetOrigin.replace(/\/$/, '')}/`).toString();

  document.documentElement.lang = 'ko';
  document.documentElement.dataset.theme = theme;
  document.head.replaceChildren();
  document.body.replaceChildren();
  document.title = 'JCode 실행 환경 생성 중';

  appendElement(document, document.head, 'meta', { attributes: { charset: 'utf-8' } });
  appendElement(document, document.head, 'meta', {
    attributes: { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  });
  appendElement(document, document.head, 'link', {
    attributes: { rel: 'stylesheet', href: new URL('/fonts.css', logoUrl).toString() }
  });

  const style = appendElement(document, document.head, 'style');
  style.textContent = `
    :root {
      color-scheme: light;
      --page: #ffffff;
      --surface: #f7f9fc;
      --surface-strong: #ffffff;
      --text: #282a36;
      --muted: #5f6673;
      --border: #e0e4ea;
      --primary: #1976d2;
      --primary-soft: #e8f2fd;
      --header: rgba(255, 255, 255, 0.88);
    }
    :root[data-theme="dark"] {
      color-scheme: dark;
      --page: #0a0a0e;
      --surface: #20212b;
      --surface-strong: #282a36;
      --text: #f8f8f2;
      --muted: #b6b8c5;
      --border: #44475a;
      --primary: #bd93f9;
      --primary-soft: #332d46;
      --header: rgba(10, 10, 14, 0.88);
    }
    * { box-sizing: border-box; }
    html, body { min-height: 100%; }
    body {
      margin: 0;
      min-width: 280px;
      min-height: 100vh;
      background: var(--page);
      color: var(--text);
      font-family: 'JetBrains Mono', 'Noto Sans KR', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    .jcode-header {
      height: 64px;
      border-bottom: 1px solid var(--border);
      background: var(--header);
      display: flex;
      align-items: center;
    }
    .jcode-header__inner {
      width: min(1120px, calc(100% - 32px));
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }
    .jcode-brand { display: flex; align-items: center; gap: 10px; }
    .jcode-brand img { width: 50px; height: 32px; object-fit: contain; }
    .jcode-brand strong { font-size: 22px; font-weight: 800; }
    .jcode-product {
      color: var(--muted);
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .jcode-main {
      min-height: calc(100vh - 64px);
      display: grid;
      place-items: center;
      padding: 32px 20px;
    }
    .jcode-content { width: min(620px, 100%); text-align: center; }
    .jcode-code-icon {
      width: 64px;
      height: 64px;
      margin: 0 auto 24px;
      border: 1px solid var(--border);
      border-radius: 8px;
      background: var(--surface-strong);
      color: var(--primary);
      display: grid;
      place-items: center;
      font-size: 22px;
      font-weight: 800;
    }
    h1 {
      margin: 0;
      font-size: 28px;
      line-height: 1.4;
      font-weight: 750;
      letter-spacing: 0;
      word-break: keep-all;
    }
    .jcode-lead {
      margin: 12px auto 28px;
      color: var(--muted);
      font-family: 'Noto Sans KR', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
      font-size: 15px;
      line-height: 1.7;
      word-break: keep-all;
    }
    .jcode-status {
      padding: 18px;
      border: 1px solid var(--border);
      border-radius: 8px;
      background: var(--surface);
      display: flex;
      align-items: center;
      gap: 14px;
      text-align: left;
    }
    .jcode-spinner {
      width: 28px;
      height: 28px;
      flex: 0 0 28px;
      border: 3px solid var(--primary-soft);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: jcode-spin 0.9s linear infinite;
    }
    .jcode-status__copy { min-width: 0; }
    .jcode-status strong { display: block; font-size: 14px; line-height: 1.5; }
    .jcode-status span {
      display: block;
      margin-top: 3px;
      color: var(--muted);
      font-family: 'Noto Sans KR', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
      font-size: 13px;
      line-height: 1.5;
    }
    .jcode-progress {
      height: 4px;
      margin-top: 14px;
      overflow: hidden;
      border-radius: 2px;
      background: var(--primary-soft);
    }
    .jcode-progress::after {
      content: '';
      display: block;
      width: 42%;
      height: 100%;
      border-radius: inherit;
      background: var(--primary);
      animation: jcode-progress 1.8s ease-in-out infinite;
    }
    .jcode-detail {
      margin: 18px 0 0;
      color: var(--muted);
      font-family: 'Noto Sans KR', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
      font-size: 13px;
      line-height: 1.7;
      word-break: keep-all;
    }
    @keyframes jcode-spin { to { transform: rotate(360deg); } }
    @keyframes jcode-progress {
      0% { transform: translateX(-110%); }
      55% { transform: translateX(90%); }
      100% { transform: translateX(245%); }
    }
    @media (prefers-reduced-motion: reduce) {
      .jcode-spinner, .jcode-progress::after { animation-duration: 4s; }
    }
  `;

  const header = appendElement(document, document.body, 'header', { className: 'jcode-header' });
  const headerInner = appendElement(document, header, 'div', { className: 'jcode-header__inner' });
  const brand = appendElement(document, headerInner, 'div', { className: 'jcode-brand' });
  appendElement(document, brand, 'img', {
    attributes: { src: logoUrl, alt: 'JCode' }
  });
  appendElement(document, brand, 'strong', { text: 'JCode' });
  appendElement(document, headerInner, 'span', {
    className: 'jcode-product',
    text: 'Workspace'
  });

  const main = appendElement(document, document.body, 'main', { className: 'jcode-main' });
  const content = appendElement(document, main, 'section', {
    className: 'jcode-content',
    attributes: { 'aria-labelledby': 'jcode-loading-title' }
  });
  appendElement(document, content, 'div', {
    className: 'jcode-code-icon',
    text: '</>',
    attributes: { 'aria-hidden': 'true' }
  });
  appendElement(document, content, 'h1', {
    text: 'JCode 실행 환경을 생성하고 있습니다',
    attributes: { id: 'jcode-loading-title' }
  });
  appendElement(document, content, 'p', {
    className: 'jcode-lead',
    text: '개인 전용 Pod와 개발 도구를 안전하게 준비하고 있습니다.'
  });

  const status = appendElement(document, content, 'div', {
    className: 'jcode-status',
    attributes: { 'aria-live': 'polite' }
  });
  appendElement(document, status, 'div', {
    className: 'jcode-spinner',
    attributes: { 'aria-hidden': 'true' }
  });
  const statusCopy = appendElement(document, status, 'div', { className: 'jcode-status__copy' });
  appendElement(document, statusCopy, 'strong', { text: '개인 작업공간 준비 중' });
  appendElement(document, statusCopy, 'span', {
    text: 'Pod가 시작되고 개발 환경이 준비될 때까지 잠시만 기다려 주세요.'
  });
  appendElement(document, content, 'div', {
    className: 'jcode-progress',
    attributes: {
      role: 'progressbar',
      'aria-label': 'JCode 실행 환경 생성 중',
      'aria-valuetext': '준비 중'
    }
  });
  appendElement(document, content, 'p', {
    className: 'jcode-detail',
    text: '준비가 완료되면 이 창에서 자동으로 JCode에 연결됩니다. 일반적으로 오래 걸리지 않습니다.'
  });
};
