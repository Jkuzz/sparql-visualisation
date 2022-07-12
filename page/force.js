const svg = d3
  .select('#visSvg')

let width = svg.style('width').slice(0, -2)
let height = svg.style('height').slice(0, -2)

// const resize_ob = new ResizeObserver(entries => {
  // 	let rect = entries[0].contentRect;

  // 	width = rect.width;
  // 	height = rect.height;
  // });

  // start observing for resize
  // resize_ob.observe(document.querySelector("#demo-textarea"));

const svgWrapper = svg.append('g')
  .classed('wrapper', true)
  .attr('transform', 'translate(0, 0) scale(1)')

var link = svgWrapper
  .append("g")
    .attr('id', 'linkContainer')
    .attr("stroke", "#999")
    .attr("stroke-opacity", 1)
    .attr('stroke', 'black')
    .attr("stroke-width", 3)
    .attr('fill', 'transparent')
    .attr('marker-end', 'url(#arrowhead)')
  .selectAll("path");

var node = svgWrapper
  .append("g")
    .attr('id', 'nodeContainer')
    .attr("stroke", "#449")
    .attr("stroke-width", 1.5)
    .attr("fill", "#77b")
  .selectAll(".node");

var linkLabel = svgWrapper
  .append("g")
    .attr("stroke", "#999")
    .attr("stroke-opacity", 0.6)
  .selectAll("rect");


const simulation = d3
  .forceSimulation()
  .force("charge", d3.forceManyBody().strength(-400))
  .force('collide', d3.forceCollide().radius(d => getClassRadius(d)))
  .force("link",
    d3.forceLink()
      .id((d) => d.id)
      .distance(200)
      .strength(0.1)
  )
  .force("x", d3.forceX(width / 2).strength(0.02))
  .force("y", d3.forceY(height / 2).strength(0.02))
  .on("tick", ticked);

svg.call(drag(simulation))

svg.call(
  d3.zoom().on("zoom", (event) => {
    let originalTransform = svgWrapper.attr("transform")
    svgWrapper.attr("transform", zoomTransformString(originalTransform, event.transform.k))
  })
)


function ticked() {
  node
    .attr('transform', (d) =>`translate(${d.x}, ${d.y})`)

  link
    .attr('d', d => makeLinkPath(d.source, d.target))
}


function makeLinkPath(sourceNode, targetNode) {
  let source = new p5.Vector(sourceNode.x, sourceNode.y)
  let target = new p5.Vector(targetNode.x, targetNode.y)
  let targetEdgeIntersect = calculatePathToCircleEdge(source, target, getClassRadius(targetNode))
  let normalisedDir = p5.Vector.sub(target, source).normalize()

  // Place the quadratic bezier midpoint
  // halfway between source and target, orthogonally to direction by curveMidOffset
  let curveMidOffset = 130
  let midpoint = new p5.Vector(
    targetEdgeIntersect.x + source.x + normalisedDir.y * curveMidOffset,
    targetEdgeIntersect.y + source.y - normalisedDir.x * curveMidOffset
  ).div(2)

  return `
  M ${source.x} ${source.y}
  Q ${midpoint.x} ${midpoint.y} ${targetEdgeIntersect.x} ${targetEdgeIntersect.y}
  `
}


function calculatePathToCircleEdge(source, target, targetRadius) {
  let direction = p5.Vector.sub(target, source)
    .setMag(targetRadius + 13)  // increase radius to accommodate for the arrow
    .rotate(180)
  return p5.Vector.add(target, direction)
}


function updateForceVis(visData) {
  var linksData = 'links' in visData ? Object.values(visData.links) : []
  var classesData = 'classes' in visData ? Object.values(visData.classes) : []

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
        .on('click', (event, node) => {
          console.log(event.target.parentNode)
          event.target.parentNode.classList.add('activeNode')

          displayNodeInfo(event, node, getNodeLinks(node.id, link.data()))
        })
      nodeContainer.append("text")
        .text((d) => d.label)
        .classed('nodeLabel', true)
        .attr('text-anchor', 'middle')
        .attr("stroke-width", '1')
        .attr("stroke", "#000")
        .attr("fill", "#000")
        .attr('pointer-events', 'none')
      return nodeContainer
    });


  link = link
    .data(linksData, (d) => [d.source, d.target])
    .join(enter => enter.append('path').attr('pointer-events', 'none'));

  simulation.nodes(classesData);
  simulation.force("link").links(linksData);
  simulation.alpha(1).restart().tick();
  ticked(); // render now!
}


/**
 * Finds all outgoing links for the chosen node
 * @param {URI} nodeId
 * @param {Array} links
 * @returns {Array}
 */
function getNodeLinks(nodeId, links) {
  return links.filter(link => link.source.id == nodeId)
}


function addNode(nodeToAdd) {

}


function addLink(linkToAdd) {

}


var draggingBackground = false;

function drag(simulation) {
  function dragstarted(event) {
    draggingBackground = 'id' in event.sourceEvent.target && event.sourceEvent.target.id == "visSvg"

    if (!event.active) simulation.alphaTarget(0.3).restart();
    event.sourceEvent.stopPropagation();
    event.subject.fx = event.subject.x;
    event.subject.fy = event.subject.y;
  }

  function dragged(event) {
    event.sourceEvent.stopPropagation();
    if(draggingBackground) {
      let newTransform = moveTransformString(svgWrapper.attr('transform'), event.dx, event.dy)
      svgWrapper.attr('transform', newTransform)
    } else {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }
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
  return (Math.log(cls.count) / Math.log(10)) * 8
}

function moveTransformString(transform, dx, dy) {
  let translatePos = transform.indexOf("translate(") + 10
  let translateEnd = transform.indexOf(")", translatePos) // bind position to match correct ()
  let original = transform.substring(
    translatePos, translateEnd
  ).split(",");
  let newX = Number(original[0]) + dx
  let newY = Number(original[1]) + dy
  let newTransform = transform.replace(
    transform.substring(translatePos - 10, translateEnd + 1),
    `translate(${newX}, ${newY})`
  )
  return newTransform
}

function zoomTransformString(transform, newScale) {
  let scalePos = transform.indexOf("scale(") + 6
  let scaleEnd = transform.indexOf(")", scalePos) // bind position to match correct ()
  let newTransform = transform.replace(
    transform.substring(scalePos - 6, scaleEnd + 1),
    `scale(${newScale})`
  )
  return newTransform
}
