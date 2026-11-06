import React from 'react';
import ReactDOM from 'react-dom/client';
import './design/tokens.css';
import './design/ud.css';
import './design/shell.css';
import './design/motion.css';
import './index.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import ErrorBoundary from './components/common/ErrorBoundary';
import initializeResizeObserverHandler from './utils/resizeObserverHandler';
import { installGlobalErrorReporting } from './utils/errorReporter';

// Initialize ResizeObserver error handling
initializeResizeObserverHandler();
installGlobalErrorReporting();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </BrowserRouter>
  </React.StrictMode>
);