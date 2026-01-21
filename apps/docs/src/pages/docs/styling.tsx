import { CodeBlock } from '@/components/code-block';

export const meta = () => [
  { title: 'Styling - Buncf' },
  { name: 'description', content: 'Using Tailwind CSS and other styling methods' },
];

export default function Styling() {
  return (
    <div className="prose prose-invert max-w-none">
      <h1>Styling</h1>
      <p>
        Buncf has built-in support for <strong>Tailwind CSS</strong> via the official Bun plugin.
        It also supports standard CSS imports and CSS modules.
      </p>

      <h2>Tailwind CSS</h2>
      <p>
        Tailwind is the recommended way to style Buncf applications.
      </p>

      <h3>1. Configuration</h3>
      <p>
        Ensure you have <code>bun-plugin-tailwind</code> installed and configured in
        <code>buncf.config.ts</code>:
      </p>

      <div className="not-prose my-6">
        <CodeBlock
          code={`// buncf.config.ts
import { tailwind } from 'bun-plugin-tailwind';

export default {
  plugins: [tailwind],
};`}
          language="typescript"
          filename="buncf.config.ts"
        />
      </div>

      <h3>2. Global CSS</h3>
      <p>Import Tailwind directives in your <code>src/globals.css</code>:</p>

      <div className="not-prose my-6">
        <CodeBlock
          code={`@import 'tailwindcss';`}
          language="css"
          filename="src/globals.css"
        />
      </div>

      <h3>3. Client Entry</h3>
      <p>Import the CSS file in your <code>src/client.tsx</code>:</p>

      <div className="not-prose my-6">
        <CodeBlock
          code={`import './globals.css';
import { hydrateRoot } from 'react-dom/client';
// ... rest of client code`}
          language="typescript"
          filename="src/client.tsx"
        />
      </div>

      <h2>CSS Modules</h2>
      <p>
        You can use CSS modules by naming your files <code>*.module.css</code>.
        This scopes classes locally to the component.
      </p>

      <div className="not-prose my-6">
        <CodeBlock
          code={`/* Button.module.css */
.btn {
  padding: 10px 20px;
  background: blue;
  color: white;
}`}
          language="css"
          filename="src/components/Button.module.css"
        />
      </div>

      <div className="not-prose my-6">
        <CodeBlock
          code={`import styles from './Button.module.css';

export function Button() {
  return <button className={styles.btn}>Click Me</button>;
}`}
          language="tsx"
          filename="src/components/Button.tsx"
        />
      </div>
    </div>
  );
}
