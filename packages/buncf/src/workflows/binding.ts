import { WorkflowEngine } from "./engine";
import type { WorkflowDatabase } from "./db";
import type { WorkflowInstance, WorkflowStatus } from "./types";

export class WorkflowStub {
  private id: string;
  private db: WorkflowDatabase;

  constructor(id: string, db: WorkflowDatabase) {
    this.id = id;
    this.db = db;
  }

  async status() {
    const instance = this.db.getInstance(this.id);
    if (!instance) {
       // Cloudflare throws or returns unknown?
       throw new Error(`Workflow instance ${this.id} not found`);
    }
    return {
      status: instance.status,
      output: instance.output,
      error: instance.error
    };
  }

  async terminate() {
      this.db.updateInstanceStatus(this.id, 'terminated');
  }

  async pause() {
      this.db.updateInstanceStatus(this.id, 'paused');
  }

  async resume() {
     // This would require waking up the engine if it was suspended.
     // For local dev, if we just killed the process, resume might just mean updating status.
     this.db.updateInstanceStatus(this.id, 'running');
  }
}

export class WorkflowBinding {
  private db: WorkflowDatabase;
  private workflowClass: any; // The user's class
  private env: any; // The global environment to pass to the workflow

  constructor(db: WorkflowDatabase, workflowClass: any, env: any = {}) {
    this.db = db;
    this.workflowClass = workflowClass;
    this.env = env;
  }

  async create(params: any = {}) {
    const id = params.id || crypto.randomUUID();
    const instanceId = id; // use provided ID or generated

    // Check if exists? Cloudflare allows upsert-like behavior if ID provided?
    // "If an ID is provided and an instance with that ID already exists and is running, the create request will fail."

    const existing = this.db.getInstance(instanceId);
    if (existing && (existing.status === 'running' || existing.status === 'paused')) {
        throw new Error(`Workflow instance ${instanceId} is already running`);
    }

    const instance: WorkflowInstance = {
      id: instanceId,
      workflowName: this.workflowClass.name || 'Workflow',
      status: 'queued',
      params: params.params,
      startTime: Date.now()
    };

    this.db.createInstance(instance);

    // Run the workflow in background (async)
    // We need to instantiate the user's class and call run()
    this.runInstance(instanceId, params.params);

    return new WorkflowStub(instanceId, this.db);
  }

  async get(id: string) {
    const instance = this.db.getInstance(id);
    if (!instance) {
        // Cloudflare behavior: returns stub anyway? or null?
        // Docs say: "Returns a handle to an existing instance."
        // If it doesn't exist, status() might fail later.
    }
    return new WorkflowStub(id, this.db);
  }

  private async runInstance(instanceId: string, params: any) {
    // This is the "Engine" execution loop trigger
    const engine = new WorkflowEngine(instanceId, this.db);

    // Update status to running
    this.db.updateInstanceStatus(instanceId, 'running');

    try {
      // Pass ctx (mocked) and env
      const ctx = {
          waitUntil: (promise: Promise<any>) => { /* mock */ },
          passThroughOnException: () => { /* mock */ }
      };
      const workflow = new this.workflowClass(ctx, this.env);

      // We expect the user class to extend WorkflowEntrypoint
      // which has a `run(event, step)` method.

      const event = {
         payload: params,
         timestamp: new Date()
      };

      const result = await workflow.run(event, engine.step);

      this.db.updateInstanceStatus(instanceId, 'complete', result);
    } catch (err: any) {
      console.error(`Workflow ${instanceId} failed:`, err);
      this.db.updateInstanceStatus(instanceId, 'errored', undefined, err.message || String(err));
    }
  }
}
