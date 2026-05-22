'use client';

/**
 * Robinhood-Legend-style account dashboard.
 *
 *  ┌──────────────────── top tab strip ────────────────────────────────────┐
 *  ├─ Account ────────┬─ Chart ────────────────────┬─ Positions ────────────┤
 *  │ Individual       │ Symbol + OHLC + Buy/Sell   │ Symbol Qty Mkt Day     │
 *  │ $X total         │                            │                        │
 *  │ +X today         │  ▌▌▌ candlesticks ▌▌▌▌    │ ...                    │
 *  │ Overview         │  ▁▂▆▇▆▂▃▆▇  volume         ├─ Recent orders ────────┤
 *  │ Market movers    │  1D 1W 1M 3M YTD 1Y 5Y All │ ...                    │
 *  └──────────────────┴────────────────────────────┴────────────────────────┘
 *
 * Live quotes/OHLCV via /api/quotes (yahoo-finance2). Positions + cost basis
 * persist to localStorage; everything else (P/L, account total, sparkline,
 * orders, market movers) is derived from real data each tick.
 */

import { useEffect, useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';

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
  optionsBuyingPower: number;
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

/* ── constants ── */

const STORAGE_KEY = 'wtl-larp-portfolio:v4';

const DEFAULT_STATE: PortfolioState = {
  positions: [
    { id: 'p1', symbol: 'AAPL',    shares: 100,   costBasis: 215  },
    { id: 'p2', symbol: 'TSLA',    shares: 50,    costBasis: 320  },
    { id: 'p3', symbol: 'NVDA',    shares: 200,   costBasis: 120  },
    { id: 'p4', symbol: 'BTC-USD', shares: 0.5,   costBasis: 60000 },
    { id: 'p5', symbol: 'ETH-USD', shares: 4,     costBasis: 2400 },
  ],
  buyingPower: 13_320.36,
  optionsBuyingPower: 9_283.10,
  selectedSymbol: 'AAPL',
};

const MOVERS = ['AAPL', 'NVDA', 'TSLA', 'GOOG', 'META', 'MSFT', 'AMZN', 'AMD', 'JPM', 'NFLX'];

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
const PANEL_BG = '#0a0a0a';
const REFRESH_MS = 20_000;

const INPUT_CLS =
  'w-full bg-white/[0.05] border border-white/[0.12] rounded-md px-3 py-2 text-sm text-white tabular-nums focus:outline-none focus:border-white/40 focus:bg-white/[0.08] transition-colors placeholder:text-white/30';

const TOP_TABS = [
  { label: 'Extended hours' },
  { label: 'Stock Trading', active: true },
  { label: 'Monitoring' },
  { label: 'Options Trading' },
];

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
function fmtCompact(n: number) {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(2) + 'k';
  return String(Math.round(n));
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
        const parsed = JSON.parse(raw) as Partial<PortfolioState>;
        if (parsed && Array.isArray(parsed.positions)) {
          setState({
            positions: parsed.positions.map((p) => ({ ...p, id: p.id || uid() })),
            buyingPower: parsed.buyingPower ?? DEFAULT_STATE.buyingPower,
            optionsBuyingPower: parsed.optionsBuyingPower ?? DEFAULT_STATE.optionsBuyingPower,
            selectedSymbol: parsed.selectedSymbol || parsed.positions[0]?.symbol || DEFAULT_STATE.selectedSymbol,
          });
        }
      }
    } catch {/* ignore */}
    setHydrated(true);
  }, []);

  useEffect(() => { if (editParam) setEditing(true); }, [editParam]);

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {/* ignore */}
  }, [state, hydrated]);

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
    } catch {/* keep stale */} finally { setLoading(false); }
  }, [allSymbols, period]);

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

  /* ── derived ── */

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
    let any = false, sum = 0;
    positionsValued.forEach((p) => { if (p.totalGain != null) { any = true; sum += p.totalGain; } });
    return any ? sum : null;
  }, [positionsValued]);

  const accountPositive = accountDayChange >= 0;
  const accountColor = accountPositive ? POS : NEG;

  const selectedQuote = quotes[state.selectedSymbol.toUpperCase()];
  const selectedBars = history[state.selectedSymbol.toUpperCase()] ?? [];
  const selectedPositive = (selectedQuote?.changePct ?? 0) >= 0;
  const selectedOHLC = useMemo(() => computeOHLC(selectedBars), [selectedBars]);

  const accountSpark = useMemo(
    () => buildAccountSpark(state.positions, history, quotes),
    [state.positions, history, quotes]
  );

  const recentOrders = useMemo(
    () => synthesizeOrders(state.positions),
    [state.positions]
  );

  function resetDefaults() {
    if (confirm('Reset to demo positions? Your edits will be lost.')) {
      setState(DEFAULT_STATE);
    }
  }

  const marketOpen = selectedQuote?.marketState === 'REGULAR';

  return (
    <div className="min-h-screen bg-black text-white antialiased" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
      {/* ── Top tab strip ── */}
      <header
        className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-black/80 bg-black"
        style={{ borderBottom: `1px solid ${DIVIDER}` }}
      >
        <div className="px-3 sm:px-4 h-11 flex items-center gap-1 sm:gap-2">
          {/* Discreet back-to-menu. Nearly invisible until hovered. */}
          <Link
            href="/"
            aria-label="Back"
            title="Back"
            className="p-1 -ml-1 rounded text-white/15 hover:text-white/80 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>

          {/* Tabs */}
          <nav className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
            {TOP_TABS.map((t) => (
              <div
                key={t.label}
                className={`px-3 py-1.5 rounded-md text-[12px] font-medium whitespace-nowrap select-none ${
                  t.active ? 'bg-white/[0.08] text-white' : ''
                }`}
                style={!t.active ? { color: TEXT_DIM } : undefined}
              >
                {t.label}
              </div>
            ))}
            <button className="px-2 py-1.5 rounded-md text-[14px] leading-none hover:bg-white/[0.06]" style={{ color: TEXT_FADE }} title="Add tab">＋</button>
          </nav>

          {/* Market state pill */}
          <div className="mx-auto hidden sm:flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.04)', color: TEXT_DIM }}>
            <span style={{ color: marketOpen ? POS : TEXT_FADE }}>●</span>
            {marketOpen ? 'Market Open' : selectedQuote?.marketState ?? 'Markets Closed'}
          </div>

          {/* Right-side controls */}
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <button className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px]" style={{ color: TEXT_DIM, border: `1px solid ${DIVIDER}` }}>
              <span aria-hidden>＋</span> Add widget
            </button>
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[12px]" style={{ color: TEXT_DIM }}>
              Individual
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </span>
            <button
              onClick={() => setEditing(true)}
              aria-label="Settings"
              className="p-1 rounded-full text-white/20 hover:text-white/80 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06A2 2 0 1 1 4.27 16.97l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6 1.65 1.65 0 0 0 10 3.09V3a2 2 0 1 1 4 0v.09c0 .66.39 1.26 1 1.51.61.26 1.31.12 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82c.25.61.85 1 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* ── 3-column grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_300px] gap-2 p-2 sm:p-3">
        {/* ── Left ── */}
        <aside className="space-y-2">
          <Panel>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold tracking-wide" style={{ color: TEXT_DIM }}>Account</span>
              <span className="flex items-center gap-2" style={{ color: TEXT_FADE }}>
                <EyeIcon /> <RefreshIcon />
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[12px]" style={{ color: TEXT_DIM }}>Individual</div>
                <div className="text-[26px] font-bold tabular-nums leading-tight mt-1">
                  {fmtUSD(accountValue)}
                </div>
              </div>
              <button className="px-3 py-1 rounded-full text-[11px] font-semibold" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.9)' }}>
                Deposit
              </button>
            </div>
            <div className="text-[12px] tabular-nums mt-1.5" style={{ color: accountColor }}>
              <span aria-hidden>{accountPositive ? '▲' : '▼'}</span> {fmtSigned(accountDayChange)} ({fmtPct(accountDayPct)})
              <span className="ml-1" style={{ color: TEXT_FADE }}>today</span>
            </div>

            <div className="mt-3 h-[68px]">
              <LineSpark data={accountSpark} color={accountColor} />
            </div>

            <h3 className="text-[10px] font-semibold tracking-[0.15em] uppercase mt-3 mb-1" style={{ color: TEXT_DIM }}>Overview</h3>
            <Row label="Buying power" value={fmtUSD(state.buyingPower)} />
            <Row label="Options buying power" value={fmtUSD(state.optionsBuyingPower)} />
            {totalGain != null && (
              <Row label="Total gain"
                value={fmtSigned(totalGain)}
                valueColor={totalGain >= 0 ? POS : NEG}
              />
            )}
          </Panel>

          <Panel>
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="text-[12px] font-semibold tracking-wide">Market movers</h3>
              <span style={{ color: TEXT_FADE }}>⋯</span>
            </div>
            <div className="grid grid-cols-[20px_1fr_44px_64px_56px] text-[10px] uppercase tracking-wider py-1 gap-1" style={{ color: TEXT_FADE }}>
              <span>#</span><span>Symbol</span><span></span><span className="text-right">Last</span><span className="text-right">Chg %</span>
            </div>
            {MOVERS.map((sym, i) => {
              const q = quotes[sym];
              const bars = history[sym] ?? [];
              const positive = (q?.changePct ?? 0) >= 0;
              const color = positive ? POS : NEG;
              const isSelected = sym === state.selectedSymbol.toUpperCase();
              return (
                <button
                  key={sym}
                  onClick={() => setState((s) => ({ ...s, selectedSymbol: sym }))}
                  className={`w-full grid grid-cols-[20px_1fr_44px_64px_56px] items-center gap-1 py-1 text-left rounded px-1 -mx-1 hover:bg-white/[0.04] transition-colors ${isSelected ? 'bg-white/[0.05]' : ''}`}
                >
                  <span className="text-[10px]" style={{ color: TEXT_FADE }}>{i + 1}</span>
                  <span className="text-[12px] font-medium">{sym}</span>
                  <span className="h-4">
                    <MiniSpark bars={bars} color={color} />
                  </span>
                  <span className="text-right text-[11px] tabular-nums">
                    {q ? fmtUSD(q.price, q.price < 10 ? 2 : 2) : '—'}
                  </span>
                  <span className="text-right text-[11px] tabular-nums" style={{ color }}>
                    {q ? fmtPct(q.changePct) : '—'}
                  </span>
                </button>
              );
            })}
          </Panel>
        </aside>

        {/* ── Center: chart ── */}
        <main>
          <Panel className="flex flex-col">
            {/* Symbol + OHLC + Buy/Sell */}
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <div className="flex items-center gap-1">
                <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold tracking-wider uppercase text-black" style={{ background: POS }}>Buy</span>
                <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold tracking-wider uppercase" style={{ background: 'rgba(255,255,255,0.06)', color: TEXT_DIM }}>Sell</span>
              </div>
              <span className="text-[14px] font-semibold tracking-tight">{state.selectedSymbol.toUpperCase()}</span>
              {selectedQuote && (
                <span className="text-[12px] tabular-nums" style={{ color: selectedPositive ? POS : NEG }}>
                  <span aria-hidden>{selectedPositive ? '▲' : '▼'}</span> {fmtSigned(selectedQuote.change)} ({fmtPct(selectedQuote.changePct)})
                </span>
              )}
              {selectedOHLC && (
                <span className="text-[11px] tabular-nums flex items-center gap-2 flex-wrap" style={{ color: TEXT_DIM }}>
                  <span>O <span className="text-white/85">{selectedOHLC.o.toFixed(2)}</span></span>
                  <span>H <span className="text-white/85">{selectedOHLC.h.toFixed(2)}</span></span>
                  <span>L <span className="text-white/85">{selectedOHLC.l.toFixed(2)}</span></span>
                  <span>C <span className="text-white/85">{selectedOHLC.c.toFixed(2)}</span></span>
                  <span>V <span className="text-white/85">{fmtCompact(selectedOHLC.v)}</span></span>
                </span>
              )}
              <span className="ml-auto flex items-center gap-1" style={{ color: TEXT_FADE }}>⋯</span>
            </div>

            <div className="h-[360px] sm:h-[460px] lg:h-[560px]">
              {selectedBars.length > 0 ? (
                <CandleChart bars={selectedBars} positive={selectedPositive} />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[12px]" style={{ color: TEXT_FADE }}>
                  {loading ? 'Loading chart…' : 'No data for this symbol.'}
                </div>
              )}
            </div>

            <div className="flex items-center gap-1 mt-2 pt-1" style={{ borderTop: `1px solid ${DIVIDER}` }}>
              {PERIODS.map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`flex-1 py-1.5 text-[11px] font-semibold tracking-wide transition-colors border-b ${
                    p === period ? 'text-white border-white' : 'border-transparent hover:text-white/70'
                  }`}
                  style={p !== period ? { color: TEXT_FADE } : undefined}
                >
                  {p}
                </button>
              ))}
              <span className="text-[11px] ml-2 pl-2 hidden sm:inline" style={{ color: TEXT_DIM, borderLeft: `1px solid ${DIVIDER}` }}>
                Interval: {periodParams(period).interval}
              </span>
            </div>
          </Panel>
        </main>

        {/* ── Right ── */}
        <aside className="space-y-2">
          <Panel>
            <h3 className="text-[12px] font-semibold tracking-wide mb-1">Positions</h3>
            <div className="grid grid-cols-[1fr_38px_72px_64px] text-[10px] uppercase tracking-wider py-1.5 gap-1" style={{ color: TEXT_FADE }}>
              <span>Symbol</span><span className="text-right">Qty</span><span className="text-right">Mkt val</span><span className="text-right">Day</span>
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
                  className={`w-full grid grid-cols-[1fr_38px_72px_64px] items-center gap-1 py-1.5 text-left rounded px-1 -mx-1 hover:bg-white/[0.04] transition-colors ${isSelected ? 'bg-white/[0.05]' : ''}`}
                >
                  <span className="text-[12px] font-semibold tracking-tight truncate">{p.symbol}</span>
                  <span className="text-right text-[11px] tabular-nums">
                    {p.shares.toLocaleString(undefined, { maximumFractionDigits: 3 })}
                  </span>
                  <span className="text-right text-[11px] tabular-nums">{fmtUSD(p.value)}</span>
                  <span className="text-right text-[11px] tabular-nums" style={{ color }}>
                    <span aria-hidden>{positive ? '▲' : '▼'}</span> {fmtSigned(p.dayChange).replace(/[+−]/, '').trim()}
                  </span>
                </button>
              );
            })}
          </Panel>

          <Panel>
            <h3 className="text-[12px] font-semibold tracking-wide mb-1">Recent orders</h3>
            <div className="grid grid-cols-[1fr_64px_44px_56px] text-[10px] uppercase tracking-wider py-1.5 gap-1" style={{ color: TEXT_FADE }}>
              <span>Symbol</span><span>Status</span><span>Side</span><span>Type</span>
            </div>
            {recentOrders.map((o) => (
              <div key={o.id} className="grid grid-cols-[1fr_64px_44px_56px] items-center gap-1 py-1.5 text-[11px]">
                <span className="font-medium truncate">{o.symbol}</span>
                <StatusBadge status={o.status} />
                <span style={{ color: o.side === 'Buy' ? POS : NEG }}>{o.side}</span>
                <span style={{ color: TEXT_DIM }}>{o.type}</span>
              </div>
            ))}
            {recentOrders.length === 0 && (
              <p className="text-[12px] italic py-3 text-center" style={{ color: TEXT_FADE }}>No recent orders.</p>
            )}
          </Panel>
        </aside>
      </div>

      {/* Tiny footer with last-fetched timestamp — useful, not branded */}
      <div className="px-4 pb-3 text-[10px] text-right" style={{ color: TEXT_FADE }}>
        {lastFetched > 0 ? `live · updated ${new Date(lastFetched).toLocaleTimeString()}` : 'connecting…'}
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

