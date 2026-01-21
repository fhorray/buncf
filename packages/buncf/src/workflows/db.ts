import { Database } from "bun:sqlite";
import type { WorkflowInstance, WorkflowStepRecord, WorkflowStatus } from "./types";
import { join } from "path";
import { existsSync, mkdirSync } from "fs";

export class WorkflowDatabase {
  private db: Database;

  constructor(storagePath: string = ".wrangler/state/v3/workflows") {
    // Ensure directory exists
    if (!existsSync(storagePath)) {
      mkdirSync(storagePath, { recursive: true });
    }

    this.db = new Database(join(storagePath, "db.sqlite"));
    this.init();
  }

  private init() {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS instances (
        id TEXT PRIMARY KEY,
        workflow_name TEXT NOT NULL,
        status TEXT NOT NULL,
        params TEXT,
        start_time INTEGER NOT NULL,
        end_time INTEGER,
        error TEXT,
        output TEXT
      )
    `);

    this.db.run(`
      CREATE TABLE IF NOT EXISTS steps (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        instance_id TEXT NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        status TEXT NOT NULL,
        input TEXT,
        output TEXT,
        start_time INTEGER NOT NULL,
        end_time INTEGER,
        error TEXT,
        FOREIGN KEY(instance_id) REFERENCES instances(id)
      )
    `);

    this.db.run(`
      CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        instance_id TEXT NOT NULL,
        name TEXT NOT NULL,
        payload TEXT,
        received_at INTEGER NOT NULL,
        FOREIGN KEY(instance_id) REFERENCES instances(id)
      )
    `);
  }

  createInstance(instance: WorkflowInstance) {
    this.db.run(
      `INSERT INTO instances (id, workflow_name, status, params, start_time)
       VALUES (?, ?, ?, ?, ?)`,
      [
        instance.id,
        instance.workflowName,
        instance.status,
        JSON.stringify(instance.params),
        instance.startTime
      ]
    );
  }

  updateInstanceStatus(id: string, status: WorkflowStatus, output?: unknown, error?: string) {
    const now = Date.now();
    let query = `UPDATE instances SET status = ?`;
    const params: any[] = [status];

    if (output !== undefined) {
      query += `, output = ?, end_time = ?`;
      params.push(JSON.stringify(output), now);
    }

    if (error !== undefined) {
      query += `, error = ?, end_time = ?`;
      params.push(error, now);
    } else if (status === 'complete' || status === 'terminated' || status === 'errored') {
       // ensure end_time is set if we are reaching a terminal state without explicit output/error update
       if (!query.includes('end_time')) {
         query += `, end_time = ?`;
         params.push(now);
       }
    }

    query += ` WHERE id = ?`;
    params.push(id);

    this.db.run(query, params);
  }

  getInstance(id: string): WorkflowInstance | null {
    const row = this.db.query("SELECT * FROM instances WHERE id = ?").get(id) as any;
    if (!row) return null;

    return {
      id: row.id,
      workflowName: row.workflow_name,
      status: row.status as WorkflowStatus,
      params: row.params ? JSON.parse(row.params) : undefined,
      startTime: row.start_time,
      endTime: row.end_time,
      error: row.error,
      output: row.output ? JSON.parse(row.output) : undefined
    };
  }

  getAllInstances(): WorkflowInstance[] {
    const rows = this.db.query("SELECT * FROM instances ORDER BY start_time DESC").all() as any[];
    return rows.map(row => ({
      id: row.id,
      workflowName: row.workflow_name,
      status: row.status as WorkflowStatus,
      params: row.params ? JSON.parse(row.params) : undefined,
      startTime: row.start_time,
      endTime: row.end_time,
      error: row.error,
      output: row.output ? JSON.parse(row.output) : undefined
    }));
  }

  addStep(step: Omit<WorkflowStepRecord, "id">): void {
    this.db.run(
      `INSERT INTO steps (instance_id, name, type, status, input, output, start_time, end_time, error)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        step.instanceId,
        step.name,
        step.type,
        step.status,
        step.input, // Already stringified
        step.output, // Already stringified
        step.startTime,
        step.endTime,
        step.error
      ]
    );
  }

  getSteps(instanceId: string): WorkflowStepRecord[] {
    const rows = this.db.query("SELECT * FROM steps WHERE instance_id = ? ORDER BY start_time ASC").all(instanceId) as any[];
    return rows.map(row => ({
      id: row.id.toString(),
      instanceId: row.instance_id,
      name: row.name,
      type: row.type,
      status: row.status,
      input: row.input,
      output: row.output,
      startTime: row.start_time,
      endTime: row.end_time,
      error: row.error
    }));
  }

  getStepByName(instanceId: string, name: string): WorkflowStepRecord | null {
      const row = this.db.query("SELECT * FROM steps WHERE instance_id = ? AND name = ?").get(instanceId, name) as any;
      if (!row) return null;
       return {
          id: row.id.toString(),
          instanceId: row.instance_id,
          name: row.name,
          type: row.type,
          status: row.status,
          input: row.input,
          output: row.output,
          startTime: row.start_time,
          endTime: row.end_time,
          error: row.error
        };
  }

  updateStep(instanceId: string, name: string, updates: Partial<WorkflowStepRecord>) {
    const sets: string[] = [];
    const params: any[] = [];

    if (updates.status) {
      sets.push("status = ?");
      params.push(updates.status);
    }
    if (updates.output) {
      sets.push("output = ?");
      params.push(updates.output);
    }
    if (updates.endTime) {
      sets.push("end_time = ?");
      params.push(updates.endTime);
    }
    if (updates.error) {
      sets.push("error = ?");
      params.push(updates.error);
    }

    if (sets.length === 0) return;

    const query = `UPDATE steps SET ${sets.join(", ")} WHERE instance_id = ? AND name = ?`;
    params.push(instanceId, name);
    this.db.run(query, params);
  }

  addEvent(instanceId: string, name: string, payload: unknown) {
    this.db.run(
      `INSERT INTO events (instance_id, name, payload, received_at)
       VALUES (?, ?, ?, ?)`,
      [instanceId, name, JSON.stringify(payload), Date.now()]
    );
  }

  getEvent(instanceId: string, name: string): { payload: unknown } | null {
    const row = this.db.query("SELECT * FROM events WHERE instance_id = ? AND name = ?").get(instanceId, name) as any;
    if (!row) return null;
    return {
      payload: JSON.parse(row.payload)
    };
  }
}
