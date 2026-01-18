import { defineAction } from "buncf";
import { z } from "zod";

// This will be automatically exposed as an RPC endpoint by Buncf
export const createTodoAction = defineAction(
  z.object({
    text: z.string().min(1, "Text is required"),
  }),
  async (input, { request }) => {
    console.log("[Server] Received action request:", input);

    // In a real app, you'd save to a DB here
    // For the demo, we just return a success message
    return {
      success: true,
      message: `Action received: ${input.text}`,
      serverTime: new Date().toISOString(),
      userAgent: request.headers.get("user-agent"),
    };
  }
);
