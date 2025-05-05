import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  AfterViewInit
} from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterViewInit {
  title = 'angular-project';

  ngAfterViewInit(): void {
    const reactwidget = (window as any).reactwidget;
    const jwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzaWQiOiIzZWFiM2IzOS04ZTlhLTQxYjMtYjZlOC0wMjEyY2E3NmJiMDEiLCJzdGsiOiJQelE1Z0pWWDFJTVhuSWJNOUZpS3pHbndqR3o5Ryt2cWhxV3BiTVFUSmNLc0plczc1Y1lhM1RZODFSTGt3MzJrK1V6Z25QcVhQSmJ3bnkram1LSmhsMUZLckdXTmdKVDl0Vzk0ZGZjWEhoLytxZXgwVWY5NDBSN25yNk1MQ0srdnRqc3Z1a3dZalYyY29lSzlUSTBkNm1QM25MS0diSlg3NnI1RUtZVGwrMzQ9IiwidGVkIjoiMDEvMDQvMjAyNCA2OjQwOjAwIFBNIiwidXBrIjoiYTRlNGY3ZmUtMzgyNi00ZDA0LWFiMjMtYjIxNTcyZGJhODZlIiwibmJmIjoxNzQ2NDQxNTUxLCJleHAiOjE3NDY1Mjc5NTEsImlhdCI6MTc0NjQ0MTU1MX0.wzZycS2fDBbYcuMfzYGefDVPYexvF9plBJVgv-tloRM';
    localStorage.setItem('jwtToken', jwtToken);
    const formData = {
      "WorkFlowName": "Test Work Flow Name",
      "ModuleId": 1,
      "ProjectId": "A3119471-1115-4CCB-A00E-BD2943CA602C",
      "RDLCTypeId": "028FE61D-12B3-4500-B3B6-CFBCEFA6F1AD",
      "DateEffective": "22 May 2025"
    }
    localStorage.setItem('workflowForm', JSON.stringify(formData));
    // 🔹 Set API endpoints
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

    // 🔹 Sidebar Node Type Options (visible if true)
    reactwidget.setSidebarItems([
      { label: 'Start', type: 'Start' },
      { label: 'Stop', type: 'Stop' },
      { label: 'Step', type: 'Step' },
      { label: 'Decision', type: 'Decision' }
    ]);

    // 🔹 Custom Config: node types & buttons
    reactwidget.setConfig({
      nodeTypes: {
        Start: true,
        Stop: true,
        Step: true,
        Decision: false
      },
      buttons: {
        create: false,
        load: true,
        save: true,
        download: false,
        view: true
      }
    });

    // 🔹 Initialize React widget
    reactwidget.initialise();
  }
}
