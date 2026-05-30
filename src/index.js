import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { z } from 'zod';
import express from 'express';
import dotenv from 'dotenv';
import {
  getUserInfo,
  getUserSpec,
  getTargetCompanies,
  getAcceptedProfile,
  calculateMatchRate,
} from './tools.js';

dotenv.config();

const PORT = process.env.PORT || 3001;
const app = express();

// 도구 등록 함수
function createServer() {
  const server = new McpServer({
    name: 'speccheck-mcp-server',
    version: '1.0.0',
  });

  server.tool('getUserInfo', '유저의 기본 정보(이름, 학년, 희망직무)를 조회합니다.',
    { userId: z.number().describe('조회할 유저 ID') },
    async ({ userId }) => {
      console.log(`[MCP] getUserInfo 호출 - userId: ${userId}`);
      const result = await getUserInfo(userId);
      return { content: [{ type: 'text', text: JSON.stringify(result) }] };
    }
  );

  server.tool('getUserSpec', '유저의 현재 스펙을 조회합니다.',
    { userId: z.number().describe('조회할 유저 ID') },
    async ({ userId }) => {
      console.log(`[MCP] getUserSpec 호출 - userId: ${userId}`);
      const result = await getUserSpec(userId);
      return { content: [{ type: 'text', text: JSON.stringify(result) }] };
    }
  );

  server.tool('getTargetCompanies', '유저가 설정한 목표 기업 목록을 조회합니다.',
    { userId: z.number().describe('조회할 유저 ID') },
    async ({ userId }) => {
      console.log(`[MCP] getTargetCompanies 호출 - userId: ${userId}`);
      const result = await getTargetCompanies(userId);
      return { content: [{ type: 'text', text: JSON.stringify(result) }] };
    }
  );

  server.tool('getAcceptedProfile', '특정 기업의 합격자 평균 스펙을 조회합니다.',
    { companyId: z.number().describe('기업 ID') },
    async ({ companyId }) => {
      console.log(`[MCP] getAcceptedProfile 호출 - companyId: ${companyId}`);
      const result = await getAcceptedProfile(companyId);
      return { content: [{ type: 'text', text: JSON.stringify(result) }] };
    }
  );

  server.tool('calculateMatchRate', '유저 스펙과 합격자 평균 스펙을 비교해 합격률을 계산합니다.',
    {
      gpa: z.number(), toeicScore: z.number(), certificateCount: z.number(),
      projectCount: z.number(), internshipCount: z.number(),
      avgGpa: z.number(), avgToeic: z.number(), avgCert: z.number(),
      avgProject: z.number(), avgInternship: z.number(),
    },
    async (params) => {
      console.log('[MCP] calculateMatchRate 호출');
      const result = calculateMatchRate(params);
      return { content: [{ type: 'text', text: JSON.stringify(result) }] };
    }
  );

  return server;
}

const transports = {};

app.get('/sse', async (req, res) => {
  console.log('[MCP] SSE 연결 요청');
  const transport = new SSEServerTransport('/messages', res);
  const server = createServer();
  await server.connect(transport);
  console.log('[MCP] sessionId:', transport.sessionId);
  transports[transport.sessionId] = transport;
  res.on('close', () => {
    console.log('[MCP] SSE 연결 종료:', transport.sessionId);
    delete transports[transport.sessionId];
  });
});

app.post('/messages', async (req, res) => {
  const sessionId = req.query.sessionId;
  const transport = transports[sessionId];
  if (transport) {
    await transport.handlePostMessage(req, res);
  } else {
    res.status(400).json({ error: 'Session not found' });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'UP', server: 'speccheck-mcp-server' });
});

app.listen(PORT, () => {
  console.log(`SpecCheck MCP 서버 실행 중 - http://localhost:${PORT}`);
  console.log(`SSE 엔드포인트: http://localhost:${PORT}/sse`);
});