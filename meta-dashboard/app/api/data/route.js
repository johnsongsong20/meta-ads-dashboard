const ACCOUNT_NAMES = {
  '1349375325729644': 'Southside Coatings',
  '1295673481394132': 'Schultz Commercial Roofing',
  '994275598578038':  'Absolute Roofing & Construction',
  '393237196834489':  'Premier Roofing Systems',
  '897758539804899':  'Premier Roof Solutions',
  '1410162463800186': 'Lapp Roofing',
  '2037138286706045': 'D&C Sprayfoam',
  '1787689704985832': 'Great Lakes Spray Foam',
  '737984749099297':  'Rooftiq',
  '809005254637020':  'DNR Commercial Roofing',
  '8970854159685706': 'NCT Skyview Roofing',
  '985832763418355':  'RJ Future Roofing',
  '1577035316347695': 'Weavers Roofing & Construction',
  '332564609711563':  'cb roofing',
  '8401236283273004': 'Redeemed Roofing Systems',
};

const ACCOUNT_IDS = Object.keys(ACCOUNT_NAMES);
const WINDOWS = ['last_30d', 'last_14d', 'last_7d', 'last_4d'];

function parseInsight(row) {
  if (!row) return { spend: 0, leads: 0, cpl: null };
  const spend = parseFloat(row.spend) || 0;
  const leadAct = (row.actions || []).find(a => a.action_type === 'lead');
  const leads = leadAct ? parseInt(leadAct.value) : 0;
  const cplAct = (row.cost_per_action_type || []).find(a => a.action_type === 'lead');
  const cpl = cplAct ? parseFloat(cplAct.value) : (leads > 0 ? spend / leads : null);
  return { spend, leads, cpl };
}

function buildUrl(token, accountId, window) {
  const fields = 'spend,actions,cost_per_action_type';
  const base = `https://graph.facebook.com/v25.0/act_${accountId}/insights?fields=${fields}&access_token=${token}`;
  if (window === 'last_4d') {
    const today = new Date();
    const from = new Date(today);
    from.setDate(today.getDate() - 4);
    const fmt = d => d.toISOString().split('T')[0];
    const timeRange = encodeURIComponent(JSON.stringify({ since: fmt(from), until: fmt(today) }));
    return `${base}&time_range=${timeRange}`;
  }
  return `${base}&date_preset=${window}`;
}

async function fetchInsight(token, accountId, window) {
  const url = buildUrl(token, accountId, window);
  const res = await fetch(url, { cache: 'no-store' });
  const json = await res.json();
  if (json.error) {
    console.error(`Error ${accountId} ${window}:`, json.error.message);
    return null;
  }
  return json.data?.[0] || null;
}

export async function GET() {
  const token = process.env.META_TOKEN;
  if (!token) {
    return Response.json({ error: 'META_TOKEN env var not set' }, { status: 500 });
  }
  try {
    const allFetches = ACCOUNT_IDS.flatMap(id =>
      WINDOWS.map(w => fetchInsight(token, id, w).then(data => ({ id, window: w, data: parseInsight(data) })))
    );
    const results = await Promise.all(allFetches);
    const accountMap = {};
    for (const { id, window, data } of results) {
      if (!accountMap[id]) {
        accountMap[id] = { id, name: ACCOUNT_NAMES[id] || id, windows: {} };
      }
      accountMap[id].windows[window] = data;
    }
    return Response.json({ accounts: Object.values(accountMap), fetchedAt: new Date().toISOString() });
  } catch (e) {
    console.error('Fetch error:', e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
