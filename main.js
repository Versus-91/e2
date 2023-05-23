// set the dimensions and margins of the graph
const margin = { top: 30, right: 50, bottom: 10, left: 50 },
  width = 1900 
  height = 800

// append the svg object to the body of the page
const svg = d3
  .select("#frame")
  .append("svg")
  .attr("width", width )
  .attr("height", height)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);
fetch("football.json").then((data) => {
  data.json().then((json_data) => {
    data = [];
    json_data.nodes.forEach((element) => {
      if (element.appearance) {
        data.push(element);
      }
    });
    const defaultValues = {
      appearance: 0,
      mins_played: 0,
      ball_recovery: 0,
      clearance_total: 0,
      duel_aerial_lost: 0,
      duel_aerial_won: 0,
      final_third: 0,
      pass_inaccurate: 0,
      pass_accurate: 0,
      possession: 0,
      punches: 0,
      touches: 0,
      keeper_missed: 0,
      keeper_save_total: 0,
      big_chance_scored: 0,
      challenge_lost: 0,
      dispossessed: 0,
      dribble_lost: 0,
      foul_committed: 0,
      foul_given: 0,
      red_card: 0,
      interception_all: 0,
      pass_key: 0,
      second_yellow: 0,
      yellow_card: 0,
      tackle_lost: 0,
      tackle_won: 0,
      shot_on_target: 0,
      shot_off_target: 0,
      shots_total: 0,
      sub_off: 0,
      goal_normal: 0,
      goals: 0,
      dribble_won: 0,
      sub_on: 0,
      assist: 0,
      man_of_the_match: 0,
      goal_head: 0,
      penalty_scored: 0,
    };

    const processedData = data.map((d) => {
      const processedObj = {
        id: d.id,
        label: d.label,
        ...defaultValues, // Assign default values for missing keys
        ...d, // Override default values with actual values from the data
      };
      return processedObj;
    });
    processedData.forEach((element) => {});
    data = processedData;
    var keys = [];
    let color_scales = new Map();
    attributeTypes = new Map(
      Object.entries({
        mpg: "quantitative",
        cylinders: "ordinal",
        displacement: "quantitative",
        appearance: "quantitative",
        mins_played: "quantitative",
        ball_recovery: "quantitative",
        clearance_total: "quantitative",
        duel_aerial_lost: "quantitative",
        duel_aerial_won: "quantitative",
        final_third: "quantitative",
        pass_inaccurate: "quantitative",
        pass_accurate: "quantitative",
        possession: "quantitative",
        punches: "quantitative",
        touches: "quantitative",
        keeper_missed: "quantitative",
        keeper_save_total: "quantitative",
        big_chance_scored: "quantitative",
        challenge_lost: "quantitative",
        dispossessed: "quantitative",
        dribble_lost: "quantitative",
        foul_committed: "quantitative",
        foul_given: "quantitative",
        red_card: "quantitative",
        interception_all: "quantitative",
        pass_key: "quantitative",
        second_yellow: "quantitative",
        yellow_card: "quantitative",
        tackle_lost: "quantitative",
        tackle_won: "quantitative",
        shot_on_target: "quantitative",
        shot_off_target: "quantitative",
        shots_total: "quantitative",
        sub_off: "quantitative",
        goal_normal: "quantitative",
        goals: "quantitative",
        dribble_won: "quantitative",
        sub_on: "quantitative",
        assist: "quantitative",
        man_of_the_match: "quantitative",
        goal_head: "quantitative",
        penalty_scored: "quantitative",
      })
    );

    // console.table(data);
    for (var i = 0; i < data.length; i++) {
      Object.keys(data[i]).forEach(function (key) {
        if (keys.indexOf(key) == -1) {
          if (key !== "id" && key !== "label") {
            keys.push(key);
          }
        }
      });
    }
    dimensions = keys;
    x = d3.scalePoint(dimensions, [margin.left, width - margin.right - 80]);
    let scales = new Map();

    // TODO: create a suitable scale for each attribute and add it to the map
    dimensions.forEach(function (attribute) {
      scales.set(
        attribute,
        d3
          .scaleLinear()
          .range([height - margin.bottom, margin.top])
          //define domain depending on the range of the attribute in the dataset
          .domain(d3.extent(data, (item) => item[attribute]))
        //d3.extent(iterable[, accessor]) acessor function is optional
      );
    });
    y = scales;
    dimensions.forEach(function (attribute) {
      //depending on the type of the attribute, set appropriate scale with domain of the attribute in y
      if (attributeTypes.get(attribute) == "quantitative") {
        color_scales.set(
          attribute,
          d3.scaleSequential(y.get(attribute).domain(), d3.interpolateWarm)
        );
      }
      if (attributeTypes.get(attribute) == "ordinal") {
        color_scales.set(
          attribute,
          d3.scaleSequential(y.get(attribute).domain(), d3.interpolateWarm)
        );
      }
      if (attributeTypes.get(attribute) == "categorical") {
        color_scales.set(
          attribute,
          d3.scaleOrdinal(y.get(attribute).domain(), d3.schemeCategory10)
        );
      }
    });
    for (i in dimensions) {
      name = dimensions[i];
      y[name] = d3
        .scaleLinear()
        .domain(
          d3.extent(data, function (d) {
            return +d[name];
          })
        )
        .range([height, 0]);
    }
    const selections = new Map();
    function brushed({ selection }, key) {
      if (selection === null) selections.delete(key);
      else selections.set(key, selection.map(x.get(key).invert));
      const selected = [];
      path.each(function (d) {
        const active = Array.from(selections).every(
          ([key, [min, max]]) => d[key] >= min && d[key] <= max
        );
        d3.select(this).style("stroke", active ? z(d[keyz]) : deselectedColor);
        if (active) {
          d3.select(this).raise();
          selected.push(d);
        }
      });
      svg.property("value", selected).dispatch("input");
    }
    const brush = d3
      .brushY()
      .extent([
        [-10, margin.top],
        [10, height - margin.bottom],
      ])
      .on("start brush end", brushed);
    // Build the X scale -> it find the best position for each Y axis
    x = d3.scalePoint().range([0, width]).padding(1).domain(dimensions);

    // The path function take a row of the csv as input, and return x and y coordinates of the line to draw for this raw.
    function path(d) {
      return d3.line()(
        dimensions.map(function (p) {
          return [x(p), y[p](d[p])];
        })
      );
    }

    // Draw the lines
    svg
      .selectAll("myPath")
      .data(data.slice().sort((a, b) => d3.ascending(a[keys], b[keys])))
      .join("path")
      .attr("stroke", (d) => d3.scaleSequential([0, 10], d3.interpolateWarm))
      .attr("d", (d) =>
        d3
          .line()
          .defined(([, value]) => value != null)
          .x(([key, value]) => x(key))
          .y(([key, value]) => y.get(key)(value))(
          d3.cross(dimensions, [d], (key, d) => [key, d[key]])
        )
      )
      .attr("d", path)
      .style("fill", "none")
      .style("stroke", "#69b3a2")
      .style("opacity", 0.5);

    // Draw the axis:
    svg
      .selectAll("myAxis")
      // For each dimension of the dataset I add a 'g' element:
      .data(dimensions)
      .enter()
      .append("g")
      .call(brush)
      // I translate this element to its right position on the x axis
      .attr("transform", function (d) {
        return "translate(" + x(d) + ")";
      })
      // And I build the axis with the call function
      .each(function (d) {
        d3.select(this).call(d3.axisLeft().scale(y[d]));
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
