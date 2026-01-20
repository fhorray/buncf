import { 
  FolderTree, 
  Zap, 
  Lock, 
  Paintbrush, 
  RefreshCw, 
  Cloud,
  Code2,
  Gauge,
  Shield
} from "lucide-react";

const features = [
  {
    icon: FolderTree,
    title: "File-System Routing",
    description: "Next.js-style pages and API routes. Just create files in src/pages/ and src/api/.",
  },
  {
    icon: Code2,
    title: "React 19 Ready",
    description: "Full React support with streaming SSR foundation for optimal performance.",
  },
  {
    icon: Lock,
    title: "Magic Bindings",
    description: "Import d1, kv, r2, env directly—no boilerplate. Access Cloudflare bindings naturally.",
  },
  {
    icon: Shield,
    title: "Type-Safe API Client",
    description: "Auto-generated typed fetch client from your handlers. Full autocomplete.",
  },
  {
    icon: RefreshCw,
    title: "SWR-Style Fetching",
    description: "useFetcher with auto-load, mutate, and callbacks. Data fetching made simple.",
  },
  {
    icon: Zap,
    title: "Server Actions",
    description: "Zod-validated RPC with defineAction. Type-safe mutations.",
  },
  {
    icon: Paintbrush,
    title: "Tailwind CSS",
    description: "Built-in bun-plugin-tailwind support. Style your apps beautifully.",
  },
  {
    icon: Gauge,
    title: "Dev Experience",
    description: "Hot reload, error overlay, open-in-editor. Developer productivity first.",
  },
  {
    icon: Cloud,
    title: "Cloudflare Native",
    description: "First-class D1, KV, R2, and Workers support. Deploy to the edge.",
  },
];

export function Features() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Everything you need to build
            <span className="text-neon"> at the edge</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A complete framework with modern features, optimized for Cloudflare Workers.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group p-6 rounded-xl border border-border/50 bg-card/50 hover:border-neon/30 hover:bg-card transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-lg bg-neon/10 flex items-center justify-center mb-4 group-hover:bg-neon/20 transition-colors">
                <feature.icon className="w-6 h-6 text-neon" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
