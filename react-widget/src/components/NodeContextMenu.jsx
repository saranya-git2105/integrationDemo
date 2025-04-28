import React from "react";
import { MarkerType } from "reactflow";

const NodeContextMenu = ({
  node,
  position,
  onClose,
  onRename,
  onDelete,
  onAddConnected,
  onDuplicate,
  dragging,
  setDragging,
  dragOffset,
  setPosition,
  setDragOffset,
}) => {
  if (!node || !position) return null;

  return (
    <div
      style={{
        position: "absolute",
        top: position.y,
        left: position.x,
        background: "white",
        border: "1px solid black",
        padding: "10px",
        zIndex: 1000,
        minWidth: "140px",
        cursor: dragging ? "grabbing" : "grab",
      }}
      onMouseDown={(e) => {
        setDragging(true);
        setDragOffset({
          x: e.clientX - position.x,
          y: e.clientY - position.y,
        });
      }}
      onMouseMove={(e) => {
        if (dragging) {
          setPosition({
            x: e.clientX - dragOffset.x,
            y: e.clientY - dragOffset.y,
          });
        }
      }}
      onMouseUp={() => setDragging(false)}
      onMouseLeave={() => setDragging(false)}
    >
      <p onClick={onDelete} style={{ cursor: "pointer", marginBottom: "5px" }}>
        🗑 Delete Node
      </p>
      <p onClick={onRename} style={{ cursor: "pointer", marginBottom: "5px" }}>
        ✏️ Rename Node
      </p>
      <p onClick={onAddConnected} style={{ cursor: "pointer", marginBottom: "5px" }}>
        ➕ Add Connected Node
      </p>
      <p onClick={onDuplicate} style={{ cursor: "pointer" }}>
        🔁 Duplicate Node
      </p>
    </div>
  );
};

export default NodeContextMenu;
