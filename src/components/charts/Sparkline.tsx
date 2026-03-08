'use client';

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface SparklineProps {
  width: number;
  height: number;
  data: number[];
  strokeColor?: string;
}

export function Sparkline({
  width,
  height,
  data = [],
  strokeColor = '#666666',
}: SparklineProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || width < 10 || height < 10 || data.length < 2) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 4, right: 4, bottom: 4, left: 4 };
    const innerWidth = Math.max(0, width - margin.left - margin.right);
    const innerHeight = Math.max(0, height - margin.top - margin.bottom);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const minVal = d3.min(data) ?? 0;
    const maxVal = d3.max(data) ?? 1;
    const padding = (maxVal - minVal) * 0.1 || 1;
    const yScale = d3
      .scaleLinear()
      .domain([minVal - padding, maxVal + padding])
      .range([innerHeight, 0]);

    const xScale = d3
      .scaleLinear()
      .domain([0, data.length - 1])
      .range([0, innerWidth]);

    const line = d3
      .line<number>()
      .x((_, i) => xScale(i))
      .y((d) => yScale(d))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', strokeColor)
      .attr('stroke-width', 1.5)
      .attr('d', line as never);
  }, [width, height, data, strokeColor]);

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      className="overflow-visible"
      style={{ minHeight: 40 }}
    />
  );
}
