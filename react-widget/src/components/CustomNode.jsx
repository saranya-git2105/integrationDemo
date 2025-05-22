import React, { useState, useRef, useEffect } from "react";
import { Handle, Position } from "reactflow";
import {
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import "./WorkflowEditor.css";

const propertyLabels = {
  stepName: "Step Name",
  purposeForForward: "Purpose Forward",
  shortPurposeForForward: "Short Purpose",
  stepActions: "Step Actions",
  commonActions: "Common Actions",
  //nodeShape: "Node Shape",
};

const CustomNode = ({ data, onRename, onEdit, onDelete, isLocked }) => {
  const { label, nodeShape, properties } = data;
  const [hovered, setHovered] = useState(false);
  const hoverTimeoutRef = useRef(null);

  useEffect(() => {
    // Cleanup timeout on unmount
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const getNodeClassName = () => {
    const baseClass = "node-base";
    switch (nodeShape) {
      case "Start":
        return `${baseClass} node-shape-start`;
      case "Stop":
        return `${baseClass} node-shape-stop`;
      case "Decision":
        return `${baseClass} node-shape-decision`;
      default:
        return `${baseClass} node-shape-step`;
    }
  };

  const renderHandleWithArrow = (type, position, id, className = "") => {
    const iconSize = 12;
    const arrowMap = {
      Top: type === "source" ? <ArrowUp size={iconSize} color="green" /> : <ArrowDown size={iconSize} color="red" />,
      Bottom: type === "source" ? <ArrowDown size={iconSize} color="green" /> : <ArrowUp size={iconSize} color="red" />,
      Left: type === "source" ? <ArrowLeft size={iconSize} color="green" /> : <ArrowRight size={iconSize} color="red" />,
      Right: type === "source" ? <ArrowRight size={iconSize} color="green" /> : <ArrowLeft size={iconSize} color="red" />,
    };

    return (
      <div className={`node-handle-container ${className}`}>
        <Handle
          type={type}
          position={Position[position]}
          id={id}
          isConnectable={typeof isLocked !== "undefined" ? !isLocked : true}
          className="handle"
        />
        {arrowMap[position]}
      </div>
    );
  };

  let hoverTimeout;
  const handleMouseLeave = (e) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeout = setTimeout(() => setHovered(false), 100);

  };

  const handleMouseEnter = (e) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    // Only show tooltip if hovering over node body, not handles
    if (!e.target.closest('.node-handle-container')) {
      setHovered(true);
    }
  };

  return (
    <div 
      className="node-wrapper"
      style={{ 
        position: 'relative',
        zIndex: hovered ? 100000 : 1,
        transform: 'translate(0, 0)' // Creates a new stacking context
      }}
    >
      {nodeShape === "Decision" ? (
        <div
          className={getNodeClassName()}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="decision-inner">
            {label}
          </div>

          {renderHandleWithArrow("target", "Top", "Decision-top-target", "handle-decision-top-target")}
          {renderHandleWithArrow("source", "Right", "Decision-right-source", "handle-decision-right-source")}
          {renderHandleWithArrow("target", "Bottom", "Decision-bottom-target", "handle-decision-bottom-target")}
          {renderHandleWithArrow("source", "Left", "Decision-left-source", "handle-decision-left-source")}
        </div>
      ) : (
        <div
          className={getNodeClassName()}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="node-content">{label}</div>

          {/* Start Node Handle */}
          {nodeShape === "Start" &&
            renderHandleWithArrow("source", "Bottom", "start-out", "handle-start-out")}

          {/* Stop Node Handle */}
          {nodeShape === "Stop" &&
            renderHandleWithArrow("target", "Top", "stop-in", "handle-stop-in")}

          {/* Step Node Arrows */}
          {nodeShape === "Step" && (
            <>
              {renderHandleWithArrow("target", "Top", "Step-top-target", "handle-step-top-target")}
              {renderHandleWithArrow("source", "Top", "Step-top-source", "handle-step-top-source")}
              {renderHandleWithArrow("target", "Right", "Step-right-target", "handle-step-right-target")}
              {renderHandleWithArrow("source", "Right", "Step-right-source", "handle-step-right-source")}
              {renderHandleWithArrow("target", "Bottom", "Step-bottom-target", "handle-step-bottom-target")}
              {renderHandleWithArrow("source", "Bottom", "Step-bottom-source", "handle-step-bottom-source")}
              {renderHandleWithArrow("target", "Left", "Step-left-target", "handle-step-left-target")}
              {renderHandleWithArrow("source", "Left", "Step-left-source", "handle-step-left-source")}
            </>
          )}
        </div>
      )}

      {/* Tooltip */}
      {/* Tooltip removed as per user request */}
    </div>
  );
};

export default CustomNode;