#!/bin/bash
echo "MCP 서버 중지 중..."
pm2 stop speccheck-mcp 2>/dev/null || true
pm2 delete speccheck-mcp 2>/dev/null || true
echo "MCP 서버 중지 완료"
