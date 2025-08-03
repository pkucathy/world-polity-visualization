// js/scene2.js

function renderScene2() {
  d3.select("#scene1").style("display", "none");
  d3.select("#scene1-next-button").style("display", "none");
  d3.select("#scene3").style("display", "none");
  d3.select("#scene2").style("display", "block").html("");  // clear everything

  const margin = { top: 60, right: 40, bottom: 60, left: 70 };
  const width = 1000 - margin.left - margin.right;
  const height = 600 - margin.top - margin.bottom;

  const svg = d3.select("#scene2")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Tooltip
  const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0); 

  d3.csv("data/democracies_summary.csv").then(data => {
    data.forEach(d => {
      d.mean_score = +d.mean_score;
      d.std_dev = +d.std_dev;
      d.democracy_1990 = +d.high_in_1990 === 1; 
    });

    const x = d3.scaleLinear()
      .domain([d3.min(data, d => d.mean_score) - 1, d3.max(data, d => d.mean_score) + 1])
      .range([0, width]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.std_dev) + 0.5])
      .range([height, 0]);

    // Shaded zones
    svg.append("rect")
      .attr("x", x(-10))
      .attr("y", 0)
      .attr("width", x(-6) - x(-10))
      .attr("height", height)
      .attr("fill", "#fdd")
      .lower();

    svg.append("rect")
      .attr("x", x(-6))
      .attr("y", 0)
      .attr("width", x(6) - x(-6))
      .attr("height", height)
      .attr("fill", "#ffd")
      .lower();

    // Axes
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x));

    svg.append("g")
      .call(d3.axisLeft(y));

    // Axis labels
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", height + 40)
      .attr("text-anchor", "middle")
      .text("Mean Democracy Score (1990–2018)");

    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", -50)
      .attr("text-anchor", "middle")
      .text("Standard Deviation (Volatility)");

    // Reference lines
    svg.append("line")
      .attr("x1", x(-6))
      .attr("x2", x(-6))
      .attr("y1", 0)
      .attr("y2", height)
      .attr("stroke", "gray")
      .attr("stroke-dasharray", "4");

    svg.append("line")
      .attr("x1", x(6))
      .attr("x2", x(6))
      .attr("y1", 0)
      .attr("y2", height)
      .attr("stroke", "gray")
      .attr("stroke-dasharray", "4");
    
    svg.append("rect")
      .attr("x", x(10) - 6)
      .attr("y", y(0) - 8)
      .attr("width", 15)
      .attr("height", 15)
      .attr("fill", "green")
      .attr("stroke", "black")
      .attr("stroke-width", 2)
      .on("mouseover", function(event) {
        tooltip.transition()
          .duration(200)
          .style("opacity", 0.9);
          tooltip.html(
            "<b>24 democracies: </b>Australia, Austria, Canada,<br/>" +
            "Costa Rica, Cyprus, Denmark, Finland, France,<br/>" +
            "Germany, Greece, Hungary, Ireland, Italy, Japan,<br/>" +
            "Luxembourg, Mauritius, Netherlands, New Zealand,<br/>" +
            "Norway, Portugal, Spain, Sweden, Switzerland, Uruguay <br/>" + 
            "<b>Mean: 10 </b><br/>" +
            "<b>SD: 0 </b><br/>" 
          )
          .style("left", (event.pageX + 40) + "px")
          .style("top", (event.pageY - 140) + "px");
      })
      .on("mouseout", function() {
        tooltip.transition()
          .duration(500)
          .style("opacity", 0);
      });


    // Points
    // Democratic before 1990: green squares
    svg.selectAll(".square-point")
      .data(data.filter(d => d.democracy_1990 && !(d.mean_score === 10 && d.std_dev === 0)))
      .enter()
      .append("rect")
      .attr("class", "square-point")
      .attr("x", d => x(d.mean_score) - 4)
      .attr("y", d => y(d.std_dev) - 4)
      .attr("width", 9)
      .attr("height", 9)
      .attr("fill", "green")
      .attr("opacity", 0.8)
      .on("mouseover", (event, d) => {
        tooltip.transition().duration(200).style("opacity", 0.9);
        tooltip.html(`<strong>${d.country}</strong><br/>Mean: ${d.mean_score.toFixed(2)}<br/>SD: ${d.std_dev.toFixed(2)}`)
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY - 28}px`);
      })
      .on("mouseout", () => tooltip.transition().duration(500).style("opacity", 0));

    // Not democratic in 1990: blue circles
    svg.selectAll(".circle-point")
      .data(data.filter(d => !d.democracy_1990))
      .enter()
      .append("circle")
      .attr("class", "circle-point")
      .attr("cx", d => x(d.mean_score))
      .attr("cy", d => y(d.std_dev))
      .attr("r", 4.5)
      .attr("fill", "#708090")
      .attr("opacity", 0.8)
      .on("mouseover", (event, d) => {
        tooltip.transition().duration(200).style("opacity", 0.9);
        tooltip.html(`<strong>${d.country}</strong><br/>Mean: ${d.mean_score.toFixed(2)}<br/>SD: ${d.std_dev.toFixed(2)}`)
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY - 28}px`);
      })
      .on("mouseout", () => tooltip.transition().duration(500).style("opacity", 0));
    

    // Annotation: Post-Cold War Democratizers (split into two lines, placed higher)
    svg.append("text")
      .attr("x", x(-4))            // center of post-Cold War cluster
      .attr("y", y(6))          // higher y-axis position
      .attr("text-anchor", "start")
      .attr("fill", "#aa7700")
      .style("font-weight", "bold")
      .style("font-size", "13px")
      .text("Post-Cold War democratizers");

    svg.append("text")
      .attr("x", x(-4))
      .attr("y", y(6) + 16)     
      .attr("text-anchor", "start")
      .attr("fill", "#aa7700")
      .style("font-weight", "bold")
      .style("font-size", "13px")
      .text("are more volatile.");

    // Annotation: Early Democracies (split into two lines, above tooltip box)
    svg.append("text")
      .attr("x", x(10) - 150)          
      .attr("y", y(0) + 35)          
      .attr("text-anchor", "start")
      .attr("fill", "green")
      .style("font-weight", "bold")
      .style("font-size", "13px")
      .text("Early democracies (score ≥ 6 ");

    svg.append("text")
      .attr("x", x(10) - 150)
      .attr("y", y(0) + 50)
      .attr("text-anchor", "start")
      .attr("fill", "green")
      .style("font-weight", "bold")
      .style("font-size", "13px")
      .text("before 1990) tend to be stable.");

    // Legend
