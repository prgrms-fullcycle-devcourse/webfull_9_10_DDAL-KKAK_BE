# ✈️ Travel-Tick

> **여행은 내가 할게, 기록은 네가 할래?**  
> 영수증 한 장으로 완성되는 AI 기반 여행 소비 기록 서비스

---

## 🧭 프로젝트 소개

여행 정산 서비스 'Travel-Tick'의 백엔드 저장소입니다.

## 🛠 기술 스택

- **Language**: TypeScript
- **Framework**: Node.js (Express)
- **Database**: PostgreSQL (Prisma ORM)
- **Security & Config**: Doppler (Secret Management)
- **Architecture**: Layered Architecture (Controller - Service - Repository)
- **Code Quality**: ESLint, Prettier, Husky, Commitlint

## 📂 프로젝트 구조

본 프로젝트는 유지보수성과 테스트 용이성을 위해 **Layered Architecture**를 따릅니다.

```text
src/
├── config/             # 환경 변수, DB 연결 등 전역 설정
├── constants/          # 에러 메시지, 공통 상태 코드 등 상수
├── controllers/        # [Layer 1] 요청/응답 처리, 입력값 검증 호출
├── services/           # [Layer 2] 핵심 비즈니스 로직, 데이터 가공
├── models/             # [Layer 3] DB 스키마 정의 (TypeORM, Mongoose 등)
├── repositories/       # (선택) DB 직접 접근 로직 분리 시 사용
├── errors/             # 커스텀 에러 클래스 정의 (AppError, NotFoundError 등)
├── lib/                # 외부 라이브러리 초기화 및 싱글톤 (PrismaClient)
│   └── prisma.ts       # PrismaClient 인스턴스화 및 어댑터 설정
├── routes/             # 엔드포인트 정의 및 컨트롤러 연결
├── middlewares/        # 인증, 로깅, 에러 핸들링 등 공통 미들웨어
├── utils/              # 공통 함수 (날짜 계산, 암호화 등)
├── types/              # 공통 TypeScript 인터페이스/타입 정의
├── app.ts              # Express 앱 설정 및 미들웨어 등록
└── main.ts             # 서버 구동 (포트 리스닝)
```

---

## 🚀 시작하기

### 1. 사전 준비

- [Doppler CLI](https://docs.doppler.com/docs/install-cli) 설치 및 로그인 (`doppler login`)
- Node.js (v18+ 권장) 및 npm

### 2. 의존성 설치

프로젝트 의존성을 설치합니다. 설치 후 `prisma generate`가 자동 실행됩니다.

```bash
npm install
```

### 3. 환경 변수 및 데이터베이스 설정

Doppler를 통해 환경 변수를 설정하고 데이터베이스 스키마를 동기화합니다.

```bash
# 로컬 개발용 .env 파일 생성
npm run env:download

# DB 마이그레이션 실행 (테이블 생성)
npm run db:migrate
```

### 4. 애플리케이션 실행

```bash
# Development (Hot-reload with Doppler)
npm run dev

# Production Build & Start
npm run build
npm start
```

### 5. 주요 유틸리티 명령어

| Command             | Description                                    |
| :------------------ | :--------------------------------------------- |
| `npm run lint`      | ESLint를 통한 코드 정적 분석                   |
| `npm run format`    | Prettier를 통한 코드 포맷팅                    |
| `npm run db:studio` | Prisma Studio(GUI)로 DB 데이터 확인            |
| `npm run db:reset`  | DB 초기화 (데이터 삭제 및 마이그레이션 재실행) |

---

## 🛣️ API 경로

추후 업데이트될 예정입니다.

### 🔐 인증 (Auth) - 예정

| Method | Endpoint | Description |
| :----- | :------- | :---------- |

### 👤 유저 (User) - 예정

| Method | Endpoint | Description |
| :----- | :------- | :---------- |
