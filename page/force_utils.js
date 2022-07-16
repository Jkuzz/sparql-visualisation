function getClassRadius(cls) {
  return Math.max(Math.log(cls.count) / Math.log(1.2) - 15, 8);
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
  let direction = p5.Vector.sub(source, target)
    .setMag(targetRadius + 20) // increase radius to accommodate for the arrow
  return p5.Vector.add(target, direction)
}

/**
 * Calculate bezier curve representing path between two nodes, label-aware
 * @param {*} link data item of the link label
 * @param {*} nodes nodes of simulation to find proper source and target in
 * @returns {String} representation of svg path curve
 */
function makeLinkPath(link, nodes) {
  let sourceNode = nodes.filter(n => n.id == link.source)[0]
  let targetNode = nodes.filter(n => n.id == link.target)[0]

  let source = new p5.Vector(sourceNode.x, sourceNode.y)
  let target = new p5.Vector(targetNode.x, targetNode.y)
  let label = new p5.Vector(link.x, link.y);
  let targetEdgeIntersect = calculatePathToCircleEdge(
    label,
    target,
    getClassRadius(targetNode)
  )

  // Place the quadratic bezier midpoint so that label is on the path
  // This means it has to be twice as far from midpoint as label is from midpoint
  let midpoint = new p5.Vector(
    targetEdgeIntersect.x + source.x,
    targetEdgeIntersect.y + source.y
  ).div(2)
  let bezierPoint =  midpoint.add(label.sub(midpoint).mult(2))

  return `
    M ${source.x} ${source.y}
    Q ${bezierPoint.x} ${bezierPoint.y} ${targetEdgeIntersect.x} ${targetEdgeIntersect.y}`
}


class NodeClickManager {
  lastClickedNode = null
  lastClickedPath = null

  clickNode = (clickedNode, links) => {
    if(this.lastClickedNode != null) {
      this.lastClickedNode.classList.remove('activeNode')
    }
    this.lastClickedNode = clickedNode
    if(clickedNode == null) {
      return // Only deselect was requested
    }
    this.clickPath(null, null, links)  // deselect clicked link
    clickedNode.classList.add('activeNode')
  }

  clickPath = (event, path, allLinks) => {
    // If clicked path label, get the path first
    let target
    if(event.target.nodeName != 'path') {
      target = allLinks.filter(d => d.id == path.id).node()
    } else {
      target = event.target
    }

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
    this.lastClickedPath = target

    this.clickNode(null)  // deselect clicked node
    allLinks  // Secondary highlight those with same URI as clicked path
      .filter(d => d.uri == path.uri)
      .classed('highlight', true)  // This is to not unclolour on mouseout
      .attr('stroke', secondaryPathColour)
      .attr('marker-end', 'url(#arrowHeadSecondary)')

    // Main highlight clicked path last
    target.classList.add('clicked')
    target.setAttribute('stroke', mainPathColour)
    target.setAttribute('stroke-width', 8)
    target.setAttribute('marker-end', 'url(#arrowHeadMain)')

    displayPathInfo(path)
  }
}
