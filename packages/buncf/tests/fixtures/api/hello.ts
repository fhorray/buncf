export const GET = () => Response.json({ message: "Hello from API" });

export const POST = async (req: Request) => {
  const body = await req.json();
  return Response.json({ received: body });
};
