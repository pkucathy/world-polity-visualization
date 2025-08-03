// js/main.js

function renderScene1() {
  d3.select("#scene1").style("display", "block");
  d3.select("#scene2").style("display", "none");

  // Define dimensions for SVG container
  const width = 1000;
  const height = 650;

  // Select map SVG and its dimensions
  const svg = d3.select("#map")
    .attr("width", width)
    .attr("height", height);

  // Create a tooltip for displaying country information
  const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

  // Define geographic projection and path generator.
  // geoNaturalEarth1 provides a nice, non-distorted view of the world.
  // Increase scale to make the map larger.
  const projection = d3.geoNaturalEarth1().scale(200).translate([width / 2, height / 2]);
  const path = d3.geoPath().projection(projection);

  // Color scale for democracy scores (threshold)
  // Color: a spectrum from autocratic (red) to democratic (blue).
  const colorScale = d3.scaleThreshold()
    .domain([-9, -7, -5, -3, -1, 1, 3, 5, 7, 9])
    .range([
      "#67000d", // <= -9
      "#a50f15", // -9 to -7
      "#cb181d", // -7 to -5
      "#ef3b2c", // -5 to -3
      "#fb6a4a", // -3 to -1
      "#fcae91", // -1 to 1
      "#c6dbef", // 1 to 3
      "#9ecae1", // 3 to 5
      "#6baed6", // 5 to 7
      "#3182bd", // 7 to 9
      "#08519c"  // >= 9
    ]);

  // Define the annotations for each year, with titles in bold
  const annotationsByYear = {
    "1990": "<b>A Bipolar World:</b> In the final stages of the Cold War, the world is clearly divided. North America, Western Europe, and Australia are strong democracies, while vast swaths of Eastern Europe, the Soviet Union, Africa, and Asia are deeply autocratic.",
    "2000": "<b>The Dawn of a Democratic Era:</b> A decade after the Soviet Union's collapse, democracy has spread eastward. Many nations in Eastern Europe and former Soviet Republics have transitioned to more democratic systems. This trend is also visible in parts of South America and Africa.",
    "2010": "<b>Consolidation and Stagnation</b>: The democratic trend continues in South America and parts of Europe, with many nations solidifying their scores. However, the Arab world and much of Asia remain autocratic.",
    "2018": "<b>Global Stresses</b>: The past decade has seen a leveling off and even a slight decline in democratic scores for some established nations, including the United States and the United Kingdom. "
  };

  let year = "2000"; // Initial year

  // Load GeoJSON and CSV data simultaneously
  Promise.all([
    d3.json("data/world-110m.json"),
    d3.csv("data/polity_filtered_final.csv", d => {
      // Convert the relevant columns to numbers.
      const score = +d.democracy;
      const yr = +d.year;
      // Return only the data points for the years selected
      if (yr === 1990 || yr === 2000 || yr === 2010 || yr === 2018) {
        return {
          country: d.country,
          id: +d.numeric,
          year: yr,
          democracy: score
        };
      }
    })
  ]).then(([world, polityData]) => {
    // Draw the map
    
    // Convert TopoJSON to GeoJSON.
    const countries = topojson.feature(world, world.objects.countries);

    // Function: updating the map based on the selected year
    function updateMap(selectedYear) {
      // Filter the polity data for the selected year
      const polityFiltered = polityData.filter(d => d.year === +selectedYear);

      // Create a map from country ID to democracy score
      const polityMap = new Map(polityFiltered.map(d => [d.id, d.democracy]));
      
      // Update the annotation box accordingly
      const annotationText = annotationsByYear[selectedYear];
      d3.select("#annotation-box").html(annotationText);
      
      // Select all countries and bind GeoJSON data
      svg.selectAll(".country")
    .data(countries.features)
    .join(
      enter => enter.append("path")
        .attr("class", "country")
        .attr("d", path),
      update => update,
      exit => exit.remove()
    )
    .on("mouseover", function (event, d) {
      const score = polityMap.get(+d.id);
      const countryName = d.properties.name;
      tooltip.transition()
        .duration(200)
        .style("opacity", .9);
      tooltip.html(`<b>${countryName}</b><br/>Democracy Score: ${score !== undefined ? score : "N/A"}`)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", function () {
      tooltip.transition()
        .duration(500)
        .style("opacity", 0);
    })
    .transition()
    .duration(750)
    .attr("fill", d => {
      const score = polityMap.get(+d.id);
      return score !== undefined ? colorScale(score) : "#ccc";
    })
    .attr("stroke", "#999")
    .attr("stroke-width", 0.5);
    }

    // Select specific years for the slider
    const validYears = [1990, 2000, 2010, 2018];
    
    // Input event on the year slider
    d3.select("#year-slider").on("input", function () {
      const sliderValue = +this.value;
      // Find the closest valid year to the slider's current value
      const closestYear = validYears.reduce((prev, curr) => 
        (Math.abs(curr - sliderValue) < Math.abs(prev - sliderValue) ? curr : prev));
      
      // Update the slider's value to snap to the closest valid year
      this.value = closestYear;

      // Update the year display text (removed to save space)
      // d3.select("#year-display").text(closestYear)
      
      // Update the map with the new year
      year = closestYear;
      updateMap(year);
    });
    
    // Handle clicks on the tick marks
    d3.selectAll(".tick").on("click", function() {
      const clickedYear = d3.select(this).attr("data-year");
      d3.select("#year-slider").property("value", clickedYear);
      // d3.select("#year-display").text(clickedYear);
      updateMap(clickedYear);
    });

    // Initial call to draw the map with the default year
    updateMap(year);

    // ---------------- LEGEND ----------------
    // Specify the legend layout
    const legendWidth = 500; 
    const legendBlockHeight = 15;
    const legendTitlePadding = 20;
    const legendBlocksPadding = 5;
    const legendAxisPadding = 5;

    // Specify color values and labels
    const legendColorValues = colorScale.range();
    const blockWidth = legendWidth / legendColorValues.length;
    
    // Create a legend group
    const legendGroup = svg.append("g")
      .attr("transform", `translate(${width / 2 - legendWidth / 2}, ${height - 60})`);

    // Add the legend title
    legendGroup.append("text")
      .attr("x", legendWidth / 2)
      .attr("y", 0)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .style("font-weight", "bold")
      .text("Polity Score");
    
    const colorBlocksY = legendTitlePadding + legendBlocksPadding;

    // Create the color blocks
    legendColorValues.forEach((color, i) => {
      legendGroup.append("rect")
        .attr("x", i * blockWidth)
        .attr("y", colorBlocksY)
        .attr("width", blockWidth)
        .attr("height", legendBlockHeight)
        .attr("fill", color);
    });

    // Create a linear scale for the legend axis
    const legendScale = d3.scaleLinear()
      .domain(d3.extent(colorScale.domain().concat([-10, 10])))
      .range([0, legendWidth]);

    const axisY = colorBlocksY + legendBlockHeight + legendAxisPadding;

    // Create the legend axis and append it to the legend group
    const legendAxis = d3.axisBottom(legendScale)
      .tickValues(colorScale.domain().concat([-10, 10]))
      .tickFormat(d3.format("d"))
      .tickSizeOuter(0);

    legendGroup.append("g")
      .attr("class", "legend-axis")
      .attr("transform", `translate(0, ${axisY})`)
      .call(legendAxis);

    // Add "Autocratic" to the left of the color scale
    legendGroup.append("text")
      .attr("x", -5)
      .attr("y", colorBlocksY + legendBlockHeight / 2)
      .attr("text-anchor", "end")
      .attr("dominant-baseline", "middle")
      .style("font-size", "12px")
      .text("Autocratic");

    // Add "Democratic" to the right of the color scale
    legendGroup.append("text")
      .attr("x", legendWidth + 5)
      .attr("y", colorBlocksY + legendBlockHeight / 2)
      .attr("text-anchor", "start")
      .attr("dominant-baseline", "middle")
      .style("font-size", "12px")
      .text("Democratic");

  });
}

document.addEventListener("DOMContentLoaded", function () {
  renderScene1();
});
