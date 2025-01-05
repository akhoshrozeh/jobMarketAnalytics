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

export default function KeywordsConnectedByJob({ links, nodes }: KeywordsConnectedByJobProps) {
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
                // Much larger base distance
                .distance(d => 300 + 200 * (1 - (d as any).weight))
            )
            // Much stronger repulsion
            .force("charge", d3.forceManyBody().strength(-2000))
            // Larger collision radius
            .force("collide", d3.forceCollide().radius(d => Math.sqrt((d as any).value) + 50))
            // Weaker centering forces to allow more spread
            .force("x", d3.forceX(width / 2).strength(0.05))
            .force("y", d3.forceY(height / 2).strength(0.05))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .alphaDecay(0.1)
            .velocityDecay(0.8);

        // Add links
        const link = g.append("g")
            .attr("stroke", "#999")
            .attr("stroke-opacity", 0.6)
            .selectAll("line")
            .data(graphLinks)
            .join("line")
            .attr("stroke-width", d => Math.sqrt(d.weight))
            .attr("class", "link");  // Add class for easier selection

        // Create node groups with hover effects
        const nodeGroup = g.append("g")
            .selectAll("g")
            .data(graphNodes)
            .join("g")
            .on("mouseover", (event, d) => {
                // Dim all links
                link.style("stroke-opacity", 0.2);
                // Highlight connected links
                link.filter(l => l.source === d || l.target === d)
                    .style("stroke-opacity", 1)
                    .style("stroke", "#ff0");  // Bright yellow for highlighted links
            })
            .on("mouseout", () => {
                // Reset all links
                link
                    .style("stroke-opacity", 0.6)
                    .style("stroke", "#999");
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
            .attr("dy", ".35em")  // Vertically center text
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