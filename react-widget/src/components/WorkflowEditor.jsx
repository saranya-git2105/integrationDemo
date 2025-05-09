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
} from "reactflow";
import { ControlButton } from "reactflow";
import { FaLock, FaUnlock } from "react-icons/fa";
import "reactflow/dist/style.css";
import Modal from "react-modal";
import CustomNode from "./CustomNode";
import CustomSmoothEdge from "./CustomSmoothEdge";
//import CustomEdge from './CustomEdge';
import { generate_styled_edges, layoutTopDownCustom } from "../utils/layout";
import Select from "react-select";
import {
  FiEye,
  FiDownload,
  FiRotateCw,
  FiPlusCircle,
  FiFolder,
  FiSave,
  FiRotateCcw,
  FiRefreshCw,
} from "react-icons/fi";
import CanvasControls from "./CanvasControls"; // adjust path as needed

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
          //{ label: "Decision", color: "#B388EB", shape: "diamond" },
        ].filter(({ label }) => config?.nodeTypes?.[label] !== false),
      [config]
    );

    const handleActionWithMeta = useCallback(
      (actionType) => {
        console.log("NODES:", nodes);
        const startNodeExists = nodes.some(
          (node) => node.data?.nodeShape === "Start"
        );

        if (!startNodeExists && actionType !== "view") {
          alert(
            "⚠️ Please drag and place a Start node first before saving or viewing the workflow."
          );
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
      getWorkflows = "",
      saveWorkflow = "",
      loadWorkflow = "",
    } = apiUrls;
    useEffect(() => {
      const storedForm = localStorage.getItem("workflowForm");
      if (storedForm) {
        try {
          const parsedForm = JSON.parse(storedForm);
          setWorkflowForm(parsedForm);
          console.log("✅ Loaded form data from localStorage:", parsedForm);
        } catch (err) {
          console.error("🚨 Error parsing form data:", err);
        }
      }
    }, []);
    useEffect(() => {
      if (!getActions) return;
      const workflowForm = JSON.parse(localStorage.getItem("workflowForm"));

      // Handle getActions as a function
      Promise.resolve(getActions())
        .then((data) => {
          console.log("📥 Raw Actions Response:", data);
          if (data?.ReturnCode === 0 && Array.isArray(data.Data)) {
            const formattedActions = data.Data.map((action) => ({
              ActionId: action.Id,
              ActionName: action.Name,
              ActionCode: action.Code,
            }));
            console.log("📋 Formatted Actions:", formattedActions);
            setStepActionsOptions(formattedActions);
          } else {
            console.warn("⚠️ No action data received or invalid format:", data);
            setStepActionsOptions([]);
          }
        })
        .catch((err) => {
          console.error("❌ Failed to get actions:", err);
          setStepActionsOptions([]);
        });
    }, [getActions]);

    useEffect(() => {
      if (!getUsers) return;
      Promise.resolve(getUsers())
        .then((data) => {
          if (data?.ReturnCode === 0 && Array.isArray(data.Data)) {
            const userOptions = data.Data.map((user) => ({
              UserId: user.Id,
              UserName: user.Name,
            }));
            console.log("👥 Loaded Users:", userOptions);
            setStepUsersOptions(userOptions);
          } else {
            console.warn("No user data received");
            setStepUsersOptions([]);
          }
        })
        .catch((err) => {
          console.error("Failed to fetch users", err);
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
          console.log("Current nodes from Angular call:", currentNodes);
          if (currentNodes.length === 0) {
            alert(
              "⚠️ Please add at least one node to the workflow before viewing JSON."
            );
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

    const handleKeyDown = useCallback(
      (e) => {
        const activeTag = document.activeElement?.tagName?.toLowerCase();
        const isInputFocused = ["input", "textarea", "select"].includes(
          activeTag
        );

        if (isInputFocused) return; // Don't handle shortcuts while typing

        if ((e.ctrlKey || e.metaKey) && e.key === "z") {
          e.preventDefault();
          handleUndo();
        }

        if (
          (e.ctrlKey || e.metaKey) &&
          (e.key === "y" || (e.shiftKey && e.key === "Z"))
        ) {
          e.preventDefault();
          handleRedo();
        }

        if ((e.key === "Delete" || e.key === "Backspace") && !isLocked) {
          if (selectedElements.length > 0) {
            addToUndoStack();

            const nodeIdsToDelete = selectedElements
              .filter((el) => el.position)
              .map((node) => node.id);

            const edgeIdsToDelete = selectedElements
              .filter((el) => el.source && el.target)
              .map((edge) => edge.id);

            setNodes((nds) =>
              nds.filter((n) => !nodeIdsToDelete.includes(n.id))
            );
            setEdges((eds) =>
              eds
                .filter((e) => !edgeIdsToDelete.includes(e.id))
                .filter(
                  (e) =>
                    !nodeIdsToDelete.includes(e.source) &&
                    !nodeIdsToDelete.includes(e.target)
                )
            );
          }
        }
      },
      [selectedElements, isLocked]
    );

    useEffect(() => {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    const addToUndoStack = (newNodes = nodes, newEdges = edges) => {
      setUndoStack((prev) => [
        ...prev.slice(-49),
        { nodes: [...newNodes], edges: [...newEdges] },
      ]);
      setRedoStack([]); // Clear redo stack on new action
    };
    const handleUndo = () => {
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
    };
    const handleRedo = () => {
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
    };

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
      addToUndoStack();
      const reactFlowBounds = event.target.getBoundingClientRect();
      const nodeType = event.dataTransfer.getData("application/reactflow");

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
      console.log("📥 Incoming JSON Data:", JSON.stringify(data, null, 2));
      
      const workflowSteps = data?.WorkFlowSteps || [];
      console.log("📋 Workflow Steps:", JSON.stringify(workflowSteps, null, 2));

      if (!workflowSteps.length) {
        console.warn("⚠️ No workflow steps found in the data");
        return;
      }

      // Helper function to get action name from ID
      const getActionNameFromId = (actionId) => {
        const action = stepActionsOptions.find(a => a.ActionId === actionId);
        return action ? action.ActionName : actionId;
      };

      // Helper function to get user name from ID
      const getUserNameFromId = (userId) => {
        const user = stepUsersOptions.find(u => u.UserId === userId);
        return user ? user.UserName : userId;
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
        const commonActions = step.WorkFlowStepUser?.map(user => 
          getUserNameFromId(user.UserId)
        ) || [];

        console.log(`\n🏗️ Creating Node:`, {
          id: stepCode,
          label: isStop ? "Stop" : step.StepName || stepCode,
          nodeShape,
          position,
          stepActions,
          commonActions
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
              CommonActions: commonActions
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

        console.log(`\n🔄 Processing Transitions for Step ${sourceId}:`, {
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
            const actionName = getActionNameFromId(transition.ActionId);

            console.log(`\n🔗 Creating Edge:`, {
              source: sourceId,
              target: targetId,
              fromHandle: transition.FromHandleId,
              toHandle: transition.ToHandleId,
              actionName
            });

            const sourceHandle = transition.FromHandleId || 
              (sourceNode.data.nodeShape === "Start" ? "Start-right-source" : "Step-right-source");
            const targetHandle = transition.ToHandleId || 
              (targetNode.data.nodeShape === "Stop" ? "Stop-left-target" : "Step-left-target");

            newEdges.push({
              id: `${sourceId}-${targetId}-${transition.ActionId || 'edge'}`,
              source: sourceId,
              target: targetId,
              sourceHandle,
              targetHandle,
              label: actionName || "",
              animated: false,
              type: "customSmooth",
              markerEnd: { type: MarkerType.ArrowClosed },
              style: { strokeWidth: 2, stroke: "#333" },
              data: {
                shortPurposeForForward: transition.ShortPurposeForForward || "",
                purposeForForward: transition.PurposeForForward || "",
                sourceHandle,
                targetHandle
              }
            });
          });
        } else {
          console.log(`\n🔗 Creating Default Edge for Step ${sourceId}`);
          
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
      console.log("\n📊 Final Nodes:", JSON.stringify(newNodes, null, 2));
      console.log("\n🔗 Final Edges:", JSON.stringify(newEdges, null, 2));

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
          sourceHandle,
          targetHandle,
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
        console.error("Start node is STILL undefined — nodesCopy:", nodesCopy);
        alert("Still no Start node even after adding one automatically.");
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
      console.log("🚨 Start node right before DFS:", startNode);
      dfs(startNode.id);

      // Optional: include disconnected nodes too (if desired)
      nodesCopy.forEach((node) => {
        if (!visited.has(node.id)) dfs(node.id);
      });

      // Build JSON
      const jsonOutput = {
        Id: "",
        WorkFlowName: workflowForm.WorkFlowName || "Untitled Workflow",
        ModuleId: workflowForm.ModuleId || "",
        ProjectId: workflowForm.ProjectId || "",
        RDLCTypeId: workflowForm.RDLCTypeId || "",
        DateEffective: workflowForm.DateEffective,
        WorkFlowSteps: sortedNodes.map((node) => {
          const props = node.data.properties || {};
          const outgoingEdges = edgesCopy.filter((e) => e.source === node.id);

          const resolveAction = (actionName) =>
            [...stepActionsOptions, ...stepUsersOptions].find(
              (act) => act.ActionName === actionName
            );

          const WorkFlowStepTransition = outgoingEdges
            .filter((edge) => stepCodeMap[edge.target] !== undefined)
            .map((edge) => {
              const action = resolveAction(edge.label);
              return {
                Id: "",
                ActionId: action?.ActionId,
                NextStepCode: "step" + stepCodeMap[edge.target],
                FromHandleId: edge.sourceHandle || "",
                ToHandleId: edge.targetHandle || "",
              };
            });

          return {
            Id: "",
            StepCode: "step" + stepCodeMap[node.id],
            StepName:
              node.data.nodeShape === "Stop" ? "Completed" : node.data.label,
            WorkFlowStepAction: (props.StepActions || []).map((actionName) => {
              const found = stepActionsOptions.find(
                (a) => a.ActionName === actionName
              );
              return {
                Id: "",
                ActionId: found?.ActionId || actionName || "Unknown",
              };
            }),
            WorkFlowStepUser: (props.UserNames || []).map((userName) => {
              const found = stepUsersOptions.find(
                (u) => u.UserName === userName
              );
              return {
                Id: "",
                UserId: found?.UserId || userName || "Unknown",
              };
            }),
            WorkFlowStepTransition,
            Position: node.position,
            Properties: {
              PurposeForForward: props.PurposeForForward || "",
              ShortPurposeForForward: props.ShortPurposeForForward || "",
              NodeShape: node.data.nodeShape || "",
            },
          };
        }),
      };

      console.log("✅ Generated JSON:", jsonOutput);
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
      console.log("JSON saved to localStorage:", jsonString);
      const json = localStorage.getItem("workflowJson");
      console.log("JSON from localStorage:", json);
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

    // Function to select node and show properties
    const handleNodeClick = (event, node) => {
      if (isLocked) return showLockedToast();
      if (node.data.nodeShape === "Start" || node.data.nodeShape === "Stop") {
        return;
      }

      setSelectedNode(node);

      const props = node.data.properties || {};

      // Normalize keys for modal
      const normalizedProps = {
        stepName: props.StepName || node.data.label,
        stepActions: Array.isArray(props.StepActions)
          ? props.StepActions
          : [],
        UserNames: Array.isArray(props.UserNames)
          ? props.UserNames
          : [],
        purposeForForward: props.PurposeForForward || "",
        shortPurposeForForward: props.ShortPurposeForForward || "",
      };
      console.log("🎯 Normalized Props:", normalizedProps);
      setNodeProperties(normalizedProps);
      setModalIsOpen(true);
    };
    // Function to update node properties
    const updateNodeProperties = (e) => {
      const { name } = e.target;
      let value;

      // Handle different input types correctly
      if (e.target.type === "checkbox") {
        value = e.target.checked;
      } else {
        value = e.target.value;
      }

      setNodeProperties((prevProps) => ({
        ...prevProps,
        [name]: value,
      }));
    };

    // Save properties to the node
    const saveNodeProperties = () => {
      addToUndoStack();
      setNodes((nds) =>
        nds.map((n) =>
          n.id === selectedNode.id
            ? {
              ...n,
              data: {
                ...n.data,
                label: nodeProperties.stepName || n.data.label,
                properties: {
                  StepName: nodeProperties.stepName || "",
                  PurposeForForward: nodeProperties.purposeForForward || "",
                  ShortPurposeForForward:
                  nodeProperties.shortPurposeForForward || "",
                  StepActions: nodeProperties.stepActions || [],
                  UserNames: nodeProperties.UserNames || [],
                  NodeShape: n.data.nodeShape,
                },
              },
            }
            : n
        )
      );
      setSelectedNode(null);
      setModalIsOpen(false);
    };

    // Allow changing edge connections dynamically
    const onEdgeUpdate = (oldEdge, newConnection) => {
      setEdges((eds) =>
        eds.map((edge) =>
          edge.id === oldEdge.id ? { ...edge, ...newConnection } : edge
        )
      );
    };

    const updateEdgeLabel = (label) => {
      if (selectedEdge) {
        addToUndoStack();
        setEdges((eds) =>
          eds.map((edge) =>
            edge.id === selectedEdge.id ? { ...edge, label } : edge
          )
        );
        setSelectedEdge((prev) => ({ ...prev, label }));
      }
      setContextMenu(null);
    };
    const handleEdgeRightClick = (event, edge) => {
      if (isLocked) return showLockedToast();
      event.preventDefault();
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

    // Consistent styles for all modals
    const modalStyles = {
      header: {
        textAlign: "center",
        marginBottom: "15px",
        fontWeight: "bold",
        fontSize: "20px",
        color: "#1e293b",
      },
      label: {
        fontWeight: "bold",
        fontSize: "14px",
        color: "#374151",
      },
      input: {
        fontSize: "14px",
        padding: "8px",
        borderRadius: "5px",
        border: "1px solid #ccc",
        width: "100%",
      },
      content: {
        fontSize: "14px",
        color: "#374151",
      },
    };

    useEffect(() => {
     // console.log("Current nodes state:", nodes);
    }, [nodes]);

    return (
      <div
        style={{
          paddingTop: "0px",
          height: "100vh",
          width: "100vw",
          display: "flex",
          background: "#e2e8f0",
        }}
      >
        {/* Sidebar Menu */}
        <div
          style={{
            width: "220px",
            background: "#e2e8f0",
            color: "#1e293b",
            padding: "18px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            boxShadow: "2px 0 8px rgba(0, 0, 0, 0.05)",
            fontFamily: "Inter, sans-serif",
            overflowY: "auto",
            flexShrink: 0, // Prevent it from shrinking
            position: "relative",
          }}
        >
          <h4
            style={{
              margin: "0 0 12px",
              textAlign: "center",
              color: "#0284c7",
              fontSize: "16px",
              fontWeight: "600",
            }}
          >
            ⚙️ Menu
          </h4>
          <div
            style={{
              position: "absolute",
              top: 18,
              right: 10,
              display: "flex",
              gap: "4px",
            }}
          >
            {/* Undo Button */}
            <div
              style={{
                background: "#e2e8f0",
                borderRadius: "50%",
                padding: "6px",
                cursor: "pointer",
              }}
              onClick={handleUndo}
              title="Undo (Ctrl+Z)"
            >
              <FiRotateCcw size={12} color="#1e293b" />
            </div>
            {/* Redo Button */}
            <div
              style={{
                background: "#e2e8f0",
                borderRadius: "50%",
                padding: "6px",
                cursor: "pointer",
              }}
              onClick={handleRedo}
              title="Redo (Ctrl+Y)"
            >
              <FiRotateCw size={12} color="#1e293b" />
            </div>

            {/* Refresh Button */}
            <div
              style={{
                background: "#e2e8f0",
                borderRadius: "50%",
                padding: "6px",
                cursor: "pointer",
              }}
              onClick={() => window.location.reload()}
              title="Refresh Page"
            >
              <FiRefreshCw size={12} color="#1e293b" />
            </div>
          </div>
          {/* File Upload 
        <input
          type="file"
          accept="application/json"
          onChange={handleFileUpload}
          style={{
            fontSize: "12px",
            padding: "5px",
            background: "#ffffff",
            color: "#0f172a",
            border: "1px solid #cbd5e1",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        />*/}

          {/* Node Types */}

          <div
            style={{
              background: "#ffffff",
              padding: "10px",
              borderRadius: "10px",
              border: "1px solid #cbd5e1",
            }}
          >
            <p
              style={{
                fontWeight: "bold",
                margin: "5px 0",
                color: "#0ea5e9",
                fontSize: "12px",
              }}
            >
              🧱 Node Types
            </p>
            {sidebarNodeTypes.map(({ label, color, shape }) => (
              <div
                key={label}
                draggable
                onDragStart={(e) => {
                  e.stopPropagation();
                  onDragStart(e, label);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "14px",
                  cursor: "grab",
                  userSelect: "none",
                  WebkitUserSelect: "none",
                }}
              >
                <span style={{ fontSize: "13px" }}>{label}</span>
                <div
                  style={{
                    width: shape === "diamond" ? 20 : 20,
                    height: shape === "diamond" ? 20 : 20,
                    background: color,
                    ...(shape === "circle" && { borderRadius: "50%" }),
                    ...(shape === "diamond" && { transform: "rotate(45deg)" }),
                    marginLeft: "10px",
                  }}
                />
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          {sidebarButtons.map(({ label, icon, action, color }) => (
            <button
              key={label}
              onClick={action}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
                gap: "12px",
                backgroundColor: color,
                color: "#ffffff",
                fontSize: "14px",
                padding: "8px 12px",
                marginTop: "5px",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                transition: "0.2s",
                boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
                lineHeight: "1",
              }}
            >
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginLeft: "35px",
                }}
              >
                {icon}
              </span>
              <span style={{ fontWeight: 500 }}>{label}</span>
            </button>
          ))}
        </div>

        {/* Workflow Editor */}
        <div
          style={{
            paddingTop: 0,
            flexGrow: 1,
            height: "100vh",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {loadedWorkflowMeta && (
            <div
              style={{
                position: "absolute",
                top: 10,
                left: 240,
                padding: "8px 16px",
                background: "#0284c7",
                color: "#fff",
                borderRadius: "8px",
                zIndex: 20,
                fontSize: "14px",
                fontWeight: "bold",
              }}
            >
              📄 Workflow -- {loadedWorkflowMeta.name} -{" "}
              {loadedWorkflowMeta.description}
            </div>
          )}
          <ReactFlow
            nodes={memoizedNodes}
            edges={edges.map((edge) => {
              const sourceNode = nodes.find((n) => n.id === edge.source);
              const targetNode = nodes.find((n) => n.id === edge.target);
              let stroke = "#333"; // default neutral

              if (sourceNode && targetNode) {
                if (targetNode.position.y > sourceNode.position.y) {
                  stroke = "green"; // Forward
                } else if (targetNode.position.y < sourceNode.position.y) {
                  stroke = "red"; // Backward
                }
              }

              return {
                ...edge,
                style: {
                  ...(edge.style || {}),
                  stroke,
                  strokeWidth: 2,
                },
              };
            })}
            edgeTypes={edgeTypes}
            nodeTypes={nodeTypes}
            onNodesChange={isLocked ? undefined : onNodesChange}
            onEdgesChange={isLocked ? undefined : onEdgesChange}
            onNodeClick={isLocked ? undefined : handleNodeClick}
            onSelectionChange={(e) => {
              const selected = [...(e?.nodes || []), ...(e?.edges || [])];

              // Avoid infinite loop by comparing with existing state
              const isSameSelection =
                selected.length === selectedElements.length &&
                selected.every(
                  (el, index) => el.id === selectedElements[index]?.id
                );

              if (!isSameSelection) {
                setSelectedElements(selected);
              }
            }}
            // <-- capture selection
            selectionKeyCode="Shift"
            multiSelectionKeyCode="Meta" // For Mac CMD key
            onDrop={isLocked ? undefined : onDrop}
            onDragOver={isLocked ? undefined : onDragOver}
            onConnect={
              isLocked
                ? showLockedToast
                : (params) => {
                  if (params.source === "stop") {
                    alert(
                      "🚫 You cannot draw connections from the Stop node."
                    );
                    return;
                  }
                  addToUndoStack();
                  setEdges((eds) =>
                    addEdge(
                      {
                        ...params,
                        sourceHandle: params.sourceHandle,
                        targetHandle: params.targetHandle,
                        animated: false,
                        type: edgeStyle,
                        markerEnd: { type: MarkerType.ArrowClosed },
                        style: { strokeWidth: 2, stroke: "#333" },
                        label: "",
                        data: {
                          shortPurposeForForward: "",
                          purposeForForward: "",
                          sourceHandle: params.sourceHandle,
                          targetHandle: params.targetHandle,
                        },
                        labelStyle: { fill: "#fff", fontWeight: 700 },
                      },
                      eds
                    )
                  );
                }
            }
            onNodeMouseEnter={(_, node) => {
              clearTimeout(hoverTimeout);
              setHoveredNodeId(node.id);
            }}
            onNodeMouseLeave={() => {
              hoverTimeout = setTimeout(() => setHoveredNodeId(null), 150);
            }}
            onNodeContextMenu={isLocked ? undefined : handleNodeRightClick}
            onEdgeUpdate={onEdgeUpdate}
            onEdgeContextMenu={isLocked ? undefined : handleEdgeRightClick}
            onEdgeMouseEnter={(_, edge) => setHoveredEdgeId(edge.id)}
            onEdgeMouseLeave={() => setHoveredEdgeId(null)}
            defaultViewport={{ x: 0, y: 0, zoom: 1 }}
            style={{ background: "#F5F5F5" }}
          >
            <CanvasControls
              backgroundVariant={backgroundVariant}
              setBackgroundVariant={setBackgroundVariant}
            />
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
              style={{
                zIndex: 10, // Make sure it shows above everything
                marginRight: 10,
                marginTop: 469,
              }}
            >
              {" "}
              <ControlButton
                title={isLocked ? "Unlock Canvas" : "Lock Canvas"}
                onClick={() => setIsLocked((prev) => !prev)}
              >
                {isLocked ? <FaLock color="#333" /> : <FaUnlock color="#333" />}
              </ControlButton>{" "}
            </Controls>
            {backgroundVariant !== "solid" && (
              <Background
                variant={backgroundVariant}
                gap={12}
                color="#d4d4d4"
              />
            )}
            {selectedElements.length > 1 && (
              <div
                style={{
                  position: "absolute",
                  top: 10,
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: "#0f172a",
                  color: "#fff",
                  padding: "6px 12px",
                  borderRadius: "6px",
                  fontSize: "14px",
                  zIndex: 50,
                  boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                }}
              >
                🔗 {selectedElements.length} nodes selected
              </div>
            )}
          </ReactFlow>
          <EdgeLabelRenderer>
            {edges
              .filter(
                (edge) =>
                  edge.id === hoveredEdgeId &&
                  (edge.label ||
                    edge.data?.shortPurposeForForward ||
                    edge.data?.purposeForForward)
              )
              .map((edge) => {
                const sourceNode = nodes.find((n) => n.id === edge.source);
                const targetNode = nodes.find((n) => n.id === edge.target);
                if (!sourceNode || !targetNode) return null;

                const edgeCenterX =
                  (sourceNode.position.x + targetNode.position.x) / 2 + 75;
                const edgeCenterY =
                  (sourceNode.position.y + targetNode.position.y) / 2 + 10; // Changed from 30 to 10 to move up

                return (
                  <div
                    key={`tooltip-${edge.id}`}
                    style={{
                      position: "absolute",
                      transform: `translate(-50%, -100%) translate(${edgeCenterX}px, ${edgeCenterY}px)`, // Changed from -50% to -100% to position above
                      background: "#fefce8",
                      color: "black",
                      padding: "6px 10px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      whiteSpace: "pre-line",
                      maxWidth: "240px",
                      zIndex: 999,
                      pointerEvents: "none",
                      boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
                    }}
                  >
                    {edge.label && (
                      <div>
                        <strong>{edge.label}</strong>
                      </div>
                    )}
                    {edge?.data?.shortPurposeForForward && (
                      <div>
                        <em>{edge.data.shortPurposeForForward}</em>
                      </div>
                    )}
                    {edge?.data?.purposeForForward && (
                      <div style={{ marginTop: "4px" }}>
                        {edge.data.purposeForForward}
                      </div>
                    )}
                  </div>
                );
              })}
          </EdgeLabelRenderer>
        </div>
        {!isLocked && contextMenu && selectedEdge && (
          <div
            id="edge-context-menu"
            style={{
              position: "absolute",
              top: edgeMenuPosition.y,
              left: edgeMenuPosition.x,
              background: "white",
              border: "1px solid black",
              borderRadius: "10px",
              boxShadow: "0 4px 10px rgba(0, 0, 0, 0.3)",
              padding: "10px",
              zIndex: 1000,
              minWidth: "250px",
              cursor: isDraggingEdgeMenu ? "grabbing" : "grab",
              borderRadius: "8px",
              boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
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
              {/* Short Purpose 
              <label style={{ display: "block", marginBottom: "5px" }}>
                Short Purpose for Forward:
              </label>
              <input
                type="text"
                name="shortPurposeForForward"
                value={selectedEdge?.data?.shortPurposeForForward || ""}
                onChange={(e) => {
                  const value = e.target.value;
                  setEdges((prevEdges) =>
                    prevEdges.map((edge) =>
                      edge.id === selectedEdge.id
                        ? {
                            ...edge,
                            data: {
                              ...edge.data,
                              shortPurposeForForward: value,
                            },
                          }
                        : edge
                    )
                  );
                  setSelectedEdge((prev) => ({
                    ...prev,
                    data: {
                      ...prev.data,
                      shortPurposeForForward: value,
                    },
                  }));
                }}
                style={{
                  padding: "8px",
                  borderRadius: "6px",
                  border: "1px solid #ccc",
                  marginBottom: "10px",
                  width: "90%",
                }}
              />*/}

              {/* Purpose 
              <label style={{ display: "block", marginBottom: "5px" }}>
                Purpose for Forward:
              </label>
              <textarea
                name="purposeForForward"
                rows={4}
                value={(() => {
                  const edge = edges.find((e) => e.id === selectedEdge?.id);
                  return edge?.data?.purposeForForward || "";
                })()}
                onChange={(e) => {
                  const value = e.target.value;
                  setEdges((prevEdges) =>
                    prevEdges.map((edge) =>
                      edge.id === selectedEdge.id
                        ? {
                            ...edge,
                            data: {
                              ...edge.data,
                              purposeForForward: value,
                            },
                          }
                        : edge
                    )
                  );
                }}
                style={{
                  padding: "6px",
                  borderRadius: "5px",
                  border: "1px solid #ccc",
                  resize: "vertical",
                  width: "90%",
                }}
              />*/}
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
                options={stepActionsOptions.map((action) => ({
                  label: action.ActionName,
                  value: action.ActionName,
                }))}
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
            style={{
              position: "absolute",
              top: nodeMenuPosition.y,
              left: nodeMenuPosition.x,
              background: "white",
              border: "1px solid black",
              padding: "10px",
              zIndex: 1000,
              minWidth: "140px",
              cursor: isDraggingNodeMenu ? "grabbing" : "grab",
              borderRadius: "8px",
              boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
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
                  alert("🚫 Start and Stop nodes cannot be deleted.");
                  return;
                }
                addToUndoStack();
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
                const newLabel = prompt(
                  "Rename node:",
                  nodeContextMenu.node.data.label
                );
                if (newLabel) {
                  setNodes((nds) =>
                    nds.map((n) =>
                      n.id === nodeContextMenu.node.id
                        ? { ...n, data: { ...n.data, label: newLabel } }
                        : n
                    )
                  );
                }
                setNodeContextMenu(null);
              }}
              style={{ cursor: "pointer", marginBottom: "5px" }}
            >
              ✏️ Rename Node
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
                addToUndoStack();
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
                addToUndoStack();
                setNodes((nds) => [...nds, duplicatedNode]);
                setNodeContextMenu(null);
              }}
              style={{ cursor: "pointer", marginBottom: "5px" }}
            >
              🔁 Duplicate Node
            </p>
          </div>
        )}

        {/* Node Properties Modal */}
        <Modal
          isOpen={modalIsOpen}
          onRequestClose={() => setModalIsOpen(false)}
          parentSelector={() => document.querySelector(".container")}
          style={{
            content: {
              width: "30%",
              minHeight: "400px",
              maxHeight: "80vh",
              margin: "auto",
              padding: "15px",
              borderRadius: "10px",
              boxShadow: "0 4px 10px rgba(0, 0, 0, 0.3)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            },
            overlay: {
              backgroundColor: "rgba(0, 0, 0, 0.5)",
            },
          }}
        >
          <h2 style={modalStyles.header}>Node Properties</h2>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              overflowY: "auto",
              paddingRight: "10px",
              flex: 1,
            }}
          >
            {/* Description Field */}
            <label style={modalStyles.label}>Step Name :</label>
            <input
              type="text"
              name="stepName"
              value={nodeProperties.stepName || ""}
              onChange={updateNodeProperties}
              style={{ ...modalStyles.input, width: "95%" }}
            />

            {/* Step Actions Multi-Select */}
            <label style={modalStyles.label}>Step Actions:</label>
            <Select
              isMulti
              closeMenuOnSelect={false}
              hideSelectedOptions={false}
              options={stepActionsOptions.map((action) => ({
                label: action.ActionName,
                value: action.ActionName,
              }))}
              value={
                nodeProperties.stepActions?.map((actionName) => ({
                  label: actionName,
                  value: actionName,
                })) || []
              }
              onChange={(selected) =>
                setNodeProperties((prev) => ({
                  ...prev,
                  stepActions: selected
                    ? selected.map((item) => item.value)
                    : [],
                }))
              }
              styles={{
                control: (base) => ({
                  ...base,
                  fontSize: "14px",
                }),
                option: (base, state) => ({
                  ...base,
                  fontSize: "14px",
                  backgroundColor: state.isSelected ? "#e2e8f0" : "white",
                  color: "black",
                  "&:hover": {
                    backgroundColor: "#f1f5f9",
                  },
                }),
                multiValue: (base) => ({
                  ...base,
                  backgroundColor: "#e2e8f0",
                  borderRadius: "4px",
                  margin: "2px",
                }),
                multiValueLabel: (base) => ({
                  ...base,
                  color: "black",
                  padding: "4px 8px",
                }),
              }}
              components={{
                Option: ({ children, ...props }) => (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "8px",
                      cursor: "pointer",
                    }}
                    onClick={() => props.selectOption(props.data)}
                  >
                    <input
                      type="checkbox"
                      checked={props.isSelected}
                      onChange={() => { }}
                      style={{ marginRight: "8px" }}
                    />
                    {children}
                  </div>
                ),
              }}
            />

            {/* Users Multi-Select */}
            <label style={modalStyles.label}>Users:</label>
            <Select
              isMulti
              closeMenuOnSelect={false}
              hideSelectedOptions={false}
              options={stepUsersOptions.map((user) => ({
                label: user.UserName,
                value: user.UserName,
              }))}
              value={
                nodeProperties.UserNames?.map((userName) => ({
                  label: userName,
                  value: userName,
                })) || []
              }
              onChange={(selected) =>
                setNodeProperties((prev) => ({
                  ...prev,
                  UserNames: selected
                    ? selected.map((item) => item.value)
                    : [],
                }))
              }
              styles={{
                control: (base) => ({
                  ...base,
                  fontSize: "14px",
                }),
                option: (base, state) => ({
                  ...base,
                  fontSize: "14px",
                  backgroundColor: state.isSelected ? "#e2e8f0" : "white",
                  color: "black",
                  "&:hover": {
                    backgroundColor: "#f1f5f9",
                  },
                }),
                multiValue: (base) => ({
                  ...base,
                  backgroundColor: "#e2e8f0",
                  borderRadius: "4px",
                  margin: "2px",
                }),
                multiValueLabel: (base) => ({
                  ...base,
                  color: "black",
                  padding: "4px 8px",
                }),
              }}
            />

            {/* Buttons */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-evenly",
                marginTop: "20px",
              }}
            >
              <button
                onClick={saveNodeProperties}
                style={{
                  ...modalButtonStyle,
                  background: "#3498db",
                  color: "white",
                }}
              >
                Save
              </button>
              <button
                onClick={() => setModalIsOpen(false)}
                style={{
                  ...modalButtonStyle,
                  background: "#e74c3c",
                  color: "white",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>

        {/* JSON View Modal */}
        <Modal
          isOpen={modalIsOpen1}
          onRequestClose={() => setModalIsOpen1(false)}
          parentSelector={() => document.querySelector(".container")}
          style={{
            content: {
              width: "50%",
              margin: "auto",
              padding: "15px",
              borderRadius: "10px",
              boxShadow: "0 4px 10px rgba(0, 0, 0, 0.3)",
              minHeight: "400px",
              maxHeight: "80vh",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            },
            overlay: {
              backgroundColor: "rgba(0, 0, 0, 0.5)",
            },
          }}
        >
          <h2 style={modalStyles.header}>Workflow JSON</h2>
          <div style={{ overflowY: "auto", flex: 1 }}>
            <pre style={{ ...modalStyles.content, whiteSpace: "pre-wrap" }}>
              {jsonData}
            </pre>
          </div>
          <div style={{ marginTop: "20px", textAlign: "center" }}>
            <button
              onClick={() => setModalIsOpen1(false)}
              style={{
                ...modalButtonStyle,
                background: "#e74c3c",
                color: "white",
              }}
            >
              Close
            </button>
          </div>
        </Modal>
        {lockedToast && (
          <div
            style={{
              position: "absolute",
              top: 70,
              right: 20,
              backgroundColor: "#f87171",
              color: "#fff",
              padding: "10px 16px",
              borderRadius: "8px",
              fontSize: "14px",
              boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
              zIndex: 30,
              animation: "fadeInOut 2s ease",
            }}
          >
            🚫 Workflow is locked
          </div>
        )}
        {/* Workflow naming Modal */}
        <Modal
          isOpen={metaModalOpen}
          onRequestClose={() => setMetaModalOpen(false)}
          parentSelector={() => document.querySelector(".container")}
          style={{
            content: {
              width: "30%",
              minHeight: "400px",
              maxHeight: "80vh",
              margin: "auto",
              padding: "20px",
              borderRadius: "10px",
              boxShadow: "0 4px 10px rgba(0, 0, 0, 0.3)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            },
            overlay: {
              backgroundColor: "rgba(0, 0, 0, 0.5)",
            },
          }}
        >
          <h3 style={modalStyles.header}>Workflow Details</h3>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "15px",
              overflowY: "auto",
              flex: 1,
              paddingRight: "10px",
            }}
          >
            {pendingAction !== "create" && (
              <>
                <label style={modalStyles.label}>Select Workflow:</label>
                <Select
                  options={workflowOptions}
                  value={selectedWorkflowOption}
                  onChange={(selected) => {
                    setSelectedWorkflowOption(selected);
                    if (selected.value === "new") {
                      setWorkflowMeta({
                        name: "",
                        description: "",
                        dateEffective: new Date().toISOString(),
                      });
                    } else {
                      setWorkflowMeta({
                        name: selected.data.Name,
                        description: selected.data.Description,
                        dateEffective: new Date().toISOString(),
                      });
                    }
                  }}
                  styles={{
                    control: (base) => ({
                      ...base,
                      fontSize: "14px",
                    }),
                    option: (base) => ({
                      ...base,
                      fontSize: "14px",
                    }),
                  }}
                />
              </>
            )}

            <label style={modalStyles.label}>Name:</label>
            <input
              type="text"
              maxLength={64}
              value={workflowMeta.name}
              onChange={(e) =>
                setWorkflowMeta({ ...workflowMeta, name: e.target.value })
              }
              style={modalStyles.input}
            />

            <label style={modalStyles.label}>Description:</label>
            <textarea
              maxLength={256}
              value={workflowMeta.description}
              onChange={(e) =>
                setWorkflowMeta({
                  ...workflowMeta,
                  description: e.target.value,
                })
              }
              style={{
                ...modalStyles.input,
                height: "60px",
                resize: "vertical",
              }}
            />

            <label style={modalStyles.label}>Effective Date:</label>
            <input
              type="datetime-local"
              value={workflowMeta.dateEffective.slice(0, 16)}
              onChange={(e) =>
                setWorkflowMeta({
                  ...workflowMeta,
                  dateEffective: new Date(e.target.value).toISOString(),
                })
              }
              style={modalStyles.input}
            />
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-evenly",
              marginTop: "20px",
            }}
          >
            <button
              onClick={handleMetaContinue}
              style={{
                ...modalButtonStyle,
                background: "#10b981",
                color: "white",
              }}
            >
              Continue
            </button>
            <button
              onClick={() => setMetaModalOpen(false)}
              style={{
                ...modalButtonStyle,
                background: "#e74c3c",
                color: "white",
              }}
            >
              Cancel
            </button>
          </div>
        </Modal>
        {/* Modal for Loading the Workflow 
        <Modal
          isOpen={loadWorkflowModalOpen}
          onRequestClose={() => setLoadWorkflowModalOpen(false)}
          parentSelector={() => document.querySelector(".container")}
          style={{
            content: {
              width: "30%",
              minHeight: "200px",
              maxHeight: "40vh",
              margin: "auto",
              padding: "20px",
              borderRadius: "10px",
              boxShadow: "0 4px 10px rgba(0, 0, 0, 0.3)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            },
            overlay: {
              backgroundColor: "rgba(0, 0, 0, 0.5)",
            },
          }}
        >
          <h3 style={modalStyles.header}>Load Workflow</h3>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "15px",
              overflowY: "auto",
              flex: 1,
              paddingRight: "10px",
            }}
          >
            <label style={modalStyles.label}>Select Workflow:</label>
            <Select
              options={allWorkflows.map((wf) => ({
                value: wf.Id,
                label: `${wf.Name} - ${wf.Description}`,
                data: wf,
              }))}
              value={selectedWorkflowToLoad}
              onChange={(selected) => setSelectedWorkflowToLoad(selected)}
              styles={{
                control: (base) => ({
                  ...base,
                  fontSize: "14px",
                }),
                option: (base) => ({
                  ...base,
                  fontSize: "14px",
                }),
                menuPortal: (base) => ({ ...base, zIndex: 9999 }),
              }}
              menuPortalTarget={
                typeof window !== "undefined" ? document.body : null
              }
              menuPosition="fixed"
            />
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-evenly",
              marginTop: "20px",
            }}
          >
            <button
              onClick={async () => {
                if (!selectedWorkflowToLoad) return;
                const workflowId = selectedWorkflowToLoad.value;
                try {
                  const response = await fetch(
                    `${loadWorkflow}/${workflowId}`,
                    {
                      method: "GET",
                      headers: {
                        ...apiUrls?.headers, // ✅ Inject headers from Angular
                      },
                    }
                  );
                  const data = await response.json();
                  console.log("responsedata", data);
                  if (data?.Workflow?.Steps?.length > 0) {
                    convertJsonToWorkflow(data);
                    setWorkflowMeta({
                      name: data.Workflow.Name || "",
                      description: data.Workflow.Description || "",
                      dateEffective:
                        data.Workflow.DateEffective || new Date().toISOString(),
                    });
                    setSelectedWorkflowOption({
                      label: `${data.Workflow.Name} - ${data.Workflow.Description}`,
                      value: data.Workflow.Id,
                      data: data.Workflow,
                    });
                    //alert("📥 Workflow loaded successfully!");
                    setLoadWorkflowModalOpen(false);
                  } else {
                    alert("⚠️ No workflow data found.");
                  }
                } catch (error) {
                  console.error("Error loading workflow:", error);
                  alert("🚨 Error occurred while loading workflow.");
                }
              }}
              style={{
                ...modalButtonStyle,
                background: "#10b981",
                color: "white",
              }}
            >
              Load
            </button>
            <button
              onClick={() => setLoadWorkflowModalOpen(false)}
              style={{
                ...modalButtonStyle,
                background: "#e74c3c",
                color: "white",
              }}
            >
              Cancel
            </button>
          </div>
        </Modal>*/}
      </div>
    );
  }
);
const buttonStyle = {
  background: "#f1f5f9",
  border: "1px solid #cbd5e1",
  borderRadius: "6px",
  padding: "6px 8px",
  cursor: "pointer",
  fontSize: "14px",
  transition: "transform 0.2s ease",
};

// Consistent style for all modal buttons
const modalButtonStyle = {
  height: "40px",
  minWidth: "110px",
  padding: "10px 15px",
  fontSize: "14px",
  fontWeight: "500",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
};

export default WorkflowEditor;
