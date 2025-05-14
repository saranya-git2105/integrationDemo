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
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import CustomNode from "./CustomNode";
import CustomSmoothEdge from "./CustomSmoothEdge";
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
          toast.warning("⚠️ Please drag and place a Start node first before saving or viewing the workflow.", {
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
          if (Array.isArray(data.Data.ProjectMemberDetails)) {
            const userOptions = data.Data.ProjectMemberDetails.map((user) => ({
              UserId: user.HRMSEmployeeId,
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
            toast.warning("⚠️ Please add at least one node to the workflow before viewing JSON.", {
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
      addToUndoStack();
      const reactFlowBounds = event.target.getBoundingClientRect();
      const nodeType = event.dataTransfer.getData("application/reactflow");

      // Check if trying to add Start/Stop node when one already exists
      if (nodeType === "Start" && nodes.some(n => n.data.nodeShape === "Start")) {
        toast.error("⚠️Cannot add multiple Start nodes.", {
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
        toast.error("⚠️ Cannot add multiple Stop nodes.", {
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
      console.log("📥 Incoming JSON Data:", JSON.stringify(data, null, 2));
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
        console.warn("⚠️ Multiple Start nodes found in workflow data. Using only the first one.");
        // Keep only the first Start node
        const firstStartIndex = workflowSteps.findIndex(step => 
          step.StepName?.toLowerCase() === "start" || 
          step.Properties?.NodeShape === "Start"
        );
        workflowSteps.splice(firstStartIndex + 1, startNodes.length - 1);
      }

      if (stopNodes.length > 1) {
        console.warn("⚠️ Multiple Stop nodes found in workflow data. Using only the first one.");
        // Keep only the first Stop node
        const firstStopIndex = workflowSteps.findIndex(step => 
          step.StepName?.toLowerCase() === "stop" || 
          step.StepName?.toLowerCase() === "completed" ||
          step.Properties?.NodeShape === "Stop"
        );
        workflowSteps.splice(firstStopIndex + 1, stopNodes.length - 1);
      }

      if (!actions.length) {
        console.log("⏳ Loading actions...");
        try {
          const actionsData = await Promise.resolve(getActions());
          console.log("📥 Raw Actions Response:", actionsData);

          if (actionsData?.ReturnCode === 0 && Array.isArray(actionsData.Data)) {
            actions = actionsData.Data.map((action) => ({
              ActionId: action.Id,
              ActionName: action.Name,
              ActionCode: action.Code,
            }));
            console.log("📋 Formatted Actions:", actions);
            setStepActionsOptions(actions);
          } else {
            console.warn("⚠️ Invalid actions data format:", actionsData);
            return;
          }
        } catch (err) {
          console.error("❌ Failed to load actions:", err);
          return;
        }
      }

      if (!users.length) {
        console.log("⏳ Loading users...");
        try {
          const usersData = await Promise.resolve(getUsers());
          console.log("📥 Raw Users Response:", usersData);

          if (Array.isArray(usersData.Data.ProjectMemberDetails)) {
            users = usersData.Data.ProjectMemberDetails.map((user) => ({
              UserId: user.HRMSEmployeeId,
              UserName: user.Name,
            }));
            console.log("📋 Formatted Users:", users);
            setStepUsersOptions(users);
          } else {
            console.warn("⚠️ Invalid users data format:", usersData);
            return;
          }
        } catch (err) {
          console.error("❌ Failed to load users:", err);
          return;
        }
      }

      // Verify both actions and users are loaded
      if (!actions.length || !users.length) {
        console.error("❌ Actions or users not loaded, cannot proceed with workflow conversion");
        return;
      }

      if (!workflowSteps.length) {
        console.warn("⚠️ No workflow steps found in the data");
        return;
      }

      // Helper function to get action name from ID
      const getActionNameFromId = (actionId) => {
        if (!actionId) {
          console.warn("⚠️ No action ID provided");
          return "";
        }

        console.log("🔍 Looking up action:", {
          actionId,
          availableActions: actions,
          actionCount: actions.length
        });

        const foundAction = actions.find(a => a.ActionId === actionId);
        if (foundAction) {
          console.log("✅ Found action:", foundAction);
          return foundAction.ActionName;
        }

        // Try to find by ActionCode if ActionId doesn't match
        const foundByCode = actions.find(a => a.ActionCode === actionId);
        if (foundByCode) {
          console.log("✅ Found action by code:", foundByCode);
          return foundByCode.ActionName;
        }

        console.warn("⚠️ Action not found:", actionId);
        return actionId;
      };

      // Helper function to get user name from ID
      const getUserNameFromId = (userId) => {
        if (!userId) {
          console.warn("⚠️ No user ID provided");
          return "";
        }

        console.log("🔍 Looking up user:", {
          userId,
          availableUsers: users,
          userCount: users.length
        });

        const foundUser = users.find(u => u.UserId === userId);
        if (foundUser) {
          console.log("✅ Found user:", foundUser);
          return foundUser.UserName;
        }

        console.warn("⚠️ User not found:", userId);
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

        console.log(`\n🏗️ Creating Node:`, {
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
            const actionId = transition.ActionId || transition.label;

            const actionName = getActionNameFromId(actionId);

            console.log(`\n🔗 Creating Edge:`, {
              source: sourceId,
              target: targetId,
              fromHandle: transition.FromHandleId || transition.sourceHandle,

              toHandle: transition.ToHandleId || transition.targetHandle,

              actionName,

              actionId
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
              style: { strokeWidth: 2, stroke: "#333" },
              data: {
                shortPurposeForForward: transition.ShortPurposeForForward || "",
                purposeForForward: transition.PurposeForForward || "",
                sourceHandle,
                targetHandle,
                actionName: actionName,
                actionId: actionId
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
      console.log("originalWorkflow", originalWorkflow);
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
        console.error("Start node is STILL undefined — nodesCopy:", nodesCopy);
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
        WorkFlowName: workflowForm?.WorkFlowName,
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
      const originalWorkflow = JSON.parse(localStorage.getItem("ModifyWorkFlowJson") || "{}");
      
      // Get the step code from the node's data
      const stepCode = props.StepCode || `step${nodes.findIndex(n => n.id === node.id)}`;
      
      // Find the original step by matching the StepCode
      const originalStep = originalWorkflow.WorkFlowSteps?.find(step => 
        step.StepCode === stepCode
      );

      // Normalize keys for modal with preserved IDs
      const normalizedProps = {
        stepName: props.StepName || node.data.label,
        stepActions: Array.isArray(props.StepActions)
          ? props.StepActions.map(actionName => {
              const found = stepActionsOptions.find(a => a.ActionName === actionName);
              const originalAction = originalStep?.WorkFlowStepAction?.find(a => 
                a.ActionId === found?.ActionId
              );
              return {
                name: actionName,
                id: originalAction?.Id || ""
              };
            })
          : [],
        UserNames: Array.isArray(props.UserNames)
          ? props.UserNames.map(userName => {
              const found = stepUsersOptions.find(u => u.UserName === userName);
              const originalUser = originalStep?.WorkFlowStepUser?.find(u => 
                u.UserId === found?.UserId
              );
              return {
                name: userName,
                id: originalUser?.Id || ""
              };
            })
          : [],
        purposeForForward: props.PurposeForForward || "",
        shortPurposeForForward: props.ShortPurposeForForward || "",
        Id: originalStep?.Id || "",
        StepCode: stepCode
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
                  Id: nodeProperties.Id || "",
                  StepCode: nodeProperties.StepCode || "",
                  StepName: nodeProperties.stepName || "",
                  PurposeForForward: nodeProperties.purposeForForward || "",
                  ShortPurposeForForward:
                    nodeProperties.shortPurposeForForward || "",
                  StepActions: nodeProperties.stepActions?.map(action => 
                    typeof action === 'string' ? action : action.name
                  ) || [],
                  UserNames: nodeProperties.UserNames?.map(user => 
                    typeof user === 'string' ? user : user.name
                  ) || [],
                  NodeShape: n.data.nodeShape,
                },
              },
            }
            : n
        )
      );
      setEdges((eds) => {
        const outgoing = eds.filter((e) => e.source === selectedNode.id);
        const updated = eds.map((e) => {
          if (e.source === selectedNode.id) {
            const actionIndex = outgoing.findIndex((x) => x.id === e.id);
            const newLabel = nodeProperties.stepActions?.[actionIndex]?.name || 
                           (typeof nodeProperties.stepActions?.[actionIndex] === 'string' ? 
                           nodeProperties.stepActions?.[actionIndex] : e.label);
            return {
              ...e,
              label: newLabel,
              data: {
                ...e.data,
                actionName: newLabel,
              },
            };
          }
          return e;
        });
        return updated;
      });
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

    // Remove the modalStyles object since we're using CSS classes now
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
        />
        {/* Sidebar Menu */}
        <div className="workflow-sidebar">
          {/* Only show titles on desktop */}
          <div class="flowchart-header">
            <div className="desktop-only">
              <h4 className="sidebar-title">⚙️ Menu</h4>
            </div>

            <div className="sidebar-controls">
              {/* Undo Button */}
              <div className="control-button" onClick={handleUndo} title="Undo (Ctrl+Z)">
                <FiRotateCcw size={12} color="#1e293b" />
              </div>
              {/* Redo Button */}
              <div className="control-button" onClick={handleRedo} title="Redo (Ctrl+Y)">
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
            onEdgeClick={isLocked ? undefined : handleEdgeClick}
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
                    toast.error("🚫 You cannot draw connections from the Stop node.", {
                      position: "top-right",
                      autoClose: 500,
                      hideProgressBar: true,
                      closeOnClick: true,
                      pauseOnHover: true,
                      draggable: true,
                    });
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
                  (sourceNode.position.y + targetNode.position.y) / 2 + 10;

                return (
                  <div
                   
                  >
                    {edge.label && (
                      <div>
                        <strong>{edge.label}</strong>
                      </div>
                    )}
                   
                  </div>
                );
              })}
          </EdgeLabelRenderer>
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
                  toast.error("🚫 Start and Stop nodes cannot be deleted.", {
                    position: "top-right",
                    autoClose: 500,
                    hideProgressBar: true,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                  });
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

        {/* Modal for Node Properties */}
        <Modal
          isOpen={modalIsOpen}
          onRequestClose={() => setModalIsOpen(false)}
          parentSelector={() => document.querySelector(".container")}
          className="modal-content node-properties-modal"
        >
          <h2 className="modal-header">Node Properties</h2>

          <div className="modal-content-container">
            {/* Description Field */}
            <div class="form-input-section">
              <label className="modal-label">Step Name :</label>
              <input
                type="text"
                name="stepName"
                value={nodeProperties.stepName || ""}
                onChange={updateNodeProperties}
                className="modal-input common-form-field-height"
              />
            </div>
            <div class="form-input-section">
              {/* Step Actions Multi-Select */}
              <label className="modal-label">Step Actions:</label>
              <Select
                isMulti
                closeMenuOnSelect={false}
                hideSelectedOptions={false}
                options={[
                  { 
                    label: "Select All", 
                    value: "__SELECT_ALL__",
                    isDisabled: false 
                  },
                  ...stepActionsOptions.map((action) => ({
                    label: action.ActionName,
                    value: action.ActionName,
                  }))
                ]}
                value={
                  nodeProperties.stepActions?.map((actionName) => ({
                    label: actionName,
                    value: actionName,
                  })) || []
                }
                onChange={(selected) => {
                  const hasSelectAll = selected?.some(item => item.value === "__SELECT_ALL__");
                  const allActionNames = stepActionsOptions.map(action => action.ActionName);
                  const currentActionNames = nodeProperties.stepActions || [];
                  
                  if (hasSelectAll) {
                    // If "Select All" was clicked, check if all are selected
                    const allSelected = allActionNames.every(name => 
                      currentActionNames.includes(name)
                    );
                    
                    if (allSelected) {
                      // Deselect all
                      setNodeProperties((prev) => ({
                        ...prev,
                        stepActions: [],
                      }));
                    } else {
                      // Select all
                      setNodeProperties((prev) => ({
                        ...prev,
                        stepActions: allActionNames,
                      }));
                    }
                  } else {
                    // Normal selection
                    setNodeProperties((prev) => ({
                      ...prev,
                      stepActions: selected ? selected.map((item) => item.value) : [],
                    }));
                  }
                }}
                className="modal-select common-form-field-height"
                classNamePrefix="modal-select"
                components={{
                  MultiValue: ({ index, getValue, ...props }) => {
                    // Don't show the "Select All" option in the selected values
                    if (props.data.value === "__SELECT_ALL__") {
                      return null;
                    }
                    
                    const maxToShow = 2;
                    const values = getValue().filter(v => v.value !== "__SELECT_ALL__");
                    const length = values.length;
                    
                    // Don't render anything for indices beyond maxToShow
                    if (index >= maxToShow) {
                      return null;
                    }
                    
                    // If this is the second item and there are more items
                    if (index === 1 && length > maxToShow) {
                      return (
                        <>
                          <div className="multi-value-container">
                            {props.data.label}
                          </div>
                          <div className="count-number">
                            +{length - maxToShow}
                          </div>
                        </>
                      );
                    }
                    
                    // For the first item or if there are only 2 or fewer items
                    return (
                      <div className="multi-value-container">
                        {props.data.label}
                      </div>
                    );
                  },
                  Option: ({ children, ...props }) => {
                    const { isSelected, isFocused, innerRef, innerProps, data } = props;
                    
                    // Special handling for "Select All" option
                    if (data.value === "__SELECT_ALL__") {
                      const allActionNames = stepActionsOptions.map(action => action.ActionName);
                      const currentActionNames = nodeProperties.stepActions || [];
                      const allSelected = allActionNames.every(name => 
                        currentActionNames.includes(name)
                      );
                      
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
                            onChange={() => null}
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
                          onChange={() => null}
                          className="multi-value-checkbox"
                        />
                        <div>{children}</div>
                      </div>
                    );
                  },
                }}
              />
            </div>
            <div class="form-input-section">
              {/* Users Multi-Select */}
              <label className="modal-label">Users:</label>
              <Select
                isMulti
                closeMenuOnSelect={false}
                hideSelectedOptions={false}
                options={[
                  { 
                    label: "Select All", 
                    value: "__SELECT_ALL_USERS__",
                    isDisabled: false 
                  },
                  ...stepUsersOptions.map((user) => ({
                    label: user.UserName,
                    value: user.UserName,
                  }))
                ]}
                value={
                  nodeProperties.UserNames?.map((userName) => ({
                    label: userName,
                    value: userName,
                  })) || []
                }
                onChange={(selected) => {
                  const hasSelectAll = selected?.some(item => item.value === "__SELECT_ALL_USERS__");
                  const allUserNames = stepUsersOptions.map(user => user.UserName);
                  const currentUserNames = nodeProperties.UserNames || [];
                  
                  if (hasSelectAll) {
                    // If "Select All" was clicked, check if all are selected
                    const allSelected = allUserNames.every(name => 
                      currentUserNames.includes(name)
                    );
                    
                    if (allSelected) {
                      // Deselect all
                      setNodeProperties((prev) => ({
                        ...prev,
                        UserNames: [],
                      }));
                    } else {
                      // Select all
                      setNodeProperties((prev) => ({
                        ...prev,
                        UserNames: allUserNames,
                      }));
                    }
                  } else {
                    // Normal selection
                    setNodeProperties((prev) => ({
                      ...prev,
                      UserNames: selected ? selected.map((item) => item.value) : [],
                    }));
                  }
                }}
                className="modal-select common-form-field-height"
                classNamePrefix="modal-select"
                components={{
                  MultiValue: ({ index, getValue, ...props }) => {
                    // Don't show the "Select All" option in the selected values
                    if (props.data.value === "__SELECT_ALL_USERS__") {
                      return null;
                    }
                    
                    const maxToShow = 2;
                    const values = getValue().filter(v => v.value !== "__SELECT_ALL_USERS__");
                    const length = values.length;
                    
                    // Don't render anything for indices beyond maxToShow
                    if (index >= maxToShow) {
                      return null;
                    }
                    
                    // If this is the second item and there are more items
                    if (index === 1 && length > maxToShow) {
                      return (
                        <>
                          <div className="multi-value-container">
                            {props.data.label}
                          </div>
                          <div className="count-number">
                            +{length - maxToShow}
                          </div>
                        </>
                      );
                    }
                    
                    // For the first item or if there are only 2 or fewer items
                    return (
                      <div className="multi-value-container">
                        {props.data.label}
                      </div>
                    );
                  },
                  Option: ({ children, ...props }) => {
                    const { isSelected, isFocused, innerRef, innerProps, data } = props;
                    
                    // Special handling for "Select All" option
                    if (data.value === "__SELECT_ALL_USERS__") {
                      const allUserNames = stepUsersOptions.map(user => user.UserName);
                      const currentUserNames = nodeProperties.UserNames || [];
                      const allSelected = allUserNames.every(name => 
                        currentUserNames.includes(name)
                      );
                      
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
                            onChange={() => null}
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
                          onChange={() => null}
                          className="multi-value-checkbox"
                        />
                        <div>{children}</div>
                      </div>
                    );
                  },
                }}
              />
            </div>
            {/* Buttons */}
            <div className="modal-buttons-container">
              <button
                onClick={() => setModalIsOpen(false)}
                className="modal-button modal-button-cancel common-form-field-height"
              >
                Cancel
              </button>
              <button
                onClick={saveNodeProperties}
                className="modal-button modal-button-save common-form-field-height"
              >
                Save
              </button>

            </div>
          </div>
        </Modal>


      </div>
    );
  }
);

export default WorkflowEditor;
