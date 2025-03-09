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

    // Basic chart dimensions
    const width = 300;
    const height = 300;
    const margin = 10;
    const radius = Math.min(width, height) / 2 - margin;

    // Create SVG container
    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("style", "max-width: 100%; height: auto;")
      .append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2})`);

    // Create tooltip div
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
      .style("z-index", "100");

    // Make a color scale
    const color = d3.scaleOrdinal(["#3D8D7A", "#B35C1E"]);

    // Create the pie generator
    const pieGenerator = d3
      .pie<{ label: string; value: number }>()
      .value((d) => d.value);

    // Create the arc generator
    const arc = d3
      .arc<d3.PieArcDatum<{ label: string; value: number }>>()
      .innerRadius(0)
      .outerRadius(radius);

    // Create a slightly larger arc for label positioning
    const labelArc = d3
      .arc<d3.PieArcDatum<{ label: string; value: number }>>()
      .innerRadius(radius * 0.6)
      .outerRadius(radius * 0.6);

    // Build the pie chart with arcs
    const arcs = svg
      .selectAll("arc")
      .data(pieGenerator(pieData))
      .enter()
      .append("g");

    arcs
      .append("path")
      .attr("d", arc)
      .attr("fill", (d, i) => color(i.toString()))
      .attr("stroke", "#fff")
      .style("stroke-width", "2px")
      .on("mouseover", function(event, d) {
        // Calculate percentage
        const percentage = ((d.data.value / total) * 100).toFixed(1);
        
        // Show tooltip with count and percentage
        tooltip
          .html(`<strong>${d.data.label}</strong><br>${d.data.value} jobs (${percentage}%)`)
          .style("opacity", 1)
          .style("left", (event.pageX + 15) + "px")
          .style("top", (event.pageY - 20) + "px");
        
        // Highlight the segment
        d3.select(this)
          .transition()
          .duration(200)
          .attr("opacity", 0.8)
          .attr("d", d3.arc<d3.PieArcDatum<{ label: string; value: number }>>()
            .innerRadius(0)
            .outerRadius(radius + 10)(d));
      })
      .on("mousemove", function(event) {
        // Move tooltip with mouse
        tooltip
          .style("left", (event.pageX + 15) + "px")
          .style("top", (event.pageY - 20) + "px");
      })
      .on("mouseout", function(event, d) {
        // Hide tooltip
        tooltip
          .style("opacity", 0);
        
        // Return segment to normal size
        d3.select(this)
          .transition()
          .duration(200)
          .attr("opacity", 1)
          .attr("d", arc(d));
      });

    // Add labels on the pieces
    arcs
      .append("text")
      .attr("transform", (d) => {
        // Position labels closer to the center for smaller segments
        const pos = labelArc.centroid(d);
        
        // Adjust position based on the label
        if (d.data.label === "Onsite") {
          // Move Non-Remote label up and to the left
          return `translate(${pos[0] - 10}, ${pos[1] - 15})`;
        } else {
          // Keep Remote label just moved to the left
          return `translate(${pos[0] - 10}, ${pos[1]})`;
        }
      })
      .text((d) => d.data.label)
      .style("text-anchor", "middle")
      .style("font-size", "1.0em")
      .style("fill", "white")
      .style("font-weight", "bold")
      .style("pointer-events", "none"); // so text doesn't interfere with hover

    // Clean up tooltip when component unmounts
    return () => {
      d3.select("body").selectAll(".tooltip").remove();
    };
  }, [data]);

  return (
    <div>
      <svg ref={svgRef}></svg>
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


