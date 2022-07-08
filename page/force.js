var svg = d3
  .select('#visSvg')

let width = svg.style('width').slice(0, -2)
let height = svg.style('height').slice(0, -2)

var link = svg
  .append("g")
    .attr('id', 'linkContainer')
    .attr("stroke", "#999")
    .attr("stroke-opacity", 1)
    .attr('stroke', 'black')
    .attr("stroke-width", 3)
    .attr('fill', 'transparent')
    .attr('marker-end', 'url(#arrowhead)')
  .selectAll("path");

var node = svg
  .append("g")
    .attr('id', 'nodeContainer')
    .attr("stroke", "#449")
    .attr("stroke-width", 1.5)
    .attr("fill", "#77b")
  .selectAll(".node");

var linkLabel = svg
  .append("g")
    .attr("stroke", "#999")
    .attr("stroke-opacity", 0.6)
  .selectAll("rect");


const simulation = d3
  .forceSimulation()
  .force("charge", d3.forceManyBody().strength(-500))
  .force('collide', d3.forceCollide().radius(d => getClassRadius(d)))
  .force("link",
    d3.forceLink()
      .id((d) => d.id)
      .distance(200)
  )
  .force("x", d3.forceX(width / 2))
  .force("y", d3.forceY(height / 2))
  .on("tick", ticked);


function ticked() {
  node
    .attr('transform', (d) =>`translate(${d.x}, ${d.y})`)

  link
    .attr('d', d => makeLinkPath(d.source, d.target))
}


function makeLinkPath(source, target) {
  let direction = {'x': target.x - source.x, 'y': target.y - source.y}
  let normalisedDir = normaliseVector(direction)

  let curveMidOffset = 150

  let midpointX = (target.x + source.x + normalisedDir.y * curveMidOffset) / 2
  let midpointY = (target.y + source.y - normalisedDir.x * curveMidOffset) / 2
  return `
  M ${source.x} ${source.y}
  Q ${midpointX} ${midpointY} ${target.x} ${target.y}
  `
}

function normaliseVector(vector) {
  let magnitude = vectorMagnitude(vector)
  return {'x': vector.x / magnitude, 'y': vector.y / magnitude}
}

function vectorMagnitude(vector) {
  return Math.sqrt(vector.x * vector.x + vector.y * vector.y)
}


function updateForceVis(visData) {
  var linksData = 'links' in visData ? visData.links : []
  var classesData = 'classes' in visData ? visData.classes : []

  // Make a shallow copy to protect against mutation, while
  // recycling old nodes to preserve position and velocity.
  const old = new Map(node.data().map((d) => [d.id, d]));
  classesData = classesData.map((d) => Object.assign(old.get(d.id) || {}, d));
  linksData = linksData.map((d) => Object.assign({}, d));

  node = node
    .data(classesData, (d) => d.id)
    .join(enter => {
      let nodeContainer = enter.append('g')
        .classed('node', true)
        .attr('transform', `translate(${width / 2}, ${height / 2})`)
      nodeContainer.append("circle")
        .attr('r', d => getClassRadius(d))
        .call((node) => node.append("title").text((d) => d.label))
        .call(drag(simulation))
      nodeContainer.append("text")
        .text((d) => d.label)
        .classed('nodeLabel', true)
        .attr('text-anchor', 'middle')
        .attr("stroke-width", '1')
        .attr("stroke", "#000")
        .attr("fill", "#000")
      return nodeContainer
    });


  link = link
    .data(linksData, (d) => [d.source, d.target])
    .join(enter => enter.append('path'));

  simulation.nodes(classesData);
  simulation.force("link").links(linksData);
  simulation.alpha(1).restart().tick();
  ticked(); // render now!
}


function addNode(nodeToAdd) {

}


function addLink(linkToAdd) {

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

  return d3.drag()
    .container(g => g)  // To drag the <g> element
    .on("start", dragstarted)
    .on("drag", dragged)
    .on("end", dragended);
}


function getClassRadius(cls) {
  return Math.log(cls.count) * 3
}
