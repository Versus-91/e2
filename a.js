// Sample data
const data = [
  { x: 1, y: 10, z: 100 },
  { x: 2, y: 20, z: 200 },
  { x: 3, y: 30, z: 300 },
  { x: 4, y: 40, z: 400 },
  { x: 5, y: 50, z: 500 }
];

// Create the parallel coordinate plot
const parallelCoordinate = d3
  .select("#frame")
  .append("svg")
  .attr("width", "100%")
  .attr("height", "100%");

// Define the brushing function
function brushed(ev) {
  const brushedIndexes = ev.event.selection.map((d) =>
    d3.bisectLeft(scaleY.range(), d)
  );

  parallelCoordinate
    .selectAll("path")
    .attr("class", (d, i) =>
      brushedIndexes[0] <= i && i <= brushedIndexes[1]
        ? "brushed"
        : "non-brushed"
    );
}

// Create the scales
const scaleX = d3.scalePoint().domain(Object.keys(data[0])).range([50, 450]);
const scaleY = d3.scaleLinear().domain([0, 500]).range([50, 350]);

// Create the axes
const axisX = d3.axisBottom(scaleX);
const axisY = d3.axisLeft(scaleY);

// Append the axes to the plot
parallelCoordinate
  .append("g")
  .attr("class", "axis-x")
  .attr("transform", "translate(0, 380)")
  .call(axisX);

parallelCoordinate
  .append("g")
  .attr("class", "axis-y")
  .attr("transform", "translate(40, 0)")
  .call(axisY);

// Create the lines
parallelCoordinate
  .selectAll("path")
  .data(data)
  .enter()
  .append("path")
  .attr("class", "brushed")
  .attr("d", (d) => {
    const keys = Object.keys(d);
    return `M${scaleX(keys[0])},${scaleY(d[keys[0]])}` +
           keys
             .slice(1)
             .map((key, i) => `L${scaleX(key)},${scaleY(d[key])}`)
             .join("");
  });

// Enable brushing
parallelCoordinate
  .append("g")
  .attr("class", "brush")
  .call(
    d3
      .brushY()
      .extent([
        [0, 50],
        [500, 350]
      ])
      .on("brush", brushed)
  );