import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  AfterViewInit,
  ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';

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
  openJsonModal() {
    const reactViewJson = (window as any).reactwidgetRef?.viewJson;
    if (typeof reactViewJson === 'function') {
      reactViewJson(); // 🔁 Triggers React's JSON generation
    }

    // Wait a moment for React to store the JSON
    setTimeout(() => {
      const json = localStorage.getItem('workflowJson');
      this.jsonContent = json ? JSON.stringify(JSON.parse(json), null, 2) : 'No JSON found';
      this.isJsonModalOpen = true;
    }, 300); // 300ms delay to ensure React has stored the JSON
  }

  closeJsonModal() {
    this.isJsonModalOpen = false;
  }


  initializeReactWidget() {
    const container = document.getElementById('react-widget-container');
    if (container && !container.querySelector('react-widget')) {
      const widget = document.createElement('react-widget');
      container.appendChild(widget);
      this.isWidgetLoaded = true;
    }

    const reactwidget = (window as any).reactwidget;

    const jwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzaWQiOiIzZWFiM2IzOS04ZTlhLTQxYjMtYjZlOC0wMjEyY2E3NmJiMDEiLCJzdGsiOiJQelE1Z0pWWDFJTVhuSWJNOUZpS3pHbndqR3o5Ryt2cWhxV3BiTVFUSmNLc0plczc1Y1lhM1RZODFSTGt3MzJrK1V6Z25QcVhQSmJ3bnkram1LSmhsMUZLckdXTmdKVDl0Vzk0ZGZjWEhoLytxZXgwVWY5NDBSN25yNk1MQ0srdnRqc3Z1a3dZalYyY29lSzlUSTBkNm1QM25MS0diSlg3NnI1RUtZVGwrMzQ9IiwidGVkIjoiMDEvMDQvMjAyNCA2OjQwOjAwIFBNIiwidXBrIjoiYTRlNGY3ZmUtMzgyNi00ZDA0LWFiMjMtYjIxNTcyZGJhODZlIiwibmJmIjoxNzQ2NDQxNTUxLCJleHAiOjE3NDY1Mjc5NTEsImlhdCI6MTc0NjQ0MTU1MX0.wzZycS2fDBbYcuMfzYGefDVPYexvF9plBJVgv-tloRM';
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
      getActions: 'https://app.jassi.me/actions',
      getUsers: 'https://app.jassi.me/users',
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
