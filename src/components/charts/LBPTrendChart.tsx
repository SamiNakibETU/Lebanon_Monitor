'use client';

import { useRef, useEffect, useState } from 'react';
import useSWR from 'swr';
import * as d3 from 'd3';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface RateSnapshot {
  rate: number;
  source: string;
  updated: string;
  volatility24h?: number | null;
  trend30d?: number[];
}

export function LBPTrendChart() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(200);

  const { data } = useSWR<RateSnapshot>('/api/v2/lbp-rate', fetcher, {
    refreshInterval: 300_000,
  });

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setWidth(entry.contentRect.width);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!svgRef.current || !data?.rate) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const height = 56;
    const margin = { top: 6, right: 6, bottom: 8, left: 6 };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;

    if (w < 10 || h < 10) return;

    const g = svg
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const trend = (data.trend30d ?? []).filter((n) => Number.isFinite(n));
    const series = trend.length > 1 ? trend : [data.rate * 0.995, data.rate, data.rate * 1.005];
    const min = d3.min(series) ?? data.rate;
    const max = d3.max(series) ?? data.rate;

    const x = d3.scaleLinear().domain([0, series.length - 1]).range([0, w]);
    const y = d3.scaleLinear().domain([min * 0.995, max * 1.005]).range([h, 0]);

    const area = d3
      .area<number>()
      .x((_, i) => x(i))
      .y0(h)
      .y1((d) => y(d))
      .curve(d3.curveMonotoneX);

    const line = d3
      .line<number>()
      .x((_, i) => x(i))
      .y((d) => y(d))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(series)
      .attr('d', area)
      .attr('fill', '#C62828')
      .attr('opacity', 0.08);

    g.append('path')
      .datum(series)
      .attr('d', line)
      .attr('fill', 'none')
      .attr('stroke', '#C62828')
      .attr('stroke-width', 1.5);

    g.append('circle')
      .attr('cx', x(series.length - 1))
      .attr('cy', y(series[series.length - 1]!))
      .attr('r', 2)
      .attr('fill', '#C62828');
  }, [data, width]);

  return (
    <div ref={containerRef} className="w-full">
      <div
        className="text-[11px] uppercase tracking-[0.08em] mb-1"
        style={{ color: '#666666' }}
      >
        Tendance LBP · 30j
      </div>
      {data?.volatility24h != null && (
        <div className="text-[10px] mb-1" style={{ color: '#666666' }}>
          Volatilité 24h: {data.volatility24h.toFixed(2)}%
        </div>
      )}
      {data?.rate ? (
        <svg ref={svgRef} className="w-full" style={{ height: 56 }} />
      ) : (
        <div
          className="text-[11px]"
          style={{ color: '#666666', height: 56, display: 'flex', alignItems: 'center' }}
        >
          Chargement…
        </div>
      )}
    </div>
  );
}
