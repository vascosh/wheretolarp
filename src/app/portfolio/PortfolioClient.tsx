'use client';

/**
 * Robinhood-pro style account dashboard.
 *
 * Left column: account total + overview + market movers.
 * Center column: candlestick chart for the selected ticker with period selector.
 * Right column: live positions list.
 *
 * Real prices and OHLCV come from /api/quotes (Yahoo via yahoo-finance2).
 * The set of positions / buying power is persisted to localStorage and
 * editable behind a near-invisible settings gear in the top bar.
 */

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';

// Chart uses canvas — must be client-only.
const CandleChart = dynamic(() => import('./CandleChart'), { ssr: false });

/* ── types ── */

interface Position {
  id: string;
  symbol: string;
  shares: number;
  costBasis?: number;
}

interface PortfolioState {
  positions: Position[];
  buyingPower: number;
  selectedSymbol: string;
}

interface Quote {
  symbol: string;
  name: string;
  price: number;
  prevClose: number;
  change: number;
  changePct: number;
  currency: string | null;
  marketState: string | null;
}

interface Bar { t: number; o: number; h: number; l: number; c: number; v: number; }

interface QuotesResponse {
  quotes: Quote[];
  history: Record<string, Bar[]>;
  fetchedAt: number;
}

const STORAGE_KEY = 'wtl-larp-portfolio:v3';

const DEFAULT_STATE: PortfolioState = {
  positions: [
    { id: 'p1', symbol: 'AAPL',    shares: 100,   costBasis: 215  },
    { id: 'p2', symbol: 'TSLA',    shares: 50,    costBasis: 320  },
    { id: 'p3', symbol: 'NVDA',    shares: 200,   costBasis: 120  },
    { id: 'p4', symbol: 'BTC-USD', shares: 0.5,   costBasis: 60000 },
    { id: 'p5', symbol: 'ETH-USD', shares: 4,     costBasis: 2400 },
  ],
  buyingPower: 13_320.36,
  selectedSymbol: 'AAPL',
};

const MOVERS = ['AAPL', 'NVDA', 'TSLA', 'GOOG', 'META', 'MSFT', 'AMZN', 'AMD', 'JPM', 'NFLX'];

/* ── period -> Yahoo range/interval ── */

const PERIODS = ['1D', '1W', '1M', '3M', 'YTD', '1Y', '5Y', 'ALL'] as const;
type Period = (typeof PERIODS)[number];

function periodParams(p: Period): { range: string; interval: string } {
  switch (p) {
    case '1D':  return { range: '1d',  interval: '5m'  };
    case '1W':  return { range: '5d',  interval: '30m' };
    case '1M':  return { range: '1mo', interval: '1d'  };
    case '3M':  return { range: '3mo', interval: '1d'  };
    case 'YTD': return { range: 'ytd', interval: '1d'  };
    case '1Y':  return { range: '1y',  interval: '1d'  };
    case '5Y':  return { range: '5y',  interval: '1wk' };
    case 'ALL': return { range: 'max', interval: '1mo' };
  }
}

const POS = '#00C805';
const NEG = '#FF5000';
const TEXT_DIM = 'rgba(255,255,255,0.55)';
const TEXT_FADE = 'rgba(255,255,255,0.35)';
const DIVIDER = 'rgba(255,255,255,0.08)';
const REFRESH_MS = 20_000;

const INPUT_CLS =
  'w-full bg-white/[0.05] border border-white/[0.12] rounded-md px-3 py-2 text-sm text-white tabular-nums focus:outline-none focus:border-white/40 focus:bg-white/[0.08] transition-colors placeholder:text-white/30';

/* ── helpers ── */

function fmtUSD(n: number, decimals = 2) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD',
    minimumFractionDigits: decimals, maximumFractionDigits: decimals,
  }).format(Number.isFinite(n) ? n : 0);
}
function fmtSigned(n: number) {
  const v = Number.isFinite(n) ? n : 0;
  return (v >= 0 ? '+' : '−') + fmtUSD(Math.abs(v));
}
function fmtPct(n: number) {
  const v = Number.isFinite(n) ? n : 0;
  return (v >= 0 ? '+' : '') + v.toFixed(2) + '%';
}
function uid() { return Math.random().toString(36).slice(2, 10); }

