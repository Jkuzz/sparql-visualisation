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
    .setMag(targetRadius + 13) // increase radius to accommodate for the arrow
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
    Q ${midpoint.x} ${midpoint.y} ${targetEdgeIntersect.x} ${targetEdgeIntersect.y}
    `;
}