/* ── Panel wrapper + small UI primitives ── */

function Panel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-md p-3 ${className}`} style={{ background: PANEL_BG, border: `1px solid ${DIVIDER}` }}>
      {children}
    </div>
  );
}

function Row({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="flex items-center justify-between py-1 text-[12px]">
      <span style={{ color: TEXT_DIM }}>{label}</span>
      <span className="tabular-nums" style={{ color: valueColor }}>{value}</span>
    </div>
  );
}

function EyeIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  );
}
function RefreshIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
      <path d="M3 12a9 9 0 0 1 15.5-6.4M21 4v5h-5M21 12a9 9 0 0 1-15.5 6.4M3 20v-5h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const colors: Record<OrderStatus, { bg: string; fg: string }> = {
    Filled:   { bg: 'rgba(0,200,5,0.16)',   fg: POS },
    Working:  { bg: 'rgba(74,122,191,0.18)', fg: '#7eb1ff' },
    Canceled: { bg: 'rgba(255,80,0,0.16)',   fg: NEG },
  };
  const c = colors[status];
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wide" style={{ background: c.bg, color: c.fg }}>
      {status}
    </span>
  );
}

/* ── Sparkline helpers ── */

function LineSpark({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return <div className="w-full h-full" />;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const W = 100, H = 100, TOP = 5, BOT = 5;
  const path = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * W;
      const y = TOP + (1 - (v - min) / range) * (H - TOP - BOT);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
    }).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full h-full">
      <path d={path} stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function MiniSpark({ bars, color }: { bars: Bar[]; color: string }) {
  if (!bars || bars.length < 2) return <div className="w-full h-full" />;
  const closes = bars.map((b) => b.c);
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const range = max - min || 1;
  const W = 44, H = 16;
  const path = closes
    .map((v, i) => {
      const x = (i / (closes.length - 1)) * W;
      const y = (1 - (v - min) / range) * H;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full h-full">
      <path d={path} stroke={color} strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function buildAccountSpark(
  positions: Position[],
  history: Record<string, Bar[]>,
  quotes: Record<string, Quote>
): number[] {
  let anchor: Bar[] = [];
  for (const p of positions) {
    const h = history[p.symbol.toUpperCase()] ?? [];
    if (h.length > anchor.length) anchor = h;
  }
  if (anchor.length < 2) return [];
  const series: number[][] = positions.map((p) => {
    const h = history[p.symbol.toUpperCase()] ?? [];
    if (h.length === 0) {
      const q = quotes[p.symbol.toUpperCase()];
      const px = q?.price ?? 0;
      return anchor.map(() => p.shares * px);
    }
    let i = 0;
    return anchor.map((a) => {
      while (i + 1 < h.length && h[i + 1].t <= a.t) i++;
      return p.shares * h[i].c;
    });
  });
  const total: number[] = new Array(anchor.length).fill(0);
  for (const s of series) {
    for (let i = 0; i < total.length && i < s.length; i++) total[i] += s[i];
  }
  return total;
}

/* ── OHLC of latest bar ── */

function computeOHLC(bars: Bar[]) {
  if (!bars || bars.length === 0) return null;
  // Use the last bar's OHLC as the "current" stat strip
  const b = bars[bars.length - 1];
  return { o: b.o, h: b.h, l: b.l, c: b.c, v: b.v };
}

/* ── Synthetic recent orders ── */

type OrderStatus = 'Filled' | 'Working' | 'Canceled';
type OrderSide = 'Buy' | 'Sell';
type OrderType = 'Market' | 'Limit' | 'Stop';

interface Order {
  id: string;
  symbol: string;
  status: OrderStatus;
  side: OrderSide;
  type: OrderType;
}

// Deterministic, derived from the current positions — gives the UI life
// without faking unrelated tickers.
function synthesizeOrders(positions: Position[]): Order[] {
  if (positions.length === 0) return [];
  const statuses: OrderStatus[] = ['Filled', 'Working', 'Canceled', 'Filled', 'Filled'];
  const sides: OrderSide[]      = ['Buy', 'Sell', 'Buy', 'Sell', 'Buy'];
  const types: OrderType[]      = ['Market', 'Limit', 'Stop', 'Market', 'Limit'];
  const out: Order[] = [];
  // ~8 rows, cycling through positions deterministically
  for (let i = 0; i < Math.min(8, positions.length * 2); i++) {
    const p = positions[i % positions.length];
    out.push({
      id: `${p.id}-${i}`,
      symbol: p.symbol,
      status: statuses[i % statuses.length],
      side: sides[i % sides.length],
      type: types[i % types.length],
    });
  }
  return out;
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
    setDraft((d) => ({ ...d, positions: [...d.positions, { id: uid(), symbol: '', shares: 0 }] }));
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
          <div className="grid grid-cols-2 gap-3">
            <LabelledInput label="Buying Power (USD)">
              <input
                type="number" step="0.01"
                value={draft.buyingPower}
                onChange={(e) => setDraft((d) => ({ ...d, buyingPower: Number(e.target.value) }))}
                className={INPUT_CLS}
              />
            </LabelledInput>
            <LabelledInput label="Options BP (USD)">
              <input
                type="number" step="0.01"
                value={draft.optionsBuyingPower}
                onChange={(e) => setDraft((d) => ({ ...d, optionsBuyingPower: Number(e.target.value) }))}
                className={INPUT_CLS}
              />
            </LabelledInput>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] tracking-[0.18em] uppercase" style={{ color: TEXT_DIM }}>Positions</p>
              <button onClick={addPos} className="text-[11px] tracking-wider uppercase text-white/80 hover:text-white transition-colors">
                + Add
              </button>
            </div>
            <p className="text-[11px] mb-3" style={{ color: TEXT_FADE }}>
              Enter a real ticker (e.g. <code className="text-white/70">AAPL</code>, <code className="text-white/70">BTC-USD</code>, <code className="text-white/70">ETH-USD</code>). Price is live from Yahoo Finance.
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
                <p className="text-sm italic text-center py-4" style={{ color: TEXT_FADE }}>No positions. Hit “+ Add”.</p>
              )}
            </div>
          </div>
        </div>

        <div className="px-5 py-4 flex items-center justify-between gap-2 shrink-0" style={{ borderTop: `1px solid ${DIVIDER}` }}>
          <button onClick={onReset} className="text-[11px] tracking-wider uppercase text-white/40 hover:text-white/70 transition-colors">
            Reset Demo
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-full text-white/50 text-xs tracking-wider uppercase hover:text-white transition-all"
              style={{ border: `1px solid ${DIVIDER}` }}
            >Cancel</button>
            <button
              onClick={() => onSave(draft)}
              className="px-5 py-2 rounded-full bg-white text-black text-xs tracking-[0.12em] uppercase font-semibold hover:bg-white/90 transition-all"
            >Save</button>
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
