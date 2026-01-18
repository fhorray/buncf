import React from 'react';
import { CodeBlock } from '@/components/ui/code-block';

export const meta = () => [{ title: 'Hooks & Navigation - Buncf Docs' }];

export default function HooksDocs() {
  return (
    <div className="space-y-10 max-w-4xl">
      <div className="space-y-4">
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight lg:text-5xl">
          Hooks & Navigation
        </h1>
        <p className="text-xl text-muted-foreground">
          Client-side routing utilities provided by <code>buncf/router</code>.
        </p>
      </div>

      <div className="space-y-6">
        <h2
          className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight"
          id="imports"
        >
          Imports
        </h2>
        <p className="leading-7">
          All hooks and components are exported from the router package.
        </p>
        <CodeBlock
          code={`import { 
  useRouter, 
  useParams, 
  useSearchParams, 
  usePathname,
  useFetcher,
  useSubmit,
  Link 
} from "buncf/router";`}
        />
      </div>

      <div className="space-y-6">
        <h2
          className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight"
          id="use-router"
        >
          useRouter
        </h2>
        <p className="leading-7">
          Provides programmatic access to the router state and navigation
          methods.
        </p>

        <h3
          className="text-xl font-semibold tracking-tight pt-2"
          id="use-router-api"
        >
          API Reference
        </h3>
        <CodeBlock
          language="typescript"
          code={`interface Router {
  pathname: string;           // Current URL path
  params: Record<string, string>; // Route parameters
  query: Record<string, string>;  // Query parameters
  
  // Navigation methods
  push: (href: string) => void;    // Navigate to new URL
  replace: (href: string) => void; // Replace current URL in history
  back: () => void;               // Go back one step
  forward: () => void;            // Go forward one step
}`}
        />

        <h3
          className="text-xl font-semibold tracking-tight pt-2"
          id="use-router-example"
        >
          Example
        </h3>
        <CodeBlock
          code={`const router = useRouter();

function handleLogin() {
  // Perform login logic...
  
  // Navigate to dashboard
  router.push("/dashboard");
  
  // Or replace history (cant go back to login)
  // router.replace("/dashboard");
}

return (
  <div>
    <p>Current Page: {router.pathname}</p>
    <button onClick={handleLogin}>Login</button>
  </div>
);`}
        />
      </div>

      <div className="space-y-6">
        <h2
          className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight"
          id="use-params"
        >
          useParams
        </h2>
        <p className="leading-7">
          Returns an object of key/value pairs of dynamic params from the
          current URL that were matched by the route.
        </p>

        <h3
          className="text-xl font-semibold tracking-tight pt-2"
          id="use-params-api"
        >
          API Reference
        </h3>
        <CodeBlock
          language="typescript"
          code={`function useParams(): Record<string, string>`}
        />

        <h3
          className="text-xl font-semibold tracking-tight pt-2"
          id="use-params-example"
        >
          Example
        </h3>
        <p className="text-sm text-muted-foreground mb-2">
          For route: <code>src/pages/users/[id].tsx</code>
        </p>
        <CodeBlock
          code={`// URL: /users/123
const params = useParams();

console.log(params.id); // "123"

return <h1>User ID: {params.id}</h1>;`}
        />
      </div>

      <div className="space-y-6">
        <h2
          className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight"
          id="use-search-params"
        >
          useSearchParams
        </h2>
        <p className="leading-7">
          A hook to read and modify the query string of the current URL.
        </p>

        <h3
          className="text-xl font-semibold tracking-tight pt-2"
          id="use-search-params-api"
        >
          API Reference
        </h3>
        <CodeBlock
          language="typescript"
          code={`function useSearchParams(): [
  params: Record<string, string>,                 // Current query params
  setParams: (newParams: Record<string, string>) => void // Function to update params
]`}
        />

        <h3
          className="text-xl font-semibold tracking-tight pt-2"
          id="use-search-params-example"
        >
          Example
        </h3>
        <CodeBlock
          code={`const [query, setQuery] = useSearchParams();

// URL: /search?q=hello&sort=desc
console.log(query.q); // "hello"

const applyFilter = () => {
  // Updates URL to: /search?q=hello&sort=asc (merges not supported yet, replaces all)
  setQuery({ ...query, sort: "asc" });
};`}
        />
      </div>

      <div className="space-y-6">
        <h2
          className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight"
          id="use-pathname"
        >
          usePathname
        </h2>
        <p className="leading-7">Returns the current URL path string.</p>
        <CodeBlock
          language="typescript"
          code={`function usePathname(): string`}
        />
      </div>

      <div className="space-y-6">
        <h2
          className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight"
          id="use-fetcher"
        >
          useFetcher
        </h2>
        <p className="leading-7">
          Interactions with the server without navigation. Great for loading
          data or submitting forms that don't change the URL.
        </p>

        <h3
          className="text-xl font-semibold tracking-tight pt-2"
          id="use-fetcher-api"
        >
          API Reference
        </h3>
        <CodeBlock
          language="typescript"
          code={`interface Fetcher<TData = any> {
  state: "idle" | "loading" | "submitting";
  data: TData | undefined;
  
  // Helpers
  isLoading: boolean;
  isSubmitting: boolean;

  // Components
  Form: ComponentType<FormProps>;

  // Methods
  load: (href: string) => void;
  submit: (
    target: string | Record<string, any> | FormData, 
    options?: { method?: string; action?: string }
  ) => void;
}`}
        />

        <h3
          className="text-xl font-semibold tracking-tight pt-4"
          id="use-fetcher-loading"
        >
          Usage: Data Loading
        </h3>
        <CodeBlock
          code={`const fetcher = useFetcher<User[]>();

useEffect(() => {
  // Fetches data from /api/users
  fetcher.load("/api/users");
}, []);

if (fetcher.state === "loading") return <p>Loading...</p>;

return (
  <ul>
    {fetcher.data?.map(user => <li key={user.id}>{user.name}</li>)}
  </ul>
);`}
        />

        <h3
          className="text-xl font-semibold tracking-tight pt-4"
          id="use-fetcher-mutation"
        >
          Usage: Mutations
        </h3>
        <CodeBlock
          code={`const fetcher = useFetcher<{ id: string }>();

// 1. Derived State (Boolean)
if (fetcher.isSubmitting) return <Spinner />;

// 2. Declarative Form (Prevents Reload + Auto-Cancellation)
return (
  <fetcher.Form action="/api/posts" method="POST" className="space-y-4">
    <input name="title" required />
    <button disabled={fetcher.isSubmitting}>
       {fetcher.isSubmitting ? "Saving..." : "Create Post"}
    </button>
  </fetcher.Form>
);`}
        />

        <h3
          className="text-xl font-semibold tracking-tight pt-4"
          id="use-fetcher-cancellation"
        >
          Auto-Cancellation
        </h3>
        <p className="leading-7">
          <code>useFetcher</code> automatically cancels pending requests if a
          new one is started (using <code>AbortController</code>). This prevents
          race conditions where an old request overwrites a newer one.
        </p>
      </div>

      <div className="space-y-6">
        <h2
          className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight"
          id="use-submit"
        >
          useSubmit
        </h2>
        <p className="leading-7">
          A helper hook that returns just the <code>submit</code> function from
          a fetcher.
        </p>
        <CodeBlock
          language="typescript"
          code={`function useSubmit(): (
  target: string | Record<string, any> | FormData, 
  options?: { method?: string; action?: string }
) => void`}
        />
      </div>

      <div className="space-y-6">
        <h2
          className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight"
          id="link"
        >
          Link Component
        </h2>
        <p className="leading-7">
          A React component to navigate between routes. It is the declarative
          equivalent of <code>router.push</code>.
        </p>

        <h3 className="text-xl font-semibold tracking-tight pt-2" id="link-api">
          API Reference
        </h3>
        <CodeBlock
          language="typescript"
          code={`interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string; // The path to navigate to
}`}
        />

        <h3
          className="text-xl font-semibold tracking-tight pt-2"
          id="link-example"
        >
          Example
        </h3>
        <CodeBlock
          language="tsx"
          code={`<Link href="/about" className="text-blue-500 hover:underline">
  About Us
</Link>`}
        />
      </div>
    </div>
  );
}
