// EventBridge Scheduler, daily 07:00 UTC → email grant team about reports and milestones due in 30/14/7/1 days or overdue.
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';
import { audit, pool } from '../lib/db.js';

const ses = new SESv2Client({});
const OFFSETS = [30, 14, 7, 1];

export async function handler() {
  const { rows } = await pool.query(`
    SELECT 'report' AS kind, r.id, r.title, r.due_date, g.id AS grant_id, g.code, g.org_id, (r.due_date - current_date) AS days
      FROM reports r JOIN grants g ON g.id = r.grant_id
     WHERE r.status <> 'submitted' AND (r.due_date - current_date) <= 30
    UNION ALL
    SELECT 'milestone', m.id, m.title, m.due_date, g.id, g.code, g.org_id, (m.due_date - current_date)
      FROM milestones m JOIN grants g ON g.id = m.grant_id
     WHERE m.status IN ('not_started', 'in_progress') AND (m.due_date - current_date) <= 30`);

  for (const item of rows) {
    const days = Number(item.days);
    const bucket = days < 0 ? `overdue-w${Math.floor(-days / 7)}` : OFFSETS.includes(days) ? `${days}d` : null;
    if (!bucket) continue;
    const key = `${item.kind}:${item.id}:${bucket}`;
    const { rowCount } = await pool.query('INSERT INTO reminders_sent (key) VALUES ($1) ON CONFLICT DO NOTHING', [key]);
    if (!rowCount) continue; // already sent

    const { rows: team } = await pool.query(
      `SELECT u.email, u.name FROM grant_users gu JOIN users u ON u.id = gu.user_id WHERE gu.grant_id = $1 AND u.role <> 'viewer'`, [item.grant_id]);
    const subject = days < 0
      ? `[GrantLoom] OVERDUE: ${item.title} (${item.code}) was due ${item.due_date.toISOString().slice(0, 10)}`
      : `[GrantLoom] ${item.title} (${item.code}) due in ${days} day${days === 1 ? '' : 's'}`;
    const body = `${subject}\n\nOpen GrantLoom to review open gaps for this ${item.kind}: ${process.env.APP_URL}/app/${item.kind === 'report' ? `reports/${item.id}` : 'milestones'}\n`;
    if (team.length) {
      await ses.send(new SendEmailCommand({
        FromEmailAddress: process.env.REMINDER_FROM,
        Destination: { ToAddresses: team.map((t) => t.email) },
        Content: { Simple: { Subject: { Data: subject }, Body: { Text: { Data: body } } } },
      }));
    }
    await audit(item.org_id, 'Sent deadline reminder', item.kind, item.id, { bucket, recipients: team.length }, { system: 'lambda:reminders' });
  }
}
