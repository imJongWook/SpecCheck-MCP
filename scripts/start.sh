#!/bin/bash
echo "MCP 서버 시작 중..."
cd /home/ubuntu/speccheck-mcp-server

# .env 파일 생성
cat > .env << ENVEOF
DATABASE_URL=postgresql://postgres.hapjrztcjdqwasyzitvx:CPZOryDqbyzfHj6C@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres
PORT=3001
ENVEOF

# 의존성 설치
npm install --production

# PM2로 실행
pm2 start src/index.js --name speccheck-mcp
pm2 save

echo "MCP 서버 시작 완료"
