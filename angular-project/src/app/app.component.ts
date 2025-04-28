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

    // 🔹 Set API endpoints
    reactwidget.setApiUrls({
      getActions: 'https://app.jassi.me/actions',
      getWorkflows: 'https://app.jassi.me/workflows',
      saveWorkflow: 'https://app.jassi.me/seed',
      loadWorkflow: 'https://app.jassi.me/get'
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
        create: true,
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
