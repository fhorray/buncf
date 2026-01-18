export default async function handler(req: Request) {
  const url = new URL(req.url);

  if (req.method === "POST") {
    // Simulate some work
    await new Promise(r => setTimeout(r, 500));
    return Response.json({
      success: true,
      message: "Resource updated successfully at " + new Date().toISOString()
    });
  }

  // GET: Return current server time
  return Response.json({
    timestamp: Date.now(),
    iso: new Date().toISOString(),
    id: crypto.randomUUID().slice(0, 8)
  });
}
