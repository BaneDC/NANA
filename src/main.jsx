import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { showScrollbarsWhileScrolling } from './lib/scrollbars';
import './styles/tokens.css';
import './styles/app.css';

showScrollbarsWhileScrolling();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
