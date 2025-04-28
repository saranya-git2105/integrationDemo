import React, { useState } from "react";
import { Handle, Position } from "reactflow";
import {
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";

const propertyLabels = {
  stepName: "Step Name",
  purposeForForward: "Purpose Forward",
  shortPurposeForForward: "Short Purpose",
  stepActions: "Step Actions",
  commonActions: "Common Actions",
  nodeShape: "Node Shape",
};

const CustomNode = ({ data, onRename, onEdit, onDelete, isLocked }) => {
  const { label, nodeShape, properties } = data;
  const [hovered, setHovered] = useState(false);

  const getShapeStyle = () => {
    switch (nodeShape) {
      case "Start":
        return { width: 50, height: 50, borderRadius: "50%", background: "#9fda7c" };
      case "Stop":
        return { width: 50, height: 50, borderRadius: "50%", background: "#FFB7B4" };
      case "Decision":
        return {
          width: 80,
          height: 80,
          background: "#B388EB",
          zIndex: 1,
          position: "relative",
          clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
          overflow: "visible",
        };
      default:
        return { width: 120, height: 50, borderRadius: "8px", background: "#82d6f7" };
    }
  };

  const shapeStyle = {
    ...getShapeStyle(),
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 12,
    position: "relative",
    cursor: "pointer",
    border: hovered ? "1px solid #333" : "1px solid #000",
    transition: "border 0.2s",
  };

  const renderHandleWithArrow = (type, position, id, style = {}) => {
    const iconSize = 12;
    const arrowMap = {
      Top: type === "source" ? <ArrowUp size={iconSize} color="green" /> : <ArrowDown size={iconSize} color="red" />,
      Bottom: type === "source" ? <ArrowDown size={iconSize} color="green" /> : <ArrowUp size={iconSize} color="red" />,
      Left: type === "source" ? <ArrowLeft size={iconSize} color="green" /> : <ArrowRight size={iconSize} color="red" />,
      Right: type === "source" ? <ArrowRight size={iconSize} color="green" /> : <ArrowLeft size={iconSize} color="red" />,
    };

    return (
      <div
        style={{
          position: "absolute",
          pointerEvents: "all",
          zIndex: 10,
          ...style,
        }}
      >
        <Handle
          type={type}
          position={Position[position]}
          id={id}
          isConnectable={typeof isLocked !== "undefined" ? !isLocked : true}
          style={{
            width: 8,
            height: 8,
            background: "rgba(0,255,0,0.3)", // debug color
            position: "absolute",
            opacity: 0, // invisible hitbox
          }}
        />
        {arrowMap[position]}
      </div>
    );
  };

  let hoverTimeout;
  const handleMouseLeave = () => {
    hoverTimeout = setTimeout(() => setHovered(false), 200);
  };
  const handleMouseEnter = () => {
    clearTimeout(hoverTimeout);
    setHovered(true);
  };

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ position: "relative", display: "inline-block" }}
    >
      {nodeShape === "Decision" ? (
        // 🟪 Special wrapper for Decision node
        <div style={{ ...shapeStyle, overflow: "visible", background: "transparent", clipPath: "none" }}>
          <div
            style={{
              width: "100%",
              height: "100%",
              background: "#B388EB",
              clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              fontWeight: "bold",
              fontSize: 12,
              padding: "4px",
              color: "#fff",
            }}
          >
            {label}
          </div>

          {renderHandleWithArrow("target", "Top", "Decision-top-target", { top: -20, left: "50%", transform: "translateX(-50%)" })}
          {renderHandleWithArrow("source", "Right", "Decision-right-source", { right: -12, top: "50%", transform: "translateY(-50%)" })}
          {renderHandleWithArrow("target", "Bottom", "Decision-bottom-target", { bottom: -12, left: "50%", transform: "translateX(-50%)" })}
          {renderHandleWithArrow("source", "Left", "Decision-left-source", { left: -12, top: "50%", transform: "translateY(-50%)" })}
        </div>
      ) : (
        
        // 🔷 All other nodes
        <div style={shapeStyle}>
          <div style={{ padding: "4px", textAlign: "center" }}>{label}</div>

          {/* Start Node Handle */}
          {nodeShape === "Start" &&
            renderHandleWithArrow("source", "Bottom", "start-out", { bottom: -12, left: "50%", transform: "translateX(-50%)" })}

          {/* Stop Node Handle */}
          {nodeShape === "Stop" &&
            renderHandleWithArrow("target", "Top", "stop-in", { top: -12, left: "50%", transform: "translateX(-50%)" })}

          {/* Step Node Arrows */}
          {nodeShape === "Step" && (
            <>
              {renderHandleWithArrow("target", "Top", "Step-top-target", { top: -12, left: "30%", transform: "translateX(-50%)" })}
              {renderHandleWithArrow("source", "Top", "Step-top-source", { top: -12, left: "70%", transform: "translateX(-50%)" })}
              {renderHandleWithArrow("target", "Right", "Step-right-target", { right: -12, top: "30%", transform: "translateY(-50%)" })}
              {renderHandleWithArrow("source", "Right", "Step-right-source", { right: -12, top: "70%", transform: "translateY(-50%)" })}
              {renderHandleWithArrow("target", "Bottom", "Step-bottom-target", { bottom: -13, left: "30%", transform: "translateX(-50%)" })}
              {renderHandleWithArrow("source", "Bottom", "Step-bottom-source", { bottom: -13, left: "70%", transform: "translateX(-50%)" })}
              {renderHandleWithArrow("target", "Left", "Step-left-target", { left: -12, top: "30%", transform: "translateY(-50%)" })}
              {renderHandleWithArrow("source", "Left", "Step-left-source", { left: -12, top: "70%", transform: "translateY(-50%)" })}
            </>
          )}
        </div>
      )}

      {/* Tooltip */}
      {hovered && properties && Object.keys(properties).length > 0 && (() => {
        const nodeX = data.__rf?.position?.x || 0;
        const isLeftSide = nodeX < 300;

        return (
          <div
            style={{
              position: "absolute",
              background: "#fefce8",
              color: "#1e293b",
              border: "1px solid #facc15",
              borderRadius: 8,
              padding: "12px",
              fontSize: "13px",
              minWidth: "200px",
              maxWidth: "280px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              zIndex: 2000,
              whiteSpace: "normal",
              textAlign: "left",
              opacity: 0.95,
              ...(isLeftSide ? { left: "110%", top: "0%" } : { right: "110%", top: "0%" }),
            }}
          >
            <strong style={{ display: "block", marginBottom: 6 }}>🔍 Properties</strong>
            {Object.entries(properties).map(([key, value]) => {
              if (!value || (Array.isArray(value) && value.length === 0)) return null;
              return (
                <div key={key} style={{ marginBottom: 4 }}>
                  <strong>{propertyLabels[key] || key}:</strong>{" "}
                  {Array.isArray(value) ? (
                    <ul style={{ paddingLeft: 16, margin: 0 }}>
                      {value.map((item, idx) => (
                        <li key={idx} style={{ fontSize: "12px", textAlign: "left" }}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <span>{value}</span>
                  )}
                </div>
              );
            })}
          </div>
        );
      })()}
    </div>
  );
};

export default CustomNode;