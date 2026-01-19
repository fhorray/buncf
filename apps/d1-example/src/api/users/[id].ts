import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export const DELETE = async (req: Request, { params }: { params: { id: string } }) => {
  await db.delete(users).where(eq(users.id, params.id));
  return Response.json({ success: true });
};

export const PUT = async (req: Request, { params }: { params: { id: string } }) => {
  const body = await req.json() as { name: string; email: string };
  const updated = await db.update(users)
    .set({ name: body.name, email: body.email })
    .where(eq(users.id, params.id))
    .returning();
  return Response.json(updated[0]);
};
