import * as ReactDOMClient from 'react-dom/client';

const ReactDOM = {
  render: (reactElement, domElement) => {
    ReactDOMClient.createRoot(domElement).render(reactElement);
  },
  unmountComponentAtNode: (domElement) => {
    // Optional cleanup if needed
    return true;
  },
};

export default ReactDOM;
