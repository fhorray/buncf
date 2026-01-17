import React from "react";
import { CodeBlock } from "@/components/ui/code-block";

export const meta = () => [{ title: "Installation - Buncf Docs" }];

export default function InstallationDocs() {
  return (
    <div className="space-y-10 max-w-4xl">
      <div className="space-y-4">
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight lg:text-5xl">Installation</h1>
        <p className="text-xl text-muted-foreground">
          Get started with Buncf in seconds.
        </p>
      </div>

      <div className="space-y-6">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight" id="requirements">Requirements</h2>
        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li><strong>Bun:</strong> version 1.0.0 or later</li>
            <li><strong>Wrangler:</strong> version 3.0.0 or later (<code>bun add -g wrangler</code>)</li>
            <li><strong>Node.js:</strong> version 18 or later (for Wrangler CLI compatibility)</li>
        </ul>
      </div>

      <div className="space-y-6">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight" id="quick-start">Quick Start</h2>
        <p className="leading-7">
          The easiest way to get started is using the CLI to scaffold a new project.
        </p>
        <CodeBlock language="bash" code={`# Create a new project
bunx buncf init my-app

# Navigate to project
cd my-app

# Start dev server
bun dev`} />
      </div>

      <div className="space-y-6">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight" id="manual-install">Manual Installation</h2>
        <p className="leading-7">
          You can also add Buncf to an existing project.
        </p>
        <CodeBlock language="bash" code={`bun add buncf`} />
      </div>

      <div className="space-y-6">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight" id="cli-commands">CLI Commands</h2>
        <div className="my-6 w-full overflow-y-auto">
          <table className="w-full">
            <thead>
              <tr className="m-0 border-t p-0 even:bg-muted">
                <th className="border px-4 py-2 text-left font-bold [&[align=center]]:text-center [&[align=right]]:text-right">Command</th>
                <th className="border px-4 py-2 text-left font-bold [&[align=center]]:text-center [&[align=right]]:text-right">Description</th>
              </tr>
            </thead>
            <tbody>
              <tr className="m-0 border-t p-0 even:bg-muted">
                <td className="border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right"><code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">buncf init</code></td>
                <td className="border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right">Scaffold a new project with recommended structure.</td>
              </tr>
              <tr className="m-0 border-t p-0 even:bg-muted">
                <td className="border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right"><code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">buncf dev</code></td>
                <td className="border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right">Start development server with hot reload.</td>
              </tr>
              <tr className="m-0 border-t p-0 even:bg-muted">
                <td className="border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right"><code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">buncf build</code></td>
                <td className="border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right">Build for production.</td>
              </tr>
              <tr className="m-0 border-t p-0 even:bg-muted">
                <td className="border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right"><code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">buncf deploy</code></td>
                <td className="border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right">Build and deploy to Cloudflare Workers.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
