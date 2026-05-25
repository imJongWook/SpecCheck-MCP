import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
import http from 'http';
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

// MCP 서버 생성
const server = new McpServer({
  name: 'speccheck-mcp-server',
  version: '1.0.0',
});

// ── 도구 등록 ──

server.tool(
  'getUserInfo',
  '유저의 기본 정보(이름, 학년, 희망직무)를 조회합니다.',
  { userId: z.number().describe('조회할 유저 ID') },
  async ({ userId }) => {
    console.log(`[MCP] getUserInfo 호출 - userId: ${userId}`);
    const result = await getUserInfo(userId);
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  }
);

server.tool(
  'getUserSpec',
  '유저의 현재 스펙(학점, 토익, 자격증, 프로젝트, 인턴십)을 조회합니다.',
  { userId: z.number().describe('조회할 유저 ID') },
  async ({ userId }) => {
    console.log(`[MCP] getUserSpec 호출 - userId: ${userId}`);
    const result = await getUserSpec(userId);
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  }
);

server.tool(
  'getTargetCompanies',
  '유저가 설정한 목표 기업 목록을 조회합니다.',
  { userId: z.number().describe('조회할 유저 ID') },
  async ({ userId }) => {
    console.log(`[MCP] getTargetCompanies 호출 - userId: ${userId}`);
    const result = await getTargetCompanies(userId);
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  }
);

server.tool(
  'getAcceptedProfile',
  '특정 기업의 합격자 평균 스펙을 조회합니다.',
  { companyId: z.number().describe('기업 ID') },
  async ({ companyId }) => {
    console.log(`[MCP] getAcceptedProfile 호출 - companyId: ${companyId}`);
    const result = await getAcceptedProfile(companyId);
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  }
);

server.tool(
  'calculateMatchRate',
  '유저 스펙과 합격자 평균 스펙을 비교해 합격률을 계산합니다.',
  {
    gpa: z.number().describe('유저 학점'),
    toeicScore: z.number().describe('유저 토익 점수'),
    certificateCount: z.number().describe('유저 자격증 수'),
    projectCount: z.number().describe('유저 프로젝트 수'),
    internshipCount: z.number().describe('유저 인턴십 횟수'),
    avgGpa: z.number().describe('합격자 평균 학점'),
    avgToeic: z.number().describe('합격자 평균 토익'),
    avgCert: z.number().describe('합격자 평균 자격증 수'),
    avgProject: z.number().describe('합격자 평균 프로젝트 수'),
    avgInternship: z.number().describe('합격자 평균 인턴십 횟수'),
  },
  async (params) => {
    console.log('[MCP] calculateMatchRate 호출');
    const result = calculateMatchRate(params);
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  }
);

// HTTP 서버 시작
const httpServer = http.createServer(async (req, res) => {
  // CORS 헤더
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'UP', server: 'speccheck-mcp-server' }));
    return;
  }

  if (req.url === '/mcp' || req.url === '/sse') {
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    await server.connect(transport);
    await transport.handleRequest(req, res);
    return;
  }

  res.writeHead(404);
  res.end('Not Found');
});

httpServer.listen(PORT, () => {
  console.log(`SpecCheck MCP 서버 실행 중 - http://localhost:${PORT}`);
  console.log(`헬스체크: http://localhost:${PORT}/health`);
  console.log(`MCP 엔드포인트: http://localhost:${PORT}/mcp`);
});
