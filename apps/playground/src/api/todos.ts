// In-memory storage (persists while dev server keeps module cached)
let todos: { id: string; text: string; createdAt: number }[] = [
  { id: "1", text: "Buy milk 🥛", createdAt: Date.now() },
  { id: "2", text: "Test Buncf Cache ⚡", createdAt: Date.now() - 1000 },
];

export default async function handler(req: Request) {
  const url = new URL(req.url);

  // 1. GET: List Todos
  if (req.method === "GET") {
    // Artificial delay to show loading states nicely
    await new Promise(r => setTimeout(r, 300));
    return Response.json(todos.sort((a, b) => b.createdAt - a.createdAt));
  }

  // 2. POST: Add Todo
  if (req.method === "POST") {
    const formData = await req.formData();
    const text = formData.get("text")?.toString();

    if (!text) {
      return Response.json({ error: "Text is required" }, { status: 400 });
    }

    const newTodo = {
      id: crypto.randomUUID(),
      text,
      createdAt: Date.now(),
    };

    todos.push(newTodo);

    return Response.json({ success: true, todo: newTodo });
  }

  // 3. DELETE: Remove Todo
  if (req.method === "DELETE") {
    // We can get ID from search params?Or body?
    // fetcher.submit(formData) with hidden input is easiest
    const formData = await req.formData();
    const id = formData.get("id")?.toString();

    if (!id) {
      return Response.json({ error: "ID required" }, { status: 400 });
    }

    todos = todos.filter(t => t.id !== id);
    return Response.json({ success: true });
  }

  return Response.json({ error: "Method not allowed" }, { status: 405 });
}
