import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { showScrollbarsWhileScrolling } from './lib/scrollbars';
import { closeKitMenusOnOutsidePress } from './lib/kitMenus';
import { preventFocusZoomOnIOS } from './lib/iosZoom';
import { followVisualViewport } from './lib/keyboardViewport';
import './styles/tokens.css';
import './styles/app.css';

showScrollbarsWhileScrolling();
closeKitMenusOnOutsidePress();
preventFocusZoomOnIOS();
followVisualViewport();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
