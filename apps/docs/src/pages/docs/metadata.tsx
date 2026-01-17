import React from "react";
import { CodeBlock } from "@/components/ui/code-block";

export const meta = () => [{ title: "Metadata - Buncf Docs" }];

export default function MetadataDocs() {
  return (
    <div className="space-y-10 max-w-4xl">
      <div className="space-y-4">
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight lg:text-5xl">Metadata</h1>
        <p className="text-xl text-muted-foreground">
          Manage SEO tags, titles, and other head elements.
        </p>
      </div>

      <div className="space-y-6">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight" id="usage">Usage</h2>
        <p className="leading-7">
          Export a <code>meta</code> function from any <strong>Page</strong> or <strong>Layout</strong>.
        </p>
        <CodeBlock filename="src/pages/index.tsx" code={`export const meta = () => [
  { title: "My Awesome App" },
  { name: "description", content: "Built with Buncf" },
  { property: "og:image", content: "/og.png" }
];

export default function HomePage() {
  return <h1>Hello World</h1>;
}`} />
      </div>

      <div className="space-y-6">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight" id="cascading">Cascading Behavior</h2>
        <p className="leading-7">
          Metadata cascades from the root layout down to the page.
        </p>
        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li><strong>Root Layout:</strong> Defines default title/description.</li>
            <li><strong>Page:</strong> Can override specific tags (e.g., set a unique title).</li>
            <li><strong>Strategy:</strong> Last writer wins for unique attributes (like <code>name</code> or <code>property</code>).</li>
        </ul>
      </div>

      <div className="space-y-6">
         <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight" id="dynamic-meta">Dynamic Metadata</h2>
         <p className="leading-7">
             (Coming Soon) Access route data to generate dynamic tags.
         </p>
      </div>

    </div>
  );
}
