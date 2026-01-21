
import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from "../src/workflows/module";

type Params = {
  name: string;
};

export class EventWorkflow extends WorkflowEntrypoint<unknown, Params> {
  async run(event: WorkflowEvent<Params>, step: WorkflowStep) {
    const greeting = await step.do("greet", async () => {
        return `Hello, ${event.payload.name}`;
    });

    // Wait for an external signal
    const signal = await step.waitForEvent<{ message: string }>("my-signal");

    const farewell = await step.do("farewell", async () => {
        return `Goodbye, ${event.payload.name}. Message: ${signal.message}`;
    });

    return { greeting, farewell };
  }
}
