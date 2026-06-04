import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';
import { EDITION_APP_NAME } from './config/edition';
import { initWebPush } from './services/pushService';

// Apply edition branding to the document title
if (typeof document !== 'undefined' && EDITION_APP_NAME) {
  document.title = EDITION_APP_NAME;
}

// Initialise OneSignal web push (no-op unless REACT_APP_ONESIGNAL_APP_ID is set)
initWebPush();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
