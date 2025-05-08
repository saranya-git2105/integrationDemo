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
          "Id": "156E562E-5F30-476E-BFDB-9C882832BF62",
          "Name": "MadhuTest1 TEst",
          "Code": null,
          "Photo": "https://imgklm01.revalweb.com/uploads/erpdevuploads/revalerplocal/dynamicmodules/hrmsemp-307/bc0b6f73-2023-4b07-95f3-80d2b0b1644f/photo/screenshot20231019184022.png",
          "Designation": "Manager",
          "CompanyEmail": "aeLPqZjDuQkpzpqTHGxHjq5yG/w7ANoNsDQli4ekEb0hBTcplhHbnMgZ+i1vow=="
      },
      {
          "Id": "A68473BC-BA8C-4A0E-B80D-2C5E7E1E5CF5",
          "Name": "Pavan Kumar",
          "Code": null,
          "Photo": "https://imgklm01.revalweb.com/uploads/erpdevuploads/revalerplocal/dynamicmodules/hrmsemp-307/e8db1ad5-b58d-44c4-b586-b7ee27390d1f/photo/screenshot20240207192519.png",
          "Designation": "Manager",
          "CompanyEmail": "aeLPqZjDuQkpzpqTAWxVh7VyG/w7ANoNsDQli4ekPchNwJHmXciMGCNOt1PTvg=="
      },
      {
          "Id": "E58A854E-779C-413C-85EB-9DC891536F79",
          "Name": "Kranthi Kumar",
          "Code": null,
          "Photo": "https://imgklm01.revalweb.com/uploads/erpdevuploads/revalerplocal/dynamicmodules/hrmsemp-307/53a62855-97a5-419a-9c23-c0848adf7d85/photo/rajini.jpg",
          "Designation": "Manager",
          "CompanyEmail": "aeLPqZjDuQkpzpqTGn9CiK9aANk/BMAfpTRym8aqbBSW4+g1cUGV1QC9GrGReKIX"
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
      if (json) {
        const parsed = JSON.parse(json);
        console.log("📝 Workflow JSON from React:", parsed);
    } // slight delay to ensure React has written to localStorage
  },300);
}
 

  initializeReactWidget() {
    const container = document.getElementById('react-widget-container');
    if (container && !container.querySelector('react-widget')) {
      const widget = document.createElement('react-widget');
      container.appendChild(widget);
      this.isWidgetLoaded = true;
    }

    const reactwidget = (window as any).reactwidget;

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
      loadWorkflow: 'https://app.jassi.me/get',
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

    reactwidget.initialise();
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
