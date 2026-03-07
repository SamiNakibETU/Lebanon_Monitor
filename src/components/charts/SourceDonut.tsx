'use client';

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface SourceDonutProps {
  width: number;
  height: number;
  data?: Array<{ name: string; count: number }>;
  total?: number;
}

const COLORS = [
  '#4ADE80',
  '#60A5FA',
  '#A78BFA',
  '#F87171',
  '#FBBF24',
  '#34D399',
  '#818CF8',
  '#F472B6',
];

export function SourceDonut({ width, height, data = [], total = 0 }: SourceDonutProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || width < 10 || height < 10) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const radius = Math.min(width, height) / 2 - 4;
    const innerRadius = radius * 0.6;

    const g = svg
      .append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    if (data.length === 0) {
      g.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '0.32em')
        .attr('fill', 'var(--text-tertiary)')
        .style('font-size', '11px')
        .text('No data');
      g.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '1.2em')
        .attr('fill', 'var(--text-secondary)')
        .style('font-size', '10px')
        .text('0');
      return;
    }

    const pie = d3.pie<{ name: string; count: number }>().value((d) => d.count);
    const arc = d3.arc<d3.PieArcDatum<{ name: string; count: number }>>().innerRadius(innerRadius).outerRadius(radius);

    g.selectAll('path')
      .data(pie(data))
      .join('path')
      .attr('d', arc as never)
      .attr('fill', (_, i) => COLORS[i % COLORS.length])
      .attr('stroke', 'var(--bg-primary)')
      .attr('stroke-width', 1);

    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '-0.1em')
      .attr('fill', 'var(--text-primary)')
      .style('font-size', '14px')
      .style('font-weight', '600')
      .text(total);

    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '1.2em')
      .attr('fill', 'var(--text-secondary)')
      .style('font-size', '10px')
      .text('events');
  }, [width, height, data, total]);

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      className="overflow-visible"
      style={{ minHeight: 60 }}
    />
  );
}
