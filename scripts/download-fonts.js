const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const fontsDir = path.join(__dirname, '..', 'public', 'fonts');
const cssDir = path.join(__dirname, '..', 'public');

// 사용 중인 폰트 목록
const fonts = [
  { name: 'Outfit', weights: [500, 700] },
  { name: 'Space Grotesk', weights: [500, 700] },
  { name: 'Montserrat', weights: [600, 700] },
  { name: 'Quicksand', weights: [600, 700] },
  { name: 'Orbitron', weights: [500, 700] },
  { name: 'Exo 2', weights: [500, 700] },
  { name: 'Righteous', weights: [400] },
  { name: 'Comfortaa', weights: [300, 400, 500, 600, 700] },
  { name: 'Russo One', weights: [400] },
  { name: 'Fira Code', weights: [500, 700] },
  { name: 'JetBrains Mono', weights: [500, 700] },
  { name: 'Source Code Pro', weights: [500, 700] },
  { name: 'IBM Plex Mono', weights: [500, 700] },
  { name: 'Noto Sans KR', weights: [300, 400, 500, 700] },
  { name: 'Poppins', weights: [300, 400, 500, 600, 700] },
];

// 폰트 이름을 URL에 사용할 수 있는 형식으로 변환
function formatFontName(name) {
  return name.replace(/\s+/g, '+');
}

// 파일 다운로드 함수
function downloadFile(url, filePath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(filePath);
    
    protocol.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        // 리다이렉트 처리
        return downloadFile(response.headers.location, filePath)
          .then(resolve)
          .catch(reject);
      }
      
      if (response.statusCode !== 200) {
        file.close();
        fs.unlinkSync(filePath);
        reject(new Error(`Failed to download: ${url} (Status: ${response.statusCode})`));
        return;
      }
      
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      file.close();
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      reject(err);
    });
  });
}

// CSS에서 폰트 파일 URL 추출
function extractFontUrls(css) {
  const urls = [];
  const urlRegex = /url\(['"]?([^'")]+)['"]?\)/g;
  let match;
  
  while ((match = urlRegex.exec(css)) !== null) {
    let url = match[1];
    // 상대 URL을 절대 URL로 변환
    if (url.startsWith('//')) {
      url = 'https:' + url;
    } else if (url.startsWith('/')) {
      url = 'https://fonts.gstatic.com' + url;
    }
    urls.push(url);
  }
  
  return urls;
}

// 폰트 다운로드 및 CSS 생성
async function downloadFonts() {
  console.log('폰트 다운로드를 시작합니다...\n');
  
  // 폰트별 CSS 파일 생성
  let allFontFaces = [];
  
  for (const font of fonts) {
    const fontName = formatFontName(font.name);
    const weights = font.weights.join(';');
    const cssUrl = `https://fonts.googleapis.com/css2?family=${fontName}:wght@${weights}&display=swap`;
    
    console.log(`다운로드 중: ${font.name}...`);
    
    try {
      // CSS 파일 가져오기 (브라우저 User-Agent 필요)
      const css = await new Promise((resolve, reject) => {
        https.get(cssUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        }, (res) => {
          let data = '';
          res.on('data', (chunk) => { data += chunk; });
          res.on('end', () => resolve(data));
        }).on('error', reject);
      });
      
      // 폰트 파일 URL 추출
      const fontUrls = extractFontUrls(css);
      
      // 각 폰트 파일 다운로드
      for (const fontUrl of fontUrls) {
        // URL에서 파일명 추출 (쿼리 파라미터 제거)
        const urlParts = fontUrl.split('/');
        const fileName = urlParts[urlParts.length - 1].split('?')[0];
        const fontFamilyDir = path.join(fontsDir, font.name.replace(/\s+/g, '-'));
        
        if (!fs.existsSync(fontFamilyDir)) {
          fs.mkdirSync(fontFamilyDir, { recursive: true });
        }
        
        const filePath = path.join(fontFamilyDir, fileName);
        
        // 이미 다운로드된 파일은 스킵
        if (fs.existsSync(filePath)) {
          console.log(`  스킵: ${fileName} (이미 존재)`);
          continue;
        }
        
        try {
          await downloadFile(fontUrl, filePath);
          console.log(`  다운로드 완료: ${fileName}`);
        } catch (err) {
          console.error(`  다운로드 실패: ${fileName} - ${err.message}`);
        }
      }
      
      // CSS에서 로컬 경로로 변경
      const localCss = css.replace(/url\(['"]?https:\/\/fonts\.gstatic\.com\/([^'")]+)['"]?\)/g, (match, url) => {
        const fileName = url.split('/').pop().split('?')[0];
        const relativePath = `/fonts/${font.name.replace(/\s+/g, '-')}/${fileName}`;
        return `url('${relativePath}')`;
      });
      
      allFontFaces.push(localCss);
      console.log(`  완료: ${font.name}\n`);
      
    } catch (err) {
      console.error(`  오류: ${font.name} - ${err.message}\n`);
    }
  }
  
  // 통합 CSS 파일 생성
  const combinedCss = allFontFaces.join('\n');
  const cssFilePath = path.join(cssDir, 'fonts.css');
  fs.writeFileSync(cssFilePath, combinedCss, 'utf8');
  console.log(`\nCSS 파일 생성 완료: ${cssFilePath}`);
  console.log('\n모든 폰트 다운로드가 완료되었습니다!');
}

// 실행
downloadFonts().catch(console.error);
