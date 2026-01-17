import { Hono } from 'hono';

const app = new Hono().basePath('/api');

app.get('/hello', (c) => {
  return c.json({
    message: 'Hello form Hono inside Buncf File System Routing!',
    path: c.req.path
  });
});

app.get("/users", async (c) => {
  const users = [
    { id: 1, name: "John", email: "john@example.com" },
    { id: 2, name: "Jane", email: "jane@example.com" },
    { id: 3, name: "Bob", email: "bob@example.com" },
  ]
  return c.json(users)
})

app.get('/users/:id', (c) => {
  const id = c.req.param('id');
  return c.json({
    id,
    name: `User ${id}`,
    email: `user${id}@example.com`,
    source: 'Hono'
  });
});

// Catch-all for other Hono routes
app.all('*', (c) => {
  return c.json({ error: 'Not Found in Hono' }, 404);
});

// Buncf API Handler expects a function.
// Since Hono's app.fetch matches (req) => Response, we can export it seamlessly.
// However, Buncf `api.ts` logic calls: handler(req)
// If we export default app.fetch, `this` context might be lost?
// Usually app.fetch is bound or safe. Let's try direct export.

export default app.fetch;
