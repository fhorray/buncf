import type { WorkflowStep, WorkflowStepConfig } from "./types";
import type { WorkflowDatabase } from "./db";

export class WorkflowEngine {
  private instanceId: string;
  private db: WorkflowDatabase;

  constructor(instanceId: string, db: WorkflowDatabase) {
    this.instanceId = instanceId;
    this.db = db;
  }

  // The step object exposed to the user
  public step: WorkflowStep = {
    do: async <T>(
      name: string,
      configOrCallback: WorkflowStepConfig | (() => Promise<T> | T) | undefined | null,
      callback?: () => Promise<T> | T
    ): Promise<T> => {
      let config: WorkflowStepConfig | undefined;
      let userCallback: () => Promise<T> | T;

      if (typeof configOrCallback === 'function') {
        userCallback = configOrCallback;
        config = undefined;
      } else {
        config = configOrCallback || undefined;
        userCallback = callback!;
      }

      // Check if step already executed
      const existingStep = this.db.getStepByName(this.instanceId, name);
      if (existingStep) {
        if (existingStep.status === 'complete') {
          return existingStep.output ? JSON.parse(existingStep.output) : undefined;
        }
        if (existingStep.error) {
             throw new Error(existingStep.error);
        }
      }

      // Start new step
      const startTime = Date.now();
      try {
        this.db.addStep({
          instanceId: this.instanceId,
          name,
          type: 'step',
          status: 'running',
          startTime,
          input: undefined,
        });

        const result = await userCallback();

        this.db.updateStep(this.instanceId, name, {
          status: 'complete',
          output: JSON.stringify(result),
          endTime: Date.now()
        });

        return result;
      } catch (err: any) {
         this.db.updateStep(this.instanceId, name, {
           status: 'errored',
           error: err.message || String(err),
           endTime: Date.now()
         });
         throw err;
      }
    },

    sleep: async (name: string, duration: number | string): Promise<void> => {
        const existingStep = this.db.getStepByName(this.instanceId, name);
        if (existingStep && existingStep.status === 'complete') {
            return;
        }

        const ms = typeof duration === 'string' ? this.parseDuration(duration) : duration * 1000;

        console.log(`[Workflow] Sleeping for ${ms}ms...`);

        this.db.addStep({
          instanceId: this.instanceId,
          name,
          type: 'sleep',
          status: 'running',
          startTime: Date.now(),
          input: JSON.stringify({ duration }),
        });

        await new Promise(resolve => setTimeout(resolve, ms));

        this.db.updateStep(this.instanceId, name, {
          status: 'complete',
          endTime: Date.now()
        });
    },

    waitForEvent: async <T>(name: string, config?: { timeout?: number | string }): Promise<T> => {
        const existingStep = this.db.getStepByName(this.instanceId, name);
        if (existingStep) {
            if (existingStep.status === 'complete') {
                 return existingStep.output ? JSON.parse(existingStep.output) : undefined;
            }
        }

        console.log(`[Workflow] Waiting for event '${name}'...`);

        // Register intent to wait
        this.db.addStep({
            instanceId: this.instanceId,
            name,
            type: 'wait_for_event',
            status: 'running',
            startTime: Date.now(),
        });

        // Set instance status to 'waiting'
        this.db.updateInstanceStatus(this.instanceId, 'waiting');

        // Poll for event
        // In a real system, we'd suspend and be woken up by the event.
        // Here, we block the loop.

        // TODO: Handle timeout
        while (true) {
            const event = this.db.getEvent(this.instanceId, name);
            if (event) {
                // Event received!
                this.db.updateStep(this.instanceId, name, {
                    status: 'complete',
                    output: JSON.stringify(event.payload),
                    endTime: Date.now()
                });
                this.db.updateInstanceStatus(this.instanceId, 'running');
                return event.payload as T;
            }

            // Sleep a bit to avoid hot loop
            await new Promise(r => setTimeout(r, 500));
        }
    }
  };

  private parseDuration(d: string): number {
      if (d.endsWith('s')) return parseInt(d) * 1000;
      if (d.endsWith('m')) return parseInt(d) * 60 * 1000;
      return 1000;
  }
}
