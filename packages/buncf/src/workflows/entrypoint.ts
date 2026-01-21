import type { WorkflowStep, WorkflowEvent } from "./types";

export abstract class WorkflowEntrypoint<Env = unknown, Params = unknown> {
  public ctx: any;
  public env: Env;

  constructor(ctx: any, env: Env) {
    this.ctx = ctx;
    this.env = env;
  }

  // Cloudflare implementation structure
  // The user implements run()
  abstract run(event: WorkflowEvent<Params>, step: WorkflowStep): Promise<unknown>;
}
