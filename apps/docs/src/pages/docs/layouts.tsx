import { CodeBlock } from '@/components/code-block';

export const meta = () => [
  { title: 'Layouts - Buncf' },
  { name: 'description', content: 'Using nested layouts in Buncf' },
];

export default function Layouts() {
  return (
    <div className="prose prose-invert max-w-none">
      <h1>Layouts</h1>
      <p>
        Layouts allow you to share UI between multiple pages. Buncf supports nested layouts
        via the file system.
      </p>

      <h2>Root Layout</h2>
      <p>
        The top-level layout is defined in <code>src/pages/_layout.tsx</code>.
        It must accept a <code>children</code> prop.
      </p>

      <div className="not-prose my-6">
        <CodeBlock
          code={`// src/pages/_layout.tsx
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}`}
          language="tsx"
          filename="src/pages/_layout.tsx"
        />
      </div>

      <h2>Nested Layouts</h2>
      <p>
        You can define a layout for a specific directory by creating a <code>_layout.tsx</code>
        file inside that directory.
      </p>

      <div className="not-prose my-6">
        <CodeBlock
          code={`// src/pages/dashboard/_layout.tsx
import { Sidebar } from '@/components/Sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex">
      <Sidebar />
      <div className="p-8 w-full">
        {children}
      </div>
    </div>
  );
}`}
          language="tsx"
          filename="src/pages/dashboard/_layout.tsx"
        />
      </div>

      <p>
        In this example, any page inside <code>src/pages/dashboard/</code> will be wrapped
        by both the <code>RootLayout</code> AND the <code>DashboardLayout</code>.
      </p>
    </div>
  );
}
