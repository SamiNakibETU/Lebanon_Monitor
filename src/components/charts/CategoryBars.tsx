'use client';

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface CategoryBarsProps {
  width: number;
  height: number;
  data?: Array<{ code: string; count: number; isOmbre?: boolean }>;
}

export function CategoryBars({ width, height, data = [] }: CategoryBarsProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || width < 10 || height < 10) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 4, right: 8, bottom: 4, left: 100 };
    const innerWidth = Math.max(0, width - margin.left - margin.right);
    const innerHeight = Math.max(0, height - margin.top - margin.bottom);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    if (data.length === 0) {
      g.append('text')
        .attr('x', innerWidth / 2)
        .attr('y', innerHeight / 2)
        .attr('text-anchor', 'middle')
        .attr('fill', 'var(--text-tertiary)')
        .style('font-size', '11px')
        .text('No data');
      return;
    }

    const maxCount = d3.max(data, (d) => d.count) ?? 1;
    const xScale = d3.scaleLinear().domain([0, maxCount]).range([0, innerWidth]);
    const yScale = d3
      .scaleBand()
      .domain(data.map((d) => d.code))
      .range([0, innerHeight])
      .padding(0.2);

    const isNeutral = (code: string) =>
      /neutral|neutre/i.test(code);

    g.selectAll('rect')
      .data(data)
      .join('rect')
      .attr('y', (d) => yScale(d.code) ?? 0)
      .attr('height', yScale.bandwidth())
      .attr('x', 0)
      .attr('width', (d) => xScale(d.count))
      .attr('fill', (d) => {
        if (isNeutral(d.code)) return d.isOmbre ? '#666666' : '#888888';
        return d.isOmbre ? '#C62828' : '#2E7D32';
      });

    g.selectAll('.label')
      .data(data)
      .join('text')
      .attr('class', 'label')
      .attr('y', (d) => (yScale(d.code) ?? 0) + yScale.bandwidth() / 2)
      .attr('x', -4)
      .attr('dy', '0.32em')
      .attr('text-anchor', 'end')
      .style('font-size', '10px')
      .style('text-overflow', 'ellipsis')
      .style('overflow', 'hidden')
      .attr('fill', 'var(--text-secondary)')
      .text((d) => d.code.replace(/\./g, '/'));
  }, [width, height, data]);

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      className="overflow-visible"
      style={{ minHeight: 80 }}
    />
  );
}
