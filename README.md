# SpecCheck MCP Server

## 실행
```bash
npm install
cp .env.example .env
# .env에 DATABASE_URL 설정
npm start
```

## 도구 목록
- getUserInfo - 유저 기본 정보 조회
- getUserSpec - 유저 스펙 조회
- getTargetCompanies - 목표 기업 목록 조회
- getAcceptedProfile - 기업별 합격자 평균 스펙 조회
- calculateMatchRate - 합격률 계산

## 엔드포인트
- GET /health - 헬스체크
- POST /mcp - MCP 엔드포인트
