const svg = d3
  .select('#visSvg')

let width = svg.style('width').slice(0, -2)
let height = svg.style('height').slice(0, -2)


const svgWrapper = svg.append('g')
  .classed('wrapper', true)
  .attr('transform', 'translate(0, 0) scale(1)')


var link = svgWrapper
  .append("g")
    .attr('id', 'linkContainer')
    .attr("stroke-opacity", 1)
    .attr('stroke', 'black')
    .attr("stroke-width", 5)
    .attr('marker-end', 'url(#arrowHead)')
    .attr('fill', 'none')
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

const mainPathColour = 'hsl(336, 100%, 55%)'
const secondaryPathColour = 'hsl(336, 100%, 75%)'
document.querySelector('#arrowHeadMain').setAttribute('fill', mainPathColour)
document.querySelector('#arrowHeadSecondary').setAttribute('fill', secondaryPathColour)

var nodeClickManager = new NodeClickManager()

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
          nodeClickManager.clickNode(event.target.parentNode, link)
          displayNodeInfo(node, getNodeLinks(node.id, link.data()))
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
    .join(enter => enter.append('path')
      .on('click', (event, path) => {
        nodeClickManager.clickPath(event, path, link)
      })
      .on('mouseover', (event, path) => {
        if(!event.target.hasAttribute('clicked')) {
          event.target.setAttribute('stroke', secondaryPathColour)
          event.target.setAttribute('marker-end', 'url(#arrowHeadSecondary)')
        }
      })
      .on('mouseout', (event, path) => {
        if(!event.target.hasAttribute('clicked') && !event.target.classList.contains('highlight')) {
          event.target.setAttribute('stroke', 'black')
          event.target.setAttribute('marker-end', 'url(#arrowHead)')
        }
      })
    );

  simulation.nodes(classesData);
  simulation.force("link").links(linksData);
  simulation.alpha(1).restart().tick();
  ticked(); // render now!
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
