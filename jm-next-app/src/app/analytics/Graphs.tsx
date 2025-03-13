"use client"
import { useEffect, useRef, useState } from 'react';
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

interface TopSkillsProps {
    data: Array<{
      _id: string;
      totalOccurrences: number;
    }>;
    blurLabels?: boolean;
    totalJobs: number;
}

export function TopSkillsGraph({ data, blurLabels = false, totalJobs }: TopSkillsProps) {
  const scrollableRef = useRef<SVGSVGElement>(null);
  const fixedRef = useRef<SVGSVGElement>(null);
  const [isLargeScreen, setIsLargeScreen] = useState(false); // Start with a default value

  // Set initial value and add resize listener
  useEffect(() => {
    // Set initial value after component mounts
    setIsLargeScreen(window.innerWidth >= 1024);

    function handleResize() {
      const wasLargeScreen = isLargeScreen;
      const isNowLargeScreen = window.innerWidth >= 1024;
      
      // Only update state if we've crossed the threshold
      if (wasLargeScreen !== isNowLargeScreen) {
        setIsLargeScreen(isNowLargeScreen);
      }
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isLargeScreen]);

  useEffect(() => {
    if (!data || !scrollableRef.current || !fixedRef.current) return;

    // Clear previous content
    d3.select(scrollableRef.current).selectAll("*").remove();
    d3.select(fixedRef.current).selectAll("*").remove();

    // Chart dimensions and margins
    const chartWidth = 600;
    const height = 600;
    const marginTop = 20;
    const marginRight = 20;
    const marginBottom = 100;
    const marginLeft = 60;

    // Use isLargeScreen to determine minBarWidth
    const minBarWidth = isLargeScreen ? 60 : 30;

    const totalBarsWidth = data.length * minBarWidth;
    const actualWidth = Math.max(chartWidth, totalBarsWidth + marginLeft + marginRight);

    // Compute percentages for each bar
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

    // Get the visible container width from the parent element.
    const container = d3.select(scrollableRef.current?.parentNode as HTMLElement)
      .style("position", "relative")
      .style("height", `${height}px`);
    const containerWidth = (container.node() as HTMLElement).clientWidth;

    // ----- SCROLLABLE LAYER (bars and x-axis) -----
    const scrollableSvg = d3.select(scrollableRef.current)
      .attr("viewBox", [0, 0, actualWidth, height])
      .attr("width", actualWidth)
      .attr("height", height)
      .attr("style", "max-width: none; height: auto;");

    // Append a gradient definition (within the scrollable layer)
    const gradient = scrollableSvg.append("defs")
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

    // Draw the bars
    const barsGroup = scrollableSvg.append("g").attr("class", "bars");
    const bars = barsGroup.selectAll("g")
      .data(dataWithPercentages)
      .join("g");

    // Create tooltip div with enhanced styling (matching the pie chart)
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

    // Add the rectangles with hover animations
    bars.append("rect")
      .attr("x", d => x(d._id) || 0)
      .attr("y", y(0))
      .attr("height", 0)
      .attr("width", x.bandwidth())
      .attr("opacity", 0.9)
      .attr("rx", 6)
      .attr("ry", 6)
      .style("fill", "url(#barGradient)")
      .style("filter", "drop-shadow(0 2px 3px rgba(0,0,0,0.2))")
      .style("pointer-events", "none") // disable interactions during animation
      .transition()
      .duration(1000)
      .ease(d3.easePoly)
      .attr("y", d => y(d.percentage))
      .attr("height", d => y(0) - y(d.percentage))
      .on("end", function() {
        // Enable interactions after animation ends
        d3.select(this)
          .style("pointer-events", "all")
          .on("mouseenter", function(event, d: any) {
            // Apply enhanced shadow immediately
            d3.select(this)
              .style("filter", "drop-shadow(0 4px 6px rgba(0,0,0,0.3))")
              .style("cursor", "pointer")
              .transition()
              .duration(200)
              .attr("y", (d: any) => y(d.percentage) - 5)
              .attr("height", (d: any) => y(0) - y(d.percentage) + 5);
            
            // Show tooltip with conditional blur
            const skillName = blurLabels ? 
              `<span style="filter: blur(8px); user-select: none;">${d._id}</span>` : 
              `<span>${d._id}</span>`;
            
            tooltip
              .html(`${skillName}<br>${d.totalOccurrences} jobs (${d.percentage.toFixed(1)}%)`)
              .style("opacity", 1)
              .style("left", (event.pageX + 15) + "px")
              .style("top", (event.pageY - 20) + "px");

            // Animate the corresponding x-axis label
            barsGroup.select(".x-axis")
              .selectAll("text")
              .filter(text => text === d._id)
              .transition()
              .duration(200)
              .style("font-size", "20px")
              .style("font-weight", "bold");
          })
          .on("mousemove", function(event) {
            // Update tooltip position as mouse moves
            tooltip
              .style("left", (event.pageX + 15) + "px")
              .style("top", (event.pageY - 20) + "px");
          })
          .on("mouseleave", function(event, d: any) {
            // Hide tooltip
            tooltip.style("opacity", 0);

            // Reset bar animation
            d3.select(this)
              .transition()
              .duration(200)
              .attr("y", (d: any) => y(d.percentage))
              .attr("height", (d: any) => y(0) - y(d.percentage))
              .style("filter", "drop-shadow(0 2px 3px rgba(0,0,0,0.2))");

            // Reset x-axis label
            barsGroup.select(".x-axis")
              .selectAll("text")
              .filter(text => text === d._id)
              .transition()
              .duration(200)
              .style("font-size", "12px")
              .style("font-weight", "normal")
              .style("fill", "black");
          });
      });

    // Append the x-axis to the scrollable layer with a class for selection
    barsGroup.append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${height - marginBottom})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .style("font-size", "12px")
      .style("transition", "all 0.2s ease")
      .attr("transform", "translate(-15,10)rotate(-45)")  // Adjusted translation values
      .style("text-anchor", "end")
      .style("dominant-baseline", "central");
      
    // ----- FIXED OVERLAY LAYER (y-axis, gridlines, and axis labels) -----
    // Use the container's visible width (containerWidth) rather than chartWidth
    const fixedSvg = d3.select(fixedRef.current)
      .attr("viewBox", [0, 0, containerWidth, height])
      .attr("width", containerWidth)
      .attr("height", height)
      .attr("style",  "pointer-events: none; position: absolute; top: 0; left: 0;");

    const fixedGroup = fixedSvg.append("g");

    // Add horizontal gridlines (use containerWidth for tickSize)
    fixedGroup.append("g")
      .attr("class", "grid")
      .attr("transform", `translate(${marginLeft},0)`)
      .call(d3.axisLeft(y)
              .tickSize(-containerWidth)
              .tickFormat(() => "")
      )
      .style("stroke-dasharray", "2,2")
      .style("stroke-opacity", 0.2)
      .call(g => g.select(".domain").remove());

    // Add the y-axis (tick values) so that percentages remain fixed
    fixedGroup.append("g")
      .attr("transform", `translate(${marginLeft},0)`)
      .call(d3.axisLeft(y).tickFormat(d => `${d}%`))
      .call(g => g.select(".domain").remove())
      .selectAll("text")
      .style("fill", "black")
      .style("font-size", "12px");

    // Add fixed x-axis label ("Keywords")
    fixedGroup.append("text")
      .attr("class", "x-label")
      .attr("text-anchor", "middle")
      // Center the label between the left and right margins of the visible area
      .attr("x", marginLeft + (containerWidth - marginLeft - marginRight) / 2)
      .attr("y", height - 10)
      .style("fill", "black")
      .style("font-size", "24px")
      .text("Keywords");

    // Add fixed y-axis label ("Occurrence Percentage")
    fixedGroup.append("text")
      .attr("class", "y-label")
      .attr("text-anchor", "middle")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", 20)
      .style("fill", "black")
      .style("font-size", "24px")
      .style("margin-bottom", "10px")
      .text("Occurrence Percentage");

    barsGroup.select(".x-axis")
    .selectAll("text")
    .attr("transform", "rotate(-45)")
    


    // Add this before the if(blurLabels) block
    const defs = scrollableSvg.append("defs");
    const blurFilter = defs.append("filter")
      .attr("id", "text-blur")
      .attr("x", "-50%")
      .attr("y", "-50%")
      .attr("width", "200%")
      .attr("height", "200%");

    blurFilter.append("feGaussianBlur")
      .attr("in", "SourceGraphic")
      .attr("stdDeviation", "2");

    // Then in the if(blurLabels) block, replace with:
    if (blurLabels) {
      barsGroup.select(".x-axis")
        .selectAll("text")
        .attr("filter", "url(#text-blur)")
        .style("user-select", "none");
    }

  }, [data, blurLabels, totalJobs, isLargeScreen]);

  return (
    <div style={{ position: "relative", height: "600px" }}>
      <div className="w-full overflow-x-auto overflow-y-hidden" style={{ scrollBehavior: 'smooth' }}>
        {/* Scrollable layer (bars & x-axis) */}
        <svg ref={scrollableRef}></svg>
      </div>
      {/* Fixed overlay layer (y-axis, gridlines, and axis labels) */}
      <svg ref={fixedRef} style={{ position: "absolute", top: 0, left: 0 }}></svg>
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
    const margin = 12; // Even larger margin
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
            const data = d as d3.PieArcDatum<{ label: string; value: number }>;
            const percentage = ((data.data.value / total) * 100).toFixed(1);
            
            tooltip
              .html(`<strong>${data.data.label}</strong><br>${data.data.value} jobs (${percentage}%)`)
              .style("opacity", 1)
              .style("left", (event.pageX + 15) + "px")
              .style("top", (event.pageY - 20) + "px");
            
            d3.select(this)
              .transition()
              .duration(200)
              .attr("d", hoverArc(d as d3.PieArcDatum<{ label: string; value: number }>))
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
              .attr("d", arc(d as d3.PieArcDatum<{ label: string; value: number }>))
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
  

interface TreeNode {
  name: string;
  value?: number;
  children?: TreeNode[];
}

interface TopJobTitlesGraphProps {
  data: TreeNode;
}



type HierarchyNode = d3.HierarchyRectangularNode<TreeNode>;

export function TopJobTitlesGraph({ data }: TopJobTitlesGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!data || !svgRef.current) return;

    // Clear previous chart
    d3.select(svgRef.current).selectAll("*").remove();

    // Set up dimensions
    const width = 928;
    const height = 928;
    const margin = 10;
    const radius = Math.min(width, height) / 2 - margin; // Adjust radius to account for margin


    // Create color scale for the outer ring
    const color = d3.scaleOrdinal(d3.quantize(d3.interpolateRainbow, data.children?.length || 1));

    // Create the partition layout
    const partition = d3.partition<typeof data>()
      .size([2 * Math.PI, radius]);

    // Create the hierarchical structure
    const root = d3.hierarchy(data)
      .sum(d => d.children ? 0 : d.value || 0)
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    // Generate the partition layout
    partition(root);

    // Create the arc generators - one for normal state and one for hover state
    const arc = d3.arc<d3.HierarchyRectangularNode<typeof data>>()
      .startAngle(d => d.x0)
      .endAngle(d => d.x1)
      .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
      .padRadius(radius / 2)
      .innerRadius(d => d.y0)
      .outerRadius(d => d.y1 - 1);

    // Create a slightly larger arc for hover effect
    const hoverArc = d3.arc<d3.HierarchyRectangularNode<typeof data>>()
      .startAngle(d => d.x0)
      .endAngle(d => d.x1)
      .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
      .padRadius(radius / 2)
      .innerRadius(d => Math.max(0, d.y0 - 5)) // Slightly smaller inner radius
      .outerRadius(d => d.y1 + 5); // Slightly larger outer radius

    // Create SVG container
    const svg = d3.select(svgRef.current)
      .attr("viewBox", [-width / 2, -height / 2, width, width])
      .style("width", "100%")
      .style("height", "auto")
      .style("font", "10px sans-serif")


    // Create tooltip
    const tooltip = d3.select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("padding", "12px")
      .style("background", "rgba(0, 0, 0, 0.8)")
      .style("color", "white")
      .style("border-radius", "6px")
      .style("font-size", "16px")
      .style("pointer-events", "none")
      .style("opacity", 0)
      .style("z-index", "100");

    // Add the arcs
    const path = svg.append("g")
      .selectAll("path")
      .data(root.descendants().filter(d => d.depth))
      .join("path")
      .attr("fill", d => {
        while (d.depth > 1) d = d.parent!;
        return color(d.data.name);
      })
      .attr("fill-opacity", 0.6)
      .attr("d", arc as any)
      .style("cursor", "pointer")
      .style("transition", "fill-opacity 0.2s");

    // Add interactivity
    path
      .on("mouseover", (event, d) => {
        const format = d3.format(",d");
        const ancestors = d.ancestors().map(d => d.data.name).reverse().join(" → ");
        const value = format(d.value || 0);

        // Highlight the current segment
        d3.select(event.currentTarget)
          .attr("fill-opacity", 1)
          .transition()
          .duration(200)
          .attr("d", hoverArc as any);

        // Highlight the text label
        svg.selectAll("text")
          .filter(textD => textD === d)
          .transition()
          .duration(100)
          .style("font-size", "20px")
          .style("font-weight", "bold");

        // Show tooltip
        tooltip
          .style("opacity", 1)
          .html(`${ancestors}<br>${value} jobs`)
          .style("left", (event.pageX + 15) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mousemove", (event) => {
        tooltip
          .style("left", (event.pageX + 15) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", (event, d) => {
        // Reset segment
        d3.select(event.currentTarget)
          .attr("fill-opacity", 0.6)
          .transition()
          .duration(200)
          .attr("d", arc as any);
        
        // Reset text label
        svg.selectAll("text")
          .filter(textD => textD === d)
          .transition()
          .duration(200)
          .style("font-size", "16px")
          .style("font-weight", "normal");
        
        // Hide tooltip
        tooltip.style("opacity", 0);
      });

    // Add labels
    const label = svg.append("g")
      .attr("pointer-events", "none")
      .attr("text-anchor", "middle")
      .style("user-select", "none")
      .attr("font-size", "16px")
      .selectAll("text")
      .data(root.descendants().filter(d => {
        const node = d as HierarchyNode;
        return d.depth && (node.y0 + node.y1) / 2 * (node.x1 - node.x0) > 12;
      }))
      .join("text")
      .attr("transform", d => {
        const node = d as HierarchyNode;
        const x = (node.x0 + node.x1) / 2 * 180 / Math.PI;
        const y = (node.y0 + node.y1) / 2;
        return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
      })
      .attr("dy", "0.35em")
      .style("font-size", "20x")
      .style("transition", "font-size 0.2s, font-weight 0.2s")
      .text(d => d.data.name);

    // Cleanup
    return () => {
      tooltip.remove();
    };
  }, [data]);

  return (
    <div className="w-full">
      <div className="w-full" style={{ maxWidth: "928px", margin: "0 auto" }}>
        <svg ref={svgRef}></svg>
      </div>
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


