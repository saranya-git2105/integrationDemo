const handleMap = ['top', 'right', 'bottom', 'left'];

export function pickHandleFromAngle(angleDeg) {
    if (angleDeg >= -45 && angleDeg < 45) return 'right';
    if (angleDeg >= 45 && angleDeg < 135) return 'bottom';
    if (angleDeg >= -135 && angleDeg < -45) return 'top';
    return 'left';
}

// Cycles through available handles per direction (source/target) for each node
export function getNextAvailableHandle(nodeId, direction, angle, map) {
    const allHandles = ['top', 'right', 'bottom', 'left'];
    if (!map[nodeId]) map[nodeId] = {};
  if (!map[nodeId][direction]) map[nodeId][direction] = { index: 0 };

  const index = map[nodeId][direction].index % allHandles.length;
  const selected = allHandles[index];

  map[nodeId][direction].index += 1;

  return selected;
}
