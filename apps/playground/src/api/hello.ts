/**
 * Example API Route: Hello World
 * URL: /api/hello
 */

export function GET(req: Request) {
  return Response.json({
    message: "Hello from buncf API!",
    timestamp: new Date().toISOString()
  });
}

export function POST(req: Request) {
  return Response.json({
    message: "POST request received!",
    method: "POST"
  });
}
