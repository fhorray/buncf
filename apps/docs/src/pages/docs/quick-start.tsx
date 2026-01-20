import { CodeBlock } from "@/components/code-block";
import { PageHeader, Paragraph, DocNavigation } from "@/components/docs/doc-components";
import { Rocket } from "lucide-react";

export default function QuickStartPage() {
  return (
    <article className="px-6 py-12 lg:px-12">
      <PageHeader
        icon={Rocket}
        title="Quick Start"
        description="Create your first buncf project and deploy it to Cloudflare Workers in minutes."
      />

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">Create a New Project</h2>
        <Paragraph>
          The fastest way to get started is using the buncf CLI to scaffold a new project:
        </Paragraph>
        <CodeBlock
          code={`# Create a new project
bunx buncf init my-app

# Navigate to the project directory
cd my-app`}
          language="bash"
          filename="Terminal"
          showLineNumbers={false}
        />
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">Start Development Server</h2>
        <Paragraph>
          Start the development server with hot reload:
        </Paragraph>
        <CodeBlock
          code="bun dev"
          language="bash"
          showLineNumbers={false}
        />
        <Paragraph>
          Your app is now running at <code className="px-1.5 py-0.5 bg-secondary rounded text-neon font-mono text-sm">http://localhost:3000</code>
        </Paragraph>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">Deploy to Cloudflare</h2>
        <Paragraph>
          When you're ready to deploy, run:
        </Paragraph>
        <CodeBlock
          code="bun deploy"
          language="bash"
          showLineNumbers={false}
        />
        <Paragraph>
          This builds your app and deploys it to Cloudflare Workers. That's it!
        </Paragraph>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">What's Next?</h2>
        <Paragraph>
          Now that you have a running project, explore the documentation to learn about:
        </Paragraph>
        <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
          <li>Project structure and file conventions</li>
          <li>Creating API routes and page routes</li>
          <li>Using Cloudflare bindings (D1, KV, R2)</li>
          <li>Data fetching and server actions</li>
        </ul>
      </section>

      <DocNavigation
        prev={{ href: "/docs", label: "Introduction" }}
        next={{ href: "/docs/installation", label: "Installation" }}
      />
    </article>
  );
}
