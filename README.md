# S-Market (스포츠 마켓플레이스) 🏃‍♂️⚽

React + TypeScript + Vite 기반의 스포츠 용품 중고거래 플랫폼입니다.

## 🎯 주요 기능

- 🔐 사용자 인증 (Firebase Auth)
- 📦 상품 등록/조회/수정/삭제
- 💬 실시간 채팅
- 🤖 AI 이미지 분석 (OpenAI GPT-4 Vision)
- 📱 반응형 디자인 (모바일 최적화)
- 🔍 상품 검색 및 필터링
- 📍 GPS 기반 거리 계산 및 지역 표시
- 🗺️ 위치 기반 상품 정렬

## 환경 설정

### 1. 환경변수 설정

프로젝트 루트에 `.env` 파일을 생성하고 다음 내용을 추가하세요:

```env
# 관리자 이메일 목록 (쉼표로 구분)
VITE_ADMIN_EMAILS=admin@example.com,your_email@example.com

# OpenAI API 키 (AI 분석 기능용)
VITE_OPENAI_API_KEY=your_openai_api_key_here

# Firebase 설정 (필요시)
VITE_FIREBASE_API_KEY=your_firebase_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your_app_id_here

# 카카오 지도 API 키 (위치 정보 변환용, 선택사항)
VITE_KAKAO_API_KEY=your_kakao_api_key_here
```

### 2. 관리자 권한 설정

"모든 상품 삭제" 기능은 관리자만 사용할 수 있습니다:

1. `.env` 파일의 `VITE_ADMIN_EMAILS`에 관리자 이메일을 추가
2. 기본 관리자: `admin@example.com`, `ljm@example.com`
3. 관리자로 로그인하면 "🗑️ 모든 상품 삭제" 버튼이 표시됩니다

## 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 빌드
npm run build

## 🚀 배포 가이드

### 1. Firebase Hosting 배포 (권장)

```bash
# Firebase CLI 설치
npm install -g firebase-tools

# Firebase 로그인
firebase login

# 프로젝트 초기화 (이미 설정되어 있음)
firebase init hosting

# 빌드 및 배포
npm run build
firebase deploy
```

### 2. Vercel 배포

```bash
# Vercel CLI 설치
npm install -g vercel

# 배포
vercel
```

### 3. Netlify 배포

```bash
# Netlify CLI 설치
npm install -g netlify-cli

# 배포
npm run build
netlify deploy --prod --dir=dist
```

## 📱 모바일 최적화

- PWA (Progressive Web App) 지원
- 모바일 터치 인터페이스 최적화
- GPS 기능 모바일 지원
- 반응형 디자인

## 🔧 개발자 도구

### 디버깅 정보
- GPS 상태 모니터링
- 상품 데이터 로깅
- 이미지 업로드 상태 추적

### 관리자 기능
- 모든 상품 삭제 (관리자 전용)
- 사용자 차단 관리
- 시스템 상태 모니터링
```

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
