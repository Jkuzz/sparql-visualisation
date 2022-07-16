function getClassRadius(cls) {
  return (Math.log(cls.count) / Math.log(10)) * 8;
}

function moveTransformString(transform, dx, dy) {
  let translatePos = transform.indexOf("translate(") + 10;
  let translateEnd = transform.indexOf(")", translatePos); // bind position to match correct ()
  let original = transform.substring(translatePos, translateEnd).split(",");
  let newX = Number(original[0]) + dx;
  let newY = Number(original[1]) + dy;
  let newTransform = transform.replace(
    transform.substring(translatePos - 10, translateEnd + 1),
    `translate(${newX}, ${newY})`
  );
  return newTransform;
}

function zoomTransformString(transform, newScale) {
  let scalePos = transform.indexOf("scale(") + 6;
  let scaleEnd = transform.indexOf(")", scalePos); // bind position to match correct ()
  let newTransform = transform.replace(
    transform.substring(scalePos - 6, scaleEnd + 1),
    `scale(${newScale})`
  );
  return newTransform;
}

/**
 * Finds all outgoing links for the chosen node
 * @param {URI} nodeId
 * @param {Array} links
 * @returns {Array}
 */
function getNodeLinks(nodeId, links) {
  return links.filter((link) => link.source.id == nodeId);
}

function calculatePathToCircleEdge(source, target, targetRadius) {
  let direction = p5.Vector.sub(target, source)
    .setMag(targetRadius + 20) // increase radius to accommodate for the arrow
    .rotate(180);
  return p5.Vector.add(target, direction);
}

function makeLinkPath(sourceNode, targetNode) {
  let source = new p5.Vector(sourceNode.x, sourceNode.y);
  let target = new p5.Vector(targetNode.x, targetNode.y);
  let targetEdgeIntersect = calculatePathToCircleEdge(
    source,
    target,
    getClassRadius(targetNode)
  );
  let normalisedDir = p5.Vector.sub(target, source).normalize();

  // Place the quadratic bezier midpoint
  // halfway between source and target, orthogonally to direction by curveMidOffset
  let curveMidOffset = 130;
  let midpoint = new p5.Vector(
    targetEdgeIntersect.x + source.x + normalisedDir.y * curveMidOffset,
    targetEdgeIntersect.y + source.y - normalisedDir.x * curveMidOffset
  ).div(2);

  return `
    M ${source.x} ${source.y}
    Q ${midpoint.x} ${midpoint.y} ${targetEdgeIntersect.x} ${targetEdgeIntersect.y}`;
}

class NodeClickManager {
  lastClickedNode = null;
  lastClickedPath = null

  clickNode = (clickedNode, links) => {
    if(this.lastClickedNode != null) {
      this.lastClickedNode.classList.remove('activeNode')
    }
    this.lastClickedNode = clickedNode
    if(clickedNode == null) {
      return // Only deselect was requested
    }
    this.clickPath(null, null, links)
    clickedNode.classList.add('activeNode')
  }

  clickPath = (event, path, allLinks) => {
    if(this.lastClickedPath != null) {
      this.lastClickedPath.classList.remove('clicked')
      this.lastClickedPath.removeAttribute('stroke-width')
      this.lastClickedPath.removeAttribute('stroke')
      this.lastClickedPath.removeAttribute('marker-end')
    }
    allLinks  // Reset all links first
      .classed('highlight', false)
      .attr('stroke', null)
      .attr('marker-end', null)

    if(event == null) {
      this.lastClickedPath = null
      return // Only deselect
    }
    this.lastClickedPath = event.target

    this.clickNode(null)
    allLinks  // Secondary highlight those with same URI as clicked path
      .filter(d => d.id == path.id)
      .classed('highlight', true)  // This is to not unclolour on mouseout
      .attr('stroke', secondaryPathColour)
      .attr('marker-end', 'url(#arrowHeadSecondary)')

    // Main highlight clicked path last
    event.target.classList.add('clicked')
    event.target.setAttribute('stroke', mainPathColour)
    event.target.setAttribute('stroke-width', 8)
    event.target.setAttribute('marker-end', 'url(#arrowHeadMain)')

    displayPathInfo(path)
  }
}
