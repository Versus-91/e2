var d3; // Minor workaround to avoid error messages in editors

// Waiting until document has loaded
window.onload = () => {
  d3.json("football.json").then(function (data) {
    const defaultAttr = "appearance";

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

    const tickDistMap = returnAttributeTickDistance();
    normalizeData();
    setupColorEncodingDropdown();
    setupAttributeSelectionDropdowns();
    let x_axis = build_x_axis();

    let y_axis = build_y_axis();

    let colors = d3.interpolateRdYlGn;
    let deselectedColor = "#b1b1b1";
    let highlight = d3.scaleSequential(y_axis.get(keyz).domain(), colors);

    let polyline = build_polyline(x_axis, y_axis);
    let label = build_label_for_polyline();

    const brush = d3
      .brushY()
      .extent([
        [-(brushWidth / 2), margin.top],
        [brushWidth / 2, height - margin.bottom],
      ])
      .on("start brush end", function (event, attr) {
        brushed(event.selection, attr, event);
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
    function colorEncodingChangeEventHandler() {
      const colorEncodingDropdown = d3.select("#color-encoding");
      colorEncodingDropdown.on("change-attribute", () => {
        keyz = colorEncodingDropdown.property("attribute-changed-to");
        selections = new Map();
        let updatedHighlight = d3.scaleSequential(
          y_axis.get(keyz).domain(),
          colors
        );

        d3.select("svg").remove();
        let apolyline = build_polyline(x_axis, y_axis);
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

    function attributeChangeEventHandler() {
      attributes.forEach((attr) => {
        const axisAttributeDropdown = d3.select(`#axis-attribute-${attr}`);
        axisAttributeDropdown.on("change-axis-attribute", () => {
          let selectedAttribute = axisAttributeDropdown.property(
            "axis-attribute-changed-to"
          );
          attributes = attributes.map((el) =>
            el === attr ? selectedAttribute : el
          );
          keyz = selectedAttribute;
          console.log(`invoking ${attr} -> ${selectedAttribute}`);
          x_axis = build_x_axis();
          y_axis = build_y_axis();

          selections = new Map(); //reset the selections manually since its not a part of brush's internal reset
          let updatedHighlight = d3.scaleSequential(
            y_axis.get(selectedAttribute).domain(),
            colors
          );

          d3.select("svg").remove();
          let apolyline = build_polyline(x_axis, y_axis);
          let label = build_label_for_polyline();
          svgRef = buildPCP(
            attributes,
            width,
            height,
            margin,
            updatedHighlight,
            apolyline,
            selectedAttribute,
            label,
            x_axis,
            y_axis,
            brush
          );
          pathRef = svgRef.selectAll("path").filter((d) => d != null);
          d3.select("#attribute-selection-root").remove();
          setupAttributeSelectionDropdowns();
          d3.select("#color-encoding").remove();
          setupColorEncodingDropdown();
        });
      });
    }

    function brushed(selection, key, event) {
      event.sourceEvent.stopPropagation();
      if (selection === null) selections.delete(key);
      else selections.set(key, selection.map(y_axis.get(key).invert));
      const selected = [];
      pathRef.each(function (d) {
        const active = Array.from(selections).every(
          ([key, [min, max]]) => d[key] >= min && d[key] <= max
        );
        const brushHighlight = d3.scaleSequential(
          y_axis.get(keyz).domain(),
          colors
        );
        d3.select(this).attr(
          "stroke",
          active ? brushHighlight(d[keyz]) : deselectedColor
        );
        if (active) {
          d3.select(this).raise();
          selected.push(d);
        }
      });
      svgRef.property("value", selected).dispatch("input");
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
      const svg = d3
        .select("#container")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

      const path = svg
        .append("g")
        .attr("fill", "none")
        .attr("stroke-width", 2.0)
        .attr("stroke-opacity", 0.8)
        .selectAll("path")
        .data(data["nodes"])
        .join("path")
        .attr("stroke", (d) => highlight(d[keyz]))
        .attr("d", (d) => {
          return polyline(
            d3.cross(attributes, [d], (key, d) => {
              return [key, d[key]];
            })
          );
        });

      path.append("title").text(label);

      const g = svg
        .append("g")
        .selectAll("g")
        .data(attributes)
        .join("g")
        .attr("transform", (d) => `translate(${x_axis(d)},0)`)
        .each(function (d) {
          d3.select(this).call(
            d3.axisLeft(y_axis.get(d)).tickFormat(function (d) {
              return d < 0 ? "NA" : d;
            })
          );
        })
        .call(
          d3
            .drag()
            .subject(function (event, d) {
              return { x: x_axis(d) };
            })
            .on("start", function (d) {
              dragging[d] = x_axis(d);
            })
            .on("drag", function (event, d) {
              dragging[d] = Math.min(
                width - margin.right,
                Math.max(margin.left, event.x)
              );
              attributes.sort(function (a, b) {
                return position(a) - position(b);
              });
              x_axis.domain(attributes);
              g.attr("transform", function (d) {
                return "translate(" + position(d) + ")";
              });
              path.each(function (d) {
                d3.select(this).select("title").remove();
                d3.select(this).append("title").text(label);
              });
            })
            .on("end", function (event, d) {
              delete dragging[d];
              d3.select(this)
                .transition()
                .duration(500)
                .attr("transform", "translate(" + x_axis(d) + ")");
              path
                .transition()
                .duration(300)
                .attr("d", (d) =>
                  polyline(d3.cross(attributes, [d], (key, d) => [key, d[key]]))
                );

              d3.select("#attribute-selection-root").remove();
              setupAttributeSelectionDropdowns();
            })
        )
        .call((g) =>
          g
            .append("text")
            .attr("x", margin.left - 35)
            .attr("y", 20)
            .attr("text-anchor", "middle")
            .attr("fill", "currentColor")
            .text((d) => d)
        )
        .call((g) =>
          g
            .selectAll("text")
            .clone(true)
            .lower()
            .attr("fill", "none")
            .attr("stroke-width", 5)
            .attr("stroke-linejoin", "round")
            .attr("stroke", "white")
        );

      g.append("g").each(function (d) {
        d3.select(this).call(brush);
      });

      return svg;
    }

    function setupAttributeSelectionDropdowns() {
      const div_attr_drpdwn = d3.select(document.createElement("div"));
      div_attr_drpdwn.attr("id", "attribute-selection-root");
      attributes.forEach((axis_attr) => {
        const form = d3.select(document.createElement("form"));
        form.attr("id", `axis-attribute-${axis_attr}`);
        form.attr("class", "attribute-selection-dropdown ");
        selectElement = document.createElement("select");
        selectElement.className = "form-select form-select-sm";
        const select = d3.select(selectElement);
        allAttributes.forEach((attr) => {
          if (
            !attributes.filter((el) => el != axis_attr).includes(attr) &&
            attr !== "label"
          ) {
            select.append("option").attr("value", attr).text(attr);
          }
        });

        select.property("value", axis_attr);
        select.on("change", () => {
          console.log("change...");
          attributeChangeEventHandler();
          form.property("axis-attribute-changed-to", select.property("value"));
          form.node().dispatchEvent(new Event("change-axis-attribute"));
        });

        form.append(() => select.node());
        div_attr_drpdwn.append(() => form.node());
      });
      d3.select("#attr-selection").append(() => div_attr_drpdwn.node());
    }

    function position(d) {
      let pos = dragging[d];
      return pos == null ? x_axis(d) : pos;
    }

    function build_x_axis() {
      let x_axis = d3.scalePoint(attributes, [
        margin.left,
        width - margin.right,
      ]);
      return x_axis;
    }

    function build_y_axis() {
      let y_axis = new Map(
        Array.from(attributes, (attr) => {
          const scale = d3.scaleLinear(
            d3.extent(data["nodes"], (d) => d[attr]),
            [margin.top, height - margin.bottom]
          );
          return [attr, scale];
        })
      );
      return y_axis;
    }

    function build_polyline(x_axis, y_axis) {
      let polyline = d3
        .line()
        //.defined(([,value]) => value != undefined)
        .x(([key]) => x_axis(key))
        .y(([key, value]) => y_axis.get(key)(value));
      return polyline;
    }

    function build_label_for_polyline() {
      let alabel = function (d) {
        let str = d["label"] + " : ";
        let playerValues = [];
        attributes.forEach((attr) => {
          if (d[attr] >= 0) playerValues.push(d[attr]);
          else playerValues.push("NA");
        });
        str += playerValues.join(", ");
        return str;
      };
      return alabel;
    }

    function getAttributes() {
      let attributes = [];
      data["nodes"].forEach((playerData) => {
        ignoredDataAttributes = ["id"];
        for (let dataAttribute in playerData) {
          //check if the data attr being looked at isnt "id"
          //and hasnt already been added to our attributes list
          if (
            !ignoredDataAttributes.includes(dataAttribute) &&
            !attributes.includes(dataAttribute)
          ) {
            attributes.push(dataAttribute);
          }
        }
      });

      //comment this - mocking attributes list
      /*attributes = ['appearance', 'mins_played', 'ball_recovery', 'challenge_lost', 'touches',
                    'clearance_total', 'dispossessed', 'dribble_lost', 'duel_aerial_lost', 'duel_aerial_won']; */
      return attributes;
    }

    function getAttributesOfPlayer(playerData) {
      return Object.keys(playerData);
    }

    function normalizeData() {
      const allAttributes = getAttributes(); //get a list of all the attributes
      data["nodes"].forEach((playerData) => {
        const playerAttributes = getAttributesOfPlayer(playerData);
        allAttributes.forEach((dataAttribute) => {
          if (!playerAttributes.includes(dataAttribute)) {
            playerData[dataAttribute] = tickDistMap.get(dataAttribute); // app. negative value represents NA value, workaround suitable for our dataset
          }
        });
      });
    }

    function returnAttributeTickDistance() {
      let tickDistMap = new Map(
        Array.from(allAttributes, (attr) => {
          const scale = d3.scaleLinear(
            d3.extent(data["nodes"], (d) => d[attr]),
            [margin.top, height - margin.bottom]
          );
          const ticks = scale.ticks();
          const tickDistance = Number((ticks[1] - ticks[2]).toFixed(1));
          return [attr, tickDistance];
        })
      );
      return tickDistMap;
    }

    function setupColorEncodingDropdown() {
      const form = d3.select(document.createElement("form"));
      form.attr("id", "color-encoding");
      form.attr("class", "color-encoding-dropdown");
      const select = d3.select(document.createElement("select"));
      attributes.forEach((attr) => {
        select.append("option").attr("value", attr).text(attr);
      });

      select.property("value", keyz);
      select.on("change", () => {
        colorEncodingChangeEventHandler();
        form.property("attribute-changed-to", select.property("value"));
        form.node().dispatchEvent(new Event("change-attribute"));
      });

      form.append(() => select.node());
      form
        .append("i")
        .style("font-size", "smaller")
        .style("margin-left", "15px")
        .text("color encoding");
      d3.select("#encoding-container").append(() => form.node());
    }
  });
};
