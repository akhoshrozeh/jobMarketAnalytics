"use client"
import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';

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
            .force("charge", d3.forceManyBody().strength(-20000))
            .force("collide", d3.forceCollide().radius(d => Math.sqrt((d as any).value) + 50))
            .force("x", d3.forceX(width / 2).strength(0.00005))
            .force("y", d3.forceY(height / 2).strength(0.00005))
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
                // Find the maximum weight to normalize values
                const maxWeight = d3.max(graphLinks, l => l.weight) || 1;
                
                // Create a color scale based on normalized weight
                const colorScale = d3.scaleLinear<string>()
                    .domain([0, maxWeight])  // use actual weight range instead of 0-1
                    .range(["#cccccc", "#000000"]);  // light gray to black

                // Show only connected links
                link.style("stroke-opacity", 0);
                link.filter(l => (l.source as any).id === d.id || (l.target as any).id === d.id)
                    .style("stroke-opacity", 1)
                    .style("stroke", l => colorScale(l.weight));
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
                if (!event.active) simulation.alphaTarget(0.002).restart();
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
    blurLabels?: boolean;
    totalJobs: number;
}

export function TopSkillsGraph({ data, blurLabels = false, totalJobs }: KeywordsCountedProps) {
    const chartRef = useRef<SVGSVGElement>(null);
  
    useEffect(() => {
      if (!data || !chartRef.current) return;
  
      // Clear previous chart
      d3.select(chartRef.current).selectAll("*").remove();
  
      // Chart dimensions
      const width = 2000;
      const height = 600;
      const marginTop = 20;
      const marginRight = 20;
      const marginBottom = 100;
      const marginLeft = 60;
      
      // Set minimum bar width
      const minBarWidth = 70; // We can adjust this value
      const totalBarsWidth = data.length * minBarWidth;
      const actualWidth = Math.max(width, totalBarsWidth + marginLeft + marginRight);
  
      // Calculate percentages
      const dataWithPercentages = data.map(d => ({
        ...d,
        percentage: (d.totalOccurrences / totalJobs) * 100
      }));
  
      // Create scales
      const x = d3.scaleBand()
        .domain(dataWithPercentages.map(d => d._id))
        .range([marginLeft, actualWidth - marginRight])
        .padding(0.1);
  
      const y = d3.scaleLinear()
        .domain([0, d3.max(dataWithPercentages, d => d.percentage) || 0]).nice()
        .range([height - marginBottom, marginTop]);
  
      // Create a container div for the chart with relative positioning
      const container = d3.select(chartRef.current.parentNode)
        .style("position", "relative")
        .style("height", `${height}px`);

      // Create SVG container with a background group and a foreground group
      const svg = d3.select(chartRef.current)
        .attr("viewBox", [0, 0, actualWidth, height])
        .attr("width", actualWidth)
        .attr("height", height)
        .attr("style", "max-width: none; height: auto;");

      // Create a group for the scrollable content
      const scrollableGroup = svg.append("g")
        .attr("class", "scrollable");

      // Create a fixed group for axes and labels that won't scroll
      const fixedGroup = svg.append("g")
        .attr("class", "fixed")
        .style("pointer-events", "none"); // Prevent interference with bar interactions

      // Add horizontal gridlines
      fixedGroup.append("g")
        .attr("class", "grid")
        .attr("transform", `translate(${marginLeft},0)`)
        .call(d3.axisLeft(y)
          .tickSize(-actualWidth)
          .tickFormat(() => "")
        )
        .style("stroke-dasharray", "2,2") // Make gridlines dashed
        .style("stroke-opacity", 0.2)
        .call(g => g.select(".domain").remove()); // Remove the axis line

      // Create gradient definition - move this after creating scrollableGroup
      const gradient = scrollableGroup.append("defs")  // Changed from svg.append to scrollableGroup.append
          .append("linearGradient")
          .attr("id", "barGradient")
          .attr("gradientTransform", "rotate(90)");

      gradient.append("stop")
          .attr("offset", "0%")
          .attr("stop-color", "#4FB3A3")
          .attr("stop-opacity", 1);

      gradient.append("stop")
          .attr("offset", "100%")
          .attr("stop-color", "#3D8D7A")
          .attr("stop-opacity", 1);

      // Move the bars to the scrollable group
      const bars = scrollableGroup.append("g")
          .selectAll("g")
          .data(dataWithPercentages)
          .join("g");

      // Add the rectangles with rounded corners and gradient
      bars.append("rect")
          .attr("x", d => x(d._id) || 0)
          .attr("y", y(0))
          .attr("height", 0)
          .attr("width", x.bandwidth())
          .attr("opacity", 0.9)
          .attr("rx", 6)
          .attr("ry", 6)
          .style("fill", "url(#barGradient)")  // This should now work correctly
          .style("filter", "drop-shadow(0 2px 3px rgba(0,0,0,0.2))")
          .style("pointer-events", "none")  // Disable interactions during animation
          .transition()
          .duration(1000)
          .ease(d3.easePoly)
          .attr("y", d => y(d.percentage))
          .attr("height", d => y(0) - y(d.percentage))
          .on("end", function() {
            // Enable interactions after animation
            d3.select(this)
              .style("pointer-events", "all");
          })
          .selection();

      // Add x-axis to the scrollable group
      const xAxis = scrollableGroup.append("g")
        .attr("transform", `translate(0,${height - marginBottom})`)
        .call(d3.axisBottom(x));

      // Add y-axis to the fixed group
      fixedGroup.append("g")
        .attr("transform", `translate(${marginLeft},0)`)
        .call(d3.axisLeft(y).tickFormat(d => `${d}%`))
        .call(g => g.select(".domain").remove())
        .selectAll("text")
        .style("fill", "black");

      // Add labels to fixed group
      fixedGroup.append("text")
        .attr("class", "x-label")
        .attr("text-anchor", "middle")
        .attr("x", width / 2)
        .attr("y", height - 10)
        .style("fill", "black")
        .style("font-size", "24px")
        .text("Keywords");

      fixedGroup.append("text")
        .attr("class", "y-label")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", 20)
        .style("fill", "black")
        .style("font-size", "24px")
        .text("Occurrence Percentage");

      // Update title blur if enabled
      if (blurLabels) {
        fixedGroup.select(".x-label")
          .style("filter", "blur(8px)")
          .style("user-select", "none");
      }

      // Create tooltip div with enhanced styling
      const tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("padding", "12px")
        .style("background", "rgba(0, 0, 0, 0.8)")
        .style("color", "white")
        .style("border-radius", "6px")
        .style("font-size", "16px")
        .style("font-weight", "500")
        .style("min-width", "180px")
        .style("text-align", "center")
        .style("box-shadow", "0 4px 8px rgba(0,0,0,0.2)")
        .style("pointer-events", "none")
        .style("opacity", 0)
        .style("z-index", "100")
        .style("backdrop-filter", "blur(4px)");

      // Update hover effects
      bars.on("mouseenter", function(event, d: { _id: string; totalOccurrences: number; percentage: number }) {
        const group = d3.select(this);
        
        // Levitate the bar with enhanced shine
        group.select("rect")
          .transition()
          .duration(200)
          .attr("y", y(d.percentage) - 10)
          .attr("opacity", 1)
          .style("filter", "drop-shadow(0 4px 6px rgba(0,0,0,0.3)) brightness(1.1)");
  
        // Show tooltip with conditional blur
        tooltip
          .html(`<strong>${blurLabels ? '<span style="filter: blur(8px);">' + d._id + '</span>' : d._id}</strong><br>${d.totalOccurrences} jobs (${d.percentage.toFixed(1)}%)`)
          .style("opacity", 1)
          .style("left", (event.pageX + 15) + "px")
          .style("top", (event.pageY - 20) + "px");
  
        // Enlarge the corresponding label
        xAxis.selectAll(".label-text")
          .filter(text => text === d._id)
          .transition()
          .duration(200)
          .style("font-size", "3.2em")
          .style("font-weight", "bold");
      })
      .on("mousemove", function(event) {
        tooltip
          .style("left", (event.pageX + 15) + "px")
          .style("top", (event.pageY - 20) + "px");
      })
      .on("mouseleave", function(event, d: { _id: string; totalOccurrences: number; percentage: number }) {
        const group = d3.select(this);
        
        // Return bar to original position and style
        group.select("rect")
          .transition()
          .duration(200)
          .attr("y", y(d.percentage))
          .attr("opacity", 0.9)
          .style("filter", "drop-shadow(0 2px 3px rgba(0,0,0,0.2))");
  
        // Hide tooltip
        tooltip.style("opacity", 0);
  
        // Return label to original size
        xAxis.selectAll(".label-text")
          .filter(text => text === d._id)
          .transition()
          .duration(200)
          .style("font-size", "1.6em")
          .style("font-weight", "normal");
      });
  
      // Clean up tooltip when component unmounts
      return () => {
        d3.select("body").selectAll(".tooltip").remove();
      };
    }, [data, blurLabels]);
  
    return (
      <div className="w-full overflow-x-auto" style={{ scrollBehavior: 'smooth' }}>
        <svg ref={chartRef}></svg>
      </div>
    );
  }
  
