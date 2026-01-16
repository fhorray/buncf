/**
 * Dynamic API Route: Users by ID
 * URL: /api/users/:id
 * 
 * Example: /api/users/123 → { id: "123", name: "User 123" }
 */

// Mock database
const users: Record<string, { id: string; name: string; email: string }> = {
  "1": { id: "1", name: "Alice", email: "alice@example.com" },
  "2": { id: "2", name: "Bob", email: "bob@example.com" },
  "3": { id: "3", name: "Charlie", email: "charlie@example.com" },
};

export function GET(req: Request & { params: { id: string } }) {
  const { id } = req.params;

  const user = users[id];
  if (!user) {
    return Response.json(
      { error: "User not found" },
      { status: 404 }
    );
  }

  return Response.json(user);
}

export function PUT(req: Request & { params: { id: string } }) {
  const { id } = req.params;
  return Response.json({
    message: `Updated user ${id}`,
    method: "PUT"
  });
}

export function DELETE(req: Request & { params: { id: string } }) {
  const { id } = req.params;
  return Response.json({
    message: `Deleted user ${id}`,
    method: "DELETE"
  });
}
