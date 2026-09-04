# 1단계: 빌드 단계
FROM docker.io/library/node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

# 소스 코드 복사 및 빌드
COPY . .

# 웹 번들링 최적화 옵션 추가
ENV NODE_ENV=production
# 빌드 시 소스맵 생성 비활성화로 번들 크기 감소
ENV GENERATE_SOURCEMAP=false
RUN npm run build

# 중간 단계: 정적 파일 최적화
FROM docker.io/library/node:20-alpine AS optimize
WORKDIR /app
COPY --from=build /app/build /app/build
# 추가 최적화 도구 설치 및 실행
RUN npm install -g html-minifier-terser
RUN find /app/build -name "*.html" -exec html-minifier-terser --collapse-whitespace --remove-comments --remove-redundant-attributes --remove-script-type-attributes --remove-tag-whitespace --use-short-doctype {} -o {} \;

# 2단계: 프로덕션 단계
FROM docker.io/library/nginx:stable-alpine
COPY --from=optimize /app/build /usr/share/nginx/html
COPY docker/runtime-config.template.js /usr/share/nginx/html/runtime-config.template.js
COPY docker/40-runtime-config.sh /docker-entrypoint.d/40-runtime-config.sh

# Nginx 설정 파일 복사
COPY ./nginx/default.conf /etc/nginx/conf.d/default.conf

# Nginx 압축 설정 추가 (캐싱 설정 제외)
RUN echo 'gzip on; \
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript; \
    gzip_comp_level 6; \
    gzip_min_length 1000; \
    gzip_proxied any;' > /etc/nginx/conf.d/gzip.conf \
    && chmod 755 /docker-entrypoint.d/40-runtime-config.sh

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
