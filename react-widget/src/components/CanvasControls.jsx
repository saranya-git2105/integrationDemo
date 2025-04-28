// CanvasControls.jsx
import React from "react";
import { FiGrid, FiSquare, FiTarget, FiLayers } from "react-icons/fi";

const CanvasControls = ({ backgroundVariant, setBackgroundVariant }) => {
  const backgroundOptions = [
    { label: "Dots", value: "dots", icon: <FiTarget size={14} /> },
    { label: "Lines", value: "lines", icon: <FiLayers size={14} /> },
    { label: "Grid", value: "cross", icon: <FiGrid size={14} /> },
    { label: "Solid", value: "solid", icon: <FiSquare size={14} /> },
  ];

  return (
    <div
      style={{
        position: "absolute",
        top: "300px",
        right: "10px",
        zIndex: 20,
        background: "#ffffff",
        borderRadius: "10px",
        boxShadow: "0 6px 20px rgba(0, 0, 0, 0.12)",
        border: "1px solid #e2e8f0",
        overflow: "hidden",
        width: "65px",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div
        style={{
          background: "#f8fafc",
          padding: "5px",
          fontSize: "10px",
          fontWeight: "bold",
          borderBottom: "1px solid #e2e8f0",
          textAlign: "center",
        }}
      >
        Background
      
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {backgroundOptions.map(({ label, value, icon }) => (
          <div
            key={value}
            onClick={() => setBackgroundVariant(value)}
            style={{
              display: "flex",
              alignItems: "center",
              padding: "8px",
              gap: "6px",
              cursor: "pointer",
              background: backgroundVariant === value ? "#e0f2fe" : "#ffffff",
              borderLeft:
                backgroundVariant === value ? "4px solid #0284c7" : "4px solid transparent",
              transition: "all 0.2s ease-in-out",
              fontSize: "13px",
            }}
          >
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CanvasControls;
