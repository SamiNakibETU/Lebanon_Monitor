'use client';

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface OmbreGaugeProps {
  width: number;
  height: number;
  ombreRatio?: number; // 0-100
}

export function OmbreGauge({ width, height, ombreRatio = 0 }: OmbreGaugeProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || width < 10 || height < 10) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const radius = Math.min(width, height * 2) / 2 - 8;
    const g = svg
      .append('g')
      .attr('transform', `translate(${width / 2},${height - 4})`);

    const arcGen = d3
      .arc<{ startAngle: number; endAngle: number }>()
      .innerRadius(radius * 0.6)
      .outerRadius(radius);

    const bgArc = arcGen({
      startAngle: -Math.PI,
      endAngle: 0,
    });

    g.append('path')
      .attr('d', bgArc ?? '')
      .attr('fill', 'rgba(255,255,255,0.06)');

    const lumiereEnd = -Math.PI + (Math.PI * (100 - ombreRatio)) / 100;
    g.append('path')
      .attr(
        'd',
        arcGen({
          startAngle: -Math.PI,
          endAngle: lumiereEnd,
        }) ?? ''
      )
      .attr('fill', '#43A047');

    g.append('path')
      .attr(
        'd',
        arcGen({
          startAngle: lumiereEnd,
          endAngle: 0,
        }) ?? ''
      )
      .attr('fill', '#E53935');

    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', -radius * 0.3)
      .attr('fill', 'var(--text-primary)')
      .style('font-size', '20px')
      .style('font-weight', '600')
      .text(`${ombreRatio}%`);

    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', -radius * 0.1)
      .attr('fill', 'var(--text-secondary)')
      .style('font-size', '9px')
      .text('ombre');
  }, [width, height, ombreRatio]);

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
