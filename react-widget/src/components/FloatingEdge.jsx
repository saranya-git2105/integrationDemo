import React from 'react';
import { getSmoothStepPath } from 'reactflow';

const FloatingEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  style = {},
  markerEnd,
}) => {
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    borderRadius: 10,
  });

  return (
    <path
      id={id}
      style={{ ...style, strokeWidth: 2 }}
      className="react-flow__edge-path"
      d={edgePath}
      markerEnd={markerEnd}
    />
  );
};

export default FloatingEdge;
