// First, so the cascade layers are declared before any other CSS arrives —
// the chat kit's own stylesheet is imported by a component further down.
import './styles/index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import CardGallery from './screens/CardGallery';
import { showScrollbarsWhileScrolling } from './lib/scrollbars';
import { closeKitMenusOnOutsidePress } from './lib/kitMenus';
import { preventFocusZoomOnIOS } from './lib/iosZoom';
import { useLang } from './i18n';
import { keyboardDebug, keyboardOnlyForFingers, moveOnlyTheComposer } from './lib/keyboardViewport';

showScrollbarsWhileScrolling();
closeKitMenusOnOutsidePress();
preventFocusZoomOnIOS();
moveOnlyTheComposer();
keyboardOnlyForFingers();
keyboardDebug();

// The gallery holds nothing worth keeping, so a switch of language draws it anew.
function Gallery() {
  return <CardGallery key={useLang()} />;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* /?kartice: every card on one page, for comparing them */}
    {new URLSearchParams(window.location.search).has('kartice') ? <Gallery /> : <App />}
  </React.StrictMode>
);
