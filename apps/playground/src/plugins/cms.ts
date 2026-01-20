/**
 * Example CMS Plugin for Buncf
 * 
 * This plugin demonstrates how to create a high-level Buncf plugin that:
 * 1. Injects API routes for CRUD operations
 * 2. Provides an admin UI at /admin
 * 3. Integrates with Cloudflare bindings (D1, KV)
 */

import type { BuncfPlugin, BuncfPluginContext, BuncfPluginSetupResult } from "buncf";

// In-memory store for demo (in production, use D1 or KV)
interface Post {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

const posts: Map<string, Post> = new Map();

// Initialize with some demo data
posts.set("1", {
  id: "1",
  title: "Welcome to Buncf CMS",
  content: "This is your first post created by the CMS plugin!",
  createdAt: new Date().toISOString(),
});

export interface CMSPluginOptions {
  /** Base path for admin routes (default: "/admin") */
  adminPath?: string;
  /** D1 database binding name (optional, uses in-memory store if not provided) */
  database?: string;
}

/**
 * CMS Plugin for Buncf
 * 
 * Provides a simple content management system with:
 * - Admin dashboard at /admin
 * - RESTful API at /admin/api/posts
 */
export function cmsPlugin(options: CMSPluginOptions = {}): BuncfPlugin<CMSPluginOptions> {
  const { adminPath = "/admin" } = options;

  return {
    name: "buncf-cms",
    basePath: adminPath,

    setup: (): BuncfPluginSetupResult => {
      return {
        routes: async (req: Request, ctx: BuncfPluginContext): Promise<Response> => {
          const url = new URL(req.url);
          const path = url.pathname;
          const method = req.method;

          // --- API Routes ---

          // GET /api/posts - List all posts
          if (path === "/api/posts" && method === "GET") {
            const allPosts = Array.from(posts.values());
            return Response.json({ posts: allPosts });
          }

          // GET /api/posts/:id - Get single post
          if (path.startsWith("/api/posts/") && method === "GET") {
            const id = path.replace("/api/posts/", "");
            const post = posts.get(id);
            if (!post) {
              return Response.json({ error: "Post not found" }, { status: 404 });
            }
            return Response.json(post);
          }

          // POST /api/posts - Create post
          if (path === "/api/posts" && method === "POST") {
            try {
              const body = await req.json() as { title: string; content: string };
              const id = Date.now().toString();
              const post: Post = {
                id,
                title: body.title,
                content: body.content,
                createdAt: new Date().toISOString(),
              };
              posts.set(id, post);
              return Response.json(post, { status: 201 });
            } catch (e) {
              return Response.json({ error: "Invalid JSON body" }, { status: 400 });
            }
          }

          // PUT /api/posts/:id - Update post
          if (path.startsWith("/api/posts/") && method === "PUT") {
            const id = path.replace("/api/posts/", "");
            const existing = posts.get(id);
            if (!existing) {
              return Response.json({ error: "Post not found" }, { status: 404 });
            }
            try {
              const body = await req.json() as { title?: string; content?: string };
              const updated: Post = {
                ...existing,
                title: body.title ?? existing.title,
                content: body.content ?? existing.content,
              };
              posts.set(id, updated);
              return Response.json(updated);
            } catch (e) {
              return Response.json({ error: "Invalid JSON body" }, { status: 400 });
            }
          }

          // DELETE /api/posts/:id - Delete post
          if (path.startsWith("/api/posts/") && method === "DELETE") {
            const id = path.replace("/api/posts/", "");
            if (!posts.has(id)) {
              return Response.json({ error: "Post not found" }, { status: 404 });
            }
            posts.delete(id);
            return Response.json({ success: true });
          }

          // --- Admin UI ---

          // GET / - Admin Dashboard
          if (path === "/" || path === "") {
            const allPosts = Array.from(posts.values());
            const html = generateAdminHTML(allPosts, adminPath);
            return new Response(html, {
              headers: { "Content-Type": "text/html" },
            });
          }

          // 404 for unknown routes
          return new Response("Not Found", { status: 404 });
        },

        middleware: [
          {
            name: "cms-auth-check",
            matcher: `${adminPath}/*`,
            handler: async (req, next) => {
              // Example: Add authentication check here
              // const auth = req.headers.get("Authorization");
              // if (!auth) return new Response("Unauthorized", { status: 401 });
              return next();
            },
          },
        ],
      };
    },
  };
}

/**
 * Generate the admin dashboard HTML
 */
function generateAdminHTML(posts: Post[], basePath: string): string {
  const postListHtml = posts
    .map(
      (post) => `
      <div class="post-card">
        <h3>${escapeHtml(post.title)}</h3>
        <p>${escapeHtml(post.content.substring(0, 100))}...</p>
        <small>Created: ${new Date(post.createdAt).toLocaleDateString()}</small>
        <div class="actions">
          <button onclick="editPost('${post.id}')">Edit</button>
          <button onclick="deletePost('${post.id}')" class="danger">Delete</button>
        </div>
      </div>
    `
    )
    .join("");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Buncf CMS Admin</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      min-height: 100vh;
      color: #e4e4e4;
    }
    .container { max-width: 1000px; margin: 0 auto; padding: 2rem; }
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #333;
    }
    h1 { 
      font-size: 1.75rem;
      background: linear-gradient(90deg, #00d9ff, #ff00e5);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .btn {
      background: linear-gradient(90deg, #00d9ff, #00b4d8);
      color: #000;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      transition: transform 0.2s;
    }
    .btn:hover { transform: translateY(-2px); }
    .post-grid { display: grid; gap: 1rem; }
    .post-card {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 12px;
      padding: 1.5rem;
    }
    .post-card h3 { margin-bottom: 0.5rem; color: #fff; }
    .post-card p { color: #aaa; margin-bottom: 0.5rem; }
    .post-card small { color: #666; }
    .post-card .actions { margin-top: 1rem; display: flex; gap: 0.5rem; }
    .post-card button {
      padding: 0.5rem 1rem;
      border-radius: 6px;
      border: none;
      cursor: pointer;
      background: #333;
      color: #fff;
    }
    .post-card button.danger { background: #dc2626; }
    .modal {
      display: none;
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.8);
      justify-content: center;
      align-items: center;
    }
    .modal.active { display: flex; }
    .modal-content {
      background: #1e1e2e;
      padding: 2rem;
      border-radius: 12px;
      width: 90%;
      max-width: 500px;
    }
    .modal-content h2 { margin-bottom: 1rem; }
    .modal-content input, .modal-content textarea {
      width: 100%;
      padding: 0.75rem;
      margin-bottom: 1rem;
      border-radius: 8px;
      border: 1px solid #333;
      background: #2a2a3e;
      color: #fff;
    }
    .modal-content textarea { min-height: 150px; resize: vertical; }
    .modal-actions { display: flex; gap: 0.5rem; justify-content: flex-end; }
    .empty-state {
      text-align: center;
      padding: 3rem;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>🚀 Buncf CMS</h1>
      <button class="btn" onclick="openCreateModal()">+ New Post</button>
    </header>
    
    <div class="post-grid">
      ${postListHtml || '<div class="empty-state">No posts yet. Create your first post!</div>'}
    </div>
  </div>

  <!-- Create/Edit Modal -->
  <div id="modal" class="modal">
    <div class="modal-content">
      <h2 id="modal-title">Create Post</h2>
      <input type="hidden" id="post-id">
      <input type="text" id="post-title" placeholder="Post Title">
      <textarea id="post-content" placeholder="Write your content here..."></textarea>
      <div class="modal-actions">
        <button onclick="closeModal()" style="background:#333;color:#fff;padding:0.5rem 1rem;border:none;border-radius:6px;cursor:pointer;">Cancel</button>
        <button onclick="savePost()" class="btn">Save</button>
      </div>
    </div>
  </div>

  <script>
    const API_BASE = '${basePath}/api/posts';

    function openCreateModal() {
      document.getElementById('modal-title').textContent = 'Create Post';
      document.getElementById('post-id').value = '';
      document.getElementById('post-title').value = '';
      document.getElementById('post-content').value = '';
      document.getElementById('modal').classList.add('active');
    }

    function closeModal() {
      document.getElementById('modal').classList.remove('active');
    }

    async function editPost(id) {
      const res = await fetch(API_BASE + '/' + id);
      const post = await res.json();
      document.getElementById('modal-title').textContent = 'Edit Post';
      document.getElementById('post-id').value = post.id;
      document.getElementById('post-title').value = post.title;
      document.getElementById('post-content').value = post.content;
      document.getElementById('modal').classList.add('active');
    }

    async function savePost() {
      const id = document.getElementById('post-id').value;
      const title = document.getElementById('post-title').value;
      const content = document.getElementById('post-content').value;

      if (!title || !content) {
        alert('Please fill in all fields');
        return;
      }

      const method = id ? 'PUT' : 'POST';
      const url = id ? API_BASE + '/' + id : API_BASE;

      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content })
      });

      location.reload();
    }

    async function deletePost(id) {
      if (!confirm('Are you sure you want to delete this post?')) return;
      await fetch(API_BASE + '/' + id, { method: 'DELETE' });
      location.reload();
    }
  </script>
</body>
</html>
  `;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export default cmsPlugin;
