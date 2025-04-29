import React from 'react';
import App from './App';
import ReactDOM from './ReactDOMWrapper';
import reactToWebComponent from 'react-to-webcomponent';

// Initialize config store
window.reactConfig = {
  apiUrls: {},
  sidebarItems: [],
  config: {}
};

// Expose dynamic setters
window.reactwidget = {
  setApiUrls: (urls) => { window.reactConfig.apiUrls = urls },
  setSidebarItems: (items) => { window.reactConfig.sidebarItems = items },
  setConfig: (cfg) => { window.reactConfig.config = cfg },
  initialise: () => {
    const container = document.createElement("div");
    container.style.width = "100%";
    container.style.height = "100%";
    document.body.querySelector("react-widget")?.appendChild(container);

    const WebApp = reactToWebComponent(App, React, ReactDOM);
    if (!customElements.get("react-widget")) {
      customElements.define("react-widget", WebApp);
    }

    ReactDOM.render(
      <App
        config={window.reactConfig.config}
        apiUrls={window.reactConfig.apiUrls}
        sidebarItems={window.reactConfig.sidebarItems}
      />,
      container
    );
  }
};

if (process.env.NODE_ENV === "development") {
  window.reactwidget.initialise();
}