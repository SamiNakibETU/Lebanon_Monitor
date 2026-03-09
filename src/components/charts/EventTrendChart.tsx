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
}

interface EventTrendChartProps {
  variant?: 'light' | 'dark';
}

export function EventTrendChart({ variant = 'dark' }: EventTrendChartProps) {
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
    if (!svgRef.current || !data?.timeline?.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const height = 120;
    const margin = { top: 8, right: 12, bottom: 20, left: 32 };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;

    if (w < 10 || h < 10) return;

    const g = svg
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const timeline = data.timeline;
    const parseDate = (s: string) => new Date(s);

    const x = d3
      .scaleTime()
      .domain(d3.extent(timeline, (d) => parseDate(d.day)) as [Date, Date])
      .range([0, w]);

    const maxTotal = d3.max(timeline, (d) => d.total) ?? 10;
    const y = d3.scaleLinear().domain([0, maxTotal * 1.1]).range([h, 0]);

    const keys = ['ombre', 'neutre', 'lumiere'] as const;
    const colors: Record<string, string> = {
      ombre: '#C62828',
      neutre: variant === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)',
      lumiere: '#2E7D32',
    };

    const stackGen = d3
      .stack<TimelineEntry>()
      .keys(keys as unknown as string[])
      .order(d3.stackOrderNone)
      .offset(d3.stackOffsetNone);

    const stackedData = stackGen(timeline);

    const area = d3
      .area<d3.SeriesPoint<TimelineEntry>>()
      .x((d) => x(parseDate(d.data.day)))
      .y0((d) => y(d[0]))
      .y1((d) => y(d[1]))
      .curve(d3.curveMonotoneX);

    stackedData.forEach((layer) => {
      g.append('path')
        .datum(layer)
        .attr('d', area)
        .attr('fill', colors[layer.key] ?? '#666')
        .attr('fill-opacity', 0.4)
        .attr('stroke', colors[layer.key] ?? '#666')
        .attr('stroke-width', 1);
    });

    const textColor = variant === 'dark' ? '#666666' : '#888888';

    g.append('g')
      .attr('transform', `translate(0,${h})`)
      .call(
        d3
          .axisBottom(x)
          .ticks(d3.timeDay.every(1))
          .tickFormat((d) => d3.timeFormat('%a')(d as Date))
          .tickSize(0)
      )
      .call((axis) => axis.select('.domain').remove())
      .selectAll('text')
      .attr('fill', textColor)
      .attr('font-size', 10)
      .attr('dy', 8);

    g.append('g')
      .call(d3.axisLeft(y).ticks(3).tickSize(0))
      .call((axis) => axis.select('.domain').remove())
      .selectAll('text')
      .attr('fill', textColor)
      .attr('font-size', 10);
  }, [data, width, variant]);

  const textColor = variant === 'dark' ? '#666666' : '#888888';

  return (
    <div ref={containerRef} className="w-full">
      <div
        className="text-[11px] uppercase tracking-[0.08em] mb-2"
        style={{ color: textColor }}
      >
        Tendance événements · 7j
      </div>
      {data?.timeline?.length ? (
        <svg ref={svgRef} className="w-full" style={{ height: 120 }} />
      ) : (
        <div
          className="text-[11px]"
          style={{
            color: textColor,
            height: 120,
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
