import { db } from "@/db";
import { users } from "@/db/schema";

export const GET = async () => {
  const allUsers = await db.select().from(users);
  return Response.json(allUsers);
};

export const POST = async (req: Request) => {
  const body = await req.json() as { name: string; email: string };

  const newUser = await db.insert(users).values({
    id: crypto.randomUUID(),
    name: body.name,
    email: body.email,
  }).returning();

  return Response.json(newUser[0]);
};
