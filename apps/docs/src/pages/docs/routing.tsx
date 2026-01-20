import { CodeBlock } from "@/components/code-block";
import { PageHeader, Paragraph, TableWrapper, DocNavigation, InlineCode } from "@/components/docs/doc-components";
import { Route } from "lucide-react";

export default function RoutingPage() {
  return (
    <article className="px-6 py-12 lg:px-12">
      <PageHeader
        icon={Route}
        title="File-System Routing"
        description="Learn how buncf maps files to routes automatically."
      />

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">How it Works</h2>
        <Paragraph>
          buncf uses a file-system based router. Simply create files in the <InlineCode>src/api/</InlineCode> 
          or <InlineCode>src/pages/</InlineCode> directories and they become routes automatically.
        </Paragraph>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">Dynamic Segments</h2>
        <Paragraph>
          Use brackets to create dynamic route segments:
        </Paragraph>
        <TableWrapper>
          <thead className="bg-secondary/30">
            <tr>
              <th className="text-left p-3 font-semibold">Pattern</th>
              <th className="text-left p-3 font-semibold">Example URL</th>
              <th className="text-left p-3 font-semibold">Params</th>
            </tr>
          </thead>
          <tbody>
            {[
              { pattern: "[id].tsx", example: "/users/123", params: '{ id: "123" }' },
              { pattern: "[...slug].tsx", example: "/docs/a/b/c", params: '{ slug: "a/b/c" }' },
              { pattern: "[[optional]].tsx", example: "/ or /page", params: '{ optional?: "page" }' },
            ].map((item) => (
              <tr key={item.pattern} className="border-t border-border/50">
                <td className="p-3 font-mono text-neon">{item.pattern}</td>
                <td className="p-3 text-muted-foreground">{item.example}</td>
                <td className="p-3 font-mono text-sm">{item.params}</td>
              </tr>
            ))}
          </tbody>
        </TableWrapper>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">Route Priority</h2>
        <Paragraph>
          When multiple routes could match a URL, buncf uses the following priority:
        </Paragraph>
        <ol className="list-decimal list-inside text-muted-foreground space-y-2 ml-4 mb-4">
          <li>Static routes (e.g., <InlineCode>/about</InlineCode>)</li>
          <li>Dynamic routes (e.g., <InlineCode>/users/[id]</InlineCode>)</li>
          <li>Catch-all routes (e.g., <InlineCode>/docs/[...slug]</InlineCode>)</li>
          <li>Optional catch-all routes (e.g., <InlineCode>/[[...path]]</InlineCode>)</li>
        </ol>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">Route Groups</h2>
        <Paragraph>
          Use parentheses to create route groups that don't affect the URL:
        </Paragraph>
        <CodeBlock
          code={`src/pages/
├── (auth)/
│   ├── login.tsx      → /login
│   └── register.tsx   → /register
└── (dashboard)/
    ├── _layout.tsx    # Shared layout
    ├── index.tsx      → /
    └── settings.tsx   → /settings`}
          language="text"
          showLineNumbers={false}
        />
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">Index Routes</h2>
        <Paragraph>
          Files named <InlineCode>index.tsx</InlineCode> or <InlineCode>index.ts</InlineCode> match 
          the directory path:
        </Paragraph>
        <CodeBlock
          code={`src/pages/index.tsx        → /
src/pages/users/index.tsx  → /users
src/api/users/index.ts     → /api/users`}
          language="text"
          showLineNumbers={false}
        />
      </section>

      <DocNavigation
        prev={{ href: "/docs/structure", label: "Project Structure" }}
        next={{ href: "/docs/api-routes", label: "API Routes" }}
      />
    </article>
  );
}
