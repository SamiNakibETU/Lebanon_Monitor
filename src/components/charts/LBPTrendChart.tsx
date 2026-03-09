'use client';

import { useRef, useEffect, useState } from 'react';
import useSWR from 'swr';
import * as d3 from 'd3';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface RateSnapshot {
  rate: number;
  source: string;
  updated: string;
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

    const height = 48;
    const margin = { top: 4, right: 4, bottom: 4, left: 4 };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;

    if (w < 10 || h < 10) return;

    const g = svg
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const rate = data.rate;
    const baseline = rate * 0.98;
    const ceiling = rate * 1.02;

    const y = d3.scaleLinear().domain([baseline, ceiling]).range([h, 0]);

    g.append('line')
      .attr('x1', 0)
      .attr('x2', w)
      .attr('y1', y(rate))
      .attr('y2', y(rate))
      .attr('stroke', '#C62828')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '4,3');

    g.append('rect')
      .attr('x', 0)
      .attr('y', y(rate))
      .attr('width', w)
      .attr('height', h - y(rate))
      .attr('fill', '#C62828')
      .attr('fill-opacity', 0.06);
  }, [data, width]);

  return (
    <div ref={containerRef} className="w-full">
      <div
        className="text-[11px] uppercase tracking-[0.08em] mb-1"
        style={{ color: '#666666' }}
      >
        Tendance LBP
      </div>
      {data?.rate ? (
        <svg ref={svgRef} className="w-full" style={{ height: 48 }} />
      ) : (
        <div
          className="text-[11px]"
          style={{ color: '#666666', height: 48, display: 'flex', alignItems: 'center' }}
        >
          Chargement…
        </div>
      )}
    </div>
  );
}
