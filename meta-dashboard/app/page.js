'use client';
import { useState, useEffect, useCallback } from 'react';

const WINDOWS = ['last_30d','last_14d','last_7d','last_4d'];
const WIN_LABELS = { last_30d:'30d', last_14d:'14d', last_7d:'7d', last_4d:'4d' };
const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 min

function shortName(n = '') {
  return n
    .replace(' and Construction','').replace('& Construction','')
    .replace(' Commercial Roofing','').replace(' Roofing Systems, LLC','')
    .replace(' Roofing Systems','').replace(' Spray Foam Insulation LLC','')
    .replace(', LLC','').replace(' LLC','').replace(' Roofing','')
    .replace(', Inc.','').replace(' Inc.','').replace(' Ad Account','');
}

function cplStyle(cpl) {
  if (!cpl) return { bg:'#f3f4f6', color:'#6b7280' };
  if (cpl < 81)  return { bg:'#dcfce7', color:'#15803d' };
  if (cpl < 90)  return { bg:'#fef3c7', color:'#b45309' };
  return { bg:'#fee2e2', color:'#b91c1c' };
}

function fmt(n) { return n != null ? '$' + n.toFixed(2) : '—'; }

function MiniBar({ value, max }) {
  const pct = max > 0 ? (value / max * 100) : 0;
  return (
    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
      <div style={{ flex:1, height:4, background:'#e5e7eb', borderRadius:2, minWidth:40 }}>
        <div style={{ width:`${pct}%`, height:4, background:'#1877f2', borderRadius:2 }} />
      </div>
      <span style={{ fontSize:11, color:'#6b7280', minWidth:18 }}>{value}</span>
    </div>
  );
}