const legend = svg.append("g")
.attr("transform", `translate(${width - 180}, 10)`);  

// Green square = Democratic before 1990
legend.append("rect")
.attr("x", 0)
.attr("y", 0)
.attr("width", 10)
.attr("height", 10)
.attr("fill", "green");

legend.append("text")
.attr("x", 15)
.attr("y", 9)
.text("Democracies before 1990")
.style("font-size", "12px")
.attr("alignment-baseline", "middle");

// Blue circle = Not democratic in 1990
legend.append("circle")
.attr("cx", 5)
.attr("cy", 25)
.attr("r", 5)
.attr("fill", "#708090");

legend.append("text")
.attr("x", 15)
.attr("y", 28)
.text("Non-democracies before 1990")
.style("font-size", "12px")
.attr("alignment-baseline", "middle");

    // Labels for zones
    svg.append("text")
      .attr("x", (x(-6) + x(-10)) / 2)
      .attr("y", 20)
      .attr("fill", "#900")
      .attr("text-anchor", "middle")
      .text("Stable Autocracies");

    svg.append("text")
      .attr("x", (x(-6) + x(6)) / 2)
      .attr("y", 20)
      .attr("fill", "#aa7700")
      .attr("text-anchor", "middle")
      .text("Post-Cold War Democratizers");
  });

// Remove any existing buttons
d3.select("#scene2").selectAll(".nav-button").remove();

// Create a wrapper div for positioning
const navDiv = d3.select("#scene2")
  .append("div")
  .attr("class", "nav-button-container");

// Back to Scene 1
navDiv.append("button")
  .attr("class", "nav-button")
  .text("Back to Global View")
  .on("click", () => {
    d3.select("#scene2").style("display", "none");
    d3.select("#scene1").style("display", "block");
    d3.select("#scene1-next-button").style("display", "block");

    //renderScene1();
  });

// Next to Scene 3
navDiv.append("button")
  .attr("class", "nav-button")
  .style("margin-left", "20px")
  .text("Next: Country-Level Summary")
  .on("click", () => {
    d3.select("#scene2").style("display", "none");
    d3.select("#scene3").style("display", "block");
    renderScene3();
  });

}
