import React from "react";
import { CodeBlock } from "@/components/ui/code-block";

export const meta = () => [{ title: "Hooks & Navigation - Buncf Docs" }];

export default function HooksDocs() {
  return (
    <div className="space-y-10 max-w-4xl">
      <div className="space-y-4">
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight lg:text-5xl">Hooks & Navigation</h1>
        <p className="text-xl text-muted-foreground">
          Client-side routing utilities provided by <code>buncf/router</code>.
        </p>
      </div>

      <div className="space-y-6">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight" id="imports">Imports</h2>
        <p className="leading-7">
          All hooks and components are exported from the router package.
        </p>
        <CodeBlock code={`import { 
  useRouter, 
  useParams, 
  useSearchParams, 
  usePathname,
  Link 
} from "buncf/router";`} />
      </div>

       <div className="space-y-6">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight" id="use-pathname">usePathname</h2>
        <p className="leading-7">
          Returns the current URL path string.
        </p>
        <CodeBlock code={`const pathname = usePathname();
// Example output: "/docs/hooks"`} />
      </div>

      <div className="space-y-6">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight" id="use-params">useParams</h2>
        <p className="leading-7">
          Read dynamic route parameters.
        </p>
        <CodeBlock filename="src/pages/blog/[slug].tsx" code={`export default function Post() {
  const { slug } = useParams();
  return <h1>Reading: {slug}</h1>;
}`} />
      </div>

      <div className="space-y-6">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight" id="use-search-params">useSearchParams</h2>
        <p className="leading-7">
          Read query string parameters.
        </p>
        <CodeBlock code={`const searchParams = useSearchParams();
const query = searchParams.get("q"); // ?q=hello`} />
      </div>

      <div className="space-y-6">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight" id="use-router">useRouter</h2>
        <p className="leading-7">
          Programmatic navigation control.
        </p>
        <CodeBlock code={`const router = useRouter();

// Navigate
router.push("/login");

// Replace history
router.replace("/dashboard");

// Go back
router.back();`} />
      </div>

      <div className="space-y-6">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight" id="link">Link Component</h2>
        <p className="leading-7">
          Use <code>&lt;Link&gt;</code> for accessible, client-side navigation.
        </p>
        <CodeBlock language="tsx" code={`<Link href="/about" className="nav-link">
  About Us
</Link>`} />
      </div>

    </div>
  );
}
