'use client';

import { useRef, useEffect, useState } from 'react';
import useSWR from 'swr';
import * as d3 from 'd3';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface TimelineEntry {
  day: string;
  ombre: number;
  lumiere: number;
  neutre: number;
  total: number;
}

interface TrendsData {
  days: number;
  timeline: TimelineEntry[];
  intensity: Array<{ day: string; score: number }>;
  breakdown: Array<{
    day: string;
    classification: 'ombre' | 'lumiere' | 'neutre';
    category: string | null;
    count: number;
    avgSeverity: number | null;
  }>;
}

interface EventTrendChartProps {
  variant?: 'light' | 'dark';
  focus?: 'lumiere' | 'ombre';
}

export function EventTrendChart({ variant = 'dark', focus = 'ombre' }: EventTrendChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(300);

  const { data } = useSWR<TrendsData>('/api/v2/trends?days=7', fetcher, {
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
    if (!svgRef.current || !data?.breakdown?.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const height = 170;
    const margin = { top: 8, right: 12, bottom: 20, left: 110 };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;

    if (w < 10 || h < 10) return;

    const g = svg
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const aggregated = d3.rollups(
      data.breakdown.filter((d) => d.classification === focus && d.category),
      (v) => d3.sum(v, (d) => d.count),
      (d) => d.category as string
    )
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const x = d3
      .scaleLinear()
      .domain([0, (d3.max(aggregated, (d) => d.count) ?? 5) * 1.1])
      .range([0, w]);

    const y = d3
      .scaleBand<string>()
      .domain(aggregated.map((d) => d.category))
      .range([0, h])
      .padding(0.25);

    const barColor = focus === 'ombre' ? '#C62828' : '#2E7D32';

    g.selectAll('rect')
      .data(aggregated)
      .enter()
      .append('rect')
      .attr('x', 0)
      .attr('y', (d) => y(d.category) ?? 0)
      .attr('width', (d) => x(d.count))
      .attr('height', y.bandwidth())
      .attr('fill', barColor)
      .attr('opacity', 0.7);

    g.selectAll('text.bar-value')
      .data(aggregated)
      .enter()
      .append('text')
      .attr('class', 'bar-value')
      .attr('x', (d) => x(d.count) + 6)
      .attr('y', (d) => (y(d.category) ?? 0) + y.bandwidth() / 2 + 4)
      .attr('fill', variant === 'dark' ? '#FFFFFF' : '#1A1A1A')
      .attr('font-size', 10)
      .text((d) => String(d.count));

    const textColor = variant === 'dark' ? '#666666' : '#888888';

    g.append('g')
      .attr('transform', `translate(0,${h})`)
      .call(d3.axisBottom(x).ticks(3).tickSize(0))
      .call((axis) => axis.select('.domain').remove())
      .selectAll('text')
      .attr('fill', textColor)
      .attr('font-size', 10)
      .attr('dy', 8)
      .text((d) => `${d}`);

    g.append('g')
      .call(d3.axisLeft(y).tickSize(0))
      .call((axis) => axis.select('.domain').remove())
      .selectAll('text')
      .attr('fill', textColor)
      .attr('font-size', 10)
      .text((d) => String(d).replace(/_/g, ' ').slice(0, 18));
  }, [data, width, variant, focus]);

  const textColor = variant === 'dark' ? '#666666' : '#888888';
  const timelineFocus = (data?.timeline ?? []).map((d) => ({
    day: d.day,
    count: focus === 'ombre' ? d.ombre : d.lumiere,
  }));
  const maxTimeline = Math.max(1, ...timelineFocus.map((d) => d.count));
  const latestIntensity = data?.intensity?.[data.intensity.length - 1]?.score ?? null;

  return (
    <div ref={containerRef} className="w-full">
      <div
        className="text-[11px] uppercase tracking-[0.08em] mb-2"
        style={{ color: textColor }}
      >
        Analyse catégories · {focus} · 7j
      </div>
      {data?.breakdown?.length ? (
        <>
          <svg ref={svgRef} className="w-full" style={{ height: 170 }} />
          <div className="mt-2">
            <div className="text-[10px] mb-1" style={{ color: textColor }}>
              Intensité du jour: {latestIntensity != null ? `${latestIntensity}/100` : 'n/a'}
            </div>
            <div className="flex items-end gap-1 h-8">
              {timelineFocus.map((d) => (
                <div
                  key={d.day}
                  title={`${d.day}: ${d.count}`}
                  style={{
                    width: '100%',
                    height: `${Math.max(2, (d.count / maxTimeline) * 100)}%`,
                    background: focus === 'ombre' ? 'rgba(198,40,40,0.65)' : 'rgba(46,125,50,0.65)',
                  }}
                />
              ))}
            </div>
          </div>
        </>
      ) : (
        <div
          className="text-[11px]"
          style={{
            color: textColor,
            height: 170,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          Chargement des tendances…
        </div>
      )}
    </div>
  );
}
