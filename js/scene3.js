function renderScene3() {
  const container = d3.select("#scene3")
    .style("padding", "40px")
    .style("position", "relative"); // To anchor nav buttons at bottom

  container.html(""); // Clear anything previously rendered

  const headerDiv = container.append("div")
  .style("text-align", "center")
  .style("margin-bottom", "10px");

headerDiv.append("h2")
  .text("Summary Insights")
  .style("margin-bottom", "8px");

headerDiv.append("ul")
  .style("list-style-type", "disc")
  .style("display", "inline-block")
  .style("text-align", "left")
  .style("margin", "0 auto")
  .selectAll("li")
  .data([
    "Early democracies (score ≥ 6 before 1990) tend to have high stability.",
    "Post-Cold War democratizers show greater volatility.",
    "Countries with lower mean scores often have more variation over time."
  ])
  .enter()
  .append("li")
  .text(d => d);


  // Table container and toggle
  // === Side-by-side layout for table and chart ===
  const sideBySideWrapper = container.append("div")
    .style("display", "flex")
    .style("gap", "60px")
    .style("align-items", "flex-start")
    .style("margin-top", "20px");

  // Chart container (left)
const chartDiv = sideBySideWrapper.append("div")
.attr("id", "summary-bar-chart")
.style("margin-top", "10px")
.style("flex", "1");

// Table container (right)
const tableSection = sideBySideWrapper.append("div")
.style("flex", "1");

  // Filter dropdown inside the table section (right side)
  const filterDiv = tableSection.append("div")
    .style("margin-bottom", "10px")
    .style("display", "flex")
    .style("justify-content", "flex-end")
    .style("max-width", "550px"); 

  filterDiv.append("label")
    .text("Filter: ")
    .style("font-weight", "bold")
    .style("margin-right", "10px");

  const select = filterDiv.append("select");

  select.selectAll("option")
  .data(["All", "Democracies before 1990", "Non-democracies before 1990"])
  .enter()
  .append("option")
  .text(d => d);

const tableDiv = tableSection.append("div").attr("id", "summary-table");

  const toggleButton = tableSection.append("button")
    .text("Show Full Table")
    .style("margin-top", "15px")
    .style("display", "block");

  const note = tableSection.append("p")
    .attr("id", "table-note")
    .style("font-size", "12px")
    .style("color", "gray")
    .style("margin-top", "8px")
    .text("Showing first 15 rows. Click the button above to view the full table.");




  let fullTableVisible = false;
  let fullData = [];

  d3.csv("data/democracies_summary.csv").then(data => {
    fullData = data;
    updateTable("All", fullTableVisible);

    select.on("change", function() {
      updateTable(this.value, fullTableVisible);
    });

    toggleButton.on("click", () => {
      fullTableVisible = !fullTableVisible;
      toggleButton.text(fullTableVisible ? "Collapse Table" : "Show Full Table");
      updateTable(select.property("value"), fullTableVisible);
    });

    // Prepare the data groups
  const all = fullData;
  const demo1990 = fullData.filter(d => +d.high_in_1990 === 1);
  const nonDemo1990 = fullData.filter(d => +d.high_in_1990 === 0);

  const groups = [
    {
      label: "All Countries",
      mean: d3.mean(all, d => +d.mean_score),
      std: d3.mean(all, d => +d.std_dev)
    },
    {
      label: "Democracies before 1990",
      mean: d3.mean(demo1990, d => +d.mean_score),
      std: d3.mean(demo1990, d => +d.std_dev)
    },
    {
      label: "Non-democracies before 1990",
      mean: d3.mean(nonDemo1990, d => +d.mean_score),
      std: d3.mean(nonDemo1990, d => +d.std_dev)
    }
  ];



  const width = 700;
  const height = 300;
  const margin = { top: 50, right: 40, bottom: 50, left: 210 };

  const svg = chartDiv.append("svg")
    .attr("width", width)
    .attr("height", height);

  const x = d3.scaleLinear()
    .domain([0, d3.max(groups, d => Math.max(d.mean, d.std)) + 1])
    .range([margin.left, width - margin.right]);

  const y = d3.scaleBand()
    .domain(groups.map(d => d.label))
    .range([margin.top, height - margin.bottom])
    .padding(0.3);

  svg.append("g")
    .attr("transform", `translate(0, ${height - margin.bottom})`)
    .call(d3.axisBottom(x).ticks(5));

  svg.append("g")
    .attr("transform", `translate(${margin.left}, 0)`)
    .call(d3.axisLeft(y));

  // Bars for Mean Scores
  svg.selectAll(".bar-mean")
    .data(groups)
    .enter()
    .append("rect")
    .attr("class", "bar-mean")
    .attr("x", x(0))
    .attr("y", d => y(d.label))
    .attr("height", y.bandwidth() / 2)
    .attr("width", d => x(d.mean) - x(0))
    .attr("fill", "#1f77b4");

  // Bars for Std Dev
  svg.selectAll(".bar-std")
    .data(groups)
    .enter()
    .append("rect")
    .attr("class", "bar-std")
    .attr("x", x(0))
    .attr("y", d => y(d.label) + y.bandwidth() / 2)
    .attr("height", y.bandwidth() / 2)
    .attr("width", d => x(d.std) - x(0))
    .attr("fill", "#ff7f0e");

  // Add value labels for Mean Scores
  svg.selectAll(".label-mean")
    .data(groups)
    .enter()
    .append("text")
    .attr("class", "label-mean")
    .attr("x", d => x(d.mean) + 5)
    .attr("y", d => y(d.label) + y.bandwidth() / 4)
    .attr("alignment-baseline", "middle")
    .style("font-size", "11px")
    .text(d => d.mean.toFixed(2));

  // Add value labels for Std Dev
  svg.selectAll(".label-std")
    .data(groups)
    .enter()
    .append("text")
    .attr("class", "label-std")
    .attr("x", d => x(d.std) + 5)
    .attr("y", d => y(d.label) + (3 * y.bandwidth() / 4))
    .attr("alignment-baseline", "middle")
    .style("font-size", "11px")
    .text(d => d.std.toFixed(2));
  
  // Add a legend
const legend = svg.append("g")
.attr("transform", `translate(${width - 180}, ${margin.top})`);

legend.append("rect")
.attr("x", 0)
.attr("y", 0)
.attr("width", 12)
.attr("height", 12)
.attr("fill", "#1f77b4");

legend.append("text")
.attr("x", 18)
.attr("y", 10)
.text("Mean Score")
.style("font-size", "12px");

legend.append("rect")
.attr("x", 0)
.attr("y", 20)
.attr("width", 12)
.attr("height", 12)
.attr("fill", "#ff7f0e");

legend.append("text")
.attr("x", 18)
.attr("y", 30)
.text("Standard Deviation")
.style("font-size", "12px");
    
  // Add title
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", 20)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("font-weight", "bold")
    .text("Group-Level Summary: Avg. Mean Score vs. Std Dev");

  

  });

  function updateTable(filterValue, showAll) {
    tableDiv.html("");

    let filteredData = fullData;
    if (filterValue !== "All") {
      filteredData = fullData.filter(d => {
        const label = +d.high_in_1990 === 1 ? "Democracies before 1990" : "Non-democracies before 1990";
        return label === filterValue;
      });
    }
    if (!showAll) {
      filteredData = filteredData.slice(0, 15);
    }

    const table = tableDiv.append("table")
      .style("border-collapse", "collapse")
      .style("margin-top", "10px");

    const headers = ["Country", "Mean Score", "Standard Deviation", "Democratic before 1990?"];
    table.append("thead")
      .append("tr")
      .selectAll("th")
      .data(headers)
      .enter()
      .append("th")
      .text(d => d)
      .style("text-align", "left")
      .style("padding-right", "25px");

    const rows = table.append("tbody")
      .selectAll("tr")
      .data(filteredData)
      .enter()
      .append("tr");

    rows.append("td").text(d => d.country).style("text-align", "left").style("padding-right", "25px");
    rows.append("td").text(d => (+d.mean_score).toFixed(2)).style("text-align", "left").style("padding-right", "25px");
    rows.append("td").text(d => (+d.std_dev).toFixed(2)).style("text-align", "left").style("padding-right", "25px");
    rows.append("td").text(d => +d.high_in_1990 === 1 ? "Yes" : "No").style("text-align", "left").style("padding-right", "25px");

    d3.select("#table-note")
      .style("display", showAll ? "none" : "block");
  }

  



  // === Navigation Buttons (bottom left) ===
  d3.select("#scene3").selectAll(".nav-button").remove();  // Clear any pre-existing buttons

  const navDiv = d3.select("#scene3")
    .append("div")
    .attr("id", "scene3-buttons")
    .attr("class", "nav-button-container");

  navDiv.append("button")
    .attr("class", "nav-button")
    .text("Back to Global View")
    .on("click", () => {
      d3.select("#scene3").style("display", "none");
      d3.select("#scene1").style("display", "block");
      d3.select("#scene1-next-button").style("display", "block");
    });

  navDiv.append("button")
    .attr("class", "nav-button")
    .style("margin-left", "20px")
    .text("Back to Regime Stability Pattern")
    .on("click", () => {
      d3.select("#scene3").style("display", "none");
      d3.select("#scene2").style("display", "block");
      renderScene2();
    });

}