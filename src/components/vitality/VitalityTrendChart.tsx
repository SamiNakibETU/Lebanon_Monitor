'use client';

import { useRef, useEffect, useState } from 'react';
import useSWR from 'swr';
import * as d3 from 'd3';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface VitalityData {
  supportingEvents: Array<{ occurredAt: string }>;
  narrativeSignals: Array<{ date: string | null }>;
  proxyIndicators: Array<{ value: number | string }>;
}

function groupByDay(items: Array<{ occurredAt?: string; date?: string | null }>): Map<string, number> {
  const map = new Map<string, number>();
  for (const item of items) {
    const d = item.occurredAt ?? item.date ?? null;
    if (!d) continue;
    const day = d.slice(0, 10);
    map.set(day, (map.get(day) ?? 0) + 1);
  }
  return map;
}

export function VitalityTrendChart() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(300);

  const { data } = useSWR<VitalityData>('/api/v2/vitality', fetcher, {
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
    if (!svgRef.current || !data) return;

    const events = [...(data.supportingEvents ?? []), ...(data.narrativeSignals ?? []).map((n) => ({ date: n.date }))];
    const byDay = groupByDay(events);
    if (byDay.size === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const height = 40;
    const margin = { top: 4, right: 8, bottom: 4, left: 8 };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;

    if (w < 10 || h < 10) return;

    const sorted = [...byDay.entries()].sort((a, b) => a[0].localeCompare(b[0])).slice(-14);
    const maxVal = Math.max(1, ...sorted.map(([, v]) => v));

    const x = d3
      .scaleBand<string>()
      .domain(sorted.map(([d]) => d))
      .range([0, w])
      .padding(0.2);

    const y = d3.scaleLinear().domain([0, maxVal]).range([h, 0]);

    const g = svg
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    g.selectAll('rect')
      .data(sorted)
      .enter()
      .append('rect')
      .attr('x', (d) => x(d[0]) ?? 0)
      .attr('y', (d) => y(d[1]))
      .attr('width', x.bandwidth())
      .attr('height', (d) => h - y(d[1]))
      .attr('fill', '#2E7D32')
      .attr('opacity', 0.6);
  }, [data, width]);

  const events = data?.supportingEvents ?? [];
  const narratives = data?.narrativeSignals ?? [];
  const hasData = events.length > 0 || narratives.length > 0;

  return (
    <div ref={containerRef} className="w-full">
      <div
        className="text-[11px] uppercase tracking-[0.08em] mb-2"
        style={{ color: '#888888' }}
      >
        Vitalité · événements + signalements · 14j
      </div>
      {hasData ? (
        <svg ref={svgRef} className="w-full" style={{ height: 40 }} />
      ) : (
        <div
          className="text-[11px]"
          style={{
            color: '#888888',
            height: 40,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          Données en attente
        </div>
      )}
    </div>
  );
}
