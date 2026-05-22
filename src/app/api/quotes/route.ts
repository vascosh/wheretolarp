import { NextRequest, NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

/**
 * /api/quotes?symbols=AAPL,TSLA,BTC-USD&range=1d&interval=5m
 *
 * Uses the `yahoo-finance2` SDK which handles Yahoo's cookie/crumb auth,
 * so it doesn't get rate-limited the way naked fetches do.
 *
 * Returns:
 *   { quotes: [{symbol, name, price, prevClose, change, changePct, currency, marketState}],
 *     history: { SYMBOL: [{t, o, h, l, c, v}, ...] },
 *     fetchedAt: ms }
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

const ALLOWED_RANGES = new Set([
  '1d', '5d', '1mo', '3mo', '6mo', 'ytd', '1y', '2y', '5y', '10y', 'max',
]);
const ALLOWED_INTERVALS = new Set([
  '1m', '2m', '5m', '15m', '30m', '60m', '90m', '1h', '1d', '5d', '1wk', '1mo', '3mo',
]);

function rangeToPeriod1(range: string): Date {
  const now = Date.now();
  const day = 86_400_000;
  switch (range) {
    case '1d':  return new Date(now - 2 * day); // a bit of slack for pre/after-hours alignment
    case '5d':  return new Date(now - 7 * day);
    case '1mo': return new Date(now - 31 * day);
    case '3mo': return new Date(now - 92 * day);
    case '6mo': return new Date(now - 184 * day);
    case 'ytd': return new Date(new Date().getFullYear(), 0, 1);
    case '1y':  return new Date(now - 366 * day);
    case '2y':  return new Date(now - 731 * day);
    case '5y':  return new Date(now - 1827 * day);
    case '10y': return new Date(now - 3653 * day);
    case 'max': return new Date(0);
    default:    return new Date(now - 2 * day);
  }
}

interface Bar { t: number; o: number; h: number; l: number; c: number; v: number; }

interface QuoteOut {
  symbol: string;
  name: string;
  price: number;
  prevClose: number;
  change: number;
  changePct: number;
  currency: string | null;
  marketState: string | null;
}

interface ChartShape {
  meta: any;
  quotes: Array<{
    date: Date; open: number | null; high: number | null; low: number | null;
    close: number | null; volume: number | null;
  }>;
}

async function fetchSymbol(symbol: string, period1: Date, interval: any) {
  try {
    const result = (await yf.chart(symbol, { period1, interval })) as ChartShape;
    return result;
  } catch {
    return null;
  }
}

function shapeQuote(symbol: string, c: ChartShape): QuoteOut | null {
  const m = c.meta;
  if (!m || typeof m.regularMarketPrice !== 'number') return null;
  const price = m.regularMarketPrice;
  const prevClose = m.chartPreviousClose ?? m.previousClose ?? price;
  const change = price - prevClose;
  const changePct = prevClose ? (change / prevClose) * 100 : 0;
  return {
    symbol: m.symbol ?? symbol,
    name: m.longName ?? m.shortName ?? symbol,
    price,
    prevClose,
    change,
    changePct,
    currency: m.currency ?? null,
    marketState: m.marketState ?? null,
  };
}

function shapeBars(c: ChartShape): Bar[] {
  const bars: Bar[] = [];
  for (const q of c.quotes) {
    if (q.close == null) continue;
    bars.push({
      t: Math.floor(q.date.getTime() / 1000),
      o: q.open ?? q.close,
      h: q.high ?? q.close,
      l: q.low ?? q.close,
      c: q.close,
      v: q.volume ?? 0,
    });
  }
  return bars;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbolsParam = (searchParams.get('symbols') ?? '').trim();
  const range = searchParams.get('range') || '1d';
  const interval = searchParams.get('interval') || '5m';
  const wantHistory = searchParams.get('history') !== '0';

  if (!symbolsParam) {
    return NextResponse.json({ error: 'symbols required' }, { status: 400 });
  }
  if (!ALLOWED_RANGES.has(range) || !ALLOWED_INTERVALS.has(interval)) {
    return NextResponse.json({ error: 'bad range or interval' }, { status: 400 });
  }

  const symbols = Array.from(
    new Set(symbolsParam.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean))
  ).slice(0, 30);

  const period1 = rangeToPeriod1(range);
  const results = await Promise.all(
    symbols.map((s) => fetchSymbol(s, period1, interval as any))
  );

  const quotes: QuoteOut[] = [];
  const history: Record<string, Bar[]> = {};
  results.forEach((r, i) => {
    if (!r) return;
    const sym = symbols[i];
    const q = shapeQuote(sym, r);
    if (q) quotes.push(q);
    if (wantHistory) history[sym] = shapeBars(r);
  });

  return NextResponse.json(
    { quotes, history, fetchedAt: Date.now() },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
