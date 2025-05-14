import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  AfterViewInit,
  ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';

const actionsResponse = {
  "ReturnCode": 0,
  "ReturnMessage": "success",
  "ResponseTime": "576",
  "RecordCount": 9,
  "Headers": null,
  "Data": [
    {
      "Id": "47F34238-2A13-4122-8E2B-E2FDCFD512A5",
      "Name": "Save As Draft",
      "Code": "SDF"
    },
    {
      "Id": "C8D4ABCF-9974-463C-A966-348999DCFDA5",
      "Name": "Send for Review",
      "Code": "SRV"
    },
    {
      "Id": "97B2FE7E-949C-4558-BDC5-233D59A100DD",
      "Name": "Send for Approval",
      "Code": "SAL"
    },
    {
      "Id": "74FF90A2-728F-4CBA-9B8B-0A775C5B1B57",
      "Name": "Approve",
      "Code": "APV"
    },
    {
      "Id": "EDABF057-DDB5-4E62-93AE-09E227ECDF80",
      "Name": "Send Back",
      "Code": "SBK"
    },
    {
      "Id": "BCA07C12-F778-45DD-8D85-44728B5DE3F7",
      "Name": "Preview",
      "Code": "PRW"
    },
    {
      "Id": "50B94CC8-6D36-43BC-AA73-9514F773C028",
      "Name": "Generate PDF",
      "Code": "GPF"
    },
    {
      "Id": "CAFE1EC3-75C5-4E3C-AAA2-10349970B379",
      "Name": "Close",
      "Code": "CLS"
    },
    {
      "Id": "EF09C147-26AC-4332-A874-5FFABA17FEF7",
      "Name": "Recall",
      "Code": "RCL"
    }
  ]
};

