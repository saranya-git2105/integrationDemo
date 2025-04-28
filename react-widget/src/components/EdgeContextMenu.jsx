import React from "react";
import Select from "react-select";

const EdgeContextMenu = ({
  edge,
  position,
  onClose,
  onDelete,
  onUpdateLabel,
  onUpdateShortPurpose,
  onUpdatePurpose,
  dragging,
  setDragging,
  dragOffset,
  setPosition,
  setDragOffset,
}) => {
  if (!edge || !position) return null;

  return (
    <div
      id="edge-context-menu"
      style={{
        position: "absolute",
        top: position.y,
        left: position.x,
        background: "white",
        border: "1px solid black",
        borderRadius: "10px",
        boxShadow: "0 4px 10px rgba(0, 0, 0, 0.3)",
        padding: "10px",
        zIndex: 1000,
        minWidth: "250px",
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
      <label style={{ marginTop: "15px", display: "block", marginBottom: "5px" }}>
        Select Edge Action:
      </label>
      <Select
        options={[
          { label: "Approve", value: "Approve" },
          { label: "Reject", value: "Reject" },
          { label: "Review", value: "Review" },
          { label: "Send Back", value: "Send Back" },
          { label: "Forward", value: "Forward" },
          { label: "Save", value: "Save" },
        ]}
        value={{ label: edge.label, value: edge.label }}
        onChange={(selected) => onUpdateLabel(selected.value)}
      />

      <label style={{ marginTop: "10px", display: "block" }}>
        Short Purpose for Forward:
      </label>
      <input
        type="text"
        value={edge?.data?.shortPurposeForForward || ""}
        onChange={(e) => onUpdateShortPurpose(e.target.value)}
        style={{
          padding: "8px",
          borderRadius: "6px",
          border: "1px solid #ccc",
          marginBottom: "10px",
          width: "90%",
        }}
      />

      <label style={{ display: "block", marginBottom: "5px" }}>
        Purpose for Forward:
      </label>
      <textarea
        rows={4}
        value={edge?.data?.purposeForForward || ""}
        onChange={(e) => onUpdatePurpose(e.target.value)}
        style={{
          padding: "6px",
          borderRadius: "5px",
          border: "1px solid #ccc",
          resize: "vertical",
          width: "90%",
        }}
      />

      <hr style={{ margin: "10px 0" }} />
      <p onClick={onDelete} style={{ color: "red", cursor: "pointer" }}>
        🗑 Delete Edge
      </p>
    </div>
  );
};

export default EdgeContextMenu;
