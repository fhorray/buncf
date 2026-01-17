import React from "react";
import { CodeBlock } from "@/components/ui/code-block";

export const meta = () => [{ title: "Data Loading - Buncf Docs" }];

export default function DataLoadingDocs() {
  return (
    <div className="space-y-10 max-w-4xl">
      <div className="space-y-4">
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight lg:text-5xl">Data Loading</h1>
        <p className="text-xl text-muted-foreground">
          Fetch data before rendering your component to prevent waterfalls.
        </p>
      </div>

      <div className="space-y-6">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight" id="loader-function">The Loader Function</h2>
        <p className="leading-7">
          Export a <code>loader</code> async function from your page. It runs on the client.
        </p>
        <CodeBlock filename="src/pages/dashboard.tsx" code={`export const loader = async ({ params }) => {
  const res = await fetch(\`/api/projects/\${params.projectId}\`);
  return res.json();
};

export default function Project({ data }) {
  // data is fully resolved here
  return <h1>{data.name}</h1>;
}`} />
      </div>

      <div className="space-y-6">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight" id="loading-state">Loading UI</h2>
        <p className="leading-7">
          While the loader is running, Buncf shows the nearest <code>_loading.tsx</code> component.
        </p>
        <CodeBlock filename="src/pages/_loading.tsx" code={`export default function Loading() {
  return <div className="spinner">Loading Data...</div>;
}`} />
      </div>

      <div className="space-y-6">
         <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight" id="api-integration">API Client Integration</h2>
         <p className="leading-7">
             Combine loaders with the Type-Safe API Client for best results.
         </p>
         <CodeBlock code={`import { api } from ".buncf/api-client";

export const loader = async () => {
    return await api.get("/api/users"); // Typed response
};`} />
      </div>

    </div>
  );
}
