import { CodeBlock } from '@/components/code-block';

export const meta = () => [
  { title: 'Page Routes - Buncf' },
  { name: 'description', content: 'Building pages with React in Buncf' },
];

export default function PageRoutes() {
  return (
    <div className="prose prose-invert max-w-none">
      <h1>Page Routes</h1>
      <p>
        Page routes are React components exported from files in <code>src/pages</code>.
        They are rendered on the server and hydrated on the client.
      </p>

      <h2>Basic Page</h2>
      <div className="not-prose my-6">
        <CodeBlock
          code={`export default function HomePage() {
  return <h1>Welcome to Buncf!</h1>;
}`}
          language="tsx"
          filename="src/pages/index.tsx"
        />
      </div>

      <h2>Accessing Parameters</h2>
      <p>Use the <code>useParams</code> hook to access dynamic route parameters.</p>

      <div className="not-prose my-6">
        <CodeBlock
          code={`import { useParams } from 'buncf/router';

export default function UserProfile() {
  const { id } = useParams();
  return <h1>User Profile: {id}</h1>;
}`}
          language="tsx"
          filename="src/pages/users/[id].tsx"
        />
      </div>

      <h2>Metadata</h2>
      <p>
        You can define page metadata (title, description, Open Graph tags) by exporting
        a <code>meta</code> function.
      </p>

      <div className="not-prose my-6">
        <CodeBlock
          code={`export const meta = () => [
  { title: 'About Us - MyApp' },
  { name: 'description', content: 'Learn more about our company' },
  { property: 'og:image', content: '/og-about.png' }
];

export default function About() {
  return <h1>About Us</h1>;
}`}
          language="tsx"
        />
      </div>

      <h2>Special Files</h2>
      <p>Buncf supports several special files to control page behavior:</p>

      <ul>
        <li><code>_layout.tsx</code>: Wraps all pages in the directory.</li>
        <li><code>_loading.tsx</code>: Shown while the page is loading (Suspense fallback).</li>
        <li><code>_error.tsx</code>: Error boundary for handling exceptions.</li>
        <li><code>_notfound.tsx</code>: Custom 404 page for the directory.</li>
      </ul>
    </div>
  );
}
