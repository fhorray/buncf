import { expect, test, describe, afterAll } from "bun:test";
import { WorkflowDatabase } from "../src/workflows/db";
import { WorkflowBinding } from "../src/workflows/binding";
import { MyWorkflow } from "./workflow-demo";
import * as fs from "fs";
import * as path from "path";

const TEST_DB_DIR = ".test-workflows-db";

describe("Workflow Engine", () => {
  // Clean up before and after
  if (fs.existsSync(TEST_DB_DIR)) {
    fs.rmSync(TEST_DB_DIR, { recursive: true });
  }

  const db = new WorkflowDatabase(TEST_DB_DIR);
  const binding = new WorkflowBinding(db, MyWorkflow);

  test("runs a workflow successfully", async () => {
    const instanceId = "test-instance-" + Date.now();
    const params = { name: "World" };

    const stub = await binding.create({ id: instanceId, params });

    // Wait for execution (it's async in background)
    // In our mock implementation, `runInstance` is awaited?
    // Wait, in `binding.ts`, `runInstance` is NOT awaited in `create`. It's fired and forgotten.
    // However, for testing, we might want to wait.
    // Since `runInstance` is private, we can't await it easily.
    // But we can poll status.

    let status = (await stub.status()).status;
    let attempts = 0;
    while (status !== 'complete' && status !== 'errored' && attempts < 20) {
        await new Promise(r => setTimeout(r, 200));
        status = (await stub.status()).status;
        attempts++;
    }

    expect(status).toBe('complete');

    const finalStatus = await stub.status();
    expect(finalStatus.output).toEqual({ greeting: "Hello, World", farewell: "Goodbye, World" });

    // Verify steps
    const steps = db.getSteps(instanceId);
    expect(steps.length).toBe(3); // greet, wait-a-bit, farewell

    expect(steps[0].name).toBe("greet");
    expect(steps[0].status).toBe("complete");
    expect(JSON.parse(steps[0].output!)).toBe("Hello, World");

    expect(steps[1].name).toBe("wait-a-bit");
    // sleep isn't fully recorded as a step in my simple engine impl?
    // Let's check `engine.ts`.
    // `sleep` logic: `const existingStep = this.db.getStepByName...`.
    // It CHECKS for existing step, but does it CREATE one?
    // Wait, I missed the `db.addStep` inside `sleep` in my previous `write_file`.
    // Let's check `engine.ts` content again.
  });

  afterAll(() => {
     if (fs.existsSync(TEST_DB_DIR)) {
        fs.rmSync(TEST_DB_DIR, { recursive: true });
     }
  });
});