/* ── main ── */

export default function PortfolioClient() {
  const search = useSearchParams();
  const editParam = search?.get('edit') === '1';

  const [state, setState] = useState<PortfolioState>(DEFAULT_STATE);
  const [period, setPeriod] = useState<Period>('1D');
  const [editing, setEditing] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [history, setHistory] = useState<Record<string, Bar[]>>({});
  const [lastFetched, setLastFetched] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Load persisted state
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as PortfolioState;
        if (parsed && Array.isArray(parsed.positions)) {
          setState({
            positions: parsed.positions.map((p) => ({ ...p, id: p.id || uid() })),
            buyingPower: parsed.buyingPower ?? DEFAULT_STATE.buyingPower,
            selectedSymbol: parsed.selectedSymbol || parsed.positions[0]?.symbol || DEFAULT_STATE.selectedSymbol,
          });
        }
      }
    } catch {/* ignore */}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (editParam) setEditing(true);
  }, [editParam]);

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {/* ignore */}
  }, [state, hydrated]);

  // Build the list of symbols we need data for: positions + movers + selected.
  const allSymbols = useMemo(() => {
    const set = new Set<string>();
    state.positions.forEach((p) => p.symbol && set.add(p.symbol.toUpperCase()));
    MOVERS.forEach((s) => set.add(s));
    if (state.selectedSymbol) set.add(state.selectedSymbol.toUpperCase());
    return Array.from(set);
  }, [state.positions, state.selectedSymbol]);

  const fetchData = useCallback(async () => {
    if (allSymbols.length === 0) return;
    const { range, interval } = periodParams(period);
    const url = `/api/quotes?symbols=${encodeURIComponent(allSymbols.join(','))}&range=${range}&interval=${interval}`;
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) return;
      const data = (await res.json()) as QuotesResponse;
      const qmap: Record<string, Quote> = {};
      data.quotes.forEach((q) => { qmap[q.symbol.toUpperCase()] = q; });
      setQuotes(qmap);
      setHistory(data.history ?? {});
      setLastFetched(data.fetchedAt ?? Date.now());
    } catch {/* ignore — keep showing stale data */}
    finally {
      setLoading(false);
    }
  }, [allSymbols, period]);

  // Initial + on-deps fetch + polling
  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;
    (async () => { if (!cancelled) await fetchData(); })();
    const id = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      fetchData();
    }, REFRESH_MS);
    return () => { cancelled = true; clearInterval(id); };
  }, [fetchData, hydrated]);

  /* ── derived account totals ── */

  const positionsValued = useMemo(() => {
    return state.positions.map((p) => {
      const q = quotes[p.symbol.toUpperCase()];
      const price = q?.price ?? 0;
      const prev = q?.prevClose ?? price;
      const value = p.shares * price;
      const dayChange = p.shares * (price - prev);
      const dayPct = q?.changePct ?? 0;
      const totalGain = p.costBasis != null ? p.shares * (price - p.costBasis) : null;
      return { ...p, quote: q, value, dayChange, dayPct, totalGain };
    });
  }, [state.positions, quotes]);

  const accountValue = useMemo(
    () => positionsValued.reduce((sum, p) => sum + p.value, 0),
    [positionsValued]
  );
  const accountDayChange = useMemo(
    () => positionsValued.reduce((sum, p) => sum + p.dayChange, 0),
    [positionsValued]
  );
  const accountDayPct = useMemo(() => {
    const base = accountValue - accountDayChange;
    return base > 0 ? (accountDayChange / base) * 100 : 0;
  }, [accountValue, accountDayChange]);
  const totalGain = useMemo(() => {
    let any = false;
    let sum = 0;
    positionsValued.forEach((p) => {
      if (p.totalGain != null) { any = true; sum += p.totalGain; }
    });
    return any ? sum : null;
  }, [positionsValued]);

  const accountPositive = accountDayChange >= 0;
  const accountColor = accountPositive ? POS : NEG;

  const selectedQuote = quotes[state.selectedSymbol.toUpperCase()];
  const selectedBars = history[state.selectedSymbol.toUpperCase()] ?? [];
  const selectedPositive = (selectedQuote?.changePct ?? 0) >= 0;

  const accountSpark = useMemo(
    () => buildAccountSpark(state.positions, history, quotes),
    [state.positions, history, quotes]
  );

  function resetDefaults() {
    if (confirm('Reset to demo positions? Your edits will be lost.')) {
      setState(DEFAULT_STATE);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans antialiased">
      {/* ── Top bar ── */}
      <header
        className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-black/70 bg-black"
        style={{ borderBottom: `1px solid ${DIVIDER}` }}
      >
        <div className="px-4 sm:px-6 h-12 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-[14px] font-semibold tracking-tight">Investing</span>
            <span className="text-[11px]" style={{ color: TEXT_FADE }}>
              {selectedQuote?.marketState === 'REGULAR' ? '● Market Open' : selectedQuote?.marketState ?? ''}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {lastFetched > 0 && (
              <span className="text-[10px] hidden sm:inline" style={{ color: TEXT_FADE }}>
                live · {new Date(lastFetched).toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={() => setEditing(true)}
              aria-label="Settings"
              className="p-1.5 rounded-full text-white/30 hover:text-white/80 transition-colors"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06A2 2 0 1 1 4.27 16.97l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6 1.65 1.65 0 0 0 10 3.09V3a2 2 0 1 1 4 0v.09c0 .66.39 1.26 1 1.51.61.26 1.31.12 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82c.25.61.85 1 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* ── 3-column layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_280px] gap-3 p-3 sm:p-4">
        {/* Left: account + overview + market movers */}
        <aside className="space-y-3">
          <Panel>
            <p className="text-[11px] tracking-[0.05em]" style={{ color: TEXT_DIM }}>Individual</p>
            <p className="text-[28px] font-bold tabular-nums leading-none mt-1.5">
              {fmtUSD(accountValue)}
            </p>
            <p className="text-[12px] tabular-nums mt-1.5" style={{ color: accountColor }}>
              <span aria-hidden>{accountPositive ? '▲' : '▼'}</span> {fmtSigned(accountDayChange)} ({fmtPct(accountDayPct)})
              <span className="ml-1" style={{ color: TEXT_FADE }}>today</span>
            </p>

            <div className="mt-3 h-16">
              <LineSpark data={accountSpark} color={accountColor} />
            </div>

            <h3 className="text-[10px] font-semibold tracking-[0.15em] uppercase mt-4 mb-2" style={{ color: TEXT_DIM }}>
              Overview
            </h3>
            <Row label="Buying power" value={fmtUSD(state.buyingPower)} />
            <Row label="Total gain"
              value={totalGain != null ? fmtSigned(totalGain) : '—'}
              valueColor={totalGain != null ? (totalGain >= 0 ? POS : NEG) : undefined}
            />
          </Panel>

          <Panel>
            <h3 className="text-[11px] font-semibold tracking-[0.05em]" style={{ color: TEXT_DIM }}>
              Market movers
            </h3>
            <div className="mt-2">
              <div className="grid grid-cols-[1fr_auto_auto] text-[10px] uppercase tracking-wider py-1.5" style={{ color: TEXT_FADE }}>
                <span>Symbol</span><span className="text-right pr-3">Last</span><span className="text-right">Chg%</span>
              </div>
              {MOVERS.map((sym) => {
                const q = quotes[sym];
                const positive = (q?.changePct ?? 0) >= 0;
                const color = positive ? POS : NEG;
                const isSelected = sym === state.selectedSymbol.toUpperCase();
                return (
                  <button
                    key={sym}
                    onClick={() => setState((s) => ({ ...s, selectedSymbol: sym }))}
                    className={`w-full grid grid-cols-[1fr_auto_auto] items-center py-1.5 text-left rounded px-1 -mx-1 hover:bg-white/[0.04] transition-colors ${isSelected ? 'bg-white/[0.05]' : ''}`}
                  >
                    <span className="text-[12px] font-medium">{sym}</span>
                    <span className="text-right text-[12px] tabular-nums pr-3">
                      {q ? fmtUSD(q.price, q.price < 10 ? 4 : 2) : '—'}
                    </span>
                    <span className="text-right text-[11px] tabular-nums" style={{ color }}>
                      {q ? fmtPct(q.changePct) : '—'}
                    </span>
                  </button>
                );
              })}
            </div>
          </Panel>
        </aside>

        {/* Center: chart */}
        <main>
          <Panel className="flex flex-col">
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="text-[18px] font-semibold tracking-tight">{state.selectedSymbol.toUpperCase()}</span>
              {selectedQuote && (
                <>
                  <span className="text-[14px] tabular-nums">{fmtUSD(selectedQuote.price, selectedQuote.price < 10 ? 4 : 2)}</span>
                  <span className="text-[12px] tabular-nums" style={{ color: selectedPositive ? POS : NEG }}>
                    {fmtSigned(selectedQuote.change)} ({fmtPct(selectedQuote.changePct)})
                  </span>
                </>
              )}
              {!selectedQuote && loading && (
                <span className="text-[12px]" style={{ color: TEXT_FADE }}>loading…</span>
              )}
              <span className="ml-auto flex items-center gap-1">
                <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold tracking-wider uppercase" style={{ background: 'rgba(0,200,5,0.15)', color: POS }}>Buy</span>
                <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold tracking-wider uppercase" style={{ background: 'rgba(255,255,255,0.05)', color: TEXT_DIM }}>Sell</span>
              </span>
            </div>

            <div className="mt-3 h-[360px] sm:h-[440px] lg:h-[520px]">
              {selectedBars.length > 0 ? (
                <CandleChart bars={selectedBars} positive={selectedPositive} />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[12px]" style={{ color: TEXT_FADE }}>
                  {loading ? 'Loading chart…' : 'No data for this symbol.'}
                </div>
              )}
            </div>

            <div className="flex items-center gap-1 mt-3 border-t" style={{ borderColor: DIVIDER }}>
              {PERIODS.map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`flex-1 py-2 text-[11px] font-semibold tracking-wide transition-colors border-b ${
                    p === period
                      ? 'text-white border-white'
                      : 'border-transparent hover:text-white/70'
                  }`}
                  style={p !== period ? { color: TEXT_FADE } : undefined}
                >
                  {p}
                </button>
              ))}
            </div>
          </Panel>
        </main>

        {/* Right: positions */}
        <aside>
          <Panel>
            <h3 className="text-[11px] font-semibold tracking-[0.05em]" style={{ color: TEXT_DIM }}>
              Positions
            </h3>
            <div className="grid grid-cols-[1fr_auto_auto] text-[10px] uppercase tracking-wider py-2 mt-1" style={{ color: TEXT_FADE }}>
              <span>Symbol</span><span className="text-right pr-3">Mkt val</span><span className="text-right">Day</span>
            </div>
            {positionsValued.length === 0 && (
              <p className="text-[12px] italic py-4 text-center" style={{ color: TEXT_FADE }}>No positions.</p>
            )}
            {positionsValued.map((p) => {
              const positive = p.dayChange >= 0;
              const color = positive ? POS : NEG;
              const isSelected = p.symbol.toUpperCase() === state.selectedSymbol.toUpperCase();
              return (
                <button
                  key={p.id}
                  onClick={() => setState((s) => ({ ...s, selectedSymbol: p.symbol }))}
                  className={`w-full grid grid-cols-[1fr_auto_auto] items-center py-2 text-left rounded px-1 -mx-1 hover:bg-white/[0.04] transition-colors ${isSelected ? 'bg-white/[0.05]' : ''}`}
                >
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold tracking-tight">{p.symbol}</p>
                    <p className="text-[10px] tabular-nums" style={{ color: TEXT_FADE }}>
                      {p.shares.toLocaleString(undefined, { maximumFractionDigits: 4 })} sh
                    </p>
                  </div>
                  <span className="text-right text-[12px] tabular-nums pr-3">{fmtUSD(p.value)}</span>
                  <span className="text-right text-[11px] tabular-nums" style={{ color }}>
                    {fmtPct(p.dayPct)}
                  </span>
                </button>
              );
            })}
          </Panel>
        </aside>
      </div>

      {editing && (
        <EditModal
          state={state}
          onClose={() => setEditing(false)}
          onSave={(s) => { setState(s); setEditing(false); }}
          onReset={resetDefaults}
        />
      )}
    </div>
  );
}

