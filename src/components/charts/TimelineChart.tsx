'use client';

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface TimelineChartProps {
  width: number;
  height: number;
  data?: Array<{ hour: string; count: number; ombre: number; lumiere: number }>;
  /** Lumière panel: green fill. Ombre panel: red fill. */
  variant?: 'lumiere' | 'ombre';
}

export function TimelineChart({ width, height, data = [], variant = 'lumiere' }: TimelineChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || width < 10 || height < 10) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 8, right: 8, bottom: 20, left: 32 };
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

    const xScale = d3
      .scaleBand()
      .domain(data.map((d) => d.hour))
      .range([0, innerWidth])
      .padding(0.1);

    const isOmbre = variant === 'ombre';
    const fillColor = isOmbre ? '#C62828' : '#2E7D32';
    const fillOpacity = 0.3;
    const values = data.map((d) => (isOmbre ? d.ombre : d.lumiere));
    const maxCount = Math.max(1, ...values);
    const yScale = d3.scaleLinear().domain([0, maxCount]).range([innerHeight, 0]);

    const area = d3
      .area<{ hour: string; ombre: number; lumiere: number }>()
      .x((d) => (xScale(d.hour) ?? 0) + xScale.bandwidth() / 2)
      .y0(innerHeight)
      .y1((d) => yScale(isOmbre ? d.ombre : d.lumiere))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(data)
      .attr('fill', fillColor)
      .attr('fill-opacity', fillOpacity)
      .attr('stroke', fillColor)
      .attr('stroke-width', 1)
      .attr('stroke-opacity', 0.6)
      .attr('d', area as never);

    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(
        d3.axisBottom(xScale).tickValues(
          xScale.domain().filter((_, i) => i % 4 === 0)
        ) as never
      )
      .selectAll('text')
      .style('font-size', '9px')
      .attr('fill', 'var(--text-tertiary)');

    g.selectAll('.domain, .tick line').attr('stroke', 'rgba(255,255,255,0.06)');
  }, [width, height, data, variant]);

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
