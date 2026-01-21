/**
 * API para executar o Workflow via Binding
 * 
 * POST /api/start-workflow
 * Body: { "email": "...", "userId": "..." }
 */
import { getCloudflareContext } from 'buncf';

export async function POST(req: Request): Promise<Response> {
  try {
    const body = await req.json() as { email?: string; userId?: string };

    if (!body.email || !body.userId) {
      return Response.json(
        { error: 'Missing required fields: email, userId' },
        { status: 400 }
      );
    }

    const { env } = getCloudflareContext();
    const workflow = (env as any).MY_WORKFLOW;

    if (!workflow) {
      return Response.json(
        { error: 'Workflow binding not found. Make sure MY_WORKFLOW is configured in wrangler.jsonc' },
        { status: 500 }
      );
    }

    const instanceId = `signup-${body.userId}-${Date.now()}`;
    const instance = await workflow.create({
      id: instanceId,
      params: {
        email: body.email,
        userId: body.userId,
      },
    });

    return Response.json({
      success: true,
      instanceId: instance.id,
      message: 'Workflow iniciado e em execução!',
    });

  } catch (error: any) {
    console.error('[API] Erro ao iniciar workflow:', error);
    return Response.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
