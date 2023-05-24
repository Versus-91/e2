let selectedNodes = [];
const color = "#00755E";
const colorSelected = "#39FF14";
function deselectAll() {
  selectedNodes = [];
  document.getElementById("data").innerHTML = "";
  d3.selectAll("circle").attr("fill", color);
}
let json = async () => {
  const response = await fetch("football.json");
  const json = await response.json();
  return json;
};
fetch("football.json")
  .then((response) => response.json())
  .then((json) => {
    var processed_data = {
      nodes: json.nodes.map((d) => ({
        id: d.id,
        group: 1,
        player: d.label,
      })),
      links: json.edges.map((d) => ({
        source: d.src,
        target: d.dst,
        value: d.val,
      })),
    };
    chart = ForceGraph(processed_data, {
      nodeId: (d) => d.id,
      nodeGroup: (d) => d.group,
      nodeTitle: (d) => `${d.id}\n${d.group}`,
      linkStrokeWidth: function (l) {
        if (l.value === 1) {
          return Math.sqrt(l.value);
        } else {
          return Math.sqrt(l.value) * 2 + 1;
        }
      },
      width: 600,
      height: 600,
      invalidation: null, // a promise to stop the simulation when the cell is re-run
    });
    function ForceGraph(
      {
        nodes, // an iterable of node objects (typically [{id}, …])
        links, // an iterable of link objects (typically [{source, target}, …])
      },
      {
        nodeId = (d) => d.id, // given d in nodes, returns a unique identifier (string)
        nodeGroup, // given d in nodes, returns an (ordinal) value for color
        nodeGroups, // an array of ordinal values representing the node groups
        nodeTitle, // given d in nodes, a title string
        nodeFill = "currentColor", // node stroke fill (if not using a group color encoding)
        nodeStroke = "#fff", // node stroke color
        nodeStrokeWidth = 1.5, // node stroke width, in pixels
        nodeStrokeOpacity = 1, // node stroke opacity
        nodeRadius = 8, // node radius, in pixels
        nodeStrength,
        linkSource = ({ source }) => source, // given d in links, returns a node identifier string
        linkTarget = ({ target }) => target, // given d in links, returns a node identifier string
        linkStroke = "#999", // link stroke color
        linkStrokeOpacity = 0.6, // link stroke opacity
        linkStrokeWidth = 1.5, // given d in links, returns a stroke width in pixels
        linkStrokeLinecap = "round", // link stroke linecap
        linkStrength,
        colors = d3.schemeTableau10, // an array of color strings, for the node groups
        width = 640, // outer width, in pixels
        height = 400, // outer height, in pixels
        invalidation, // when this promise resolves, stop the simulation
      } = {}
    ) {
      // Compute values.
      const N = d3.map(nodes, nodeId).map(intern);
      const LS = d3.map(links, linkSource).map(intern);
      const LT = d3.map(links, linkTarget).map(intern);
      if (nodeTitle === undefined) nodeTitle = (_, i) => N[i];
      const T = nodeTitle == null ? null : d3.map(nodes, nodeTitle);
      const G = nodeGroup == null ? null : d3.map(nodes, nodeGroup).map(intern);
      const W =
        typeof linkStrokeWidth !== "function"
          ? null
          : d3.map(links, linkStrokeWidth);
      const L =
        typeof linkStroke !== "function" ? null : d3.map(links, linkStroke);

      // Replace the input nodes and links with mutable objects for the simulation.
      nodes = d3.map(nodes, (_, i) => ({ id: N[i] }));
      links = d3.map(links, (_, i) => ({ source: LS[i], target: LT[i] }));

      // Compute default domains.
      if (G && nodeGroups === undefined) nodeGroups = d3.sort(G);

      // Construct the scales.
      const color =
        nodeGroup == null ? null : d3.scaleOrdinal(nodeGroups, colors);

      // Construct the forces.
      const forceNode = d3.forceManyBody();
      const forceLink = d3.forceLink(links).id(({ index: i }) => N[i]);
      if (nodeStrength !== undefined) forceNode.strength(nodeStrength);
      if (linkStrength !== undefined) forceLink.strength(linkStrength);

      const simulation = d3
        .forceSimulation(nodes)
        .force("link", forceLink)
        .force("charge", forceNode)
        .force("center", d3.forceCenter())
        .on("tick", ticked);

      const svg = d3
        .select("#frame")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [-width / 2, -height / 2, width, height])
        .attr("style", "max-width: 100%; height: auto; height: intrinsic;");

      const link = svg
        .append("g")
        .attr("stroke", typeof linkStroke !== "function" ? linkStroke : null)
        .attr("stroke-opacity", linkStrokeOpacity)
        .attr(
          "stroke-width",
          typeof linkStrokeWidth !== "function" ? linkStrokeWidth : null
        )
        .attr("stroke-linecap", linkStrokeLinecap)
        .selectAll("line")
        .data(links)
        .join("line");

      const node = svg
        .append("g")
        .attr("fill", nodeFill)
        .attr("stroke", nodeStroke)
        .attr("stroke-opacity", nodeStrokeOpacity)
        .attr("stroke-width", nodeStrokeWidth)
        .selectAll("circle")
        .data(nodes)
        .join("circle")
        .attr("r", nodeRadius)
        .call(drag(simulation))
        .on("mouseover", handleMouseOver) // Add mouseover event listener
        .on("mouseout", handleMouseOut)
        .on("click", selectNodes);

      if (W) link.attr("stroke-width", ({ index: i }) => W[i]);
      if (L) link.attr("stroke", ({ index: i }) => L[i]);
      if (G) node.attr("fill", ({ index: i }) => color(G[i]));
      if (T) node.append("title").text(({ index: i }) => T[i]);
      if (invalidation != null) invalidation.then(() => simulation.stop());
      // Function to handle node selection
      function selectNodes(event, d) {
        const isSelected = selectedNodes.includes(d);
        if (isSelected) {
          // Deselect the node if it's already selected
          selectedNodes = selectedNodes.filter((node) => node !== d);
        } else {
          // Select the clicked node
          selectedNodes.push(d);
          d3.select(this).attr("fill", colorSelected);
        }
        const selectEvent = new CustomEvent("nodeSelected", {
          detail: selectedNodes,
        });
        document.dispatchEvent(selectEvent);
        items = [];
        selectedNodes.forEach((item) => {
          data = json.nodes.find((z) => item.id === z.id);
          items.push(data);
        });
        tableCreate(items);
      }
      function unselectNodes() {
        selectedNodes = [];
        document.getElementById("data").innerHTML = "";
        d3.selectAll("circle").attr("fill", color);
      }
      function intern(value) {
        return value !== null && typeof value === "object"
          ? value.valueOf()
          : value;
      }
      const tooltip = d3
        .select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("pointer-events", "none")
        .style("visibility", "hidden");

      function handleMouseOver(event, d) {
        // item = json.nodes.find((item) => item.id === d.id);
        // console.log(item);
        // tableCreate(item);
      }
      function tableCreate(dataObj) {
        //body reference
        var body = document.getElementById("data");
        body.innerHTML = "";
        // create elements <table> and a <tbody>
        var tbl = document.createElement("table");
        tbl.className = "table table-striped table-hover";
        var tblBody = document.createElement("tbody");
        var tblHead = document.createElement("thead");
        const headers = ["id", "label", "mins_played"];
        var headerRow = document.createElement("tr");
        for (var j = 0; j < 3; j++) {
          // table row creation
          // Form and set the inner HTML directly
          headerRow.innerHTML += `<th>${headers[j]}</th>`;
          //row added to end of table body
        }
        tblHead.appendChild(headerRow);
        dataObj.forEach((item) => {
          // cells creation
          var row = document.createElement("tr");
          for (var j = 0; j < 3; j++) {
            // table row creation
            // Form and set the inner HTML directly
            row.innerHTML += `<td>${item[headers[j]]}</td>`;
            //row added to end of table body
          }
          tblBody.appendChild(row);
          // append the <tbody> inside the <table>
          tbl.appendChild(tblHead);
          tbl.appendChild(tblBody);
        });
        // put <table> in the <body>
        body.appendChild(tbl);
      }
      function handleMouseOut() {
        // Hide the tooltip
        tooltip.style("visibility", "hidden");
      }
      function ticked() {
        link
          .attr("x1", (d) => d.source.x)
          .attr("y1", (d) => d.source.y)
          .attr("x2", (d) => d.target.x)
          .attr("y2", (d) => d.target.y);

        node
          .attr("cx", (d) => d.x)
          .attr("cy", (d) => d.y)
          .attr("fill-opacity", (d) => (selectedNodes.includes(d) ? 1 : 0.7)); // Highlight selected nodes
      }

      function drag(simulation) {
        function dragstarted(event) {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          event.subject.fx = event.subject.x;
          event.subject.fy = event.subject.y;
        }

        function dragged(event) {
          event.subject.fx = event.x;
          event.subject.fy = event.y;
        }

        function dragended(event) {
          if (!event.active) simulation.alphaTarget(0);
          event.subject.fx = null;
          event.subject.fy = null;
        }

        return d3
          .drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended);
      }

      return Object.assign(svg.node(), { scales: { color } });
    }
  });
