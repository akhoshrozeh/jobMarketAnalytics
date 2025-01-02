"use client"
import { useEffect, useRef } from 'react';
import * as d3 from "d3";

interface AggregatedGroupProps {
  data: Array<{
    _id: string;
    totalOccurrences: number;
  }>;
}

export default function AggregatedGroup({ data }: AggregatedGroupProps) {
  const chartRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!data || !chartRef.current) return;

    // Clear previous chart
    d3.select(chartRef.current).selectAll("*").remove();

    // Chart dimensions
    const width = 1500;
    const height = 500;
    const marginTop = 20;
    const marginRight = 20;
    const marginBottom = 90;
    const marginLeft = 60;

    // Create scales
    const x = d3.scaleBand()
      .domain(data.map(d => d._id))
      .range([marginLeft, width - marginRight])
      .padding(0.1);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.totalOccurrences) || 0]).nice()
      .range([height - marginBottom, marginTop]);

    // Create SVG container
    const svg = d3.select(chartRef.current)
      .attr("viewBox", [0, 0, width, height])
      .attr("width", width)
      .attr("height", height)
      .attr("style", "max-width: 100%; height: auto;");

    // Add bars
    svg.append("g")
      .attr("fill", "#4f46e5")
      .selectAll("rect")
      .data(data)
      .join("rect")
      .attr("x", d => x(d._id) || 0)
      .attr("y", d => y(d.totalOccurrences))
      .attr("height", d => y(0) - y(d.totalOccurrences))
      .attr("width", x.bandwidth())
      .attr("opacity", 0.8);

    // Add x-axis
    svg.append("g")
      .attr("transform", `translate(0,${height - marginBottom})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end");

    // Add y-axis
    svg.append("g")
      .attr("transform", `translate(${marginLeft},0)`)
      .call(d3.axisLeft(y))
      .call(g => g.select(".domain").remove());

    // Add labels
    svg.append("text")
      .attr("class", "x-label")
      .attr("text-anchor", "middle")
      .attr("x", width / 2)
      .attr("y", height - 10)
      .text("Keywords");

    svg.append("text")
      .attr("class", "y-label")
      .attr("text-anchor", "middle")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", 20)
      .text("Occurrences");

  }, [data]);

  return (
    <div className="w-full overflow-x-auto">
      <svg ref={chartRef}></svg>
    </div>
  );
}

