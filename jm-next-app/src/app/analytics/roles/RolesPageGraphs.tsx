"use client"
import { useEffect, useRef, useState } from 'react';
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
    selectedRole: string;
    selectedSubcategory: string;
    totalJobs: number;
}

// Define the type for the data structure
interface BarData {
    data: {
        category: string;
    };
    [key: number]: number;
}

export function SalaryDistributionGraph({ minSalaries, maxSalaries, selectedRole, selectedSubcategory, totalJobs }: SalaryDistributionProps) {
    const scrollableRef = useRef<SVGSVGElement>(null);
    const fixedRef = useRef<SVGSVGElement>(null);
    const [containerWidth, setContainerWidth] = useState<number>(600);
    const containerDivRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function updateWidth() {
            if (containerDivRef.current) {
                setContainerWidth(containerDivRef.current.offsetWidth);
            }
        }
        updateWidth();
        window.addEventListener('resize', updateWidth);
        return () => window.removeEventListener('resize', updateWidth);
    }, []);

    useEffect(() => {
        // console.log('Data updated:', { minSalaries, maxSalaries, selectedRole, selectedSubcategory, totalJobs });
        if (!scrollableRef.current || !fixedRef.current || !minSalaries || !maxSalaries) {
            // console.log('Missing required data or refs');
            return;
        }

        // Clear previous content
        d3.select(scrollableRef.current).selectAll("*").remove();
        d3.select(fixedRef.current).selectAll("*").remove();

        // Chart dimensions and margins
        const width = containerWidth;
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

        // Calculate the available width for bars
        const availableWidth = actualWidth - marginLeft - marginRight;

        // Create scales
        const x = d3.scaleBand()
            .domain(stackedData.map(d => d.category))
            .range([marginLeft, actualWidth - marginRight])
            .paddingInner(0.1)
            .paddingOuter(0.05);

        const y = d3.scaleLinear()
            .domain([0, d3.max(stackedData, d => d.min + d.max) || 0]).nice()
            .range([height - marginBottom, marginTop]);

        // Create gradient for bars
        const scrollableSvg = d3.select(scrollableRef.current)
            .attr("viewBox", [0, 0, width, height])
            .attr("width", width)
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
            .on("mouseenter", function(event, d: BarData) {
                const percentage = ((d[1] - d[0]) / totalJobs * 100).toFixed(1);
                const parentNode = (this as SVGGElement).parentNode as SVGGElement | null;
                if (parentNode) {
                    const parentData = d3.select<SVGGElement, any>(parentNode).datum();
                    const currentIndex = boundaries.indexOf(+d.data.category);
                    const nextCategory = boundaries[currentIndex + 1] || "1Mil";
                    tooltip
                        .html(parentData.key === "min" 
                            ? `${percentage}% of ${selectedRole} jobs in ${selectedSubcategory} have Minimum salary of $${(+d.data.category / 1000).toFixed(0)}k - $${(typeof nextCategory === 'number' ? nextCategory / 1000 : nextCategory)}k`
                            : `${percentage}% of ${selectedRole} jobs in ${selectedSubcategory} have Maximum salary of $${(+d.data.category / 1000).toFixed(0)}k - $${(typeof nextCategory === 'number' ? nextCategory / 1000 : nextCategory)}k`)
                        .style("opacity", 1)
                        .style("left", (event.pageX + 15) + "px")
                        .style("top", (event.pageY - 20) + "px");
                }

                // Enlarge the bar
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr("x", (x(d.data.category) || 0) - 5)
                    .attr("width", x.bandwidth() + 10)
                    .attr("y", y(d[1]) - 5)
                    .attr("height", y(d[0]) - y(d[1]) + 10);
            })
            .on("mousemove", function(event) {
                tooltip
                    .style("left", (event.pageX + 15) + "px")
                    .style("top", (event.pageY - 20) + "px");
            })
            .on("mouseleave", function(event, d: BarData) {
                tooltip.style("opacity", 0);

                // Reset the bar size
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr("x", x(d.data.category) || 0)
                    .attr("width", x.bandwidth())
                    .attr("y", y(d[1]))
                    .attr("height", y(d[0]) - y(d[1]));
            })
            .transition()
            .duration(750)
            .attr("y", d => y(d[1]))
            .attr("height", d => y(d[0]) - y(d[1]));

        // Define the boundaries
        const boundaries = [0, 50000, 70000, 90000, 110000, 130000, 150000, 180000, 200000, 220000, 240000, 260000, 280000, 300000, 400000, 500000, 600000, 700000, 800000, 900000, 1000000];

        // Add x-axis with formatted labels
        scrollableSvg.append("g")
            .attr("transform", `translate(0,${height - marginBottom})`)
            .call(d3.axisBottom(x)
                .tickFormat((d, i) => {
                    const nextValue = boundaries[i + 1];
                    return `$${(+d / 1000).toFixed(0)}k - $${(typeof nextValue === 'number' ? nextValue / 1000 : nextValue)}k`;
                })
            )
            .selectAll("text")
            .style("font-size", "14px")
            .style("font-weight", "600")
            .attr("transform", "translate(-15,10)rotate(-45)")
            .style("text-anchor", "end")
            .style("dominant-baseline", "central");

        // Fixed overlay layer
        const fixedSvg = d3.select(fixedRef.current)
            .attr("viewBox", [0, 0, width, height])
            .attr("width", width)
            .attr("height", height)
            .attr("style", "pointer-events: none; position: absolute; top: 0; left: 0;");

        // Add gridlines
        fixedSvg.append("g")
            .attr("class", "grid")
            .attr("transform", `translate(${marginLeft},0)`)
            .call(d3.axisLeft(y)
                .tickSize(-width + marginLeft + marginRight)
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
        // fixedSvg.append("text")
        //     .attr("class", "x-label")
        //     .attr("text-anchor", "middle")
        //     .attr("x", marginLeft + (containerWidth - marginLeft - marginRight) / 2)
        //     .attr("y", height - 5)
        //     .style("fill", "black")
        //     .style("font-size", "24px")
        //     .text("Salary Range");

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
            .attr("transform", `translate(${width - 150}, 30)`);

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
    }, [minSalaries, maxSalaries, selectedRole, selectedSubcategory, totalJobs, containerWidth]);

    return (
        <div ref={containerDivRef} className="relative w-full overflow-x-auto">
            <svg ref={scrollableRef} className="w-full"></svg>
            <svg ref={fixedRef} className="absolute top-0 left-0 w-full pointer-events-none"></svg>
        </div>
    );
}

