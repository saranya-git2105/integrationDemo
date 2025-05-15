import React from 'react';
import { getSmoothStepPath, EdgeLabelRenderer, BaseEdge  } from 'reactflow';

const CustomSmoothEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd, label,
  style,
}) => {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 10,
  });

  // Optional: calculate label offset from edge midpoint
  const deltaX = targetX - sourceX;
  const deltaY = targetY - sourceY;
  const angle = Math.atan2(deltaY, deltaX);
  const offsetX = Math.cos(angle) * 30;
  const offsetY = Math.sin(angle) * 10;

  return (
    <>
      <path
        id={id}
        style={style}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
      />
      <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={style} />
      {label && (
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX + offsetX}px, ${labelY + offsetY}px)`,
            background: 'white',
            padding: '4px 8px',
            borderRadius: 6,
            fontSize: 12,
            pointerEvents: 'none',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            zIndex: 1000,
          }}
        >
          {label}
        </div>
      </EdgeLabelRenderer>
      )}
    </>
  );
};

export default CustomSmoothEdge;
