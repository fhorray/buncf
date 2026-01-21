import type { WorkflowDatabase } from "./db";

export async function handleWorkflowApi(req: Request, db: WorkflowDatabase): Promise<Response | null> {
  const url = new URL(req.url);
  const path = url.pathname;

  if (path === "/_buncf/workflows/api/instances") {
    const instances = db.getAllInstances();
    return new Response(JSON.stringify(instances), {
      headers: { "Content-Type": "application/json" }
    });
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
      } catch (e) {}

      db.addEvent(instanceId, eventName, payload);

      return new Response(JSON.stringify({ success: true }), {
          headers: { "Content-Type": "application/json" }
      });
  }

  return null;
}
