import { expect, test, describe, afterAll } from "bun:test";
import { WorkflowDatabase } from "../src/workflows/db";
import { WorkflowBinding } from "../src/workflows/binding";
import { EventWorkflow } from "./workflow-event-demo";
import * as fs from "fs";

const TEST_DB_DIR = ".test-workflows-events-db";

describe("Workflow Engine Events", () => {
  // Clean up before and after
  if (fs.existsSync(TEST_DB_DIR)) {
    fs.rmSync(TEST_DB_DIR, { recursive: true });
  }

  const db = new WorkflowDatabase(TEST_DB_DIR);
  const binding = new WorkflowBinding(db, EventWorkflow);

  test("pauses for event and resumes", async () => {
    const instanceId = "test-event-instance-" + Date.now();
    const params = { name: "EventWorld" };

    const stub = await binding.create({ id: instanceId, params });

    // Wait until it reaches 'waiting' state
    let status = (await stub.status()).status;
    let attempts = 0;
    while (status !== 'waiting' && status !== 'errored' && attempts < 20) {
        await new Promise(r => setTimeout(r, 200));
        status = (await stub.status()).status;
        attempts++;
    }

    expect(status).toBe('waiting');

    // Trigger event
    db.addEvent(instanceId, "my-signal", { message: "Proceed!" });

    // Wait for completion
    attempts = 0;
    while (status !== 'complete' && status !== 'errored' && attempts < 20) {
        await new Promise(r => setTimeout(r, 200));
        status = (await stub.status()).status;
        attempts++;
    }

    expect(status).toBe('complete');

    const finalStatus = await stub.status();
    expect(finalStatus.output).toEqual({
        greeting: "Hello, EventWorld",
        farewell: "Goodbye, EventWorld. Message: Proceed!"
    });

    // Verify steps
    const steps = db.getSteps(instanceId);
    expect(steps.length).toBe(3); // greet, my-signal (wait), farewell

    expect(steps[1].name).toBe("my-signal");
    expect(steps[1].type).toBe("wait_for_event");
    expect(steps[1].status).toBe("complete");
    expect(JSON.parse(steps[1].output!)).toEqual({ message: "Proceed!" });
  });

  afterAll(() => {
     if (fs.existsSync(TEST_DB_DIR)) {
        fs.rmSync(TEST_DB_DIR, { recursive: true });
     }
  });
});
