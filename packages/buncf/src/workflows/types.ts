
export type WorkflowStatus = 'queued' | 'running' | 'paused' | 'errored' | 'terminated' | 'complete' | 'waiting' | 'sleeping';

export interface WorkflowInstance {
  id: string;
  workflowName: string;
  status: WorkflowStatus;
  params: unknown;
  startTime: number;
  endTime?: number;
  error?: string;
  output?: unknown;
}

export interface WorkflowStepRecord {
  id: string; // usually auto-increment or uuid
  instanceId: string;
  name: string;
  type: 'step' | 'sleep' | 'wait_for_event';
  status: 'pending' | 'running' | 'complete' | 'errored';
  input?: string; // JSON string
  output?: string; // JSON string
  startTime: number;
  endTime?: number;
  error?: string;
}

// Public Interface (matching Cloudflare types roughly)

export interface WorkflowStepConfig {
  retries?: {
    limit: number;
    delay: number | string;
    backoff?: "constant" | "linear" | "exponential";
  };
  timeout?: number | string;
}

export interface WorkflowStep {
  do: <T>(name: string, config: WorkflowStepConfig | undefined | null, callback: () => Promise<T> | T) => Promise<T>;
  // overload for when config is omitted
  do: <T>(name: string, callback: () => Promise<T> | T) => Promise<T>;
  sleep: (name: string, duration: number | string) => Promise<void>;
  waitForEvent: <T = unknown>(name: string, config?: { timeout?: number | string }) => Promise<T>;
}

export interface WorkflowEvent<T = unknown> {
  payload: T;
  timestamp: Date;
}
