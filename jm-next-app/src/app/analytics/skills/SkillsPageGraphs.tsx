"use client"
import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface SalaryDistributionProps {
    minSalaries: Array<{
        _id: string;
        count: number;
        examples: number[];
    }>;
    maxSalaries: Array<{
        _id: string;
        count: number;
        examples: number[];
    }>;
}

export function SalaryDistributionGraph({ minSalaries, maxSalaries }: SalaryDistributionProps) {
    const scrollableRef = useRef<SVGSVGElement>(null);
    const fixedRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (!scrollableRef.current || !fixedRef.current || !minSalaries || !maxSalaries) return;

        // Clear previous content
        d3.select(scrollableRef.current).selectAll("*").remove();
        d3.select(fixedRef.current).selectAll("*").remove();

        // Chart dimensions and margins
        const width = 600;
        const height = 600;
        const marginTop = 20;
        const marginRight = 20;
        const marginBottom = 100;
        const marginLeft = 60;

        // Prepare the data for stacking
        const stackedData = minSalaries.map((d, i) => ({
            category: d._id,
            min: d.count,
            max: maxSalaries[i]?.count || 0
        }));

        const totalBarsWidth = stackedData.length * 60;
        const actualWidth = Math.max(width, totalBarsWidth + marginLeft + marginRight);

        // Create scales
        const x = d3.scaleBand()
            .domain(stackedData.map(d => d.category))
            .range([marginLeft, actualWidth - marginRight])
            .padding(0.1);

        const y = d3.scaleLinear()
            .domain([0, d3.max(stackedData, d => d.min + d.max) || 0]).nice()
            .range([height - marginBottom, marginTop]);

        // Get the container width
        const container = d3.select(scrollableRef.current?.parentNode as HTMLElement)
            .style("position", "relative")
            .style("height", `${height}px`);
        const containerWidth = (container.node() as HTMLElement).clientWidth;

        // Create gradient for bars
        const scrollableSvg = d3.select(scrollableRef.current)
            .attr("viewBox", [0, 0, actualWidth, height])
            .attr("width", actualWidth)
            .attr("height", height)
            .attr("style", "max-width: none; height: auto;");

        // Add gradients
        const defs = scrollableSvg.append("defs");
        
        // Gradient for min salary bars
        const minGradient = defs.append("linearGradient")
            .attr("id", "minSalaryGradient")
            .attr("gradientTransform", "rotate(90)");

        minGradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", "#4FB3A3")
            .attr("stop-opacity", 1);

        minGradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", "#3D8D7A")
            .attr("stop-opacity", 1);

        // Gradient for max salary bars
        const maxGradient = defs.append("linearGradient")
            .attr("id", "maxSalaryGradient")
            .attr("gradientTransform", "rotate(90)");

        maxGradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", "#FF9B5E")
            .attr("stop-opacity", 1);

        maxGradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", "#E07C3E")
            .attr("stop-opacity", 1);

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
            .style("font-weight", "500")
            .style("min-width", "180px")
            .style("text-align", "center")
            .style("box-shadow", "0 4px 8px rgba(0,0,0,0.2)")
            .style("pointer-events", "none")
            .style("opacity", 0)
            .style("z-index", "100")
            .style("backdrop-filter", "blur(4px)");

        // Create and draw the stacked bars
        const stack = d3.stack<any>()
            .keys(["min", "max"])
            .order(d3.stackOrderNone)
            .offset(d3.stackOffsetNone);

        const series = stack(stackedData);

        // Draw bars with animations
        scrollableSvg.append("g")
            .selectAll("g")
            .data(series)
            .join("g")
            .attr("fill", (d, i) => i === 0 ? "url(#minSalaryGradient)" : "url(#maxSalaryGradient)")
            .selectAll("rect")
            .data(d => d)
            .join("rect")
            .attr("x", d => x(d.data.category) || 0)
            .attr("width", x.bandwidth())
            .attr("y", height - marginBottom)
            .attr("height", 0)
            .attr("rx", 6)
            .attr("ry", 6)
            .style("filter", "drop-shadow(0 2px 3px rgba(0,0,0,0.2))")
            .transition()
            .duration(1000)
            .ease(d3.easePoly)
            .attr("y", d => y(d[1]))
            .attr("height", d => y(d[0]) - y(d[1]));

        // Add x-axis with rotated labels
        scrollableSvg.append("g")
            .attr("transform", `translate(0,${height - marginBottom})`)
            .call(d3.axisBottom(x))
            .selectAll("text")
            .style("font-size", "12px")
            .attr("transform", "translate(-15,10)rotate(-45)")
            .style("text-anchor", "end")
            .style("dominant-baseline", "central");

        // Fixed overlay layer
        const fixedSvg = d3.select(fixedRef.current)
            .attr("viewBox", [0, 0, containerWidth, height])
            .attr("width", containerWidth)
            .attr("height", height)
            .attr("style", "pointer-events: none; position: absolute; top: 0; left: 0;");

        // Add gridlines
        fixedSvg.append("g")
            .attr("class", "grid")
            .attr("transform", `translate(${marginLeft},0)`)
            .call(d3.axisLeft(y)
                .tickSize(-containerWidth)
                .tickFormat(() => "")
            )
            .style("stroke-dasharray", "2,2")
            .style("stroke-opacity", 0.2)
            .call(g => g.select(".domain").remove());

        // Add y-axis
        fixedSvg.append("g")
            .attr("transform", `translate(${marginLeft},0)`)
            .call(d3.axisLeft(y))
            .call(g => g.select(".domain").remove())
            .selectAll("text")
            .style("fill", "black")
            .style("font-size", "12px");

        // Add axis labels
        fixedSvg.append("text")
            .attr("class", "x-label")
            .attr("text-anchor", "middle")
            .attr("x", marginLeft + (containerWidth - marginLeft - marginRight) / 2)
            .attr("y", height - 10)
            .style("fill", "black")
            .style("font-size", "24px")
            .text("Salary Range");

        fixedSvg.append("text")
            .attr("class", "y-label")
            .attr("text-anchor", "middle")
            .attr("transform", "rotate(-90)")
            .attr("x", -height / 2)
            .attr("y", 20)
            .style("fill", "black")
            .style("font-size", "24px")
            .text("Number of Jobs");

        // Add legend
        const legend = fixedSvg.append("g")
            .attr("transform", `translate(${containerWidth - 150}, 30)`);

        const legendItems = [
            { label: "Min Salary", color: "url(#minSalaryGradient)" },
            { label: "Max Salary", color: "url(#maxSalaryGradient)" }
        ];

        legend.selectAll("rect")
            .data(legendItems)
            .join("rect")
            .attr("x", 0)
            .attr("y", (d, i) => i * 25)
            .attr("width", 18)
            .attr("height", 18)
            .attr("fill", d => d.color);

        legend.selectAll("text")
            .data(legendItems)
            .join("text")
            .attr("x", 24)
            .attr("y", (d, i) => i * 25 + 14)
            .text(d => d.label)
            .style("font-size", "12px");

        // Cleanup
        return () => {
            tooltip.remove();
        };
    }, [minSalaries, maxSalaries]);

    return (
        <div style={{ position: "relative", height: "600px" }}>
            <div className="w-full overflow-x-auto overflow-y-hidden" style={{ scrollBehavior: 'smooth' }}>
                <svg ref={scrollableRef}></svg>
            </div>
            <svg ref={fixedRef} style={{ position: "absolute", top: 0, left: 0 }}></svg>
        </div>
    );
}

