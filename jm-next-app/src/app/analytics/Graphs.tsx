"use client"
import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface KeywordsConnectedByJobProps {
    links: Array<{
        source: string;
        target: string;
        weight: number;
    }>;
    nodes: Array<{
        _id: string;
        totalOccurrences: number;
    }>;
}

export function KeywordsConnectedByJob({ links, nodes }: KeywordsConnectedByJobProps) {
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (!svgRef.current || !links || !nodes) return;

        // Set up dimensions
        const width = 1500;
        const height = 1000;

        // Specify the color scale
        const color = d3.scaleOrdinal(d3.schemeCategory10);

        // Create copies of the data to avoid mutation
        const graphNodes = nodes.map(d => ({
            id: d._id,
            value: d.totalOccurrences,
            ...d
        }));

        // Filter links to only include those where both source and target exist in nodes
        const graphLinks = links
            .filter(link => 
                nodes.some(node => node._id === link.source) && 
                nodes.some(node => node._id === link.target)
            )
            .map(d => ({...d}));

        // Clear existing SVG content
        d3.select(svgRef.current).selectAll("*").remove();

        // Create SVG container
        const svg = d3.select(svgRef.current)
            .attr("width", width)
            .attr("height", height)
            .attr("viewBox", [0, 0, width, height])
            .attr("style", "max-width: 100%; height: auto;");

        // Add zoom functionality
        const g = svg.append("g");
        const zoom = d3.zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.1, 4])
            .on("zoom", (event) => {
                g.attr("transform", event.transform);
            });
        svg.call(zoom);

        // Create simulation with much stronger forces
        const simulation = d3.forceSimulation(graphNodes as any)
            .force("link", d3.forceLink(graphLinks)
                .id(d => (d as any).id)
                .distance(d => 300 + 200 * (1 - (d as any).weight))
            )
            .force("charge", d3.forceManyBody().strength(-2000))
            .force("collide", d3.forceCollide().radius(d => Math.sqrt((d as any).value) + 50))
            .force("x", d3.forceX(width / 2).strength(0.05))
            .force("y", d3.forceY(height / 2).strength(0.05))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .alphaDecay(0.1)
            .velocityDecay(0.8);

        // Add links with initial opacity set to 0
        const link = g.append("g")
            .attr("stroke", "#999")
            .attr("stroke-opacity", 0)  // Initially hidden
            .selectAll("line")
            .data(graphLinks)
            .join("line")
            .attr("stroke-width", d => Math.sqrt(d.weight))
            .attr("class", "link");

        // Create node groups with hover effects
        const nodeGroup = g.append("g")
            .selectAll("g")
            .data(graphNodes)
            .join("g")
            .on("mouseover", (event, d) => {
                // Show only connected links
                link.style("stroke-opacity", 0);
                link.filter(l => (l.source as any).id === d.id || (l.target as any).id === d.id)
                    .style("stroke-opacity", 1)
                    .style("stroke", "#ff0");
            })
            .on("mouseout", () => {
                // Hide all links
                link.style("stroke-opacity", 0);
            });

        // Add circles to each group
        const node = nodeGroup
            .append("circle")
            .attr("r", d => Math.sqrt((d as any).value) + 3)
            .attr("fill", (_, i) => color(i.toString()))
            .attr("stroke", "#fff")
            .attr("stroke-width", 1.5);

        // Add text labels to each group
        const labels = nodeGroup
            .append("text")
            .text(d => (d as any).id)
            .attr("text-anchor", "middle")
            .attr("dy", ".35em")
            .attr("fill", "white")
            .attr("font-size", "12px");

        // Update the drag behavior to use nodeGroup instead of node
        nodeGroup.call(d3.drag<any, any>()
            .on("start", (event) => {
                if (!event.active) simulation.alphaTarget(0.01).restart();
                event.subject.fx = event.subject.x;
                event.subject.fy = event.subject.y;
            })
            .on("drag", (event) => {
                event.subject.fx = event.x;
                event.subject.fy = event.y;
            })
            .on("end", (event) => {
                if (!event.active) simulation.alphaTarget(0);
            }));

        // Update the tick function to move both circle and text
        simulation.on("tick", () => {
            link
                .attr("x1", d => (d.source as any).x)
                .attr("y1", d => (d.source as any).y)
                .attr("x2", d => (d.target as any).x)
                .attr("y2", d => (d.target as any).y);

            nodeGroup
                .attr("transform", d => `translate(${(d as any).x},${(d as any).y})`);
        });

        // Cleanup
        return () => {
            simulation.stop();
        };
    }, [links, nodes]);

    return (
        <div className="w-full overflow-x-auto">
            <h2 className="text-xl font-semibold mb-4">Skills Network</h2>
            <svg ref={svgRef}></svg>
        </div>
    );
}

interface KeywordsCountedProps {
    data: Array<{
      _id: string;
      totalOccurrences: number;
    }>;
  }
  
export function KeywordsCounted({ data }: KeywordsCountedProps) {
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
        .attr("fill", "#3D8D7A")
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
          .attr("fill", "#3D8D7A");
  
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
          .attr("fill", "#3D8D7A");
  
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
  
  