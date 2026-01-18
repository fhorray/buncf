import { defineAction } from "buncf/router";
import { z } from "zod";

// A simple math action
export const multiply = defineAction(
  z.object({ a: z.number(), b: z.number() }),
  async ({ a, b }) => {
    // Simulate server latency
    await new Promise(r => setTimeout(r, 800));
    return { result: a * b };
  }
);

// An action with validation logic
export const registerUser = defineAction(
  z.object({
    username: z.string().min(3, "Too short"),
    email: z.string().email("Invalid email")
  }),
  async ({ username, email }) => {
    // Simulate DB check
    if (username === "admin") {
      throw new Error("Username taken");
    }
    return {
      id: crypto.randomUUID(),
      message: `Welcome ${username}! Check ${email}.`
    };
  }
);
