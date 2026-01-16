
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BuncfRouter } from "buncf/router"; 
import Layout from "./src/_layout";
import "./src/globals.css";


const routes = {};
routes["/about"] = () => import("/src/pages/about.tsx");
routes["/users"] = () => import("/src/pages/users/index.tsx");
routes["/"] = () => import("/src/pages/index.tsx");
routes["/blog/[slug]"] = () => import("/src/pages/blog/[slug].tsx");


const elem = document.getElementById("root");
if (!elem) throw new Error("Root element not found");

// Check if we have server-injected manifest, otherwise use generated routes
const routerRoutes = (window as any).__BUNCF_MANIFEST__ 
  ? routes 
  : routes;

const app = (
  <StrictMode>
    <BuncfRouter layout={Layout} routes={routerRoutes} />
  </StrictMode>
);

if (import.meta.hot) {
  const root = (import.meta.hot.data.root ??= createRoot(elem));
  root.render(app);
} else {
  createRoot(elem).render(app);
}
