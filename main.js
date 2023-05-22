// set the dimensions and margins of the graph
const margin = { top: 30, right: 50, bottom: 10, left: 50 },
  width = 1600 - margin.left - margin.right,
  height = 900 - margin.top - margin.bottom;

// append the svg object to the body of the page
const svg = d3
  .select("#frame")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);
fetch("football.json").then((data) => {
  data.json().then((json_data) => {
    data = [];
    json_data.nodes.forEach((element) => {
      if (element.appearance) {
        data.push({
          label: element.label,
          appearance: element.appearance,
          mins_played: element.mins_played,
        });
      }
    });
    var keys = [];
    console.table(data);
    for (var i = 0; i < data.length; i++) {
      Object.keys(data[i]).forEach(function (key) {
        if (keys.indexOf(key) == -1) {
          if (key !== "id" && key !== "label") {
            keys.push(key);
          }
        }
      });
    }
    // console.log("keys", keys);
    // Color scale: give me a specie name, I return a color
    // const color = d3
    //   .scaleOrdinal()
    //   .domain(["setosa", "versicolor", "virginica"])
    //   .range(["#440154ff", "#21908dff", "#fde725ff"]);

    // Here I set the list of dimension manually to control the order of axis:
    dimensions = keys;

    // For each dimension, I build a linear scale. I store all in a y object
    const y = {};
    for (i in dimensions) {
      name = dimensions[i];
      y[name] = d3
        .scaleLinear()
        // .domain([0, 8]) // --> Same axis range for each group
        .domain([
          d3.extent(data, function (d) {
            return +d[name];
          }),
        ])
        .range([height, 0]);
    }

    // Build the X scale -> it find the best position for each Y axis
    x = d3.scalePoint().range([0, width]).domain(dimensions);

    // Highlight the specie that is hovered
    const highlight = function (event, d) {
      selected_specie = d.Species;

      // first every group turns grey
      d3.selectAll(".line")
        .transition()
        .duration(200)
        .style("stroke", "lightgrey")
        .style("opacity", "0.2");
      // Second the hovered specie takes its color
      d3.selectAll("." + selected_specie)
        .transition()
        .duration(200)
        .style("stroke", color(selected_specie))
        .style("opacity", "1");
    };

    // Unhighlight
    // const doNotHighlight = function (event, d) {
    //   d3.selectAll(".line")
    //     .transition()
    //     .duration(200)
    //     .delay(1000)
    //     .style("stroke", function (d) {
    //       return color(d.Species);
    //     })
    //     .style("opacity", "1");
    // };

    // The path function take a row of the csv as input, and return x and y coordinates of the line to draw for this raw.
    function path(d) {
      return d3.line()(
        dimensions.map(function (p) {
          console.log(d[p]);
          return [x(p), y[p](d[p])];
        })
      );
    }

    // Draw the lines
    svg
      .selectAll("myPath")
      .data(data)
      .join("path")
      .attr("class", function (d) {
        return "line " + d.Species;
      }) // 2 class for each line: 'line' and the group name
      .attr("d", path)
      .style("fill", "none")
      // .style("stroke", function (d) {
      //   return color(d.Species);
      // })
      .style("opacity", 0.5);
    // .on("mouseover", highlight)
    // .on("mouseleave", doNotHighlight);

    // Draw the axis:
    svg
      .selectAll("myAxis")
      // For each dimension of the dataset I add a 'g' element:
      .data(dimensions)
      .enter()
      .append("g")
      .attr("class", "axis")
      // I translate this element to its right position on the x axis
      .attr("transform", function (d) {
        return `translate(${x(d)})`;
      })
      // And I build the axis with the call function
      .each(function (d) {
        d3.select(this).call(d3.axisLeft().ticks(5).scale(y[d]));
      })
      // Add axis title
      .append("text")
      .style("text-anchor", "middle")
      .attr("y", -9)
      .text(function (d) {
        return d;
      })
      .style("fill", "black");
  });
});
// Parse the Data
// d3.csv(
//   "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/iris.csv"
// ).then(function (data) {
//   // Color scale: give me a specie name, I return a color
//   const color = d3
//     .scaleOrdinal()
//     .domain(["setosa", "versicolor", "virginica"])
//     .range(["#440154ff", "#21908dff", "#fde725ff"]);

//   // Here I set the list of dimension manually to control the order of axis:
//   dimensions = ["Petal_Length", "Petal_Width", "Sepal_Length", "Sepal_Width"];

//   // For each dimension, I build a linear scale. I store all in a y object
//   const y = {};
//   for (i in dimensions) {
//     name = dimensions[i];
//     y[name] = d3
//       .scaleLinear()
//       .domain([0, 8]) // --> Same axis range for each group
//       // --> different axis range for each group --> .domain( [d3.extent(data, function(d) { return +d[name]; })] )
//       .range([height, 0]);
//   }

//   // Build the X scale -> it find the best position for each Y axis
//   x = d3.scalePoint().range([0, width]).domain(dimensions);

//   // Highlight the specie that is hovered
//   const highlight = function (event, d) {
//     selected_specie = d.Species;

//     // first every group turns grey
//     d3.selectAll(".line")
//       .transition()
//       .duration(200)
//       .style("stroke", "lightgrey")
//       .style("opacity", "0.2");
//     // Second the hovered specie takes its color
//     d3.selectAll("." + selected_specie)
//       .transition()
//       .duration(200)
//       .style("stroke", color(selected_specie))
//       .style("opacity", "1");
//   };

//   // Unhighlight
//   const doNotHighlight = function (event, d) {
//     d3.selectAll(".line")
//       .transition()
//       .duration(200)
//       .delay(1000)
//       .style("stroke", function (d) {
//         return color(d.Species);
//       })
//       .style("opacity", "1");
//   };

//   // The path function take a row of the csv as input, and return x and y coordinates of the line to draw for this raw.
//   function path(d) {
//     return d3.line()(
//       dimensions.map(function (p) {
//         return [x(p), y[p](d[p])];
//       })
//     );
//   }

//   // Draw the lines
//   svg
//     .selectAll("myPath")
//     .data(data)
//     .join("path")
//     .attr("class", function (d) {
//       return "line " + d.Species;
//     }) // 2 class for each line: 'line' and the group name
//     .attr("d", path)
//     .style("fill", "none")
//     .style("stroke", function (d) {
//       return color(d.Species);
//     })
//     .style("opacity", 0.5)
//     .on("mouseover", highlight)
//     .on("mouseleave", doNotHighlight);

//   // Draw the axis:
//   svg
//     .selectAll("myAxis")
//     // For each dimension of the dataset I add a 'g' element:
//     .data(dimensions)
//     .enter()
//     .append("g")
//     .attr("class", "axis")
//     // I translate this element to its right position on the x axis
//     .attr("transform", function (d) {
//       return `translate(${x(d)})`;
//     })
//     // And I build the axis with the call function
//     .each(function (d) {
//       d3.select(this).call(d3.axisLeft().ticks(5).scale(y[d]));
//     })
//     // Add axis title
//     .append("text")
//     .style("text-anchor", "middle")
//     .attr("y", -9)
//     .text(function (d) {
//       return d;
//     })
//     .style("fill", "black");
// });