/* ── Panel wrapper ── */

function Panel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`bg-[#0a0a0a] rounded-lg p-3 ${className}`}
      style={{ border: `1px solid ${DIVIDER}` }}
    >
      {children}
    </div>
  );
}

function Row({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-[12px]">
      <span style={{ color: TEXT_DIM }}>{label}</span>
      <span className="tabular-nums" style={{ color: valueColor }}>{value}</span>
    </div>
  );
}

/* ── Simple SVG line sparkline (account overview) ── */

function LineSpark({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) {
    return <div className="w-full h-full" />;
  }
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const W = 100, H = 100, TOP = 5, BOT = 5;
  const path = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * W;
      const y = TOP + (1 - (v - min) / range) * (H - TOP - BOT);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full h-full">
      <path d={path} stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/** Build an account-value timeline by aligning each position's bars to a
 *  shared timestamp index. Falls back to a flat line when data is missing. */
function buildAccountSpark(
  positions: Position[],
  history: Record<string, Bar[]>,
  quotes: Record<string, Quote>
): number[] {
  // Use the longest available position history as the timeline anchor.
  let anchor: Bar[] = [];
  for (const p of positions) {
    const h = history[p.symbol.toUpperCase()] ?? [];
    if (h.length > anchor.length) anchor = h;
  }
  if (anchor.length < 2) return [];

  // Per position, build value series sampled at anchor timestamps.
  const series: number[][] = positions.map((p) => {
    const h = history[p.symbol.toUpperCase()] ?? [];
    if (h.length === 0) {
      const q = quotes[p.symbol.toUpperCase()];
      const px = q?.price ?? 0;
      return anchor.map(() => p.shares * px);
    }
    // For each anchor t, find the closest bar by time (binary-search-y but linear is fine here).
    let i = 0;
    return anchor.map((a) => {
      while (i + 1 < h.length && h[i + 1].t <= a.t) i++;
      return p.shares * h[i].c;
    });
  });

  // Sum across positions per timestamp
  const total: number[] = new Array(anchor.length).fill(0);
  for (const s of series) {
    for (let i = 0; i < total.length && i < s.length; i++) total[i] += s[i];
  }
  return total;
}

/* ── Edit modal ── */

function EditModal({
  state, onClose, onSave, onReset,
}: {
  state: PortfolioState;
  onClose: () => void;
  onSave: (s: PortfolioState) => void;
  onReset: () => void;
}) {
  const [draft, setDraft] = useState<PortfolioState>(state);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  function updatePos(id: string, patch: Partial<Position>) {
    setDraft((d) => ({ ...d, positions: d.positions.map((p) => (p.id === id ? { ...p, ...patch } : p)) }));
  }
  function addPos() {
    setDraft((d) => ({
      ...d,
      positions: [...d.positions, { id: uid(), symbol: '', shares: 0, costBasis: undefined }],
    }));
  }
  function removePos(id: string) {
    setDraft((d) => ({ ...d, positions: d.positions.filter((p) => p.id !== id) }));
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-6">
      <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative z-10 w-full max-w-lg max-h-[90vh] rounded-xl bg-[#111] text-white flex flex-col overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.6)]"
        style={{ border: `1px solid ${DIVIDER}` }}
      >
        <div className="px-5 py-4 flex items-center justify-between shrink-0" style={{ borderBottom: `1px solid ${DIVIDER}` }}>
          <h3 className="text-base font-semibold">Customize</h3>
          <button onClick={onClose} aria-label="Close" className="text-white/40 hover:text-white p-1">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M4 4L16 16M16 4L4 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-5 space-y-6">
          <div>
            <label className="block text-[10px] tracking-[0.15em] uppercase mb-1.5" style={{ color: TEXT_DIM }}>
              Buying Power (USD)
            </label>
            <input
              type="number" step="0.01"
              value={draft.buyingPower}
              onChange={(e) => setDraft((d) => ({ ...d, buyingPower: Number(e.target.value) }))}
              className={INPUT_CLS}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] tracking-[0.18em] uppercase" style={{ color: TEXT_DIM }}>Positions</p>
              <button onClick={addPos} className="text-[11px] tracking-wider uppercase text-white/80 hover:text-white transition-colors">
                + Add
              </button>
            </div>
            <p className="text-[11px] mb-3" style={{ color: TEXT_FADE }}>
              Enter a real ticker (e.g. <code className="text-white/70">AAPL</code>, <code className="text-white/70">BTC-USD</code>, <code className="text-white/70">ETH-USD</code>). The price comes from Yahoo Finance in real time.
            </p>

            <div className="space-y-3">
              {draft.positions.map((p) => (
                <div key={p.id} className="rounded-lg p-3 bg-white/[0.03]" style={{ border: `1px solid ${DIVIDER}` }}>
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    <LabelledInput label="Symbol">
                      <input
                        value={p.symbol}
                        onChange={(e) => updatePos(p.id, { symbol: e.target.value.toUpperCase() })}
                        placeholder="AAPL"
                        className={INPUT_CLS}
                      />
                    </LabelledInput>
                    <LabelledInput label="Shares">
                      <input
                        type="number" step="0.0001"
                        value={p.shares}
                        onChange={(e) => updatePos(p.id, { shares: Number(e.target.value) })}
                        className={INPUT_CLS}
                      />
                    </LabelledInput>
                    <LabelledInput label="Cost basis">
                      <input
                        type="number" step="0.01"
                        value={p.costBasis ?? ''}
                        placeholder="optional"
                        onChange={(e) => updatePos(p.id, { costBasis: e.target.value === '' ? undefined : Number(e.target.value) })}
                        className={INPUT_CLS}
                      />
                    </LabelledInput>
                  </div>
                  <button
                    onClick={() => removePos(p.id)}
                    className="text-[10px] tracking-wider uppercase text-red-400/70 hover:text-red-400 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ))}
              {draft.positions.length === 0 && (
                <p className="text-sm italic text-center py-4" style={{ color: TEXT_FADE }}>
                  No positions. Hit “+ Add”.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="px-5 py-4 flex items-center justify-between gap-2 shrink-0" style={{ borderTop: `1px solid ${DIVIDER}` }}>
          <button
            onClick={onReset}
            className="text-[11px] tracking-wider uppercase text-white/40 hover:text-white/70 transition-colors"
          >
            Reset Demo
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-full text-white/50 text-xs tracking-wider uppercase hover:text-white transition-all"
              style={{ border: `1px solid ${DIVIDER}` }}
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(draft)}
              className="px-5 py-2 rounded-full bg-white text-black text-xs tracking-[0.12em] uppercase font-semibold hover:bg-white/90 transition-all"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function LabelledInput({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[9px] tracking-[0.15em] uppercase mb-1" style={{ color: TEXT_FADE }}>
        {label}
      </span>
      {children}
    </label>
  );
}
