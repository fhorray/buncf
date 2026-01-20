/**
 * Client Entry Point
 * Renders the BuncfRouter with Layout
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BuncfRouter } from 'buncf/router';
import Layout from './_layout';
import { routes, layouts } from '../.buncf/routes';
import './globals.css';

const elem = document.getElementById('root');
if (!elem) {
  console.error(
    'Available elements:',
    document.body ? document.body.innerHTML : 'no body',
  );
  throw new Error(
    'Root element not found. Make sure <div id="root"></div> exists in your index.html',
  );
}

const app = (
  <StrictMode>
    <BuncfRouter layout={Layout} routes={routes} layouts={layouts} />
  </StrictMode>
);

if (import.meta.hot) {
  const root = (import.meta.hot.data.root ??= createRoot(elem));
  root.render(app);
} else {
  createRoot(elem).render(app);
}
