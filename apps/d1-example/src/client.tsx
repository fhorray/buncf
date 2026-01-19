import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BuncfRouter } from 'buncf/router';
// @ts-ignore - Generated at build time
import { routes, layouts } from '$routes';
import './globals.css';

const root = createRoot(document.getElementById('root')!);
root.render(
  <StrictMode>
    <BuncfRouter routes={routes} layouts={layouts} />
  </StrictMode>,
);
