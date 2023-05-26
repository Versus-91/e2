var d3; // Minor workaround to avoid error messages in editors

// Waiting until document has loaded
window.onload = () => {
  // Loading the dataset
  fetch("data/football.json")
    .then((response) => response.json())
    .then((json) => console.log(json));

  // YOUR CODE GOES HERE
  console.log("YOUR CODE GOES HERE");
  fetch("data/football.json")
    .then((response) => response.json())
    .then(function (data) {
      const defaultAttr = "mins_played";

      // initial arrays of attributes to display on axes of the PCP
      let attributes = [
        "appearance",
        "mins_played",
        "ball_recovery",
        "challenge_lost",
        "touches",
        "clearance_total",
        "pass_accurate",
        "pass_inaccurate",
        "yellow_card",
        "keeper_save_total",
      ];
      let allAttributes = getAttributes();
      let margin = { top: 30, right: 30, bottom: 30, left: 30 };
      let width = 1900;
      let height = 700;
      let brushWidth = 20;
      let keyz = defaultAttr;

      let selections = new Map();
      let dragging = {};

      const tickDistMap = getAttributeTickDistance();
      normalizeData();
      setupColorEncodingDropdown();
      setupAttributeSelectionDropdowns();
      let x_axis = buildXAxis();

      let y_axis = buildYAxis();

      let colors = d3.interpolateRdYlGn;
      let deselectedColor = "#b1b1b1";
      let highlight = d3.scaleSequential(y_axis.get(keyz).domain(), colors);

      let polyline = buildPolyline(x_axis, y_axis);
      let label = buildLabelForPolyline();

      const brush = d3
        .brushY()
        .extent([
          [-(brushWidth / 2), margin.top],
          [brushWidth / 2, height - margin.bottom],
        ])
        .on("start brush end", function (event, attr) {
          handleBrushed(event.selection, attr, event);
        });

      //build the Parallel Coordinates Plot
      var svgRef = buildPCP(
        attributes,
        width,
        height,
        margin,
        highlight,
        polyline,
        keyz,
        label,
        x_axis,
        y_axis,
        brush
      );
      var pathRef = svgRef.selectAll("path").filter((d) => d != null);
      function handleColorEncodingChange() {
        const colorEncodingDropdown = d3.select("#color-encoding");
        colorEncodingDropdown.on("change-attribute", () => {
          keyz = colorEncodingDropdown.property("attribute-changed-to");
          selections = new Map();
          let updatedHighlight = d3.scaleSequential(
            y_axis.get(keyz).domain(),
            colors
          );

          d3.select("svg").remove();
          let apolyline = buildPolyline(x_axis, y_axis);
          svgRef = buildPCP(
            attributes,
            width,
            height,
            margin,
            updatedHighlight,
            apolyline,
            keyz,
            label,
            x_axis,
            y_axis,
            brush
          );
          pathRef = svgRef.selectAll("path").filter((d) => d != null);
        });
      }

      function handleAttributeChange() {
        attributes.forEach((attr) => {
          const axisAttributeDropdown = d3.select(`#axis-attribute-${attr}`);
          axisAttributeDropdown.on("change-axis-attribute", () => {
            let newValue = axisAttributeDropdown.property(
              "attribute-changed-to"
            );
            attributes.splice(attributes.indexOf(attr), 1);
            attributes.splice(attributes.indexOf(newValue), 0, attr);
            let updatedHighlight = d3.scaleSequential(
              y_axis.get(keyz).domain(),
              colors
            );

            d3.select("svg").remove();
            let apolyline = buildPolyline(x_axis, y_axis);
            svgRef = buildPCP(
              attributes,
              width,
              height,
              margin,
              updatedHighlight,
              apolyline,
              keyz,
              label,
              x_axis,
              y_axis,
              brush
            );
            pathRef = svgRef.selectAll("path").filter((d) => d != null);
          });
        });
      }

      function handleDragStart(event, attr) {
        dragging[attr] = event.x;
        d3.select(this).attr("font-weight", "bold");
        svgRef.selectAll(".attribute-selection").attr("opacity", 1);
      }

      function handleDragging(event, attr) {
        let newX = dragging[attr] + event.x - dragging[attr];
        selections.set(attr, newX);
        svgRef
          .selectAll("path")
          .attr("d", polyline)
          .filter((d) => isSelected(d))
          .attr("opacity", 1);
        svgRef
          .selectAll(".axis-label")
          .attr("x", (d) => position(d, newX))
          .filter((d) => isSelected(d))
          .attr("font-weight", "bold")
          .attr("fill", "black");
      }

      function handleDragEnd(event, attr) {
        delete dragging[attr];
        d3.select(this).attr("font-weight", null);
        svgRef
          .selectAll(".attribute-selection")
          .attr("opacity", (d) => (selections.has(d) ? 1 : 0.2));
        if (!isSelected(attr)) {
          attributes.splice(attributes.indexOf(attr), 1);
          attributes.splice(attributes.indexOf(defaultAttr), 0, attr);
          let updatedHighlight = d3.scaleSequential(
            y_axis.get(keyz).domain(),
            colors
          );

          d3.select("svg").remove();
          let apolyline = buildPolyline(x_axis, y_axis);
          svgRef = buildPCP(
            attributes,
            width,
            height,
            margin,
            updatedHighlight,
            apolyline,
            keyz,
            label,
            x_axis,
            y_axis,
            brush
          );
          pathRef = svgRef.selectAll("path").filter((d) => d != null);
        }
      }

      function handleMouseOver(event, attr) {
        if (!isSelected(attr)) {
          d3.select(this).attr("font-weight", "bold");
          svgRef
            .selectAll("path")
            .filter((d) => d != null)
            .attr("opacity", (d) => (isSelected(d) ? 1 : 0.2));
          svgRef.selectAll(".axis-label").attr("fill", (d) => {
            if (isSelected(d)) {
              return "black";
            } else if (d === attr) {
              return "black";
            } else {
              return deselectedColor;
            }
          });
        }
      }

      function handleMouseOut(event, attr) {
        if (!isSelected(attr)) {
          d3.select(this).attr("font-weight", null);
          svgRef
            .selectAll("path")
            .filter((d) => d != null)
            .attr("opacity", 1);
          svgRef
            .selectAll(".axis-label")
            .attr("fill", (d) => (isSelected(d) ? "black" : deselectedColor));
        }
      }

      function handleBrushed(brushSelection, attr, event) {
        if (brushSelection === null) {
          selections.delete(attr);
          svgRef
            .selectAll(".brush")
            .filter((d) => d === attr)
            .call(brush.move, null);
        } else {
          let min = y_axis.get(attr).invert(brushSelection[1]);
          let max = y_axis.get(attr).invert(brushSelection[0]);
          selections.set(attr, [min, max]);
        }
        svgRef
          .selectAll("path")
          .attr("d", polyline)
          .filter((d) => isSelected(d))
          .attr("opacity", 1);
        svgRef
          .selectAll(".axis-label")
          .attr("fill", (d) => (isSelected(d) ? "black" : deselectedColor));
      }

      function buildPCP(
        attributes,
        width,
        height,
        margin,
        highlight,
        polyline,
        keyz,
        label,
        x_axis,
        y_axis,
        brush
      ) {
        let svg = d3
          .select("body")
          .append("svg")
          .attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom)
          .append("g")
          .attr("transform", `translate(${margin.left}, ${margin.top})`);

        svg
          .selectAll(".axis")
          .data(attributes)
          .enter()
          .append("g")
          .attr("class", "axis")
          .attr("transform", (d) => `translate(${x_axis(d)}, 0)`)
          .each(function (d) {
            d3.select(this).call(d3.axisLeft(y_axis.get(d)));
          })
          .append("text")
          .attr("class", "axis-label")
          .attr("x", 0)
          .attr("y", -5)
          .attr("fill", (d) => (isSelected(d) ? "black" : deselectedColor))
          .attr("text-anchor", "middle")
          .text((d) => d)
          .on("mouseover", handleMouseOver)
          .on("mouseout", handleMouseOut)
          .on("mousedown", handleDragStart)
          .on("mousemove", handleDragging)
          .on("mouseup", handleDragEnd)
          .on("touchstart", handleDragStart)
          .on("touchmove", handleDragging)
          .on("touchend", handleDragEnd);

        svg
          .append("text")
          .attr("class", "highlight-label")
          .attr("x", width)
          .attr("y", 30)
          .attr("text-anchor", "end")
          .text(keyz);

        svg.append("g").attr("class", "brush").call(brush);

        svg
          .append("g")
          .attr("class", "polyline-group")
          .selectAll("path")
          .data(data)
          .enter()
          .append("path")
          .attr("class", "polyline")
          .attr("d", polyline)
          .attr("stroke", (d) => highlight(getValue(d)))
          .attr("opacity", 1)
          .on("mouseover", function (event, d) {
            d3.select(this).attr("stroke-width", "4px");
            d3.select(this).attr("opacity", 1);
            d3.select(this).raise();
          })
          .on("mouseout", function (event, d) {
            d3.select(this).attr("stroke-width", "1px");
            d3.select(this).attr("opacity", 1);
          });

        svg
          .append("g")
          .attr("class", "label-group")
          .selectAll("text")
          .data(data)
          .enter()
          .append("text")
          .attr("class", "label-text")
          .attr("x", (d) => position(label(d), 0))
          .attr("y", margin.top - 15)
          .attr("fill", (d) => highlight(getValue(d)))
          .attr("text-anchor", "middle")
          .text((d) => label(d));

        return svg;
      }

      function buildPolyline(x_axis, y_axis) {
        return (d) => {
          return d != null
            ? d3.line()(
                attributes.map((p) => [
                  x_axis(p),
                  y_axis.get(p)(isSelected(p) ? getValue(d) : null),
                ])
              )
            : null;
        };
      }

      function buildLabelForPolyline() {
        return (d) => {
          return d !== null ? d.player_name : null;
        };
      }

      function buildXAxis() {
        return d3.scalePoint().range([0, width]).padding(1).domain(attributes);
      }

      function buildYAxis() {
        let y_axis = new Map();
        attributes.forEach((attr) => {
          y_axis.set(
            attr,
            d3
              .scaleLinear()
              .range([height, margin.bottom])
              .domain(yDomain(attr))
          );
        });
        return y_axis;
      }

      function getAttributes() {
        let allAttributes = new Set();
        data.forEach((d) => {
          Object.keys(d).forEach((key) => {
            allAttributes.add(key);
          });
        });
        return Array.from(allAttributes);
      }

      function getAttributeTickDistance() {
        let tickDistMap = new Map();
        attributes.forEach((attr) => {
          let dist = yDomain(attr)[1] / 10;
          tickDistMap.set(attr, dist);
        });
        return tickDistMap;
      }

      function isSelected(attr) {
        return selections.has(attr);
      }

      function isSelectedValue(attr, value) {
        if (!selections.has(attr)) {
          return true;
        }
        let [min, max] = selections.get(attr);
        return min <= value && value <= max;
      }

      function position(attr, value) {
        if (!selections.has(attr)) {
          return x_axis(attr);
        }
        let [min, max] = selections.get(attr);
        return (
          x_axis(attr) + ((value - min) / (max - min)) * tickDistMap.get(attr)
        );
      }

      function getValue(d) {
        return d != null ? +d[keyz] : null;
      }

      function normalizeData() {
        attributes.forEach((attr) => {
          let [min, max] = d3.extent(data, (d) => +d[attr]);
          yDomain(attr, [min, max]);
        });
      }

      function yDomain(attr, domain = null) {
        if (domain === null) {
          return y_axis.get(attr).domain();
        } else {
          y_axis.get(attr).domain(domain);
        }
      }

      function setupColorEncodingDropdown() {
        let colorEncodingDropdown = d3.select("#color-encoding");
        colorEncodingDropdown
          .selectAll("option")
          .data(allAttributes)
          .enter()
          .append("option")
          .attr("value", (d) => d)
          .text((d) => d);
      }

      function setupAttributeSelectionDropdowns() {
        let attributeSelectionContainer = d3.select(
          "#attribute-selection-container"
        );
        attributes.forEach((attr) => {
          let attributeSelection = attributeSelectionContainer
            .append("div")
            .attr("class", "attribute-selection")
            .attr("id", `attribute-selection-${attr}`);

          attributeSelection
            .append("label")
            .attr("for", `axis-attribute-${attr}`)
            .text(attr);

          attributeSelection
            .append("select")
            .attr("id", `axis-attribute-${attr}`)
            .on("change", () => {
              attributeSelection.dispatch("change-axis-attribute");
            })
            .selectAll("option")
            .data(allAttributes)
            .enter()
            .append("option")
            .attr("value", (d) => d)
            .text((d) => d);
        });
      }
    });
};
