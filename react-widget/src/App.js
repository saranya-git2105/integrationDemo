import React from 'react';
import { ReactFlowProvider } from 'reactflow';
import WorkflowEditor from './components/WorkflowEditor';

const App = () => {
  const { apiUrls, sidebarItems, config } = window.reactConfig || {};
  return (
    <ReactFlowProvider>
      <div className="App">
        <WorkflowEditor
          apiUrls={apiUrls}
          sidebarItems={sidebarItems}
          config={config}
        />
      </div>
    </ReactFlowProvider>
  );
};

export default App;