const employeesResponse = {
  "ReturnCode": 0,
  "ReturnMessage": "success",
  "ResponseTime": "578",
  "RecordCount": 587,
  "Headers": null,
  "Data": [
    {
      "Id": "760792A1-3302-4033-98A1-80C32FBB9BE4",
      "HRMSEmployeeId": "B365011E-A1F4-40F5-A97D-EF9EDB8870FC",
      "EmployeeID": "RI-1233",
      "Name": "SrikarP",
      "ReportingStartDate": null,
      "ReportingEndDate": null,
      "EmployeeManagerId": "AA2A8933-859A-4DA2-B15A-DF79FD862C59"
    },
    {
      "Id": "B55B45A6-6EEB-4C72-896F-05A40FD8FF62",
      "HRMSEmployeeId": "395D15E6-64C1-4613-9DF2-CF5FCB851040",
      "EmployeeID": "RI-61",
      "Name": "SwamyPillanagoila",
      "ReportingStartDate": null,
      "ReportingEndDate": null,
      "EmployeeManagerId": "AA2A8933-859A-4DA2-B15A-DF79FD862C59"
    },
    {
      "Id": "56BE6586-A932-4EF9-8A2F-4BBBB8089CAA",
      "HRMSEmployeeId": "4F119DD2-2508-4CD4-B9BE-713A0EBD52A5",
      "EmployeeID": "RI-789",
      "Name": "AkhilN",
      "ReportingStartDate": null,
      "ReportingEndDate": null,
      "EmployeeManagerId": "AA2A8933-859A-4DA2-B15A-DF79FD862C59"
    }
  ]
};

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterViewInit {
  isModalOpen = false;
  isWidgetLoaded = false;
  isFullscreen = false;
  jsonContent: string = '';
  isJsonModalOpen: boolean = false;
  constructor(private elementRef: ElementRef) { }

  ngAfterViewInit(): void {
    // Optional: Auto-load widget on view init
    // this.initializeReactWidget();
    document.addEventListener('fullscreenchange', () => {
      this.isFullscreen = !!document.fullscreenElement;
    });
  }
  saveWorkflow() {
    const reactViewJson = (window as any).reactwidgetRef?.viewJson;

    if (typeof reactViewJson === 'function') {
      reactViewJson(); // React generates and saves JSON in localStorage
    }

    setTimeout(() => {
      const json = localStorage.getItem('workflowJson');
      localStorage.setItem('ModifyWorkflowJson', json || '');
      if (json) {
        const parsed = JSON.parse(json);
        console.log("📝 Workflow JSON from React:", parsed);
      } // slight delay to ensure React has written to localStorage
    }, 300);
  }
  loadWorkflow() {
    console.log("🚨 Loading workflow from localStorage...");

    // First ensure widget is initialized
    if (!(window as any).reactwidgetRef?.isInitialized) {
      console.log("Initializing widget first...");
      this.initializeReactWidget();
      // Wait for initialization to complete
      setTimeout(() => this.loadWorkflow(), 1500);
      return;
    }

    const storedJson = localStorage.getItem('ModifyWorkflowJson');
    if (!storedJson) {
      console.warn("⚠️ No workflow found in localStorage");
      return;
    }

    try {
      const parsedJson = JSON.parse(storedJson);
      const reactwidgetRef = (window as any).reactwidgetRef;

      if (reactwidgetRef?.convertJsonToWorkflow) {
        console.log("Found convertJsonToWorkflow function, attempting to load workflow");
        reactwidgetRef.convertJsonToWorkflow(parsedJson);
        console.log("✅ Loaded workflow into React widget:", parsedJson);
      } else {
        console.error("❌ Widget not properly initialized - convertJsonToWorkflow function not found");
        console.log("Available functions:", Object.keys(reactwidgetRef || {}));
      }
    } catch (err) {
      console.error("❌ Failed to parse or load workflow:", err);
    }
  }
  initializeReactWidget() {
    const container = document.getElementById('react-widget-container');
    if (container && !container.querySelector('react-widget')) {
      const widget = document.createElement('react-widget');
      container.appendChild(widget);
      this.isWidgetLoaded = true;
    }

    const reactwidget = (window as any).reactwidget;
    const widgetElement = document.querySelector('react-widget');

    const jwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzaWQiOiI1OWNmZGM3OC01NWZjLTQxMDEtOWE1Yy0yNTQ5MzkxNDQyNzQiLCJ0ZWQiOiIxLzEvMDAwMSAxMjowMDowMCBBTSIsIm5iZiI6MTc0NjYxNzM2MSwiZXhwIjoxNzQ2NzAzNzYxLCJpYXQiOjE3NDY2MTczNjF9.sRnEMsPxpGvLp3LJbkBzWiWVd00gS0uYVYI4hie84xY';
    localStorage.setItem('jwtToken', jwtToken);

    const formData = {
      WorkFlowName: 'Test Work Flow Name',
      ModuleId: 1,
      ProjectId: 'A3119471-1115-4CCB-A00E-BD2943CA602C',
      RDLCTypeId: '028FE61D-12B3-4500-B3B6-CFBCEFA6F1AD',
      DateEffective: '22 May 2025',
      Id: "",
      WorkFlowActionId: ""
    };
    localStorage.setItem('workflowForm', JSON.stringify(formData));

    reactwidget.setApiUrls({
      getActions: () => Promise.resolve(actionsResponse),
      getUsers: () => Promise.resolve(employeesResponse),
      getWorkflows: 'https://app.jassi.me/workflows',
      saveWorkflow: 'https://app.jassi.me/seed',
      headers: {
        Authorization: `Bearer ${jwtToken}`,
        'Content-Type': 'application/json'
      }
    });

    reactwidget.setSidebarItems([
      { label: 'Start', type: 'Start' },
      { label: 'Stop', type: 'Stop' },
      { label: 'Step', type: 'Step' },
      { label: 'Decision', type: 'Decision' }
    ]);

    reactwidget.setConfig({
      nodeTypes: {
        Start: true,
        Stop: true,
        Step: true,
        Decision: false
      },
      buttons: {
        create: false,
        load: false,
        save: true,
        download: false,
        view: true
      }
    });

    try {
      // Initialize the widget
      reactwidget.initialise();

      // Wait for a short time to ensure widget is fully initialized
      setTimeout(() => {
        if (!widgetElement) {
          console.error("❌ React widget element not found");
          return;
        }

        // Set up the widget reference with initialization flag and functions
        (window as any).reactwidgetRef = {
          ...(window as any).reactwidgetRef,
          isInitialized: true,
          convertJsonToWorkflow: (json: any) => {
            console.log("Converting JSON to workflow:", json);
            try {
              // Try to dispatch a custom event to the widget
              const event = new CustomEvent('load-workflow', {
                detail: json,
                bubbles: true,
                composed: true
              });
              widgetElement.dispatchEvent(event);
              console.log("✅ Dispatched load-workflow event");
            } catch (err) {
              console.error("❌ Error dispatching load-workflow event:", err);
            }
          },
          viewJson: () => {
            try {
              // Try to dispatch a custom event to get the JSON
              const event = new CustomEvent('get-workflow-json', {
                bubbles: true,
                composed: true
              });
              widgetElement.dispatchEvent(event);
              console.log("✅ Dispatched get-workflow-json event");
              return null; // The React component should handle the event and save to localStorage
            } catch (err) {
              console.error("❌ Error dispatching get-workflow-json event:", err);
              return null;
            }
          }
        };

        console.log("✅ React widget initialized successfully with functions:",
          Object.keys((window as any).reactwidgetRef));
      }, 1000);

    } catch (error) {
      console.error("❌ Failed to initialize React widget:", error);
    }
  }

  // New method to load workflow from API
  loadWorkflowFromApi(workflowId: string) {
    console.log("🚨 Loading workflow from API...");

    // First ensure widget is initialized
    if (!(window as any).reactwidgetRef?.isInitialized) {
      console.log("Initializing widget first...");
      this.initializeReactWidget();
    }

    // Fetch workflow data from API
    const jwtToken = localStorage.getItem('jwtToken');
    fetch(`https://app.jassi.me/workflows/${workflowId}`, {
      headers: {
        'Authorization': `Bearer ${jwtToken}`,
        'Content-Type': 'application/json'
      }
    })
      .then(response => response.json())
      .then(workflowData => {
        console.log("✅ Received workflow data:", workflowData);

        // Store the workflow data
        localStorage.setItem('ModifyWorkflowJson', JSON.stringify(workflowData));

        // Load the workflow in the widget
        this.loadWorkflow();
      })
      .catch(error => {
        console.error("❌ Failed to fetch workflow:", error);
      });
  }

  closeModal() {
    this.isModalOpen = false;
    const widget = document.querySelector('#react-widget-modal-container react-widget');
    const mainContainer = document.getElementById('react-widget-container');
    if (widget && mainContainer) {
      mainContainer.appendChild(widget);
    }
  }

  toggleFullscreen() {
    const element = this.elementRef.nativeElement.querySelector('.container');

    if (!this.isFullscreen) {
      if (element.requestFullscreen) {
        element.requestFullscreen();
      } else if ((element as any).webkitRequestFullscreen) {
        (element as any).webkitRequestFullscreen();
      } else if ((element as any).msRequestFullscreen) {
        (element as any).msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
      }
    }
  }
}
