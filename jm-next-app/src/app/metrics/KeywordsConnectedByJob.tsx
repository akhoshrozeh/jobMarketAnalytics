"use client"
import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface KeywordsConnectedByJobProps {
    data: Array<{
        source: string;
        target: string;
        weight: number;
    }>;
}

export default function KeywordsConnectedByJob({ data }: KeywordsConnectedByJobProps) {
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (!svgRef.current) return;

        // Set up dimensions
        const width = 800;
        const height = 600;
        const minFitness = 0.1; // Add threshold for filtering links

        // Clean and prepare data
        const links = data.map(d => ({
            source: d.source,
            target: d.target,
            fitness: d.weight // renamed weight to fitness to match the code
        })).filter(l => l.fitness > minFitness);
        
        const nodesSet = new Set<string>();
        links.forEach(link => {
            nodesSet.add(link.source);
            nodesSet.add(link.target);
        });
        const nodes = Array.from(nodesSet).map(id => ({ id }));

        // Clear existing SVG content
        d3.select(svgRef.current).selectAll("*").remove();

        // Create SVG
        const svg = d3.select(svgRef.current)
            .attr("width", width)
            .attr("height", height);

        // Create container for zoom
        const g = svg.append("g");

        // Set up zoom behavior
        const zoom = d3.zoom<SVGSVGElement, unknown>()
            .scaleExtent([1/2, 64])
            .on("zoom", (event) => {
                g.attr("transform", event.transform);
            });

        svg.call(zoom);

        // Create simulation
        const simulation = d3.forceSimulation(nodes as any)
            .force("link", d3.forceLink(links)
                .id(d => (d as any).id)
                .distance(d => 30 + 30 * (1 - (d as any).fitness))
                .strength(0.1)
            )
            .force("charge", d3.forceManyBody().strength(-100))
            .force("x", d3.forceX())
            .force("y", d3.forceY());

        // Create links
        const link = g.append("g")
            .selectAll("line")
            .data(links)
            .join("line")
            .attr("stroke", "#999")
            .attr("stroke-opacity", 0.3)
            .attr("stroke-width", d => 0.5 + 1 * d.fitness);

        // Create nodes
        const node = g.append("g")
            .selectAll("circle")
            .data(nodes)
            .join("circle")
            .attr("r", 5)
            .attr("fill", "black")
            .attr("stroke", "#fff")
            .attr("stroke-width", 1.5);

        // Add titles
        node.append("title")
            .text(d => d.id);

        // Set up simulation tick
        simulation.on("tick", () => {
            link
                .attr("x1", d => (d.source as any).x)
                .attr("y1", d => (d.source as any).y)
                .attr("x2", d => (d.target as any).x)
                .attr("y2", d => (d.target as any).y);

            node
                .attr("cx", d => (d as any).x)
                .attr("cy", d => (d as any).y);
        });

        // Cleanup
        return () => {
            simulation.stop();
        };
    }, [data]);

    return (
        <div>
            <h1>Keywords Connected By Job</h1>
            <svg ref={svgRef}></svg>
        </div>
    );
}