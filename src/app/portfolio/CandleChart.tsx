'use client';

import { useEffect, useRef } from 'react';
import {
  createChart,
  ColorType,
  CandlestickSeries,
  HistogramSeries,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from 'lightweight-charts';

export interface Bar { t: number; o: number; h: number; l: number; c: number; v: number; }

interface Props {
  bars: Bar[];
  /** if true, the volume bars + crosshair use the "up" colour family */
  positive: boolean;
}

export default function CandleChart({ bars }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volRef = useRef<ISeriesApi<'Histogram'> | null>(null);

  // Mount/unmount the chart instance once
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const chart = createChart(el, {
      width: el.clientWidth,
      height: el.clientHeight,
      layout: {
        background: { type: ColorType.Solid, color: '#000000' },
        textColor: 'rgba(255,255,255,0.55)',
        fontSize: 11,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.04)' },
        horzLines: { color: 'rgba(255,255,255,0.04)' },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: 'rgba(255,255,255,0.08)',
      },
      rightPriceScale: { borderColor: 'rgba(255,255,255,0.08)' },
      crosshair: { mode: 1 },
      handleScroll: true,
      handleScale: true,
    });

    const candle = chart.addSeries(CandlestickSeries, {
      upColor: '#00C805',
      downColor: '#FF5000',
      borderUpColor: '#00C805',
      borderDownColor: '#FF5000',
      wickUpColor: '#00C805',
      wickDownColor: '#FF5000',
    });

    const vol = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: '',
      color: 'rgba(255,255,255,0.2)',
    });
    chart.priceScale('').applyOptions({ scaleMargins: { top: 0.78, bottom: 0 } });

    chartRef.current = chart;
    candleRef.current = candle;
    volRef.current = vol;

    const ro = new ResizeObserver(() => {
      if (!el || !chartRef.current) return;
      chartRef.current.applyOptions({ width: el.clientWidth, height: el.clientHeight });
    });
    ro.observe(el);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      candleRef.current = null;
      volRef.current = null;
    };
  }, []);

  // Push new bars whenever they change
  useEffect(() => {
    const candle = candleRef.current;
    const vol = volRef.current;
    if (!candle || !vol) return;

    candle.setData(
      bars.map((b) => ({
        time: b.t as UTCTimestamp,
        open: b.o,
        high: b.h,
        low: b.l,
        close: b.c,
      }))
    );
    vol.setData(
      bars.map((b) => ({
        time: b.t as UTCTimestamp,
        value: b.v,
        color: b.c >= b.o ? 'rgba(0,200,5,0.40)' : 'rgba(255,80,0,0.40)',
      }))
    );
    chartRef.current?.timeScale().fitContent();
  }, [bars]);

  return <div ref={containerRef} className="w-full h-full" />;
}
