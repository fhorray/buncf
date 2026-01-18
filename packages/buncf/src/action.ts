import { z, type ZodSchema } from "zod";

/**
 * Server Action Definition
 */
export interface ActionDef<Input, Output> {
  input: ZodSchema<Input>;
  handler: (input: Input, context: ActionContext) => Promise<Output>;
}

export interface ActionContext {
  request: Request;
  // potentially add user context, etc.
}

/**
 * Define a type-safe server action
 */
export function defineAction<Input, Output>(
  schema: ZodSchema<Input>,
  handler: (input: Input, ctx: ActionContext) => Promise<Output>
) {
  // We return a function that can be called directly (useful for tests or TS satisfaction)
  // At build time, this is completely replaced on the client anyway.
  const actionFn = async (input: Input) => {
    return handler(input, { request: {} as any });
  };

  // Attach metadata for the server/build-system
  (actionFn as any).input = schema;
  (actionFn as any).handler = handler;
  (actionFn as any)._isAction = true;

  // Return as a hybrid type
  return actionFn as unknown as ((input: Input) => Promise<Output>) & ActionDef<Input, Output> & { _isAction: true };
}

/**
 * Handle execution of an action (Server Side)
 */
export async function handleAction<Input, Output>(
  req: Request,
  action: {
    input: ZodSchema<Input>;
    handler: (input: Input, ctx: ActionContext) => Promise<Output>;
  }
): Promise<Response> {
  try {
    const contentType = req.headers.get("content-type") || "";
    let inputData: any;

    if (contentType.includes("application/json")) {
      inputData = await req.json();
    } else if (contentType.includes("form-data")) {
      // Basic form data parsing
      const formData = await req.formData();
      inputData = Object.fromEntries(formData);
    } else {
      return new Response("Unsupported Content-Type", { status: 400 });
    }

    // Validate Input
    const parseResult = action.input.safeParse(inputData);
    if (!parseResult.success) {
      return new Response(JSON.stringify({
        error: "Validation Error",
        issues: parseResult.error.issues
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Execute Handler
    const result = await action.handler(parseResult.data, { request: req });
    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (e: any) {
    console.error("[buncf] Action Failed:", e);
    return new Response(JSON.stringify({ error: e.message || "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
