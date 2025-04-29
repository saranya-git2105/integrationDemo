import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './src/App';
import reportWebVitals from './reportWebVitals';

window.reactConfig = {
  apiEndpoint: ''
};

window.reactwidget = {
  SetApiendpoint: (url) => {
    window.reactConfig.apiEndpoint = url;
  },
  Createworkflow: false,
  initialise: () => {
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(
      <React.StrictMode>
        <App 
          apiEndpoint={window.reactConfig.apiEndpoint}
          showCreateWorkflowButton={window.reactwidget.Createworkflow}
        />
      </React.StrictMode>
    );
  }
};

reportWebVitals();

if (process.env.NODE_ENV === "development") {
  window.reactwidget.initialise();
}
