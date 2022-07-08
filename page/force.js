
const drag = d3.drag()
  .on("start", dragstarted)
  .on("drag", dragged)
  .on("end", dragended);

var svg = d3
  .select('#visSvg')

let width = svg.style('width').slice(0, -2)
let height = svg.style('height').slice(0, -2)

var link = svg
  .append("g")
    .attr("stroke", "#999")
    .attr("stroke-opacity", 0.6)
  .selectAll("line");

var node = svg
  .append("g")
    .attr("stroke", "#449")
    .attr("stroke-width", 1.5)
    .attr("fill", "#77b")
  .selectAll("circle");

var texts = svg
  .append('g')
  .selectAll('text')

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
    .attr("cx", (d) => d.x)
    .attr("cy", (d) => d.y);

  link
    .attr('d', d => makeLinkPath(d.source, d.target))
    // .attr("x1", (d) => d.source.x)
    // .attr("y1", (d) => d.source.y)
    // .attr("x2", (d) => d.target.x)
    // .attr("y2", (d) => d.target.y);

  texts
    .attr('x', d => d.x)
    .attr('y', d => d.y );
}


function makeLinkPath(source, target) {
  let direction = {'x': target.x - source.x, 'y': target.y - source.y}
  let normalisedDir = normaliseVector(direction)

  let curveMidOffset = 100

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
    .join((enter) =>
      enter
        .append("circle")
          .attr('r', d => getClassRadius(d))
          // .attr('x', width / 2)
          // .attr('y', height / 2)
          .call((node) => node.append("title").text((d) => d.label))
          .call(drag)
    );

  texts = texts
    .data(classesData, (d) => d.id)
    .join((enter) =>
      enter
        .append("text")
          .text((d) => d.label)
          .attr('class', 'nodeLabel')
          .attr('text-anchor', 'middle')
    );


  link = link
    .data(linksData, (d) => [d.source, d.target])
    .join((enter) =>
      enter.append('path')
        .attr('marker-end', 'url(#arrowhead)')
        .attr('pathLength', '1')
        .attr('stroke-dasharray', '0.9')
        .attr('stroke', 'black')
        .attr('fill', 'transparent')
    );

  simulation.nodes(classesData);
  simulation.force("link").links(linksData);
  simulation.alpha(1).restart().tick();
  ticked(); // render now!
}


function addNode(nodeToAdd) {

}


function addLink(linkToAdd) {

}


function dragstarted(event, d) {
  if (!event.active) simulation.alphaTarget(0.3).restart();
  d.fx = d.x;
  d.fy = d.y;
}


function dragged(event, d) {
  d.fx = event.x;
  d.fy = event.y;
}


function dragended(event, d) {
  if (!event.active) simulation.alphaTarget(0);
  d.fx = null;
  d.fy = null;
}


function getClassRadius(cls) {
  return Math.log(cls.count) * 2.5
}
