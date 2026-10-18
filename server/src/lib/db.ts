import pg from 'pg';

// Connection string is injected from Secrets Manager via the Lambda environment (see template.yaml).
export const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 2, ssl: { rejectUnauthorized: true } });

export async function audit(orgId: string, action: string, targetType: string, targetId: string, detail: unknown, actor: { user?: string; system?: string }) {
  await pool.query(
    'INSERT INTO audit_log (org_id, actor_user, actor_system, action, target_type, target_id, detail) VALUES ($1,$2,$3,$4,$5,$6,$7)',
    [orgId, actor.user ?? null, actor.system ?? null, action, targetType, targetId, JSON.stringify(detail)],
  );
}
