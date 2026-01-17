/**
 * Client Entry Point
 * Renders the BuncfRouter with Layout
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BuncfRouter } from 'buncf/router';
import Layout from './_layout';
import { routes } from '../.buncf/routes';

const elem = document.getElementById('root');
if (!elem) throw new Error('Root element not found');

const app = (
  <StrictMode>
    <BuncfRouter layout={Layout} routes={routes} />
  </StrictMode>
);

if (import.meta.hot) {
  const root = (import.meta.hot.data.root ??= createRoot(elem));
  root.render(app);
} else {
  createRoot(elem).render(app);
}
