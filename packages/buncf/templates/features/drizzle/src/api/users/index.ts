
import { getDb } from "@/db";
import { users } from "@/db/schema";

export default async () => {
  const db = await getDb();
  const allUsers = await db.select().from(users);
  return Response.json(allUsers);
};
