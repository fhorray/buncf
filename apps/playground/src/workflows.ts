import { WorkflowEntrypoint, type WorkflowStep, type WorkflowEvent } from 'cloudflare:workers';

/**
 * Parâmetros de entrada do Workflow
 */
type UserSignupParams = {
  email: string;
  userId: string;
};

/**
 * Workflow de Cadastro de Usuário (Simplificado)
 * 
 * Este exemplo demonstra:
 * - step.do: Executar uma ação (com retry automático)
 * - step.sleep: Pausar a execução por um tempo
 */
export class UserSignupWorkflow extends WorkflowEntrypoint<CloudflareEnv, UserSignupParams> {
  override async run(event: WorkflowEvent<UserSignupParams>, step: WorkflowStep) {
    const { email, userId } = event.payload;

    // 1️⃣ Buscar dados do usuário
    const user = await step.do('fetch-user-data', async () => {
      console.log(`[Workflow] Buscando dados do usuário: ${userId}`);
      return {
        id: userId,
        email,
        name: 'Usuário Exemplo',
        createdAt: new Date().toISOString(),
      };
    });

    // 2️⃣ Enviar email de boas-vindas
    const emailResult = await step.do('send-welcome-email', async () => {
      console.log(`[Workflow] Enviando email de boas-vindas para: ${user.email}`);
      return { sent: true, to: user.email };
    });

    // 3️⃣ Aguardar 5 segundos
    await step.sleep('wait-before-finalize', '5 seconds');

    // 4️⃣ Finalizar
    const finalResult = await step.do('finalize-signup', async () => {
      console.log(`[Workflow] Finalizando cadastro de ${user.name}`);
      return {
        success: true,
        userId: user.id,
        email: user.email,
        emailSent: emailResult.sent,
        completedAt: new Date().toISOString(),
      };
    });

    return finalResult;
  }
}