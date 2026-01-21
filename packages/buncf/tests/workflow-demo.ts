
import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from "../src/workflows/module";

type Params = {
  name: string;
};

export class MyWorkflow extends WorkflowEntrypoint<unknown, Params> {
  async run(event: WorkflowEvent<Params>, step: WorkflowStep) {
    const greeting = await step.do("greet", async () => {
        console.log("Step 1 running");
        return `Hello, ${event.payload.name}`;
    });

    await step.sleep("wait-a-bit", 1); // 1 second

    const farewell = await step.do("farewell", async () => {
        console.log("Step 2 running");
        return `Goodbye, ${event.payload.name}`;
    });

    return { greeting, farewell };
  }
}
