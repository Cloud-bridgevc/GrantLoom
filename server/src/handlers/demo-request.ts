// API: POST /public/demo-request (website form) → HubSpot contact upsert + deal in the Demo Requests pipeline.
// HUBSPOT_TOKEN is a private-app token from Secrets Manager. Pipeline/stage ids come from env (see docs/HUBSPOT.md).
import type { APIGatewayProxyEventV2 } from 'aws-lambda';

const HS = 'https://api.hubapi.com';
const SEGMENT: Record<string, string> = {
  'NGO / nonprofit': 'ngo', 'Foundation / funder': 'foundation', 'Research institution': 'research', 'Grant consultant': 'consultant', Other: 'other',
};

async function hs(path: string, method: string, body: unknown) {
  const res = await fetch(`${HS}${path}`, { method, headers: { Authorization: `Bearer ${process.env.HUBSPOT_TOKEN}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`HubSpot ${path} ${res.status}: ${await res.text()}`);
  return res.json() as Promise<{ id: string; results?: { id: string }[] }>;
}

export async function handler(event: APIGatewayProxyEventV2) {
  const f = JSON.parse(event.body ?? '{}') as Record<string, string>;
  if (!f.name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email ?? '') || !f.org || !SEGMENT[f.orgType] || f.consent !== 'yes') {
    return { statusCode: 400, body: 'Invalid request' };
  }
  const [firstname, ...rest] = f.name.trim().split(/\s+/);
  const props = {
    email: f.email.toLowerCase(), firstname, lastname: rest.join(' '), company: f.org, jobtitle: f.role ?? '',
    grantloom_segment: SEGMENT[f.orgType], grantloom_active_grants: f.grants ?? '', grantloom_demo_notes: (f.msg ?? '').slice(0, 2000),
    lifecyclestage: 'marketingqualifiedlead', hs_legal_basis: 'Freely given consent from contact',
  };

  // Upsert the contact by email.
  const found = await hs('/crm/v3/objects/contacts/search', 'POST', { filterGroups: [{ filters: [{ propertyName: 'email', operator: 'EQ', value: props.email }] }], limit: 1 });
  const contactId = found.results?.[0]?.id
    ? (await hs(`/crm/v3/objects/contacts/${found.results[0].id}`, 'PATCH', { properties: props })).id
    : (await hs('/crm/v3/objects/contacts', 'POST', { properties: props })).id;

  // Deal in the demo pipeline, associated to the contact (association type 3 = deal → contact).
  await hs('/crm/v3/objects/deals', 'POST', {
    properties: { dealname: `Demo — ${f.org}`, pipeline: process.env.HS_DEMO_PIPELINE, dealstage: process.env.HS_DEMO_STAGE_NEW, grantloom_segment: SEGMENT[f.orgType] },
    associations: [{ to: { id: contactId }, types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 3 }] }],
  });
  return { statusCode: 202, body: JSON.stringify({ ok: true }) };
}
