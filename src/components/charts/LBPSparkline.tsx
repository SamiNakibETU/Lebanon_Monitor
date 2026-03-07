'use client';

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface LBPSparklineProps {
  width: number;
  height: number;
  data?: Array<{ at: string; value: number }>;
  current?: number;
  trend?: 'up' | 'down' | 'stable';
}

export function LBPSparkline({
  width,
  height,
  data = [],
  current = 0,
  trend = 'stable',
}: LBPSparklineProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || width < 10 || height < 10) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 4, right: 4, bottom: 4, left: 4 };
    const innerWidth = Math.max(0, width - margin.left - margin.right);
    const innerHeight = Math.max(0, height - margin.top - margin.bottom);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    if (data.length < 2) {
      g.append('text')
        .attr('x', innerWidth / 2)
        .attr('y', innerHeight / 2)
        .attr('text-anchor', 'middle')
        .attr('dy', '0.32em')
        .attr('fill', 'var(--text-secondary)')
        .style('font-size', '11px')
        .text(current > 0 ? current.toLocaleString() : '—');
      return;
    }

    const xScale = d3
      .scalePoint()
      .domain(data.map((d) => d.at))
      .range([0, innerWidth]);

    const minVal = d3.min(data, (d) => d.value) ?? 0;
    const maxVal = d3.max(data, (d) => d.value) ?? 1;
    const padding = (maxVal - minVal) * 0.1 || 1;
    const yScale = d3
      .scaleLinear()
      .domain([minVal - padding, maxVal + padding])
      .range([innerHeight, 0]);

    const line = d3
      .line<{ at: string; value: number }>()
      .x((d) => xScale(d.at) ?? 0)
      .y((d) => yScale(d.value))
      .curve(d3.curveMonotoneX);

    const color = trend === 'up' ? '#F87171' : trend === 'down' ? '#4ADE80' : 'var(--text-secondary)';

    g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', color)
      .attr('stroke-width', 1.5)
      .attr('d', line as never);

    g.append('text')
      .attr('x', innerWidth - 2)
      .attr('y', 2)
      .attr('text-anchor', 'end')
      .attr('fill', 'var(--text-primary)')
      .style('font-size', '10px')
      .style('font-weight', '500')
      .text(current > 0 ? current.toLocaleString() : '');
  }, [width, height, data, current, trend]);

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      className="overflow-visible"
      style={{ minHeight: 36 }}
    />
  );
}
