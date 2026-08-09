# 배포 가이드

Frontend 이미지는 환경별 주소를 포함하지 않고 한 번만 빌드합니다. 검증한 이미지 digest를 dev에서 production으로 그대로 승격하고, 주소와 Keycloak 설정은 컨테이너 시작 시 주입합니다.

## 로컬 개발

```bash
cp .env.example .env
npm ci
npm start
```

CRA 개발 서버에서만 `.env`의 `REACT_APP_*` 값을 fallback으로 읽습니다. 배포 이미지에는 이 값이 포함되지 않습니다.

## 이미지 빌드와 실행

```bash
docker build -t registry.example/jcode/frontend:git-sha .

docker run --rm -p 8080:80 \
  -e JCODE_API_URL=https://api.dev.example \
  -e JCODE_KEYCLOAK_URL=https://auth.dev.example \
  -e JCODE_REALM=jcode \
  -e JCODE_CLIENT_ID=jcode-frontend \
  -e JCODE_REDIRECT_URI=https://dev.example/callback \
  -e JCODE_SCOPE='openid profile email' \
  registry.example/jcode/frontend:git-sha
```

`JCODE_API_URL`은 필수입니다. 나머지는 인증 구성이 필요할 때 설정합니다. 시작 스크립트가 `/runtime-config.js`를 생성하므로 같은 이미지 digest를 서로 다른 환경 설정으로 실행할 수 있습니다.

## Kubernetes 예시

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: jcode-frontend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: jcode-frontend
  template:
    metadata:
      labels:
        app: jcode-frontend
    spec:
      containers:
        - name: frontend
          image: registry.example/jcode/frontend@sha256:REPLACE_WITH_VERIFIED_DIGEST
          ports:
            - containerPort: 80
          env:
            - name: JCODE_API_URL
              value: https://api.example
            - name: JCODE_KEYCLOAK_URL
              value: https://auth.example
            - name: JCODE_REALM
              value: jcode
            - name: JCODE_CLIENT_ID
              value: jcode-frontend
            - name: JCODE_REDIRECT_URI
              value: https://jcode.example/callback
            - name: JCODE_SCOPE
              value: openid profile email
          readinessProbe:
            httpGet:
              path: /
              port: 80
          livenessProbe:
            httpGet:
              path: /
              port: 80
```

환경을 바꿀 때 이미지를 다시 빌드하지 않습니다. dev에서 확인한 digest를 production manifest에 넣고 `JCODE_*` 값만 production 설정으로 교체합니다.

## 확인

```bash
curl --fail http://localhost:8080/runtime-config.js
curl --fail http://localhost:8080/
```

`runtime-config.js`에 실행 환경의 값이 있고 정적 JS 번들에 dev 주소가 없는지 확인합니다.
