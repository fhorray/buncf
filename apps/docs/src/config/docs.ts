export const docsConfig = {
  mainNav: [
    {
      title: "Documentation",
      href: "/docs",
    },
    {
      title: "GitHub",
      href: "https://github.com/francyelton/buncf",
      external: true,
    },
  ],
  sidebarNav: [
    {
      title: "Get Started",
      items: [
        { title: "Introduction", href: "/docs" },
        { title: "Installation", href: "/docs/installation" },
      ],
    },
    {
      title: "Core Concepts",
      items: [
        { title: "Routing", href: "/docs/routing" },
        { title: "Metadata", href: "/docs/metadata" },
        { title: "Data Loading", href: "/docs/data-loading" },
        { title: "Hooks & Nav", href: "/docs/hooks" },
        { title: "Layouts", href: "/docs/layouts" },
        { title: "Middleware", href: "/docs/middleware" },
      ],
    },
    {
      title: "Reference",
      items: [
        { title: "API Client", href: "/docs/api-routes" },
      ],
    },
    {
      title: "Cloudflare",
      items: [
        { title: "Bindings (KV, D1)", href: "/docs/bindings" },
        { title: "Deployment", href: "/docs/deployment" },
      ],
    },
  ],
};
