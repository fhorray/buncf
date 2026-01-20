import { CodeBlock } from "@/components/code-block";
import { PageHeader, Paragraph, TableWrapper, DocNavigation } from "@/components/docs/doc-components";
import { Terminal } from "lucide-react";

export default function CLIPage() {
  return (
    <article className="px-6 py-12 lg:px-12">
      <PageHeader
        icon={Terminal}
        title="CLI Commands"
        description="Reference for all buncf command-line interface commands."
      />

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">Available Commands</h2>
        <TableWrapper>
          <thead className="bg-secondary/30">
            <tr>
              <th className="text-left p-3 font-semibold">Command</th>
              <th className="text-left p-3 font-semibold">Description</th>
            </tr>
          </thead>
          <tbody>
            {[
              { cmd: "buncf init [name]", desc: "Scaffold a new project" },
              { cmd: "buncf dev", desc: "Start dev server with hot reload" },
              { cmd: "buncf dev --remote", desc: "Use live Cloudflare bindings" },
              { cmd: "buncf build", desc: "Production build" },
              { cmd: "buncf deploy", desc: "Build and deploy to Workers" },
            ].map((item) => (
              <tr key={item.cmd} className="border-t border-border/50">
                <td className="p-3 font-mono text-neon">{item.cmd}</td>
                <td className="p-3 text-muted-foreground">{item.desc}</td>
              </tr>
            ))}
          </tbody>
        </TableWrapper>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">buncf init</h2>
        <Paragraph>
          Creates a new buncf project with all the necessary files and dependencies.
        </Paragraph>
        <CodeBlock
          code={`bunx buncf init my-app

# Options
--template <name>  # Use a specific template
--no-git           # Skip git initialization
--no-install       # Skip dependency installation`}
          language="bash"
          showLineNumbers={false}
        />
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">buncf dev</h2>
        <Paragraph>
          Starts the development server with hot module replacement.
        </Paragraph>
        <CodeBlock
          code={`buncf dev

# Options
--port <number>    # Port to run on (default: 3000)
--host <string>    # Host to bind to (default: localhost)
--remote           # Use remote Cloudflare bindings
--open             # Open browser automatically`}
          language="bash"
          showLineNumbers={false}
        />
        <Paragraph>
          The <code className="px-1.5 py-0.5 bg-secondary rounded text-neon font-mono text-sm">--remote</code> flag 
          is useful when you need to test against real Cloudflare services like D1, KV, or R2.
        </Paragraph>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">buncf build</h2>
        <Paragraph>
          Creates an optimized production build.
        </Paragraph>
        <CodeBlock
          code={`buncf build

# Output is written to .buncf/cloudflare/`}
          language="bash"
          showLineNumbers={false}
        />
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">buncf deploy</h2>
        <Paragraph>
          Builds and deploys your app to Cloudflare Workers.
        </Paragraph>
        <CodeBlock
          code={`buncf deploy

# This runs:
# 1. buncf build
# 2. wrangler deploy`}
          language="bash"
          showLineNumbers={false}
        />
      </section>

      <DocNavigation
        prev={{ href: "/docs/installation", label: "Installation" }}
        next={{ href: "/docs/structure", label: "Project Structure" }}
      />
    </article>
  );
}
