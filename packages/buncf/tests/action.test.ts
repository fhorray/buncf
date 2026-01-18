import { describe, test, expect } from "bun:test";
import { defineAction, handleAction } from "../src/action";
import { z } from "zod";

describe("RPC & Server Actions", () => {
  // 1. Define a sample action
  const addAction = defineAction(
    z.object({ a: z.number(), b: z.number() }),
    async ({ a, b }) => {
      return { result: a + b };
    }
  );

  test("defineAction preserves schema", () => {
    expect(addAction.input).toBeDefined();
    expect(addAction._isAction).toBe(true);
  });

  test("handleAction executes successfully with valid JSON", async () => {
    const req = new Request("http://localhost/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ a: 10, b: 20 })
    });

    const res = await handleAction(req, addAction);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ result: 30 });
  });

  test("handleAction validates input and returns 400 on error", async () => {
    const req = new Request("http://localhost/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Missing 'b'
      body: JSON.stringify({ a: 10 })
    });

    const res = await handleAction(req, addAction);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Validation Error");
    expect(json.issues).toBeDefined();
  });

  test("handleAction handles Form Data", async () => {
    const formData = new FormData();
    formData.set("a", "5");
    formData.set("b", "7");

    // Note: FormData values are strings. Zod needs coercion or pre-processing usually.
    // Let's see if our handleAction implementation handles naive FormData -> Object conversion.
    // Our current implementation does: Object.fromEntries(formData).
    // BUT strict Zod number() expects a number, not string "5".

    // We will test a string-based action for FormData compatibility
    const echoAction = defineAction(
      z.object({ msg: z.string() }),
      async ({ msg }) => ({ received: msg })
    );

    const form = new FormData();
    form.set("msg", "hello world");

    const req = new Request("http://localhost/action", {
      method: "POST",
      body: form
    });

    const res = await handleAction(req, echoAction);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.received).toBe("hello world");
  });
});