interface RemoteVsNonRemotePieProps {
  data: {
    remote: number;
    nonRemote: number;
  };
}

export function RemoteVsNonRemotePie({ data }: RemoteVsNonRemotePieProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!data || !svgRef.current) return;

    // Clear anything previously drawn
    d3.select(svgRef.current).selectAll("*").remove();

    // Convert the object { remote: number; nonRemote: number } into an array
    const pieData = [
      { label: "Remote", value: data.remote },
      { label: "Onsite", value: data.nonRemote },
    ];

    // Calculate total for percentages
    const total = pieData.reduce((sum, item) => sum + item.value, 0);

    // Enhanced chart dimensions - make them responsive
    const width = 400;
    const height = 400;
    const margin = 60; // Even larger margin
    const radius = Math.min(width, height) / 2 - margin;

    // Create SVG container with a background for better contrast
    const svg = d3
      .select(svgRef.current)
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .style("overflow", "visible") // This is key - allow content to overflow the SVG
      .style("z-index", "10"); // Higher z-index to ensure visibility
    
    // Add a subtle background circle
    // svg.append("circle")
    //   .attr("cx", width / 2)
    //   .attr("cy", height / 2)
    //   .attr("r", radius + 20)
    //   .attr("fill", "#f8f9fa")
    //   .attr("filter", "drop-shadow(0 4px 6px rgba(0,0,0,0.1))");
    
    const pieGroup = svg.append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2})`);

    // Create tooltip div with enhanced styling
    const tooltip = d3.select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("padding", "12px")
      .style("background", "rgba(0, 0, 0, 0.8)")
      .style("color", "white")
      .style("border-radius", "6px")
      .style("font-size", "16px")
      .style("font-weight", "500")
      .style("min-width", "180px")
      .style("text-align", "center")
      .style("box-shadow", "0 4px 8px rgba(0,0,0,0.2)")
      .style("pointer-events", "none")
      .style("opacity", 0)
      .style("z-index", "100")
      .style("backdrop-filter", "blur(4px)");

    // Create gradient definitions for each slice
    const defs = svg.append("defs");
    
    // Remote gradient (teal)
    const remoteGradient = defs.append("linearGradient")
      .attr("id", "remoteGradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "100%")
      .attr("y2", "100%");
    
    remoteGradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#7EEADB");  // Light teal
      
    remoteGradient.append("stop")
      .attr("offset", "50%")
      .attr("stop-color", "#4FB3A3");  // Medium teal
      
    remoteGradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#3D8D7A");  // Dark teal
    
    // Onsite gradient (orange)
    const onsiteGradient = defs.append("linearGradient")
      .attr("id", "onsiteGradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "100%")
      .attr("y2", "100%");
    
    onsiteGradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#FFB78E");  // Light orange
      
    onsiteGradient.append("stop")
      .attr("offset", "50%")
      .attr("stop-color", "#FF9B5E");  // Medium orange
      
    onsiteGradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#E07C3E");  // Dark orange
    
    // Add inner shadow filter
    defs.append("filter")
      .attr("id", "innerShadow")
      .append("feDropShadow")
      .attr("dx", "0")
      .attr("dy", "0")
      .attr("stdDeviation", "3")
      .attr("flood-color", "rgba(0,0,0,0.3)");

    // Add outer glow filter
    const glowFilter = defs.append("filter")
      .attr("id", "glow")
      .attr("x", "-50%")
      .attr("y", "-50%")
      .attr("width", "200%")
      .attr("height", "200%");
    
    glowFilter.append("feGaussianBlur")
      .attr("stdDeviation", "3")
      .attr("result", "blur");
    
    glowFilter.append("feComposite")
      .attr("in", "blur")
      .attr("in2", "SourceGraphic")
      .attr("operator", "out")
      .attr("result", "glow");
    
    glowFilter.append("feBlend")
      .attr("in", "SourceGraphic")
      .attr("in2", "glow")
      .attr("mode", "normal");

    // Make a color scale with gradients
    const colorMap = {
      "Remote": "url(#remoteGradient)",
      "Onsite": "url(#onsiteGradient)"
    };

    // Create the pie generator
    const pieGenerator = d3
      .pie<{ label: string; value: number }>()
      .value((d) => d.value)
      .padAngle(0.02);

    // Create the arc generator with rounded corners
    const arc = d3
      .arc<d3.PieArcDatum<{ label: string; value: number }>>()
      .innerRadius(radius * 0.5)
      .outerRadius(radius)
      .cornerRadius(8);

    // Create an arc for the animation starting point (0 degrees)
    const arcTween = (d: d3.PieArcDatum<{ label: string; value: number }>) => {
      const interpolate = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
      return (t: number) => arc(interpolate(t))!;
    };

    // Create a slightly larger arc for hover effect
    const hoverArc = d3
      .arc<d3.PieArcDatum<{ label: string; value: number }>>()
      .innerRadius(radius * 0.48)
      .outerRadius(radius * 1.05)
      .cornerRadius(10);

    // Create a label arc
    const labelArc = d3
      .arc<d3.PieArcDatum<{ label: string; value: number }>>()
      .innerRadius(radius * 0.75)
      .outerRadius(radius * 0.75);

    // Build the pie chart with arcs
    const arcs = pieGroup
      .selectAll("arc")
      .data(pieGenerator(pieData))
      .enter()
      .append("g")
      .attr("class", "slice");

    // Add the slices with gradients and effects
    arcs
      .append("path")
      .attr("d", arc)
      .attr("fill", (d) => colorMap[d.data.label as keyof typeof colorMap])
      .attr("stroke", "#fff")
      .style("stroke-width", "2px")
      .style("filter", "url(#innerShadow)")
      .style("opacity", 0) // Start with opacity 0
      .attr("d", d => arc({ ...d, startAngle: 0, endAngle: 0 })) // Start from 0 angle
      .transition() // Begin transition
      .duration(1000) // Animation duration in milliseconds
      .ease(d3.easeCircleOut) // Use circular easing for smooth animation
      .style("opacity", 1) // Fade in
      .attrTween("d", arcTween) // Animate the arc path
      .on("end", function() {
        // After animation completes, add the hover events
        d3.select(this)
          .on("mouseover", function(event, d) {
            const percentage = ((d.data.value / total) * 100).toFixed(1);
            
            tooltip
              .html(`<strong>${d.data.label}</strong><br>${d.data.value} jobs (${percentage}%)`)
              .style("opacity", 1)
              .style("left", (event.pageX + 15) + "px")
              .style("top", (event.pageY - 20) + "px");
            
            d3.select(this)
              .transition()
              .duration(200)
              .attr("d", hoverArc(d))
              .style("filter", "url(#glow)");
          })
          .on("mousemove", function(event) {
            tooltip
              .style("left", (event.pageX + 15) + "px")
              .style("top", (event.pageY - 20) + "px");
          })
          .on("mouseout", function(event, d) {
            tooltip
              .style("opacity", 0);
            
            d3.select(this)
              .transition()
              .duration(200)
              .attr("d", arc(d))
              .style("filter", "url(#innerShadow)");
          });
      });

    // Animate the percentage labels
    arcs
      .append("text")
      .attr("transform", (d) => `translate(${labelArc.centroid(d)})`)
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .style("fill", "white")
      .style("text-shadow", "0 1px 2px rgba(0,0,0,0.5)")
      .style("pointer-events", "none")
      .style("opacity", 0) // Start with opacity 0
      .text((d) => {
        const percentage = ((d.data.value / total) * 100).toFixed(0);
        return `${percentage}%`;
      })
      .transition() // Begin transition
      .delay(1000) // Wait for pie animation to complete
      .duration(500) // Fade in duration
      .style("opacity", 1); // Fade in the text

    // Add labels with connecting lines
    const labelOffset = 30;
    
    // Add a center circle with a subtle shadow
    pieGroup.append("circle")
      .attr("cx", 0)
      .attr("cy", 0)
      .attr("r", radius * 0.48)
      .attr("fill", "white")
      .attr("filter", "drop-shadow(0 0 4px rgba(0,0,0,0.2))");

    // Add title in the center
    pieGroup.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "-0.2em")
      .style("font-size", "18px")
      .style("font-weight", "bold")
      .style("fill", "#333")
      .text("Job Location");

    pieGroup.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "1.2em")
      .style("font-size", "16px")
      .style("fill", "#666")
      .text("Distribution");

    // Clean up tooltip when component unmounts
    return () => {
      d3.select("body").selectAll(".tooltip").remove();
    };
  }, [data]);

  return (
    <div className="flex justify-center items-center w-full h-full relative" style={{ minHeight: "400px" }}>
      <svg ref={svgRef} className="absolute inset-0"></svg>
    </div>
  );
}
  

interface TopJobTitlesGraphProps {
  data: Array<{
    title: string;
    count: number;
  }>;
}

export default function TopJobTitlesGraph({ data }: TopJobTitlesGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!data || !data.length || !svgRef.current) return;

    // Clear previous chart
    d3.select(svgRef.current).selectAll("*").remove();

    // Set the dimensions and margins of the graph
    const margin = { top: 20, right: 30, bottom: 70, left: 150 };
    const width = 800 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    // Append the svg object to the div
    const svg = d3.select(svgRef.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .attr("viewBox", [0, 0, width + margin.left + margin.right, height + margin.top + margin.bottom])
      .attr("style", "max-width: 100%; height: auto;")
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Sort data
    data.sort((a, b) => b.count - a.count);

    // Add X axis
    const x = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.count) || 0])
      .range([0, width]);
    
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("transform", "translate(-10,0)rotate(-45)")
      .style("text-anchor", "end")
      .style("font-size", "12px");

    // Y axis
    const y = d3.scaleBand()
      .range([0, height])
      .domain(data.map(d => d.title))
      .padding(1);
    
    svg.append("g")
      .call(d3.axisLeft(y))
      .selectAll("text")
      .style("font-size", "12px");

    // Lines
    svg.selectAll("myline")
      .data(data)
      .enter()
      .append("line")
      .attr("x1", d => x(d.count))
      .attr("x2", x(0))
      .attr("y1", d => y(d.title) as number)
      .attr("y2", d => y(d.title) as number)
      .attr("stroke", "grey")
      .attr("stroke-width", 1.5);

    // Circles
    svg.selectAll("mycircle")
      .data(data)
      .enter()
      .append("circle")
      .attr("cx", d => x(d.count))
      .attr("cy", d => y(d.title) as number)
      .attr("r", 8)
      .style("fill", "#3D8D7A")
      .attr("stroke", "black")
      .attr("stroke-width", 1.5)
      .on("mouseover", function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("r", 12)
          .style("fill", "#B35C1E");
          
        // Add tooltip with count
        svg.append("text")
          .attr("class", "tooltip")
          .attr("x", x(d.count) + 15)
          .attr("y", (y(d.title) as number) + 4)
          .text(`${d.count} jobs`)
          .style("font-size", "14px")
          .style("font-weight", "bold");
      })
      .on("mouseout", function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("r", 8)
          .style("fill", "#3D8D7A");
          
        // Remove tooltip
        svg.selectAll(".tooltip").remove();
      });

    // Add title
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", -margin.top / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
  }, [data]);

  return (
    <div className="w-full overflow-x-auto">
      <svg ref={svgRef}></svg>
    </div>
  );
}

interface JobLocationMapProps {
  locations: Array<{
    location: string;
    count: number;
    latitude: number;
    longitude: number;
  }>;
}

export function JobLocationMap({ locations }: JobLocationMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  
  useEffect(() => {
    if (!svgRef.current || !locations.length) return;

    // Clear previous chart
    d3.select(svgRef.current).selectAll("*").remove();

    const width = 975;
    const height = 610;

    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
      .attr("style", "max-width: 100%; height: auto;");

    const g = svg.append("g");

    // Example snippet:
    const maxCount = d3.max(locations, d => d.count) || 1;
    const radius = d3.scaleSqrt([0, maxCount], [0, 40]);

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 8])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
        g.selectAll("circle")
          .attr("r", function(d) { 
            return radius((d as any).count) / event.transform.k;
          });
      });

    svg.call(zoom);

    // Create a projection for the US
    const projection = d3.geoAlbersUsa()
      .scale(1300)
      .translate([width / 2, height / 2]);
    const path = d3.geoPath().projection(projection);

    // Load US map
    d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json").then((us: any) => {
      g.append("path")
        .datum(topojson.feature(us, us.objects.nation))
        .attr("fill", "#ddd")
        .attr("d", path);
      g.append("path")
        .datum(topojson.mesh(us, us.objects.states, (a, b) => a !== b))
        .attr("fill", "none")
        .attr("stroke", "white")
        .attr("stroke-linejoin", "round")
        .attr("d", path);

      // Copy locations for simulation
      const simPoints = locations.map(d => {
        const [x, y] = projection([d.longitude, d.latitude]) || [width / 2, height / 2];
        return { ...d, x, y };
      });

      // Force simulation to separate circles
      const simulation = d3.forceSimulation(simPoints)
        .force("x", d3.forceX(d => d.x))
        .force("y", d3.forceY(d => d.y))
        .force("collide", d3.forceCollide(d => radius(d.count) + 2))
        .stop();

      // Run simulation
      for (let i = 0; i < 120; i++) simulation.tick();

      // Draw circles at simulated positions
      const format = d3.format(",.0f");
      g.selectAll("circle")
        .data(simPoints)
        .join("circle")
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)
        .attr("r", d => radius(d.count))
        .attr("fill", "#3D8D7A")
        .attr("fill-opacity", 0.6)
        .attr("stroke", "#fff")
        .attr("stroke-width", 0.5)
        .on("mouseover", function (event, d) {
          // Highlight
          d3.select(this)
            .attr("fill", "#B35C1E")
            .attr("fill-opacity", 0.9);
          g.append("text")
            .attr("class", "tooltip")
            .attr("x", d.x)
            .attr("y", d.y - radius(d.count) - 10)
            .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .style("font-weight", "bold")
            .style("fill", "black")
            .text(`${d.location}: ${format(d.count)}`);
        })
        .on("mouseout", function () {
          // Un-highlight
          d3.select(this)
            .attr("fill", "#3D8D7A")
            .attr("fill-opacity", 0.6);
          g.selectAll(".tooltip").remove();
        })
        .append("title")
        .text(d => `${d.location}\n${format(d.count)} jobs`);
    });
  }, [locations]);

  return (
    <div className="w-full overflow-x-auto">
      <svg ref={svgRef}></svg>
    </div>
  );
}


