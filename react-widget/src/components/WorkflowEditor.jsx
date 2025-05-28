import React, {
  useState,
  useCallback,
  useEffect,
  useMemo,
  useImperativeHandle,
  forwardRef,
  useRef,
} from "react";
import ReactFlow, {
  addEdge,
  Controls,
  MiniMap,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  useReactFlow,
  EdgeLabelRenderer,
  applyNodeChanges,
  applyEdgeChanges,
} from "reactflow";
import { ControlButton } from "reactflow";
import { FaLock, FaUnlock } from "react-icons/fa";
import "reactflow/dist/style.css";
import Modal from "react-modal";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import CustomNode from "./CustomNode";
import CustomSmoothEdge from "./CustomSmoothEdge";
import { generate_styled_edges, layoutTopDownCustom } from "../utils/layout";
import Select from "react-select";
import logger from "../utils/logger";
import {
  FiEye,
  FiDownload,
  FiRotateCw,
  FiPlusCircle,
  FiFolder,
  FiSave,
  FiRotateCcw,
  FiRefreshCw,
  FiGrid,
} from "react-icons/fi";

import "./WorkflowEditor.css";

Modal.setAppElement(document.querySelector(".container"));
const nodeWidth = 150;
const nodeHeight = 60;

const WorkflowEditor = forwardRef(
  ({ config = { nodeTypes: {}, buttons: {} }, apiUrls = {} }, props, ref) => {
    config = typeof config === "string" ? JSON.parse(config) : config;
    apiUrls = typeof apiUrls === "string" ? JSON.parse(apiUrls) : apiUrls;
    const { setViewport } = useReactFlow();
    const [history, setHistory] = useState([{ nodes: [], edges: [] }]);
    const [undoStack, setUndoStack] = useState([]);
    const [redoStack, setRedoStack] = useState([]);
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [modalIsOpen1, setModalIsOpen1] = useState(false);
    const [jsonData, setJsonData] = useState("");
    const [contextMenu, setContextMenu] = useState(null);
    const [selectedEdge, setSelectedEdge] = useState(null);
    const [selectedNode, setSelectedNode] = useState(null);
    const [nodeProperties, setNodeProperties] = useState({});
    const [saveButtonColor, setSaveButtonColor] = useState('#4b49ac');
    const nodeTypes = useMemo(
      () => ({
        custom: (nodeProps) => (
          <CustomNode {...nodeProps} isConnectable={true} />
        ),
      }),
      []
    );
    const [nodeContextMenu, setNodeContextMenu] = useState(null);
    const [isLocked, setIsLocked] = useState(false);
    const [lockedToast, setLockedToast] = useState(false);
    const [allWorkflows, setAllWorkflows] = useState([]);
    const [selectedWorkflowOption, setSelectedWorkflowOption] = useState(null);
    const [stepActionsOptions, setStepActionsOptions] = useState([]);
    const [stepUsersOptions, setStepUsersOptions] = useState([]);
    const [workflowMeta, setWorkflowMeta] = useState({
      name: "",
      description: "",
      dateEffective: new Date().toISOString(),
    });
    const [loadedWorkflowMeta, setLoadedWorkflowMeta] = useState(null);
    const [metaModalOpen, setMetaModalOpen] = useState(false);
    const [pendingAction, setPendingAction] = useState(null);
    const [loadWorkflowModalOpen, setLoadWorkflowModalOpen] = useState(false);
    const [selectedWorkflowToLoad, setSelectedWorkflowToLoad] = useState(null);
    const [hoveredEdgeId, setHoveredEdgeId] = useState(null);
    const [selectedElements, setSelectedElements] = useState([]);
    const [hoveredNodeId, setHoveredNodeId] = useState(null);
    let hoverTimeout;
    const { getNodes, getEdges } = useReactFlow();
    const reactFlowInstance = useReactFlow();
    const [backgroundVariant, setBackgroundVariant] = useState("dots"); // 'dots', 'lines', 'cross', or 'solid'
    const [edgeStyle, setEdgeStyle] = useState("customSmooth");
    const edgeTypes = useMemo(
      () => ({
        customSmooth: CustomSmoothEdge,
      }),
      []
    );
    const [nodeMenuPosition, setNodeMenuPosition] = useState({ x: 0, y: 0 });
    const [isDraggingNodeMenu, setIsDraggingNodeMenu] = useState(false);
    const [edgeMenuPosition, setEdgeMenuPosition] = useState({ x: 0, y: 0 });
    const [isDraggingEdgeMenu, setIsDraggingEdgeMenu] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [workflowForm, setWorkflowForm] = useState(null);
    const sidebarNodeTypes = useMemo(
      () =>
        [
          { label: "Start", color: "#9fda7c", shape: "circle" },
          { label: "Step", color: "#82d6f7", shape: "rect" },
          { label: "Stop", color: "#FFB7B4", shape: "circle" },
        ].filter(({ label }) => config?.nodeTypes?.[label] !== false),
      [config]
    );

    const [nodeCount, setNodeCount] = useState(2); // Add this state for node counter
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [drawerNode, setDrawerNode] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [drawerNodeProperties, setDrawerNodeProperties] = useState({});
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [pendingTemplateAction, setPendingTemplateAction] = useState(null);

    // Add template workflows
    const templateWorkflows = useMemo(
      () => [
        {
          label: "2-Step Template",
          description: "Start → Step → Step → Stop",
          template: {
            nodes: [
              {
                id: "start",
                type: "custom",
                position: { x: 100, y: 100 },
                data: { label: "Start", nodeShape: "Start" }
              },
              {
                id: "step1",
                type: "custom",
                position: { x: 87.81411960132891, y: 206.41362126245843 },
                data: { label: "Step 1", nodeShape: "Step" }
              },
              {
                id: "step2",
                type: "custom",
                position: { x: 134.63355481727575, y: 317.3167774086379 },
                data: { label: "Step 2", nodeShape: "Step" }
              },
              {
                id: "stop",
                type: "custom",
                position: { x: 192.356146179402, y: 418.9843101291086 },
                data: { label: "Stop", nodeShape: "Stop" }
              }
            ],
            edges: [
              {
                id: "start-step1",
                source: "start",
                target: "step1",
                sourceHandle: "Start-bottom-source",
                targetHandle: "Step-top-target",
                type: "straight",
                markerEnd: { type: MarkerType.ArrowClosed },
                style: { strokeWidth: 2, stroke: "#333" }
              },
              {
                id: "step1-step2",
                source: "step1",
                target: "step2",
                sourceHandle: "Step-bottom-source",
                targetHandle: "Step-top-target",
                type: "straight",
                markerEnd: { type: MarkerType.ArrowClosed },
                style: { strokeWidth: 2, stroke: "#333" }
              },
              {
                id: "step2-stop",
                source: "step2",
                target: "stop",
                sourceHandle: "Step-bottom-source",
                targetHandle: "Stop-top-target",
                type: "straight",
                markerEnd: { type: MarkerType.ArrowClosed },
                style: { strokeWidth: 2, stroke: "#333" }
              }
            ]
          }
        },
        {
          label: "3-Step Template",
          description: "Start → Step → Step → Step → Stop",
          template: {
            nodes: [
              {
                id: "start",
                type: "custom",
                position: { x: 100, y: 100 },
                data: { label: "Start", nodeShape: "Start" }
              },
              {
                id: "step1",
                type: "custom",
                position: { x: 87.81411960132891, y: 206.41362126245843 },
                data: { label: "Step 1", nodeShape: "Step" }
              },
              {
                id: "step2",
                type: "custom",
                position: { x: 134.63355481727575, y: 317.3167774086379 },
                data: { label: "Step 2", nodeShape: "Step" }
              },
              {
                id: "step3",
                type: "custom",
                position: { x: 192.356146179402, y: 418.9843101291086 },
                data: { label: "Step 3", nodeShape: "Step" }
              },
              {
                id: "stop",
                type: "custom",
                position: { x: 250, y: 520 },
                data: { label: "Stop", nodeShape: "Stop" }
              }
            ],
            edges: [
              {
                id: "start-step1",
                source: "start",
                target: "step1",
                sourceHandle: "Start-bottom-source",
                targetHandle: "Step-top-target",
                type: "straight",
                markerEnd: { type: MarkerType.ArrowClosed },
                style: { strokeWidth: 2, stroke: "#333" }
              },
              {
                id: "step1-step2",
                source: "step1",
                target: "step2",
                sourceHandle: "Step-bottom-source",
                targetHandle: "Step-top-target",
                type: "straight",
                markerEnd: { type: MarkerType.ArrowClosed },
                style: { strokeWidth: 2, stroke: "#333" }
              },
              {
                id: "step2-step3",
                source: "step2",
                target: "step3",
                sourceHandle: "Step-bottom-source",
                targetHandle: "Step-top-target",
                type: "straight",
                markerEnd: { type: MarkerType.ArrowClosed },
                style: { strokeWidth: 2, stroke: "#333" }
              },
              {
                id: "step3-stop",
                source: "step3",
                target: "stop",
                sourceHandle: "Step-bottom-source",
                targetHandle: "Stop-top-target",
                type: "straight",
                markerEnd: { type: MarkerType.ArrowClosed },
                style: { strokeWidth: 2, stroke: "#333" }
              }
            ]
          }
        }
      ],
      []
    );

    // Add this function to generate dynamic template
    const generateDynamicTemplate = (count) => {
      const nodes = [];
      const edges = [];
      const baseY = 100;
      const yIncrement = 110;

      // Add Start node
      nodes.push({
        id: "start",
        type: "custom",
        position: { x: 100, y: baseY },
        data: { label: "Start", nodeShape: "Start", properties: { StepName: "Start" } }
      });

      // Add Step nodes
      for (let i = 0; i < count; i++) {
        const yPos = baseY + (i + 1) * yIncrement;
        const xPos = 87.81411960132891 + (i * 46.81943521594684);

        nodes.push({
          id: `step${i + 1}`,
          type: "custom",
          position: { x: xPos, y: yPos },
          data: {
            label: `Step ${i + 1}`,
            nodeShape: "Step",
            properties: { StepName: `Step ${i + 1}` }
          }
        });

        // Add edge from previous node
        const sourceId = i === 0 ? "start" : `step${i}`;
        const sourceHandle = i === 0 ? "Start-bottom-source" : "Step-bottom-source";

        edges.push({
          id: `${sourceId}-step${i + 1}`,
          source: sourceId,
          target: `step${i + 1}`,
          sourceHandle,
          targetHandle: "Step-top-target",
          type: "straight",
          markerEnd: { type: MarkerType.ArrowClosed },
          style: { strokeWidth: 2, stroke: "#333" },
          label: "",
          data: {
            shortPurposeForForward: "",
            purposeForForward: "",
            sourceHandle,
            targetHandle: "Step-top-target"
          }
        });
      }
      // Add Stop node
      const stopY = baseY + (count + 1) * yIncrement;
      const stopX = 192.356146179402 + ((count - 1) * 46.81943521594684);

      nodes.push({
        id: "stop",
        type: "custom",
        position: { x: stopX, y: stopY },
        data: { label: "Stop", nodeShape: "Stop", properties: { StepName: "Stop" } }
      });
      // Add final edge to Stop
      edges.push({
        id: `step${count}-stop`,
        source: `step${count}`,
        target: "stop",
        sourceHandle: "Step-bottom-source",
        targetHandle: "Stop-top-target",
        type: "straight",
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { strokeWidth: 2, stroke: "#333" },
        label: "",
        data: {
          shortPurposeForForward: "",
          purposeForForward: "",
          sourceHandle: "Step-bottom-source",
          targetHandle: "Stop-top-target"
        }
      });
      return { nodes, edges };
    };
    // Add this function to handle dynamic template loading
    const loadDynamicTemplate = (e) => {
      // Prevent any default behavior or event bubbling
      e?.preventDefault();
      e?.stopPropagation();

      // Show toast immediately if there are existing nodes
      if (nodes.length > 0) {
        // Force immediate toast display
        toast.error("Please clear the canvas before generating a new template.", {
          position: "top-right",
          autoClose: 500,
          hideProgressBar: true,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          onOpen: () => {
            // Force a re-render to ensure toast is visible
            setNodes([...nodes]);
          }
        });
        return;
      }

      if (isLocked) {
        showLockedToast();
        return;
      }

      // Generate and apply template
      const template = generateDynamicTemplate(nodeCount);
      setNodes([]);
      setEdges([]);
      setNodes(template.nodes);
      setEdges(template.edges);
    };

    // Handle template confirmation
    const handleTemplateConfirm = () => {
      // Generate template only when confirmed
      const template = generateDynamicTemplate(nodeCount);
      setNodes([]);
      setEdges([]);
      setNodes(template.nodes);
      setEdges(template.edges);
      setConfirmModalOpen(false);
    };

    // Handle template cancellation
    const handleTemplateCancel = () => {
      setConfirmModalOpen(false);
    };

    const handleActionWithMeta = useCallback(
      (actionType) => {
        logger.debug("NODES:", nodes);
        const startNodeExists = nodes.some(
          (node) => node.data?.nodeShape === "Start"
        );

        if (!startNodeExists && actionType !== "view") {
          toast.warning("Please drag and place a Start node first before saving or viewing the workflow.", {
            position: "top-right",
            autoClose: 500,
            hideProgressBar: true,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });
          return;
        }
        /*if (actionType === "save") {
      if (!workflowMeta.name || !workflowMeta.description) {
        setPendingAction(actionType);
        setMetaModalOpen(true);
        return;
      }
      saveWorkflowToAPI();
      return;
    }*/

        if (actionType === "view") {
          viewJson();
          return;
        }

        if (actionType === "download") {
          downloadJson();
          return;
        }
        if (actionType === "create") {
          handleCreateWorkflowClick();
          return;
        }
      },
      [
        nodes,
        workflowMeta,
        stepActionsOptions,
        stepUsersOptions,
        selectedWorkflowOption,
      ]
    );

    const sidebarButtons = useMemo(
      () =>
        [
          {
            key: "create",
            icon: <FiPlusCircle />,
            label: "Create Workflow",
            action: () => handleActionWithMeta("create"),
            color: "#9B85E0",
          },
          {
            key: "view",
            icon: <FiEye />,
            label: "View JSON",
            action: () => handleActionWithMeta("view"),
            color: "#3b82f6",
          },
          {
            key: "load",
            label: "Load Workflow",
            icon: <FiFolder />,
            action: () => setLoadWorkflowModalOpen(true),
            color: "#DF9600",
          },
          {
            key: "save",
            label: "Save Workflow",
            icon: <FiSave />,
            action: () => handleActionWithMeta("save"),
            color: "#4B49AC",
          },
          {
            key: "download",
            label: "Download JSON",
            icon: <FiDownload />,
            action: () => handleActionWithMeta("download"),
            color: "#00D25B",
          },
        ].filter(({ key }) => config?.buttons?.[key] !== false),
      [config, handleCreateWorkflowClick, handleActionWithMeta]
    );

    const {
      getActions = "",
      getUsers = "",
    } = apiUrls;
    useEffect(() => {
      const storedForm = localStorage.getItem("workflowForm");
      if (storedForm) {
        try {
          const parsedForm = JSON.parse(storedForm);
          setWorkflowForm(parsedForm);
          logger.info("✅ Loaded form data from localStorage:", parsedForm);
        } catch (err) {
          logger.error("🚨 Error parsing form data:", err);
        }
      }
    }, []);
    useEffect(() => {
      if (!getActions) return;
      const workflowForm = JSON.parse(localStorage.getItem("workflowForm"));

      // Handle getActions as a function
      Promise.resolve(getActions())
        .then((data) => {
          logger.info("📥 Raw Actions Response:", data);
          if (data?.ReturnCode === 0 && Array.isArray(data.Data)) {
            const formattedActions = data.Data.map((action) => ({
              ActionId: action.Id,
              ActionName: action.Name,
              ActionCode: action.Code,
            }));
            logger.info("📋 Formatted Actions:", formattedActions);
            setStepActionsOptions(formattedActions);
          } else {
            logger.warn("⚠️ No action data received or invalid format:", data);
            setStepActionsOptions([]);
          }
        })
        .catch((err) => {
          logger.error("❌ Failed to get actions:", err);
          setStepActionsOptions([]);
        });
    }, [getActions]);
    useEffect(() => {
      if (apiUrls.getSaveButtonColour) {
        Promise.resolve(apiUrls.getSaveButtonColour())
          .then((color) => {
            setSaveButtonColor(color);
          })
          .catch((err) => {
            console.error("Error getting save button color:", err);
          });
      }
    }, [apiUrls.getSaveButtonColour]);
    useEffect(() => {
      if (!getUsers) return;
      Promise.resolve(getUsers())
        .then((data) => {
          if (Array.isArray(data.Data.ProjectMemberDetails)) {
            const userOptions = data.Data.ProjectMemberDetails.map((user) => ({
              UserId: user.HRMSEmployeeId,
              UserName: user.Name,
            }));
            logger.info("👥 Loaded Step Users:", userOptions);
            setStepUsersOptions(userOptions);
          } else {
            logger.warn("No user data received");
            setStepUsersOptions([]);
          }
        })
        .catch((err) => {
          logger.error("❌ Failed to fetch step users", err);
          setStepUsersOptions([]);
        });
    }, [getUsers, apiUrls?.headers]);


    useEffect(() => {
      if (selectedNode) {
        const props = selectedNode.data.properties || {};

        // Normalize property keys for the modal
        setNodeProperties({
          stepName: props.StepName || selectedNode.data.label,
          //role: props.Role || "",
          purposeForForward: props.PurposeForForward || "",
          shortPurposeForForward: props.ShortPurposeForForward || "",
          stepActions: Array.isArray(props.StepActions)
            ? props.StepActions.map((id) => {
              const found = stepActionsOptions.find((a) => a.ActionId === id);
              return found?.ActionId || id;
            })
            : [],

          UserNames: Array.isArray(props.UserNames)
            ? props.UserNames.map((name) => {
              const found = stepUsersOptions.find((u) => u.UserName === name);
              return found?.UserName || name;
            })
            : [],
        });
      }
    }, [selectedNode, stepActionsOptions, stepUsersOptions]);

    useEffect(() => {
      // Expose the method globally
      window.reactwidgetRef = {
        viewJson: () => {
          const currentNodes = getNodes();
          const currentEdges = getEdges();
          logger.info("Current nodes from Angular call:", currentNodes);
          if (currentNodes.length === 0) {
            toast.warning(" Please add at least one node to the workflow before viewing JSON.", {
              position: "top-right",
              autoClose: 500,
              hideProgressBar: true,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
            });
            return;
          }
          viewJson();
        },
        convertJsonToWorkflow: convertJsonToWorkflow,
      };
    }, [getNodes, getEdges, nodes, edges]);

    useEffect(() => {
      // Handler for the custom event
      const handleLoadWorkflow = (event) => {
        if (event.detail) {
          // You may need to adjust the path to the workflow steps depending on your JSON structure
          convertJsonToWorkflow(event.detail);
        }
      };

      // Get the DOM node for this component
      const widgetElement = document.querySelector('react-widget');
      if (widgetElement) {
        widgetElement.addEventListener('load-workflow', handleLoadWorkflow);
      }

      // Cleanup
      return () => {
        if (widgetElement) {
          widgetElement.removeEventListener('load-workflow', handleLoadWorkflow);
        }
      };
    }, [convertJsonToWorkflow]);
    useEffect(() => {

      if (stepActionsOptions.length && stepUsersOptions.length) {

        // and call convertJsonToWorkflow here when options are ready.
      }
    }, [stepActionsOptions, stepUsersOptions]);

    // Track all changes that should trigger undo/redo
    const trackChange = useCallback(() => {
      if (isLocked) return;
      setUndoStack((prev) => [
        ...prev.slice(-49),
        { nodes: [...nodes], edges: [...edges] },
      ]);
      setRedoStack([]); // Clear redo stack on new action
    }, [nodes, edges, isLocked]);

    const handleUndo = useCallback(() => {
      if (isLocked) return showLockedToast();
      if (undoStack.length > 0) {
        const last = undoStack[undoStack.length - 1];
        setRedoStack((prev) => [
          ...prev,
          { nodes: [...nodes], edges: [...edges] },
        ]); // Save current to redo
        setNodes(last.nodes);
        setEdges(last.edges);
        setUndoStack((prev) => prev.slice(0, -1));
      }
    }, [undoStack, nodes, edges, isLocked]);

    const handleRedo = useCallback(() => {
      if (isLocked) return showLockedToast();
      if (redoStack.length > 0) {
        const next = redoStack[redoStack.length - 1];
        setUndoStack((prev) => [
          ...prev,
          { nodes: [...nodes], edges: [...edges] },
        ]); // Save current to undo
        setNodes(next.nodes);
        setEdges(next.edges);
        setRedoStack((prev) => prev.slice(0, -1));
      }
    }, [redoStack, nodes, edges, isLocked]);

    const handleKeyDown = useCallback(
      (e) => {
        const activeTag = document.activeElement?.tagName?.toLowerCase();
        const isInputFocused = ["input", "textarea", "select"].includes(
          activeTag
        );

        if (isInputFocused) return; // Don't handle shortcuts while typing

        if ((e.ctrlKey || e.metaKey) && e.key === "z") {
          e.preventDefault();
          if (e.shiftKey) {
            handleRedo();
          } else {
            handleUndo();
          }
        }

        if ((e.ctrlKey || e.metaKey) && e.key === "y") {
          e.preventDefault();
          handleRedo();
        }
      },
      [handleUndo, handleRedo]
    );

    useEffect(() => {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    // Handle node changes
    const handleNodesChange = useCallback((changes) => {
      if (!isLocked) {
        const hasPositionChanges = changes.some(
          (change) => change.type === "position" && change.dragging === false
        );
        const hasSelectionChanges = changes.some(
          (change) => change.type === "select"
        );
        const hasRemoveChanges = changes.some(
          (change) => change.type === "remove"
        );

        if (hasPositionChanges || hasRemoveChanges) {
          trackChange();
        }
        setNodes((nds) => applyNodeChanges(changes, nds));
      }
    }, [isLocked, trackChange]);

    // Handle edge changes
    const handleEdgesChange = useCallback((changes) => {
      if (!isLocked) {
        const hasEdgeChanges = changes.some(
          (change) => change.type === "remove" || change.type === "add"
        );
        if (hasEdgeChanges) {
          trackChange();
        }
        setEdges((eds) => applyEdgeChanges(changes, eds));
      }
    }, [isLocked, trackChange]);

    // Handle node drag stop
    const handleNodeDragStop = useCallback(() => {
      if (!isLocked) {
        trackChange();
      }
    }, [isLocked, trackChange]);

    // Handle edge updates
    const handleEdgeUpdate = useCallback((oldEdge, newConnection) => {
      if (!isLocked) {
        trackChange();
        setEdges((eds) =>
          eds.map((edge) =>
            edge.id === oldEdge.id ? { ...edge, ...newConnection } : edge
          )
        );
      }
    }, [isLocked, trackChange]);

    // Handle node property updates
    const saveDrawerNodeProperties = useCallback(() => {
      if (!isLocked) {
        trackChange();
        setNodes((nds) =>
          nds.map((n) =>
            n.id === drawerNode.id
              ? {
                  ...n,
                  data: {
                    ...n.data,
                    label: drawerNodeProperties.StepName || n.data.label,
                    properties: {
                      ...drawerNodeProperties,
                    },
                  },
                }
              : n
          )
        );
        setDrawerOpen(false);
        setEditMode(false);
        setDrawerNode(null);
      }
    }, [drawerNode, drawerNodeProperties, isLocked, trackChange]);

    // Handle Drag Start
    const onDragStart = (event, nodeType) => {
      event.dataTransfer.setData("application/reactflow", nodeType);
      event.dataTransfer.effectAllowed = "move";

      // Create an empty drag image
      const dragImage = document.createElement("div");
      dragImage.style.width = "1px";
      dragImage.style.height = "1px";
      document.body.appendChild(dragImage);
      event.dataTransfer.setDragImage(dragImage, 0, 0);

      // Clean up the temporary element
      setTimeout(() => {
        document.body.removeChild(dragImage);
      }, 0);
    };
    const showLockedToast = () => {
      if (!lockedToast) {
        toast.warning("🔒 Canvas is locked. Unlock to make changes.", {
          position: "top-right",
          autoClose: 2000,
          hideProgressBar: true,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        setLockedToast(true);
        setTimeout(() => setLockedToast(false), 2000);
      }
    };
    const gridSize = 20;

    const snapToGrid = (x, y) => ({
      x: Math.round(x / gridSize) * gridSize,
      y: Math.round(y / gridSize) * gridSize,
    });
    // Handle Drop Event
    const onDrop = (event) => {
      if (isLocked) return showLockedToast();
      event.preventDefault();
      trackChange();
      const reactFlowBounds = event.target.getBoundingClientRect();
      const nodeType = event.dataTransfer.getData("application/reactflow");

      // Check if trying to add Start/Stop node when one already exists
      if (nodeType === "Start" && nodes.some(n => n.data.nodeShape === "Start")) {
        toast.error("Cannot add multiple Start nodes.", {
          position: "top-right",
          autoClose: 500,
          hideProgressBar: true,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        return;
      }
      if (nodeType === "Stop" && nodes.some(n => n.data.nodeShape === "Stop")) {
        toast.error("Cannot add multiple Stop nodes.", {
          position: "top-right",
          autoClose: 500,
          hideProgressBar: true,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        return;
      }

      const rawPosition = {
        x: event.clientX - reactFlowBounds.left - nodeWidth / 2,
        y: event.clientY - reactFlowBounds.top - nodeHeight / 2,
      };

      const position = snapToGrid(rawPosition.x, rawPosition.y);

      const newNode = {
        id: `${nodes.length + 1}`,
        type: "custom",
        position,
        draggable: true,
        data: { label: nodeType, nodeShape: nodeType, properties: {} },
      };

      setNodes((nds) => [...nds, newNode]);
    };
    // Allow dropping on canvas
    const onDragOver = (event) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
    };

    // Handle JSON file upload
    /* const handleFileUpload = (event) => {
     const file = event.target.files[0];
     if (!file) return;
 
     const reader = new FileReader();
     reader.onload = (e) => {
       try {
         const jsonData = JSON.parse(e.target.result);
         convertJsonToWorkflow(jsonData);
       } catch (error) {
         console.error("Invalid JSON file format", error);
       }
     };
     reader.readAsText(file);
   };*/
    const handleCreateWorkflowClick = () => {
      const newWorkflowOption = {
        value: "new",
        label: "➕ Create New Workflow",
        data: null,
      };

      setWorkflowMeta({
        name: "",
        description: "",
        dateEffective: new Date().toISOString(),
      });
      setSelectedWorkflowOption(newWorkflowOption);
      setPendingAction("create");
      setMetaModalOpen(true);
    };

    const workflowOptions = useMemo(
      () => [
        { label: "➕ Create New Workflow", value: "new" },
        ...(Array.isArray(allWorkflows)
          ? allWorkflows.map((w) => ({
            label: `${w.Name} - ${w.Description}`,
            value: w.Id,
            data: w,
          }))
          : []),
      ],
      [allWorkflows]
    );
    const convertJsonToWorkflow = async (data) => {
      logger.info("📥 Incoming JSON Data:", JSON.stringify(data, null, 2));
      let actions = stepActionsOptions;
      let users = stepUsersOptions;

      // Validate Start/Stop nodes in incoming data
      const workflowSteps = data?.WorkFlowSteps || [];
      const startNodes = workflowSteps.filter(step =>
        step.StepName?.toLowerCase() === "start" ||
        step.Properties?.NodeShape === "Start"
      );
      const stopNodes = workflowSteps.filter(step =>
        step.StepName?.toLowerCase() === "stop" ||
        step.StepName?.toLowerCase() === "completed" ||
        step.Properties?.NodeShape === "Stop"
      );

      if (startNodes.length > 1) {
        logger.warn("⚠️ Multiple Start nodes found in workflow data. Using only the first one.");
        // Keep only the first Start node
        const firstStartIndex = workflowSteps.findIndex(step =>
          step.StepName?.toLowerCase() === "start" ||
          step.Properties?.NodeShape === "Start"
        );
        workflowSteps.splice(firstStartIndex + 1, startNodes.length - 1);
      }

      if (stopNodes.length > 1) {
        logger.warn("⚠️ Multiple Stop nodes found in workflow data. Using only the first one.");
        // Keep only the first Stop node
        const firstStopIndex = workflowSteps.findIndex(step =>
          step.StepName?.toLowerCase() === "stop" ||
          step.StepName?.toLowerCase() === "completed" ||
          step.Properties?.NodeShape === "Stop"
        );
        workflowSteps.splice(firstStopIndex + 1, stopNodes.length - 1);
      }

      if (!actions.length) {
        logger.info("⏳ Loading actions...");
        try {
          const actionsData = await Promise.resolve(getActions());
          logger.info("📥 Raw Actions Response:", actionsData);

          if (actionsData?.ReturnCode === 0 && Array.isArray(actionsData.Data)) {
            actions = actionsData.Data.map((action) => ({
              ActionId: action.Id,
              ActionName: action.Name,
              ActionCode: action.Code,
            }));
            logger.info("📋 Formatted Actions:", actions);
            setStepActionsOptions(actions);
          } else {
            logger.warn("⚠️ Invalid actions data format:", actionsData);
            return;
          }
        } catch (err) {
          logger.error("❌ Failed to load actions:", err);
          return;
        }
      }

      if (!users.length) {
        logger.info("⏳ Loading users...");
        try {
          const usersData = await Promise.resolve(getUsers());
          logger.info("📥 Raw Step Users Response:", usersData);

          if (Array.isArray(usersData.Data.ProjectMemberDetails)) {
            users = usersData.Data.ProjectMemberDetails.map((user) => ({
              UserId: user.HRMSEmployeeId,
              UserName: user.Name,
            }));
            logger.info("📋 Formatted Step Users:", users);
            setStepUsersOptions(users);
          } else {
            logger.warn("⚠️ Invalid users data format:", usersData);
            return;
          }
        } catch (err) {
          logger.error("❌ Failed to load step users:", err);
          return;
        }
      }

      // Verify both actions and users are loaded
      if (!actions.length || !users.length) {
        logger.error("❌ Actions or step users not loaded, cannot proceed with workflow conversion");
        return;
      }

      if (!workflowSteps.length) {
        logger.warn("⚠️ No workflow steps found in the data");
        return;
      }

      // Helper function to get action name from ID
      const getActionNameFromId = (actionId) => {
        if (!actionId) {
          logger.warn("⚠️ No action ID provided");
          return "";
        }

        logger.info("🔍 Looking up action:", {
          actionId,
          availableActions: actions,
          actionCount: actions.length
        });

        const foundAction = actions.find(a => a.ActionId === actionId);
        if (foundAction) {
          logger.info("✅ Found action:", foundAction);
          return foundAction.ActionName;
        }

        // Try to find by ActionCode if ActionId doesn't match
        const foundByCode = actions.find(a => a.ActionCode === actionId);
        if (foundByCode) {
          logger.info("✅ Found action by code:", foundByCode);
          return foundByCode.ActionName;
        }

        logger.warn("⚠️ Action not found:", actionId);
        return actionId;
      };

      // Helper function to get user name from ID
      const getUserNameFromId = (userId) => {
        if (!userId) {
          logger.warn("⚠️ No user ID provided");
          return "";
        }

        logger.info("🔍 Looking up user:", {
          userId,
          availableUsers: users,
          userCount: users.length
        });

        const foundUser = users.find(u => u.UserId === userId);
        if (foundUser) {
          logger.info("✅ Found user:", foundUser);
          return foundUser.UserName;
        }

        logger.warn("⚠️ User not found:", userId);
        return userId;
      };

      const stepCodeToIdMap = {};
      const newNodes = [];
      const hasExplicitStop = workflowSteps.some((s) => {
        const stepName = s.StepName?.toLowerCase();
        return stepName === "stop" || stepName === "completed";
      });

      // Step 1: Build nodes
      workflowSteps.forEach((step, index) => {
        const stepCode = String(step.StepCode ?? index);
        const rawPos = step.Position || {};
        const position = {
          x: rawPos.x ?? rawPos.X ?? (index % 4) * 200,
          y: rawPos.y ?? rawPos.Y ?? Math.floor(index / 4) * 120,
        };

        const stepNameLower = step.StepName?.toLowerCase();
        const nodeShape =
          step.Properties?.NodeShape ||
          (stepNameLower === "start"
            ? "Start"
            : stepNameLower === "stop" || stepNameLower === "completed"
              ? "Stop"
              : "Step");

        const isStop = stepNameLower === "stop" || stepNameLower === "completed";
        stepCodeToIdMap[stepCode] = stepCode;

        // Map action IDs to names
        const stepActions = step.WorkFlowStepAction?.map(action =>
          getActionNameFromId(action.ActionId)
        ) || [];

        // Map user IDs to names
        const UserNames = step.WorkFlowStepUser?.map(user =>
          getUserNameFromId(user.UserId)
        ) || [];

        logger.info(`\n🏗️ Creating Node:`, {
          id: stepCode,
          label: isStop ? "Stop" : step.StepName || stepCode,
          nodeShape,
          position,
          stepActions,
          UserNames
        });

        // Create node with proper properties
        newNodes.push({
          id: stepCode,
          type: "custom",
          position,
          draggable: true,
          data: {
            label: isStop ? "Stop" : step.StepName || stepCode,
            nodeShape,
            properties: {
              StepName: step.StepName || stepCode,
              PurposeForForward: step.Properties?.PurposeForForward || "",
              ShortPurposeForForward: step.Properties?.ShortPurposeForForward || "",
              NodeShape: nodeShape,
              StepActions: stepActions,
              UserNames: UserNames
            }
          }
        });
      });

      // Step 2: Generate edges with proper handles
      const newEdges = [];
      workflowSteps.forEach((step) => {
        const sourceId = String(step.StepCode);
        const sourceNode = newNodes.find(n => n.id === sourceId);

        if (!sourceNode) return;

        logger.info(`\n🔄 Processing Transitions for Step ${sourceId}:`, {
          transitions: step.WorkFlowStepTransition,
          sourceNode: sourceNode.data.label
        });

        // Handle transitions
        if (step.WorkFlowStepTransition && step.WorkFlowStepTransition.length > 0) {
          step.WorkFlowStepTransition.forEach((transition) => {
            const targetId = String(transition.NextStepCode);
            const targetNode = newNodes.find(n => n.id === targetId);

            if (!targetNode) return;

            // Get action name from ID
            const actionId = transition.ActionId || transition.label;
            const actionName = getActionNameFromId(actionId);

            // Determine if it's a forward or backward connection
            const isForward = sourceNode.position.y <= targetNode.position.y;
            const edgeColor = isForward ? "#22c55e" : "#ef4444"; // Green for forward, Red for backward

            logger.info(`\n🔗 Creating Edge:`, {
              source: sourceId,
              target: targetId,
              fromHandle: transition.FromHandleId || transition.sourceHandle,
              toHandle: transition.ToHandleId || transition.targetHandle,
              actionName,
              actionId,
              isForward,
              edgeColor
            });

            const sourceHandle = transition.FromHandleId || transition.sourceHandle ||
              (sourceNode.data.nodeShape === "Start" ? "Start-right-source" : "Step-right-source");
            const targetHandle = transition.ToHandleId || transition.targetHandle ||
              (targetNode.data.nodeShape === "Stop" ? "Stop-left-target" : "Step-left-target");

            newEdges.push({
              id: `${sourceId}-${targetId}-${actionName || 'edge'}`,
              source: sourceId,
              target: targetId,
              sourceHandle,
              targetHandle,
              label: actionName || "",
              animated: false,
              type: "customSmooth",
              markerEnd: { type: MarkerType.ArrowClosed },
              style: { strokeWidth: 2, stroke: edgeColor },
              data: {
                shortPurposeForForward: transition.ShortPurposeForForward || "",
                purposeForForward: transition.PurposeForForward || "",
                sourceHandle,
                targetHandle,
                actionName: actionName,
                actionId: actionId,
                isForward: isForward
              }
            });
          });
        } else {
          logger.info(`\n🔗 Creating Default Edge for Step ${sourceId}`);

          const stopNodeId = `${sourceId}_STOP`;
          const stopNode = newNodes.find(n => n.id === stopNodeId);

          if (stopNode) {
            const sourceHandle = sourceNode.data.nodeShape === "Start" ? "Start-right-source" : "Step-right-source";
            const targetHandle = "Stop-left-target";

            newEdges.push({
              id: `${sourceId}-${stopNodeId}-default`,
              source: sourceId,
              target: stopNodeId,
              sourceHandle,
              targetHandle,
              label: "End",
              animated: false,
              type: "customSmooth",
              markerEnd: { type: MarkerType.ArrowClosed },
              style: { strokeWidth: 2, stroke: "#333" },
              data: {
                shortPurposeForForward: "",
                purposeForForward: "",
                sourceHandle,
                targetHandle
              }
            });
          }
        }
      });

      // Log final nodes and edges
      logger.info("\n📊 Final Nodes:", JSON.stringify(newNodes, null, 2));
      logger.info("\n🔗 Final Edges:", JSON.stringify(newEdges, null, 2));

      // Step 3: Add Start node if not found
      const hasStart = newNodes.some((n) => n.data.nodeShape === "Start");
      if (!hasStart && newNodes.length > 0) {
        const firstNode = newNodes[0];
        const startNodeId = "sys_start";

        newNodes.unshift({
          id: startNodeId,
          type: "custom",
          position: {
            x: firstNode.position.x,
            y: firstNode.position.y - 120,
          },
          draggable: true,
          data: {
            label: "Start",
            nodeShape: "Start",
            properties: {
              StepName: "Start",
              NodeShape: "Start"
            }
          }
        });

        const sourceHandle = "Start-right-source";
        const targetHandle = firstNode.data.nodeShape === "Stop" ? "Stop-left-target" : "Step-left-target";

        newEdges.unshift({
          id: `${startNodeId}-${firstNode.id}-StartEdge`,
          source: startNodeId,
          target: firstNode.id,
          markerEnd: { type: MarkerType.ArrowClosed },
          animated: false,
          type: "customSmooth",
          style: { strokeWidth: 2, stroke: "#333" },
          data: {
            shortPurposeForForward: "",
            purposeForForward: "",
            sourceHandle,
            targetHandle
          }
        });

        stepCodeToIdMap[startNodeId] = startNodeId;
      }

      // Step 4: Position layout
      const allHavePositions = newNodes.every(
        (n) => typeof n.position?.x === "number" && typeof n.position?.y === "number"
      );
      const finalNodes = allHavePositions
        ? newNodes
        : await layoutTopDownCustom(newNodes, newEdges, "TB");

      // Step 5: Update state
      setNodes(finalNodes);
      setEdges(newEdges);

      // Step 6: Center canvas
      setTimeout(() => {
        const bounds = finalNodes.reduce(
          (acc, node) => {
            acc.minX = Math.min(acc.minX, node.position.x);
            acc.minY = Math.min(acc.minY, node.position.y);
            acc.maxX = Math.max(acc.maxX, node.position.x + 150);
            acc.maxY = Math.max(acc.maxY, node.position.y + 60);
            return acc;
          },
          { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
        );

        const centerX = (bounds.minX + bounds.maxX) / 2;
        const centerY = (bounds.minY + bounds.maxY) / 2;

        setViewport({
          x: window.innerWidth / 2 - centerX,
          y: window.innerHeight / 2 - centerY,
          zoom: 0.75,
        });

        // Force canvas re-center
        reactFlowInstance.fitView();
      }, 100);
    };

    const generateJson = (excludeStartStop = false) => {
      const nodesCopy = [...getNodes()];
      const edgesCopy = [...getEdges()];

      // Get the original workflow data from localStorage if it exists
      const originalWorkflow = JSON.parse(localStorage.getItem("ModifyWorkFlowJson") || "{}");
      logger.info("originalWorkflow", originalWorkflow);
      const originalSteps = originalWorkflow.WorkFlowSteps || [];

      const graph = {};
      const visited = new Set();
      const sortedNodes = [];
      const stepCodeMap = {};
      let stepCodeCounter = 0;

      // Build graph from edges
      nodesCopy.forEach((node) => {
        graph[node.id] = [];
      });

      edgesCopy.forEach((edge) => {
        graph[edge.source].push({ target: edge.target, label: edge.label });
      });

      let startNode = nodesCopy.find((n) => n.data.nodeShape === "Start");
      if (!startNode && nodesCopy.length > 0) {
        const firstNode = nodesCopy[0];
        const startNodeId = "sys_start";

        const newStartNode = {
          id: startNodeId,
          type: "custom",
          position: {
            x: firstNode.position.x,
            y: firstNode.position.y - 120,
          },
          draggable: true,
          data: {
            label: "Start",
            nodeShape: "Start",
            properties: {
              StepName: "Start",
              NodeShape: "Start",
            },
          },
        };

        nodesCopy.unshift(newStartNode);

        edgesCopy.unshift({
          id: `${startNodeId}-${firstNode.id}-StartEdge`,
          source: startNodeId,
          target: firstNode.id,
          markerEnd: { type: MarkerType.ArrowClosed },
          animated: false,
          type: "customSmooth",
          style: { strokeWidth: 2, stroke: "#333" },
        });

        startNode = newStartNode;
      }

      if (!startNode) {
        logger.error("Start node is STILL undefined — nodesCopy:", nodesCopy);
        toast.error("Still no Start node even after adding one automatically.", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: true,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        return;
      }

      // DFS Traversal to handle cycles
      const dfs = (currentId) => {
        if (visited.has(currentId)) return;
        visited.add(currentId);

        const node = nodesCopy.find((n) => n.id === currentId);
        if (!node) return;

        const isStartStop =
          node.data.nodeShape === "Start" || node.data.nodeShape === "Stop";

        if (!excludeStartStop || !isStartStop) {
          if (!stepCodeMap[currentId]) {
            stepCodeMap[currentId] = `${stepCodeCounter++}`;
          }
          sortedNodes.push(node);
        }

        for (const neighbor of graph[currentId]) {
          dfs(neighbor.target);
        }
      };

      dfs(startNode.id);

      // Include disconnected nodes
      nodesCopy.forEach((node) => {
        if (!visited.has(node.id)) dfs(node.id);
      });

      // Build JSON
      const jsonOutput = {
        Id: originalWorkflow.Id || workflowForm?.Id || "",
        WorkFlowName: workflowForm?.WorkFlowName || originalWorkflow.WorkFlowName,
        ModuleId: workflowForm?.ModuleId || originalWorkflow.ModuleId,
        ProjectId: workflowForm?.ProjectId || originalWorkflow.ProjectId,
        RDLCTypeId: workflowForm?.RDLCTypeId || originalWorkflow.RDLCTypeId,
        DateEffective: workflowForm?.DateEffective || originalWorkflow.DateEffective || new Date().toISOString(),
        CountryCode: originalWorkflow.CountryCode || "ind",
        CurrencyCode: originalWorkflow.CurrencyCode || "inr",
        LanguageCode: originalWorkflow.LanguageCode || "eng",
        WorkFlowSteps: sortedNodes.map((node) => {
          const props = node.data.properties || {};
          const outgoingEdges = edgesCopy.filter((e) => e.source === node.id);

          // Use existing StepCode or generate new one
          const stepCode = props.StepCode || "step" + stepCodeMap[node.id];

          // Find matching original step by StepCode
          const originalStep = originalSteps.find(step => step.StepCode === stepCode);

          const resolveAction = (actionName) =>
            [...stepActionsOptions, ...stepUsersOptions].find(
              (act) => act.ActionName === actionName
            );

          const WorkFlowStepTransition = outgoingEdges
            .filter((edge) => stepCodeMap[edge.target] !== undefined)
            .map((edge) => {
              const action = resolveAction(edge.label);
              const targetNode = nodesCopy.find(n => n.id === edge.target);
              const targetStepCode = targetNode?.data?.properties?.StepCode || "step" + stepCodeMap[edge.target];

              // Find matching original transition
              const originalTransition = originalStep?.WorkFlowStepTransition?.find(t =>
                t.NextStepCode === targetStepCode
              );

              return {
                Id: originalTransition?.Id || "",
                ActionId: action?.ActionId || "",
                NextStepCode: targetStepCode,
                FromHandleId: edge.sourceHandle || "",
                ToHandleId: edge.targetHandle || "",
              };
            });

          // Map actions with preserved IDs
          const WorkFlowStepAction = (props.StepActions || []).map((actionName) => {
            const found = stepActionsOptions.find(
              (a) => a.ActionName === actionName
            );
            // Find matching original action
            const originalAction = originalStep?.WorkFlowStepAction?.find(a =>
              a.ActionId === found?.ActionId
            );

            return {
              Id: originalAction?.Id || "",
              ActionId: found?.ActionId || actionName || "Unknown",
            };
          });

          // Map users with preserved IDs
          const WorkFlowStepUser = (props.UserNames || []).map((userName) => {
            const found = stepUsersOptions.find(
              (u) => u.UserName === userName
            );
            // Find matching original user
            const originalUser = originalStep?.WorkFlowStepUser?.find(u =>
              u.UserId === found?.UserId
            );

            return {
              Id: originalUser?.Id || "",
              UserId: found?.UserId || userName || "Unknown",
            };
          });

          return {
            Id: originalStep?.Id || "",
            StepCode: stepCode,
            StepName: node.data.nodeShape === "Stop" ? "Completed" : node.data.label,
            WorkFlowStepAction,
            WorkFlowStepUser,
            WorkFlowStepTransition,
            Position: {
              X: node.position.x,
              Y: node.position.y
            },
            Properties: {
              PurposeForForward: props.PurposeForForward || "",
              ShortPurposeForForward: props.ShortPurposeForForward || "",
              NodeShape: node.data.nodeShape || "",
            },
          };
        }),
      };

      logger.info("✅ Generated JSON:", jsonOutput);
      return jsonOutput;
    };

    // Function to show JSON in a modal
    const viewJson = () => {
      const json = generateJson(false);
      if (json) {
        const formatted = JSON.stringify(json, null, 2);
        localStorage.setItem("workflowJson", formatted);
        setJsonData(formatted);
        //setModalIsOpen1(true);
      }
    };
    const SaveWorkflow = () => {
      const jsonoutput = generateJson(false);
      const jsonString = JSON.stringify(jsonoutput, null, 2);
      localStorage.setItem("workflowJson", jsonString);
      logger.info("JSON saved to localStorage:", jsonString);
      const json = localStorage.getItem("workflowJson");
      logger.info("JSON from localStorage:", json);
    };
    useImperativeHandle(ref, () => ({
      triggerViewJson: () => {
        viewJson();
      },
    }));

    // Function to download JSON file
    const downloadJson = () => {
      const jsonOutput = generateJson(false);
      const jsonString = JSON.stringify(jsonOutput, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "workflow.json";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
    useEffect(() => {
      const closeMenus = (e) => {
        const edgeMenu = document.getElementById("edge-context-menu");
        const nodeMenu = document.querySelector("[data-node-context-menu]");

        // Don't close if we're dragging or if click is inside menus
        if (isDraggingNodeMenu || isDraggingEdgeMenu) return;
        if (edgeMenu && edgeMenu.contains(e.target)) return;
        if (nodeMenu && nodeMenu.contains(e.target)) return;

        setContextMenu(null);
        setNodeContextMenu(null);
      };

      window.addEventListener("click", closeMenus);
      return () => window.removeEventListener("click", closeMenus);
    }, [isDraggingNodeMenu, isDraggingEdgeMenu]);

    //handle node right click

    const handleNodeRightClick = (event, node) => {
      if (isLocked) return showLockedToast();
      event.preventDefault();
      setSelectedNode(node);
      setNodeContextMenu({
        x: event.clientX,
        y: event.clientY,
        node,
      });
      setNodeMenuPosition({ x: event.clientX, y: event.clientY });
    };

    // Function to select node and show properties (open drawer)
    const handleNodeClick = (event, node) => {
      if (isLocked) return showLockedToast();
      if (node.data.nodeShape === "Start" || node.data.nodeShape === "Stop") {
        return;
      }
      setDrawerNode(node);
      setDrawerNodeProperties(node.data.properties || {});
      setDrawerOpen(true);
      setEditMode(false); // Reset edit mode when opening drawer
      setSelectedNode(node); // keep for compatibility
    };

    // Function to update drawer node properties in edit mode
    const updateDrawerNodeProperties = (e) => {
      const { name, value } = e.target;
      setDrawerNodeProperties((prev) => ({
        ...prev,
        [name]: value,
      }));
    };

    const handleEdgeClick = (event, edge) => {
      if (isLocked) return showLockedToast();
      event.stopPropagation(); // Prevent any bubbling
      setSelectedEdge({
        ...edge,
        data: {
          shortPurposeForForward: edge.data?.shortPurposeForForward || "",
          purposeForForward: edge.data?.purposeForForward || "",
          ...edge.data, // preserve existing values
        },
      });
      setContextMenu({ x: event.clientX, y: event.clientY });
      setEdgeMenuPosition({ x: event.clientX, y: event.clientY });
    };
    const stepOptionsFormatted = stepActionsOptions.map((action) => ({
      label: action.ActionName,
      value: action.ActionName,
    }));

    const commonOptionsFormatted = stepUsersOptions.map((user) => ({
      label: user.UserName,
      value: user.UserId,
    }));

    const handleMetaContinue = () => {
      setMetaModalOpen(false);
      if (pendingAction === "save") {
        saveWorkflowToAPI();
      }
      if (pendingAction === "create") {
        // Clear canvas
        setNodes([]);
        setEdges([]);

        // Reset workflow metadata (if needed)
        setWorkflowMeta((prev) => ({
          ...prev,
          dateEffective: new Date().toISOString(),
        }));

        // Reset workflow option
        setSelectedWorkflowOption({
          value: "new",
          label: "➕ Create New Workflow",
          data: null,
        });

        setLoadedWorkflowMeta(null); // Also clear display of loaded workflow
      }

      setPendingAction(null);
    };
    const memoizedNodes = useMemo(() => {
      return nodes.map((n) => ({ ...n, draggable: !isLocked }));
    }, [nodes, isLocked]);



    useEffect(() => {
      // console.log("Current nodes state:", nodes);
    }, [nodes]);

    // Add template loading function
    const loadTemplate = (template) => {
      if (isLocked) return showLockedToast();

      // Clear existing workflow
      setNodes([]);
      setEdges([]);

      // Add template nodes and edges
      setNodes(template.nodes);
      setEdges(template.edges);

      // Center the view
      setTimeout(() => {
        reactFlowInstance.fitView();
      }, 100);
    };

    const renderTooltip = (node) => {
      const props = node.data.properties || {};
      return (
        <div className="node-tooltip">
          <span className="tooltip-title">{node.data.label}</span>
          <div className="tooltip-property" data-label="Step Name">
            Step Name : {props.StepName || node.data.label}
          </div>
          {props.StepActions && props.StepActions.length > 0 && (
            <div className="tooltip-property" data-label="Step Actions">
              Step Actions :
              <ul>
                {props.StepActions.map((action, index) => (
                  <li key={index}>{action}</li>
                ))}
              </ul>
            </div>
          )}
          {props.UserNames && props.UserNames.length > 0 && (
            <div className="tooltip-property" data-label="Step Users">
              Step Users :
              <ul>
                {props.UserNames.map((user, index) => (
                  <li key={index}>{user}</li>
                ))}
              </ul>
            </div>
          )}
          {props.PurposeForForward && (
            <div className="tooltip-property" data-label="Purpose">
              Purpose : {props.PurposeForForward}
            </div>
          )}
        </div>
      );
    };

    // Add updateEdgeLabel function
    const updateEdgeLabel = (actionName) => {
      if (!selectedEdge) return;

      setEdges((eds) =>
        eds.map((edge) =>
          edge.id === selectedEdge.id
            ? {
                ...edge,
                label: actionName,
                data: {
                  ...edge.data,
                  actionName: actionName,
                },
              }
            : edge
        )
      );
      setContextMenu(null);
    };

    return (
      <div className="workflow-editor-container">
        <ToastContainer
          position="top-right"
          autoClose={500}
          hideProgressBar={true}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
          closeButton={true}
          toastClassName="custom-toast"
          bodyClassName="custom-toast-body"
        />

        {/* Add Confirmation Modal */}
        <Modal
          isOpen={confirmModalOpen}
          onRequestClose={handleTemplateCancel}
          className="confirmation-modal"
          overlayClassName="confirmation-modal-overlay"
          contentLabel="Confirm Template Change"
        >
          <div className="confirmation-modal-content">
            <h3>Confirm Template Change</h3>
            <p>There are existing nodes on the canvas. Are you sure you want to replace them with a new template?</p>
            <div className="confirmation-modal-buttons">
              <button onClick={handleTemplateCancel} className="modal-button-cancel">Cancel</button>
              <button onClick={handleTemplateConfirm} className="modal-button-save" style={{ background: saveButtonColor }}>Confirm</button>
            </div>
          </div>
        </Modal>

        {/* Sidebar Menu */}
        <div className="workflow-sidebar">
          {/* Only show titles on desktop */}
          <div class="flowchart-header">
            <div className="desktop-only">
              <h4 className="sidebar-title">⚙️ Menu</h4>
            </div>

            <div className="sidebar-controls">
              {/* Undo Button */}
              <div 
                className="control-button" 
                onClick={handleUndo} 
                title="Undo (Ctrl+Z)"
                style={{ opacity: undoStack.length > 0 ? 1 : 0.5 }}
              >
                <FiRotateCcw size={12} color="#1e293b" />
              </div>
              {/* Redo Button */}
              <div 
                className="control-button" 
                onClick={handleRedo} 
                title="Redo (Ctrl+Y)"
                style={{ opacity: redoStack.length > 0 ? 1 : 0.5 }}
              >
                <FiRotateCw size={12} color="#1e293b" />
              </div>
            </div>
          </div>

          {/* Node Types */}
          <div className="node-types-container">
            <div className="desktop-only">
              <p className="node-types-title">🧱 Node Types</p>
            </div>
            {sidebarNodeTypes.map(({ label, color, shape }) => (
              <div
                key={label}
                className="node-type-item"
                draggable
                onDragStart={(e) => {
                  e.stopPropagation();
                  onDragStart(e, label);
                }}
              >
                <span>{label}</span>
                <div
                  className={`node-type-shape ${shape === "circle" ? "circle" : shape === "diamond" ? "diamond" : ""}`}
                  style={{ background: color }}
                />
              </div>
            ))}
          </div>

          {/* Add template workflows */}
          <div className="template-workflows-container">
            <div className="desktop-only">
              <p className="template-workflows-title">🎯 Dynamic Template</p>
            </div>
            <div className="dynamic-template-controls">
              <input
                type="number"
                min="1"
                max="10"
                value={nodeCount}
                onChange={(e) => setNodeCount(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
                className="node-counter-input"
              />
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  // Force immediate execution
                  Promise.resolve().then(() => {
                    loadDynamicTemplate(e);
                  });
                }}
                className="generate-template-button"
              >
                Generate Template
              </button>
            </div>
            <div className="dynamic-template-description">
              Create a template with {nodeCount} step{nodeCount !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Action Buttons */}
          {sidebarButtons.map(({ label, icon, action, color }) => (
            <button
              key={label}
              onClick={action}
              className="sidebar-button"
              style={{ backgroundColor: color, color: "#ffffff" }}
            >
              <span className="sidebar-button-icon">{icon}</span>
              <span className="sidebar-button-text">{label}</span>
            </button>
          ))}

          <div style={{
            background: '#ffffff',
            border: '1px solid #ffffff',
            borderRadius: '8px',
            padding: '10px 12px',
            marginBottom: '8px',
            fontSize: '14px',
            color: '#000000',
            lineHeight: 1.6
          }}>
            <b>Editor Tips:</b>
            <ul style={{margin: '6px 0 0 16px', padding: 0}}>
              <li>Drag and drop nodes from <b>Node Types</b> to the canvas.</li>
              <li>From the Handles draw the edges to connect between the Nodes.</li>
              <li>Click a node to view or edit its properties.</li>
              <li>Right-click a node for more options (delete, duplicate, add connected node).</li>
              
              <li>Undo/Redo with the ⟲/⟳ buttons or Ctrl+Z/Ctrl+Y.</li>
            </ul>
          </div>
        </div>

        {/* Workflow Editor */}
        <div className="workflow-editor-area">
          {loadedWorkflowMeta && (
            <div className="workflow-meta-display">
              📄 Workflow -- {loadedWorkflowMeta.name} - {loadedWorkflowMeta.description}
            </div>
          )}
          <ReactFlow
            nodes={memoizedNodes}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onNodeDragStop={handleNodeDragStop}
            onEdgeUpdate={handleEdgeUpdate}
            onConnect={(params) => {
              if (isLocked) return showLockedToast();
              if (params.source === "stop") {
                toast.error(" You cannot draw connections from the Stop node.", {
                  position: "top-right",
                  autoClose: 500,
                  hideProgressBar: true,
                  closeOnClick: true,
                  pauseOnHover: true,
                  draggable: true,
                });
                return;
              }

              // Get source and target nodes
              const sourceNode = nodes.find(n => n.id === params.source);
              const targetNode = nodes.find(n => n.id === params.target);

              // Determine if it's a forward or backward connection
              const isForward = sourceNode.position.y <= targetNode.position.y;
              const edgeColor = isForward ? "#22c55e" : "#ef4444"; // Green for forward, Red for backward

              trackChange();
              setEdges((eds) =>
                addEdge(
                  {
                    ...params,
                    animated: false,
                    type: edgeStyle,
                    markerEnd: { type: MarkerType.ArrowClosed },
                    style: { strokeWidth: 2, stroke: edgeColor },
                    label: "",
                    data: {
                      shortPurposeForForward: "",
                      purposeForForward: "",
                      isForward: isForward,
                    },
                  },
                  eds
                )
              );
            }}
            edgeTypes={edgeTypes}
            nodeTypes={nodeTypes}
            onNodeClick={isLocked ? undefined : handleNodeClick}
            onEdgeClick={isLocked ? undefined : handleEdgeClick}
            onSelectionChange={(e) => {
              const selected = [...(e?.nodes || []), ...(e?.edges || [])];
              const isSameSelection =
                selected.length === selectedElements.length &&
                selected.every(
                  (el, index) => el.id === selectedElements[index]?.id
                );

              if (!isSameSelection) {
                setSelectedElements(selected);
              }
            }}
            selectionKeyCode="Shift"
            multiSelectionKeyCode="Meta"
            onDrop={isLocked ? undefined : onDrop}
            onDragOver={isLocked ? undefined : onDragOver}
            onNodeMouseEnter={(_, node) => {
              clearTimeout(hoverTimeout);
              setHoveredNodeId(node.id);
            }}
            onNodeMouseLeave={() => {
              hoverTimeout = setTimeout(() => setHoveredNodeId(null), 150);
            }}
            onNodeContextMenu={isLocked ? undefined : handleNodeRightClick}
            onEdgeMouseEnter={(_, edge) => setHoveredEdgeId(edge.id)}
            onEdgeMouseLeave={() => setHoveredEdgeId(null)}
            defaultViewport={{ x: 0, y: 0, zoom: 1 }}
            style={{ background: "#F5F5F5" }}
          >
            <MiniMap
              nodeColor={(node) => {
                switch (node.data?.nodeShape) {
                  case "Start":
                    return "#9fda7c";
                  case "Stop":
                    return "#FFB7B4";
                  case "Step":
                    return "#82d6f7";
                  case "Decision":
                    return "#B388EB";
                  default:
                    return "#82d6f7";
                }
              }}
              nodeStrokeWidth={2}
              nodeBorderRadius={3}
              maskColor="rgba(255,255,255,0.6)"
              style={{
                height: 107,
                width: 200,
                border: "1px solid #ccc",
                bottom: 10,
                right: 30,
                zIndex: 20,
              }}
            />
            <Controls
              position="top-right"
              showInteractive={false}
              style={{
                zIndex: 10, // Make sure it shows above everything
                marginRight: 10,
                marginTop: 469,
              }}
            >
              <ControlButton
                title={isLocked ? "Unlock Canvas" : "Lock Canvas"}
                onClick={() => setIsLocked((prev) => !prev)}
              >
                {isLocked ? <FaLock color="#333" /> : <FaUnlock color="#333" />}
              </ControlButton>
              <ControlButton
                title="Toggle Background"
                onClick={() => {
                  const variants = ['dots', 'lines', 'cross', 'solid'];
                  const currentIndex = variants.indexOf(backgroundVariant);
                  const nextIndex = (currentIndex + 1) % variants.length;
                  setBackgroundVariant(variants[nextIndex]);
                }}
              >
                <FiGrid color="#333" />
              </ControlButton>
            </Controls>
            {backgroundVariant !== "solid" && (
              <Background
                variant={backgroundVariant}
                gap={12}
                color="#d4d4d4"
              />
            )}
            {selectedElements.length > 1 && (
              <div className="selection-indicator">
                🔗 {selectedElements.length} nodes selected
              </div>
            )}
          </ReactFlow>

        </div>

        {/* Context Menus */}
        {!isLocked && contextMenu && selectedEdge && (
          <div
            id="edge-context-menu"
            className="context-menu"
            style={{
              top: edgeMenuPosition.y,
              left: edgeMenuPosition.x,
              cursor: isDraggingEdgeMenu ? "grabbing" : "grab",
            }}
            onMouseDown={(e) => {
              setIsDraggingEdgeMenu(true);
              setDragOffset({
                x: e.clientX - edgeMenuPosition.x,
                y: e.clientY - edgeMenuPosition.y,
              });
            }}
            onMouseMove={(e) => {
              if (isDraggingEdgeMenu) {
                setEdgeMenuPosition({
                  x: e.clientX - dragOffset.x,
                  y: e.clientY - dragOffset.y,
                });
              }
            }}
            onMouseUp={() => {
              setIsDraggingEdgeMenu(false);
            }}
            onMouseLeave={() => {
              setIsDraggingEdgeMenu(false);
            }}
          >
            <div style={{ marginTop: "10px" }}>

              <label
                style={{
                  marginTop: "15px",
                  display: "block",
                  marginBottom: "5px",
                }}
              >
                Select Edge Action:
              </label>
              <Select
                options={
                  (() => {
                    const sourceNode = nodes.find((n) => n.id === selectedEdge.source);
                    const selectedActionNames = sourceNode?.data?.properties?.StepActions || [];
                    const usedActions = edges
                      .filter(e => e.source === selectedEdge.source && e.id !== selectedEdge.id)
                      .map(e => e.label);

                    return stepActionsOptions
                      .filter((action) =>
                        selectedActionNames.includes(action.ActionName) &&
                        !usedActions.includes(action.ActionName)
                      )
                      .map((action) => ({
                        label: action.ActionName,
                        value: action.ActionName,
                      }));
                  })()
                }
                value={{ label: selectedEdge.label, value: selectedEdge.label }}
                onChange={(selected) => updateEdgeLabel(selected.value)}
              />
            </div>

            <hr style={{ margin: "10px 0" }} />
            <p
              onClick={() => {
                setEdges((prev) =>
                  prev.filter((e) => e.id !== selectedEdge.id)
                );
                setSelectedEdge(null);
                setContextMenu(null);
              }}
              style={{ color: "red", cursor: "pointer" }}
            >
              🗑 Delete Edge
            </p>
          </div>
        )}

        {!isLocked && nodeContextMenu && (
          <div
            data-node-context-menu
            className="context-menu"
            style={{
              top: nodeMenuPosition.y,
              left: nodeMenuPosition.x,
              cursor: isDraggingNodeMenu ? "grabbing" : "grab",
            }}
            onMouseDown={(e) => {
              setIsDraggingNodeMenu(true);
              setDragOffset({
                x: e.clientX - nodeMenuPosition.x,
                y: e.clientY - nodeMenuPosition.y,
              });
            }}
            onMouseMove={(e) => {
              if (isDraggingNodeMenu) {
                setNodeMenuPosition({
                  x: e.clientX - dragOffset.x,
                  y: e.clientY - dragOffset.y,
                });
              }
            }}
            onMouseUp={() => setIsDraggingNodeMenu(false)}
            onMouseLeave={() => setIsDraggingNodeMenu(false)}
          >
            <p
              onClick={() => {
                const nodeId = nodeContextMenu.node.id;
                const nodeShape = nodeContextMenu.node.data.nodeShape;
                if (nodeShape === "Start" || nodeShape === "Stop") {
                  toast.error(" Start and Stop nodes cannot be deleted.", {
                    position: "top-right",
                    autoClose: 500,
                    hideProgressBar: true,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                  });
                  return;
                }
                trackChange();
                const updatedNodes = nodes.filter((n) => n.id !== nodeId);
                const updatedEdges = edges.filter(
                  (e) => e.source !== nodeId && e.target !== nodeId
                );
                setNodes(updatedNodes);
                setEdges(updatedEdges);
                setNodeContextMenu(null);
              }}
              style={{ cursor: "pointer", marginBottom: "5px" }}
            >
              🗑 Delete Node
            </p>

            <p
              onClick={() => {
                const newNodeId = `${nodes.length + 1}`;
                const newNode = {
                  id: newNodeId,
                  type: "custom",
                  position: {
                    x: nodeContextMenu.node.position.x + 200,
                    y: nodeContextMenu.node.position.y + 100,
                  },
                  data: {
                    label: "Step",
                    properties: {},
                    nodeShape: "Step",
                  },
                };
                const newEdge = {
                  id: `${nodeContextMenu.node.id}-${newNodeId}`,
                  source: nodeContextMenu.node.id,
                  target: newNodeId,
                  sourceHandle: "Step-right-source",
                  targetHandle: "Step-left-target",
                  label: "Forward",
                  animated: false,
                  markerEnd: { type: MarkerType.ArrowClosed },
                  style: { stroke: "#2980b9", strokeWidth: 2 },
                  data: {
                    shortPurposeForward: "",
                    purposeForForward: " ",
                  },
                };
                trackChange();
                setNodes((nds) => [...nds, newNode]);
                setEdges((eds) => [...eds, newEdge]);
                setNodeContextMenu(null);
              }}
              style={{ cursor: "pointer" }}
            >
              ➕ Add Connected Node
            </p>
            <p
              onClick={() => {
                const original = nodeContextMenu.node;
                const newId = `${nodes.length + 1}`;

                const duplicatedNode = {
                  ...original,
                  id: newId,
                  position: {
                    x: original.position.x + 40,
                    y: original.position.y + 40,
                  },
                  data: {
                    ...original.data,
                    label: original.data.label + " (copy)",
                    properties: { ...original.data.properties },
                  },
                };
                trackChange();
                setNodes((nds) => [...nds, duplicatedNode]);
                setNodeContextMenu(null);
              }}
              style={{ cursor: "pointer", marginBottom: "5px" }}
            >
              🔁 Duplicate Node
            </p>
          </div>
        )}

        {/* Drawer for node properties */}
        {drawerOpen && drawerNode && (
          <div className="drawer">
            <div className="drawer-close" onClick={() => setDrawerOpen(false)}>&times;</div>
            <div className="drawer-actions">
              <div className="drawer-header">Step Properties</div>
              {!editMode && (
                <button 
                  onClick={() => {
                    setEditMode(true);
                  }}
                  className="edit-button"
                >
                  Edit
                </button>
              )}
            </div>
            <div className="drawer-content">
              {!editMode ? (
                <>
                  <div className="drawer-label">Step Name :
                  {drawerNodeProperties.StepName || drawerNode.data.label}</div>
                  <div className="drawer-label">Step Actions :
                  
                    {(drawerNodeProperties.StepActions || []).map((action, idx) => (
                      <span
                        key={idx}
                        style={{
                          background: '#e2e8f0',
                          color: '#1e293b',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          display: 'inline-block',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {action}
                      </span>
                    ))}
                  </div>
                  <div className="drawer-label">Step Users :
                  
                    {(drawerNodeProperties.UserNames || []).map((user, idx) => (
                      <span
                        key={idx}
                        style={{
                          background: '#e2e8f0', // match Step Actions
                          color: '#1e293b',      // match Step Actions
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          display: 'inline-block',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {user}
                      </span>
                    ))}
                  </div>

                </>
              ) : (
                <>
                  <div className="drawer-label">Step Name :</div>
                  <input
                    type="text"
                    name="StepName"
                    value={drawerNodeProperties.StepName || ""}
                    onChange={updateDrawerNodeProperties}
                    className="modal-input"
                   
                  />
                  <div className="drawer-label">Step Actions :</div>
                  <Select
                    isMulti
                    closeMenuOnSelect={false}
                    hideSelectedOptions={false}
                    options={[
                      { label: "Select All", value: "__SELECT_ALL__" },
                      ...stepActionsOptions.map(action => ({
                        label: action.ActionName,
                        value: action.ActionName,
                      }))
                    ]}
                    value={
                      (drawerNodeProperties.StepActions || []).map(actionName => ({
                        label: actionName,
                        value: actionName,
                      })) || []
                    }
                    onChange={selected => {
                      const hasSelectAll = selected?.some(item => item.value === "__SELECT_ALL__");
                      const allActionNames = stepActionsOptions.map(action => action.ActionName);
                      const currentActionNames = drawerNodeProperties.StepActions || [];
                      if (hasSelectAll) {
                        // If "Select All" was clicked, check if all are selected
                        const allSelected = allActionNames.every(name => currentActionNames.includes(name));
                        setDrawerNodeProperties(prev => ({
                          ...prev,
                          StepActions: allSelected ? [] : allActionNames,
                        }));
                      } else {
                        setDrawerNodeProperties(prev => ({
                          ...prev,
                          StepActions: selected ? selected.map(item => item.value) : [],
                        }));
                      }
                    }}
                    className="modal-select"
                    classNamePrefix="modal-select"
                    components={{
                      Option: ({ children, ...props }) => {
                        const { isSelected, isFocused, innerRef, innerProps, data } = props;
                        if (data.value === "__SELECT_ALL__") {
                          const allActionNames = stepActionsOptions.map(action => action.ActionName);
                          const currentActionNames = drawerNodeProperties.StepActions || [];
                          const allSelected = allActionNames.every(name => currentActionNames.includes(name));
                          return (
                            <div
                              ref={innerRef}
                              {...innerProps}
                              className="multi-value-option"
                              style={{
                                backgroundColor: isFocused ? '#f0f0f0' : 'white',
                                fontWeight: 'bold',
                                borderBottom: '1px solid #e5e5e5'
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={allSelected}
                                readOnly
                                className="multi-value-checkbox"
                              />
                              <div>{children}</div>
                            </div>
                          );
                        }
                        return (
                          <div
                            ref={innerRef}
                            {...innerProps}
                            className="multi-value-option"
                            style={{
                              backgroundColor: isFocused ? '#f0f0f0' : 'white',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              readOnly
                              className="multi-value-checkbox"
                            />
                            <div>{children}</div>
                          </div>
                        );
                      },
                      MultiValue: ({ index, getValue, ...props }) => {
                        const values = getValue();
                        const maxToShow = 2;
                        const length = values.length;
                        if (index >= maxToShow) return null;
                        if (index === 1 && length > maxToShow) {
                          return (
                            <>
                              <div className="multi-value-container">{props.data.label}</div>
                              <div className="count-number">+{length - maxToShow}</div>
                            </>
                          );
                        }
                        return <div className="multi-value-container">{props.data.label}</div>;
                      },
                    }}
                  />
                  <div className="drawer-label">Step Users :</div>
                  <Select
                    isMulti
                    closeMenuOnSelect={false}
                    hideSelectedOptions={false}
                    options={[
                      { label: "Select All", value: "__SELECT_ALL_USERS__" },
                      ...stepUsersOptions.map(user => ({
                        label: user.UserName,
                        value: user.UserName,
                      }))
                    ]}
                    value={
                      (drawerNodeProperties.UserNames || []).map(userName => ({
                        label: userName,
                        value: userName,
                      })) || []
                    }
                    onChange={selected => {
                      const hasSelectAll = selected?.some(item => item.value === "__SELECT_ALL_USERS__");
                      const allUserNames = stepUsersOptions.map(user => user.UserName);
                      const currentUserNames = drawerNodeProperties.UserNames || [];
                      if (hasSelectAll) {
                        const allSelected = allUserNames.every(name => currentUserNames.includes(name));
                        setDrawerNodeProperties(prev => ({
                          ...prev,
                          UserNames: allSelected ? [] : allUserNames,
                        }));
                      } else {
                        setDrawerNodeProperties(prev => ({
                          ...prev,
                          UserNames: selected ? selected.map(item => item.value) : [],
                        }));
                      }
                    }}
                    className="modal-select"
                    classNamePrefix="modal-select"
                    components={{
                      Option: ({ children, ...props }) => {
                        const { isSelected, isFocused, innerRef, innerProps, data } = props;
                        if (data.value === "__SELECT_ALL_USERS__") {
                          const allUserNames = stepUsersOptions.map(user => user.UserName);
                          const currentUserNames = drawerNodeProperties.UserNames || [];
                          const allSelected = allUserNames.every(name => currentUserNames.includes(name));
                          return (
                            <div
                              ref={innerRef}
                              {...innerProps}
                              className="multi-value-option"
                              style={{
                                backgroundColor: isFocused ? '#f0f0f0' : 'white',
                                fontWeight: 'bold',
                                borderBottom: '1px solid #e5e5e5'
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={allSelected}
                                readOnly
                                className="multi-value-checkbox"
                              />
                              <div>{children}</div>
                            </div>
                          );
                        }
                        return (
                          <div
                            ref={innerRef}
                            {...innerProps}
                            className="multi-value-option"
                            style={{
                              backgroundColor: isFocused ? '#f0f0f0' : 'white',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              readOnly
                              className="multi-value-checkbox"
                            />
                            <div>{children}</div>
                          </div>
                        );
                      },
                      MultiValue: ({ index, getValue, ...props }) => {
                        const values = getValue();
                        const maxToShow = 2;
                        const length = values.length;
                        if (index >= maxToShow) return null;
                        if (index === 1 && length > maxToShow) {
                          return (
                            <>
                              <div className="multi-value-container">{props.data.label}</div>
                              <div className="count-number">+{length - maxToShow}</div>
                            </>
                          );
                        }
                        return <div className="multi-value-container">{props.data.label}</div>;
                      },
                    }}
                  />
                  <div className="drawer-actions">
                    
                    <button onClick={() => setEditMode(false)} className="modal-button-cancel">Cancel</button>
                    <button onClick={saveDrawerNodeProperties} className="modal-button-save" style={{ background: saveButtonColor }}>Save</button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

      </div>
    );
  }
);

export default WorkflowEditor;
