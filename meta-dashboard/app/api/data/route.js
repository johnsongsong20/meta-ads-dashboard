const ACCOUNT_IDS = [
  '1349375325729644','1295673481394132','994275598578038','393237196834489',
  '897758539804899','1410162463800186','2037138286706045','1787689704985832',
  '737984749099297','809005254637020','8970854159685706','985832763418355',
  '1577035316347695','332564609711563','8401236283273004'
];

const WINDOWS = ['last_30d','last_14d','last_7d','last_4d'];
const API = 'https://graph.facebook.com/v25.0';

function parseInsight(row) {
  if (!row) return { spend: 0, leads: 0, cpl: null };
  const spend = parseFloat(row.spend) || 0;
  const leadAct = (row.actions || []).find(a => a.action_type === 'lead');
  const leads = leadAct ? parseInt(leadAct.value) : 0;
  const cplAct = (row.cost_per_action_type || []).find(a => a.action_type === 'lead');
  const cpl = cplAct ? parseFloat(cplAct.value) : (leads > 0 ? spend / leads : null);
  return { spend, leads, cpl };
}

async function fetchInsight(token, accountId, datePreset) {
  const fields = 'spend,actions,cost_per_action_type';
  const res = await fetch(
    `${API}/${accountId}/insights?fields=${fields}&date_preset=${datePreset}&access_token=${token}`,
    { next: { revalidate: 0 } }
  );
  const json = await res.json();
  if (json.error) return null;
  return json.data?.[0] || null;
}

async function fetchName(token, accountId) {
  const res = await fetch(`${API}/${accountId}?fields=name&access_token=${token}`, { next: { revalidate: 3600 } });
  const json = await res.json();
  return json.name || accountId;
}

export async function GET() {
  const token = process.env.META_TOKEN;
  if (!token) {
    return Response.json({ error: 'META_TOKEN env var not set' }, { status: 500 });
  }

  try {
    // Fetch names + all window data in parallel
    const [names, ...windowResults] = await Promise.all([
      Promise.all(ACCOUNT_IDS.map(id => fetchName(token, id))),
      ...WINDOWS.map(w =>
        Promise.all(ACCOUNT_IDS.map(id => fetchInsight(token, id, w)))
      )
    ]);

    const accounts = ACCOUNT_IDS.map((id, i) => {
      const windows = {};
      WINDOWS.forEach((w, wi) => {
        windows[w] = parseInsight(windowResults[wi][i]);
      });
      return { id, name: names[i], windows };
    });

    return Response.json({ accounts, fetchedAt: new Date().toISOString() });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
