#!/bin/bash
echo "MCP 서버 검증 중..."
sleep 5

for i in {1..10}; do
    if curl -s http://localhost:3001/health | grep -q "UP"; then
        echo "MCP 서버 정상 실행 확인"
        exit 0
    fi
    echo "대기 중... ($i/10)"
    sleep 3
done

echo "MCP 서버 검증 실패"
exit 1