function StatCard({ label, value, sub }) {
  return (
    <div style={{ background:'#fff', border:'1px solid rgba(0,0,0,.07)', borderRadius:10, padding:'14px 18px' }}>
      <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.05em', color:'#6b7280', marginBottom:5 }}>{label}</div>
      <div style={{ fontSize:26, fontWeight:700, lineHeight:1 }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:'#9ca3af', marginTop:3 }}>{sub}</div>}
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fetchedAt, setFetchedAt] = useState(null);
  const [filter, setFilter] = useState('');
  const [sortKey, setSortKey] = useState('leads30');
  const [sortAsc, setSortAsc] = useState(false);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL / 1000);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/data');
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json.accounts);
      setFetchedAt(new Date(json.fetchedAt).toLocaleTimeString());
      setCountdown(REFRESH_INTERVAL / 1000);
    } catch(e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const timer = setInterval(load, REFRESH_INTERVAL);
    return () => clearInterval(timer);
  }, [load]);

  useEffect(() => {
    const tick = setInterval(() => setCountdown(c => c > 0 ? c - 1 : 0), 1000);
    return () => clearInterval(tick);
  }, []);

  const accounts = data || [];
  const filtered = accounts.filter(a => a.name.toLowerCase().includes(filter.toLowerCase()));

  const sorted = [...filtered].sort((a, b) => {
    let av, bv;
    if (sortKey === 'name') { av = a.name; bv = b.name; }
    else if (sortKey === 'leads30') { av = a.windows.last_30d?.leads || 0; bv = b.windows.last_30d?.leads || 0; }
    else if (sortKey === 'spend30') { av = a.windows.last_30d?.spend || 0; bv = b.windows.last_30d?.spend || 0; }
    else if (sortKey === 'cpl30') { av = a.windows.last_30d?.cpl ?? 99999; bv = b.windows.last_30d?.cpl ?? 99999; }
    else if (sortKey === 'cpl14') { av = a.windows.last_14d?.cpl ?? 99999; bv = b.windows.last_14d?.cpl ?? 99999; }
    else if (sortKey === 'cpl7')  { av = a.windows.last_7d?.cpl  ?? 99999; bv = b.windows.last_7d?.cpl  ?? 99999; }
    else if (sortKey === 'cpl4')  { av = a.windows.last_4d?.cpl  ?? 99999; bv = b.windows.last_4d?.cpl  ?? 99999; }
    if (typeof av === 'string') return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
    return sortAsc ? av - bv : bv - av;
  });

  const maxLeads = Math.max(...accounts.map(a => a.windows.last_30d?.leads || 0), 1);
  const totalSpend = accounts.reduce((s,a) => s + (a.windows.last_30d?.spend || 0), 0);
  const totalLeads = accounts.reduce((s,a) => s + (a.windows.last_30d?.leads || 0), 0);
  const blendedCPL = totalLeads > 0 ? totalSpend / totalLeads : 0;
  const activeCount = accounts.filter(a => (a.windows.last_30d?.spend || 0) > 0).length;

  const th = (label, key, align = 'right') => {
    const active = sortKey === key;
    return (
      <th onClick={() => { if (sortKey === key) setSortAsc(!sortAsc); else { setSortKey(key); setSortAsc(key === 'cpl30' || key === 'cpl14' || key === 'cpl7' || key === 'cpl4' || key === 'name'); } }}
        style={{ padding:'9px 14px', textAlign:align, fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.04em', color: active ? '#1877f2' : '#6b7280', background:'#f9fafb', borderBottom:'1px solid #e5e7eb', whiteSpace:'nowrap', cursor:'pointer', userSelect:'none' }}>
        {label} {active ? (sortAsc ? '↑' : '↓') : ''}
      </th>
    );
  };

  return (
    <div style={{ fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', background:'#f4f4f2', minHeight:'100vh', color:'#1a1a1a' }}>
      {/* Header */}
      <header style={{ background:'#fff', borderBottom:'1px solid rgba(0,0,0,.08)', padding:'12px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10, position:'sticky', top:0, zIndex:100 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <h1 style={{ fontSize:17, fontWeight:600, margin:0 }}>Meta Ads Dashboard</h1>
          <span style={{ background:'#1877f2', color:'#fff', fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:20 }}>Facebook</span>
          {!loading && <span style={{ width:8, height:8, borderRadius:'50%', background:'#22c55e', display:'inline-block', animation:'pulse 2s infinite' }} />}
          {loading && <span style={{ fontSize:12, color:'#6b7280' }}>Fetching…</span>}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
          {fetchedAt && <span style={{ fontSize:12, color:'#6b7280' }}>Updated {fetchedAt} · next in {Math.floor(countdown/60)}:{String(countdown%60).padStart(2,'0')}</span>}
          <button onClick={load} disabled={loading}
            style={{ fontSize:12, padding:'6px 14px', borderRadius:7, background:'#1877f2', color:'#fff', border:'none', cursor:'pointer', fontWeight:500, opacity: loading ? .6 : 1 }}>
            {loading ? 'Loading…' : '↻ Refresh'}
          </button>
        </div>
      </header>

      <main style={{ padding:'20px 24px', maxWidth:1440, margin:'0 auto' }}>
        {error && (
          <div style={{ background:'#fee2e2', border:'1px solid #fca5a5', color:'#991b1b', padding:'12px 16px', borderRadius:8, marginBottom:16, fontSize:13 }}>
            ⚠ {error} — Check that META_TOKEN is set correctly in Vercel environment variables.
          </div>
        )}

        {/* Stat cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
          <StatCard label="Total spend (30d)" value={`$${totalSpend.toLocaleString('en-US',{maximumFractionDigits:0})}`} sub="All accounts" />
          <StatCard label="Total leads (30d)" value={totalLeads} sub="Lead conversions" />
          <StatCard label="Blended CPL (30d)" value={`$${blendedCPL.toFixed(2)}`} sub="Avg across accounts" />
          <StatCard label="Active accounts" value={activeCount} sub={`of ${accounts.length} total`} />
        </div>

        {/* Table */}
        <div style={{ background:'#fff', border:'1px solid rgba(0,0,0,.07)', borderRadius:10, overflow:'hidden' }}>
          <div style={{ padding:'12px 16px', borderBottom:'1px solid #e5e7eb', display:'flex', justifyContent:'space-between', alignItems:'center', gap:10, flexWrap:'wrap' }}>
            <h2 style={{ fontSize:14, fontWeight:600, margin:0 }}>CPL across all time windows</h2>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Filter accounts…"
                style={{ fontSize:12, padding:'5px 10px', border:'1px solid #e5e7eb', borderRadius:6, outline:'none', minWidth:180 }} />
              <span style={{ fontSize:12, color:'#9ca3af' }}>{sorted.length} accounts</span>
            </div>
          </div>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr>
                  {th('Account','name','left')}
                  {th('Leads 30d','leads30')}
                  {th('Spend 30d','spend30')}
                  {th('CPL — 30d','cpl30')}
                  {th('CPL — 14d','cpl14')}
                  {th('CPL — 7d','cpl7')}
                  {th('CPL — 4d','cpl4')}
                  <th style={{ padding:'9px 14px', textAlign:'center', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.04em', color:'#6b7280', background:'#f9fafb', borderBottom:'1px solid #e5e7eb', whiteSpace:'nowrap' }}>Trend</th>
                  <th style={{ padding:'9px 14px', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.04em', color:'#6b7280', background:'#f9fafb', borderBottom:'1px solid #e5e7eb' }}>Volume</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map(a => {
                  const w30 = a.windows.last_30d || {};
                  const w14 = a.windows.last_14d || {};
                  const w7  = a.windows.last_7d  || {};
                  const w4  = a.windows.last_4d  || {};
                  const trend = w30.cpl && w7.cpl ? ((w7.cpl - w30.cpl) / w30.cpl * 100) : null;
                  return (
                    <tr key={a.id} style={{ borderBottom:'0.5px solid #e5e7eb' }}
                      onMouseEnter={e => e.currentTarget.style.background='#f9fafb'}
                      onMouseLeave={e => e.currentTarget.style.background='#fff'}>
                      <td style={{ padding:'10px 14px', fontWeight:500, whiteSpace:'nowrap' }}>{a.name}</td>
                      <td style={{ padding:'10px 14px', textAlign:'right', fontWeight:700 }}>{w30.leads || 0}</td>
                      <td style={{ padding:'10px 14px', textAlign:'right' }}>${(w30.spend||0).toLocaleString('en-US',{maximumFractionDigits:0})}</td>
                      {[w30,w14,w7,w4].map((w,i) => {
                        const s = cplStyle(w.cpl);
                        return (
                          <td key={i} style={{ padding:'10px 14px', textAlign:'right' }}>
                            <span style={{ display:'inline-block', padding:'3px 10px', borderRadius:20, fontSize:12, fontWeight:600, background:s.bg, color:s.color }}>
                              {fmt(w.cpl)}
                            </span>
                          </td>
                        );
                      })}
                      <td style={{ padding:'10px 14px', textAlign:'center', fontSize:12, fontWeight:600 }}>
                        {trend != null
                          ? <span style={{ color: trend < 0 ? '#15803d' : '#b91c1c' }}>{trend < 0 ? '▼' : '▲'}{Math.abs(trend).toFixed(0)}%</span>
                          : <span style={{ color:'#d1d5db' }}>—</span>}
                      </td>
                      <td style={{ padding:'10px 14px', minWidth:100 }}>
                        <MiniBar value={w30.leads||0} max={maxLeads} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ padding:'10px 16px', borderTop:'1px solid #e5e7eb', fontSize:11, color:'#9ca3af', display:'flex', gap:20, flexWrap:'wrap' }}>
            <span>🟢 Under $81 CPL</span>
            <span>🟡 $81–$89 CPL</span>
            <span>🔴 Over $100 CPL</span>
            <span style={{ marginLeft:'auto' }}>▼ = CPL improving (7d cheaper than 30d) &nbsp; ▲ = CPL getting worse</span>
          </div>
        </div>
      </main>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }
        @media(max-width:768px){main{padding:12px!important} header{padding:10px 14px!important}}
      `}</style>
    </div>
  );
}
