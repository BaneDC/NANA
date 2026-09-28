import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { showScrollbarsWhileScrolling } from './lib/scrollbars';
import { closeKitMenusOnOutsidePress } from './lib/kitMenus';
import { preventFocusZoomOnIOS } from './lib/iosZoom';
import { keyboardDebug, keyboardOnlyForFingers, moveOnlyTheComposer } from './lib/keyboardViewport';
import './styles/tokens.css';
import './styles/app.css';

showScrollbarsWhileScrolling();
closeKitMenusOnOutsidePress();
preventFocusZoomOnIOS();
moveOnlyTheComposer();
keyboardOnlyForFingers();
keyboardDebug();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
