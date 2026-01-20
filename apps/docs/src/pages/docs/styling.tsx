'use client';

import { CodeBlock } from "@/components/code-block";
import { PageHeader, Paragraph, DocNavigation, InlineCode } from "@/components/docs/doc-components";
import { Paintbrush } from "lucide-react";

export default function StylingPage() {
  return (
    <article className="px-6 py-12 lg:px-12">
      <PageHeader
        icon={Paintbrush}
        title="Styling"
        description="Add styles to your buncf application."
      />

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">Tailwind CSS</h2>
        <Paragraph>
          buncf has first-class support for Tailwind CSS. To get started, create a <InlineCode>globals.css</InlineCode> file:
        </Paragraph>
        <CodeBlock
          code={`/* src/globals.css */
@import 'tailwindcss';`}
          language="css"
          filename="src/globals.css"
          showLineNumbers={false}
        />
        <Paragraph>
          Then import it in your client entry:
        </Paragraph>
        <CodeBlock
          code={`// src/client.tsx
import './globals.css';
import { hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'buncf/router';

hydrateRoot(document, <BrowserRouter />);`}
          language="tsx"
          filename="src/client.tsx"
        />
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">CSS Modules</h2>
        <Paragraph>
          Use CSS Modules for component-scoped styles:
        </Paragraph>
        <CodeBlock
          code={`/* components/Button.module.css */
.button {
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  transition: all 0.2s;
}

.primary {
  background-color: #3b82f6;
  color: white;
}

.primary:hover {
  background-color: #2563eb;
}`}
          language="css"
          filename="components/Button.module.css"
        />
        <CodeBlock
          code={`// components/Button.tsx
import styles from './Button.module.css';

interface ButtonProps {
  variant?: 'primary' | 'secondary';
  children: React.ReactNode;
}

export function Button({ variant = 'primary', children }: ButtonProps) {
  return (
    <button className={\`\${styles.button} \${styles[variant]}\`}>
      {children}
    </button>
  );
}`}
          language="tsx"
          filename="components/Button.tsx"
        />
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">Global Styles</h2>
        <Paragraph>
          Add global styles alongside Tailwind:
        </Paragraph>
        <CodeBlock
          code={`/* src/globals.css */
@import 'tailwindcss';

/* Custom global styles */
:root {
  --brand-color: #3b82f6;
  --text-primary: #1f2937;
  --text-secondary: #6b7280;
}

body {
  font-family: 'Inter', sans-serif;
  -webkit-font-smoothing: antialiased;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f5f9;
}

::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

/* Focus styles */
*:focus-visible {
  outline: 2px solid var(--brand-color);
  outline-offset: 2px;
}`}
          language="css"
          filename="src/globals.css"
        />
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">Static Assets</h2>
        <Paragraph>
          Place static files like images, fonts, and icons in the <InlineCode>public/</InlineCode> directory:
        </Paragraph>
        <CodeBlock
          code={`public/
├── images/
│   ├── logo.svg
│   └── hero.png
├── fonts/
│   └── inter.woff2
└── favicon.ico`}
          language="text"
          showLineNumbers={false}
        />
        <Paragraph>
          Reference them with absolute paths:
        </Paragraph>
        <CodeBlock
          code={`// In JSX
<img src="/images/logo.svg" alt="Logo" />
<link rel="icon" href="/favicon.ico" />

// In CSS
.hero {
  background-image: url('/images/hero.png');
}

@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter.woff2') format('woff2');
}`}
          language="tsx"
        />
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">Custom Fonts</h2>
        <Paragraph>
          Add custom fonts using Google Fonts or local files:
        </Paragraph>
        <CodeBlock
          code={`/* src/globals.css */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

/* Or use @font-face for local fonts */
@font-face {
  font-family: 'CustomFont';
  src: url('/fonts/custom.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

body {
  font-family: 'Inter', sans-serif;
}`}
          language="css"
          filename="src/globals.css"
        />
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">Dark Mode</h2>
        <Paragraph>
          Implement dark mode with Tailwind's dark variant:
        </Paragraph>
        <CodeBlock
          code={`// Add dark mode toggle
function DarkModeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  return (
    <button onClick={() => setIsDark(!isDark)}>
      {isDark ? '☀️' : '🌙'}
    </button>
  );
}

// Use dark: prefix in classes
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
  Content
</div>`}
          language="tsx"
        />
      </section>

      <DocNavigation
        prev={{ href: "/docs/middleware", label: "Middleware" }}
        next={{ href: "/docs/deployment", label: "Deployment" }}
      />
    </article>
  );
}
