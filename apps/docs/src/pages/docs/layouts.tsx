import React from "react";
import { CodeBlock } from "@/components/ui/code-block";

export const meta = () => [{ title: "Layouts - Buncf Docs" }];

export default function LayoutsDocs() {
  return (
    <div className="space-y-10 max-w-4xl">
      <div className="space-y-4">
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight lg:text-5xl">Nested Layouts</h1>
        <p className="text-xl text-muted-foreground">
          Wrap your pages with shared layouts that persist across navigation.
        </p>
      </div>

      <div className="space-y-6">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight" id="basics">Basics</h2>
        <p className="leading-7">
          Create <code>_layout.tsx</code> in any directory to wrap all pages within it.
        </p>
        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
             <li><code>src/pages/_layout.tsx</code> - Wraps everything (Global Layout).</li>
             <li><code>src/pages/dashboard/_layout.tsx</code> - Wraps <code>/dashboard/*</code>.</li>
        </ul>
        <CodeBlock filename="src/pages/dashboard/_layout.tsx" code={`export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="dashboard-grid">
      <Sidebar />
      <main>{children}</main>
    </div>
  );
}`} />
      </div>

      <div className="space-y-6">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight" id="metadata">Layout Metadata</h2>
        <p className="leading-7">
          Layouts can export a <code>meta</code> function to define default metadata for all nested pages.
        </p>
        <CodeBlock filename="src/_layout.tsx" code={`export const meta = () => [
  { title: "My App" },
  { name: "viewport", content: "width=device-width, initial-scale=1" }
];

export default function RootLayout({ children }) {
    return <>{children}</>;
}`} />
         <div className="rounded-lg bg-pink-500/10 border border-pink-500/20 p-4">
            <p className="text-sm text-pink-500 font-medium">
                Cascading Behavior: Inner layouts or pages can override specific tags (Last writer wins).
            </p>
         </div>
      </div>

    </div>
  );
}
