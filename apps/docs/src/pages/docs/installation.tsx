import { CodeBlock } from "@/components/code-block";
import { PageHeader, Paragraph, DocNavigation, InlineCode } from "@/components/docs/doc-components";
import { Terminal } from "lucide-react";

export default function InstallationPage() {
  return (
    <article className="px-6 py-12 lg:px-12">
      <PageHeader
        icon={Terminal}
        title="Installation"
        description="Add buncf to a new or existing project."
      />

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">Prerequisites</h2>
        <Paragraph>
          Before installing buncf, make sure you have the following installed:
        </Paragraph>
        <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4 mb-4">
          <li><strong className="text-foreground">Bun</strong> - version 1.0 or higher</li>
          <li><strong className="text-foreground">Node.js</strong> - version 18 or higher (for some tooling)</li>
        </ul>
        <CodeBlock
          code={`# Install Bun (if not already installed)
curl -fsSL https://bun.sh/install | bash`}
          language="bash"
          showLineNumbers={false}
        />
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">New Project</h2>
        <Paragraph>
          The recommended way to create a new buncf project:
        </Paragraph>
        <CodeBlock
          code={`bunx buncf init my-app
cd my-app
bun dev`}
          language="bash"
          filename="Terminal"
          showLineNumbers={false}
        />
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">Existing Project</h2>
        <Paragraph>
          Add buncf to an existing project:
        </Paragraph>
        <CodeBlock
          code="bun add buncf"
          language="bash"
          showLineNumbers={false}
        />
        <Paragraph>
          Then create the required directories and files:
        </Paragraph>
        <CodeBlock
          code={`mkdir -p src/api src/pages public
touch src/client.tsx src/index.html`}
          language="bash"
          showLineNumbers={false}
        />
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">Cloudflare Setup</h2>
        <Paragraph>
          Create a <InlineCode>wrangler.json</InlineCode> file in your project root:
        </Paragraph>
        <CodeBlock
          code={`{
  "name": "my-app",
  "main": ".buncf/cloudflare/worker.js",
  "compatibility_date": "2025-01-01"
}`}
          language="json"
          filename="wrangler.json"
        />
        <Paragraph>
          Make sure you have the Wrangler CLI installed for deployments:
        </Paragraph>
        <CodeBlock
          code="bun add -D wrangler"
          language="bash"
          showLineNumbers={false}
        />
      </section>

      <DocNavigation
        prev={{ href: "/docs/quick-start", label: "Quick Start" }}
        next={{ href: "/docs/cli", label: "CLI Commands" }}
      />
    </article>
  );
}
