import pool from './db.js';

// ──────────────────────────────────────────────
// 1. 유저 기본 정보 조회
// ──────────────────────────────────────────────
export async function getUserInfo(userId) {
  try {
    const result = await pool.query(
      'SELECT name, grade, job_name, is_onboarded FROM users WHERE user_id = $1',
      [userId]
    );
    if (result.rows.length === 0) return { error: '유저를 찾을 수 없습니다.' };
    const row = result.rows[0];
    return {
      name: row.name,
      grade: row.grade,
      jobName: row.job_name,
      isOnboarded: row.is_onboarded,
    };
  } catch (e) {
    console.error('[MCP] getUserInfo 오류:', e.message);
    return { error: e.message };
  }
}

// ──────────────────────────────────────────────
// 2. 유저 스펙 조회
// ──────────────────────────────────────────────
export async function getUserSpec(userId) {
  try {
    const result = await pool.query(
      `SELECT gpa, toeic_score, certificate_count, project_count,
              internship_count, award_count, tech_stack
       FROM user_spec WHERE user_id = $1`,
      [userId]
    );
    if (result.rows.length === 0) return { error: '스펙 정보가 없습니다.' };
    const row = result.rows[0];
    return {
      gpa: row.gpa || 0,
      toeicScore: row.toeic_score || 0,
      certificateCount: row.certificate_count || 0,
      projectCount: row.project_count || 0,
      internshipCount: row.internship_count || 0,
      awardCount: row.award_count || 0,
      techStack: row.tech_stack,
    };
  } catch (e) {
    console.error('[MCP] getUserSpec 오류:', e.message);
    return { error: e.message };
  }
}

// ──────────────────────────────────────────────
// 3. 목표 기업 목록 조회
// ──────────────────────────────────────────────
export async function getTargetCompanies(userId) {
  try {
    const result = await pool.query(
      `SELECT c.company_id, c.company_name, c.industry, c.company_type
       FROM user_target_company utc
       JOIN company c ON utc.company_id = c.company_id
       WHERE utc.user_id = $1`,
      [userId]
    );
    return result.rows.map(row => ({
      companyId: row.company_id,
      companyName: row.company_name,
      industry: row.industry,
      companyType: row.company_type,
    }));
  } catch (e) {
    console.error('[MCP] getTargetCompanies 오류:', e.message);
    return { error: e.message };
  }
}

// ──────────────────────────────────────────────
// 4. 기업별 합격자 평균 스펙 조회
// ──────────────────────────────────────────────
export async function getAcceptedProfile(companyId) {
  try {
    const result = await pool.query(
      `SELECT AVG(gpa) as avg_gpa,
              AVG(toeic_score) as avg_toeic,
              AVG(certificate_count) as avg_cert,
              AVG(project_count) as avg_project,
              AVG(internship_count) as avg_internship,
              COUNT(*) as sample_count
       FROM accepted_profile WHERE company_id = $1`,
      [companyId]
    );
    const row = result.rows[0];
    // 데이터 없으면 업계 평균 반환
    if (!row || row.sample_count == 0) {
      return {
        companyId,
        gpa: 3.8,
        toeicScore: 850,
        certificateCount: 1,
        projectCount: 3,
        internshipCount: 1,
        dataSource: '업계평균',
      };
    }
    return {
      companyId,
      gpa: Math.round(row.avg_gpa * 100) / 100,
      toeicScore: Math.round(row.avg_toeic),
      certificateCount: Math.round(row.avg_cert),
      projectCount: Math.round(row.avg_project),
      internshipCount: Math.round(row.avg_internship),
      sampleCount: row.sample_count,
      dataSource: '합격자데이터',
    };
  } catch (e) {
    console.error('[MCP] getAcceptedProfile 오류:', e.message);
    return { error: e.message };
  }
}

// ──────────────────────────────────────────────
// 5. 합격률 계산
// ──────────────────────────────────────────────
export function calculateMatchRate({
  gpa, toeicScore, certificateCount, projectCount, internshipCount,
  avgGpa, avgToeic, avgCert, avgProject, avgInternship,
}) {
  const gpaScore    = Math.min((gpa || 0) / (avgGpa || 3.8), 1.0) * 25;
  const toeicScore2 = Math.min((toeicScore || 0) / (avgToeic || 850), 1.0) * 25;
  const certScore   = Math.min((certificateCount || 0) / (avgCert || 1), 1.0) * 20;
  const projScore   = Math.min((projectCount || 0) / (avgProject || 3), 1.0) * 15;
  const internScore = Math.min((internshipCount || 0) / (avgInternship || 1), 1.0) * 15;

  const total = Math.round(gpaScore + toeicScore2 + certScore + projScore + internScore);

  return {
    matchRate: total,
    breakdown: {
      gpa: Math.round(gpaScore * 10) / 10,
      toeic: Math.round(toeicScore2 * 10) / 10,
      certificate: Math.round(certScore * 10) / 10,
      project: Math.round(projScore * 10) / 10,
      internship: Math.round(internScore * 10) / 10,
    },
  };
}
