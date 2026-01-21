import type { WorkflowDatabase } from "./db";

export async function handleWorkflowApi(req: Request, db: WorkflowDatabase): Promise<Response | null> {
  const url = new URL(req.url);
  const path = url.pathname;

  // GET /_buncf/workflows/api/instances - List all instances
  if (path === "/_buncf/workflows/api/instances" && req.method === "GET") {
    const instances = db.getAllInstances();
    return new Response(JSON.stringify(instances), {
      headers: { "Content-Type": "application/json" }
    });
  }

  // POST /_buncf/workflows/api/instances - Create a new instance
  // This is used by the test page to create workflows dynamically
  if (path === "/_buncf/workflows/api/instances" && req.method === "POST") {
    try {
      const body = await req.json() as { workflowName?: string; params?: any };

      if (!body.workflowName) {
        return new Response(JSON.stringify({ error: "workflowName is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }

      // For manual creation, we create an instance directly in the DB
      // The actual binding-based execution happens through the workflow binding
      const instanceId = `manual-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

      db.createInstance({
        id: instanceId,
        workflowName: body.workflowName,
        status: 'queued',
        params: body.params || {},
        startTime: Date.now()
      });

      return new Response(JSON.stringify({
        success: true,
        instanceId,
        message: "Workflow instance created. Use the workflow binding to execute it.",
        hint: "For full execution, use env.MY_WORKFLOW.create() in your code."
      }), {
        status: 201,
        headers: { "Content-Type": "application/json" }
      });
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e.message || "Failed to create instance" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }

  const instanceMatch = path.match(/^\/_buncf\/workflows\/api\/instances\/([^\/]+)$/);
  if (instanceMatch) {
    const id = instanceMatch[1];
    const instance = db.getInstance(id);
    if (!instance) return new Response("Not Found", { status: 404 });
    return new Response(JSON.stringify(instance), {
      headers: { "Content-Type": "application/json" }
    });
  }

  const stepsMatch = path.match(/^\/_buncf\/workflows\/api\/instances\/([^\/]+)\/steps$/);
  if (stepsMatch) {
    const id = stepsMatch[1];
    const steps = db.getSteps(id);
    return new Response(JSON.stringify(steps), {
      headers: { "Content-Type": "application/json" }
    });
  }

  // Trigger Event
  // POST /_buncf/workflows/api/events/:instanceId/:eventName
  const eventMatch = path.match(/^\/_buncf\/workflows\/api\/events\/([^\/]+)\/([^\/]+)$/);
  if (req.method === "POST" && eventMatch) {
    const instanceId = eventMatch[1];
    const eventName = eventMatch[2];

    // Parse payload
    let payload = {};
    try {
      payload = await req.json();
    } catch (e) { }

    db.addEvent(instanceId, eventName, payload);

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" }
    });
  }

  return null;
}
