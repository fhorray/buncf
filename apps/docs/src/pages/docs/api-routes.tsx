import React from "react";
import { CodeBlock } from "@/components/ui/code-block";

export const meta = () => [{ title: "API Client - Buncf Docs" }];

export default function ApiClientDocs() {
  return (
    <div className="space-y-10 max-w-4xl">
      <div className="space-y-4">
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight lg:text-5xl">Type-Safe API Client</h1>
        <p className="text-xl text-muted-foreground">
          Buncf auto-generates a typed API client from your endpoints, giving you RPC-like safety without the boilerplate.
        </p>
      </div>

      <div className="space-y-6">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight" id="define">1. Define Handlers</h2>
        <p className="leading-7">
            Use <code>defineHandler</code> to infer types automatically.
        </p>
        <CodeBlock filename="src/api/users/[id].ts" code={`import { defineHandler } from "buncf";

interface User {
  id: string;
  name: string;
}

export const GET = defineHandler<{ id: string }, User>((req) => {
  return Response.json({ id: req.params.id, name: "Alice" });
});`} />
      </div>

      <div className="space-y-6">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight" id="consume">2. Use the Client</h2>
        <p className="leading-7">
            Import the generated client from <code>.buncf/api-client</code>.
        </p>
        <CodeBlock filename="src/pages/users/[id].tsx" code={`import { api } from "../.buncf/api-client";
import { useParams } from "buncf/router";

export default function UserPage() {
  const { id } = useParams();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // 🎉 Autocomplete enabled!
    api.get("/api/users/:id", { params: { id } }).then(setUser);
  }, [id]);

  return <div>{user?.name}</div>;
}`} />
      </div>

      <div className="space-y-6">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight" id="data-loaders">Data Loaders</h2>
        <p className="leading-7">
            Render-as-you-fetch support. Export a <code>loader</code> function.
        </p>
        <CodeBlock filename="src/pages/dashboard.tsx" code={`import { api } from "../.buncf/api-client";

export const loader = async ({ params, query }) => {
    // Runs on client before render
    const stats = await api.get("/api/stats");
    return stats;
};

export default function Dashboard({ data }) {
    return <div>Stats: {data.total_users}</div>;
}`} />
      </div>

    </div>
  );
}
