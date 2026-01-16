/**
 * API Route: List all users
 * URL: /api/users
 */

const users = [
  { id: "1", name: "Alice", email: "alice@example.com" },
  { id: "2", name: "Bob", email: "bob@example.com" },
  { id: "3", name: "Charlie", email: "charlie@example.com" },
];

export function GET(req: Request) {
  return Response.json({ users, total: users.length });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    return Response.json({
      message: "User created",
      user: { id: Date.now().toString(), ...body }
    }, { status: 201 });
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
}
