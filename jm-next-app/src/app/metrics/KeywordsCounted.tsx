"use client"
import { useEffect, useRef } from 'react';
import * as d3 from "d3";

interface KeywordsCountedProps {
  data: Array<{
    _id: string;
    totalOccurrences: number;
  }>;
}

export default function KeywordsCounted({ data }: KeywordsCountedProps) {
  const chartRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!data || !chartRef.current) return;

    // Clear previous chart
    d3.select(chartRef.current).selectAll("*").remove();

    // Chart dimensions
    const width = 2000;
    const height = 1000;
    const marginTop = 20;
    const marginRight = 20;
    const marginBottom = 200;
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
      .attr("style", "max-width: 100%; height: auto;").call(d3.zoom)

    // Add bars with labels
    const bars = svg.append("g")
      .attr("fill", "#4f46e5")
      .selectAll("g")
      .data(data)
      .join("g");

    // Add the rectangles
    bars.append("rect")
      .attr("x", d => x(d._id) || 0)
      .attr("y", y(0))
      .attr("height", 0)
      .attr("width", x.bandwidth())
      .attr("opacity", 0.8)
      .transition()
      .duration(1000)
      .ease(d3.easePoly)
      .attr("y", d => y(d.totalOccurrences))
      .attr("height", d => y(0) - y(d.totalOccurrences))
      .selection();

    // Add x-axis with labels
    const xAxis = svg.append("g")
      .attr("transform", `translate(0,${height - marginBottom})`)
      .call(d3.axisBottom(x));

    xAxis.selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end")
      .attr("class", "label-text")
      .style("font-size", "1.6em");

    // Add hover effects
    bars.on("mouseenter", function(event, d: { _id: string; totalOccurrences: number }) {
      const group = d3.select(this);
      
      // Levitate the bar
      group.select("rect")
        .transition()
        .duration(200)
        .attr("y", y(d.totalOccurrences) - 10)
        .attr("opacity", 1)
        .attr("fill", "#635ce0");

      // Enlarge the corresponding label
      xAxis.selectAll(".label-text")
        .filter(text => text === d._id)
        .transition()
        .duration(200)
        .style("font-size", "2.2em")
        .style("font-weight", "bold");
    })
    .on("mouseleave", function(event, d: { _id: string; totalOccurrences: number }) {
      const group = d3.select(this);
      
      // Return bar to original position
      group.select("rect")
        .transition()
        .duration(200)
        .attr("y", y(d.totalOccurrences))
        .attr("opacity", 0.8)
        .attr("fill", "#4f46e5");

      // Return label to original size
      xAxis.selectAll(".label-text")
        .filter(text => text === d._id)
        .transition()
        .duration(200)
        .style("font-size", "1.6em")
        .style("font-weight", "normal");
    });

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
      .style("fill", "white")
      .style("font-size", "24px")
      .text("Keywords");
      

    svg.append("text")
      .attr("class", "y-label")
      .attr("text-anchor", "middle")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", 20)
      .style("fill", "white")
      .style("font-size", "24px")
      .text("Occurrences");

  }, [data]);

  return (
    <div className="w-full overflow-x-auto">
      <svg ref={chartRef}></svg>
    </div>
  );
}

