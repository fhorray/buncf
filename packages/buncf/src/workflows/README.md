# ⚡ Cloudflare Workflows no BunCF

Os Workflows do Cloudflare permitem que você execute processos de longa duração com persistência automática, retentativas e gerenciamento de estado. O **BunCF** traz essa experiência para o ambiente local, permitindo que você desenvolva e teste workflows complexos rapidamente.

## 🚀 Guia Rápido

### 1. Criar a Classe do Workflow

Defina a lógica do seu workflow em um arquivo dedicado (ex: `src/workflows.ts`). Você deve estender `WorkflowEntrypoint` e implementar o método `run`.

```typescript
// src/workflows.ts
import {
  WorkflowEntrypoint,
  type WorkflowStep,
  type WorkflowEvent,
} from 'cloudflare:workers';

type Params = {
  email: string;
  userId: string;
};

export class UserSignupWorkflow extends WorkflowEntrypoint<
  CloudflareEnv,
  Params
> {
  override async run(event: WorkflowEvent<Params>, step: WorkflowStep) {
    // 1️⃣ Executar uma ação isolada (com retentativa automática)
    const user = await step.do('get-user', async () => {
      console.log(`Processando usuário: ${event.payload.userId}`);
      return { id: event.payload.userId, name: 'Usuário Teste' };
    });

    // 2️⃣ Pausar a execução por um tempo determinado
    await step.sleep('wait-for-email', '5 seconds');

    // 3️⃣ Esperar por um evento externo (ex: confirmação de e-mail)
    // O workflow aguardará no status 'waiting' até o evento ser disparado via API ou Dashboard
    const confirmacao = await step.waitForEvent<{ code: string }>(
      'email-confirmed',
    );

    // 4️⃣ Finalizar o processo
    await step.do('finalize', async () => {
      console.log(`Código recebido: ${confirmacao.code}`);
      return 'Cadastro concluído!';
    });
  }
}
```

### 2. Registrar no Wrangler

O BunCF lê a configuração de workflows do seu `wrangler.toml` (ou `wrangler.jsonc`) para injetar os bindings automaticamente.

```toml
[[workflows]]
name = "user-signup"
binding = "MY_WORKFLOW"
class_name = "UserSignupWorkflow"
```

### 3. Exportar no Entrypoint

Para que o BunCF consiga instanciar sua classe, exporte-a no seu entrypoint principal (`src/index.ts`).

```typescript
export { UserSignupWorkflow } from './workflows';
```

---

## 🛠️ Como disparar e gerenciar

### Iniciar uma Instância

Use o binding injetado para criar novas execuções a partir das suas rotas de API:

```typescript
// src/api/signup.ts
export default async function handler(req, { env }) {
  const instance = await env.MY_WORKFLOW.create({
    id: `signup-${Date.now()}`,
    params: { email: 'user@example.com', userId: '123' },
  });

  return Response.json({ id: instance.id, status: 'started' });
}
```

### 📊 Dashboard Visual

O BunCF inclui um painel administrativo poderoso para depurar seus workflows.

1. Rode o projeto: `bun buncf dev`
2. Acesse: `http://localhost:3000/_buncf/workflows`

No painel você pode:

- **Monitorar:** Ver a lista de instâncias e seus status (`Running`, `Sleeping`, `Waiting`, `Complete`).
- **Inspecionar:** Clicar em uma instância para ver o histórico detalhado de cada passo (`Input`/`Output`).
- **Interagir:** Enviar eventos manuais para instâncias que estão aguardando (`waitForEvent`).

---

## 💡 Dicas e Melhores Práticas

- **Idempotência:** O método `run` pode ser re-executado em caso de falhas. Use `step.do` para envolver efeitos colaterais (chamadas de API, DB) para que o resultado seja persistido e não repetido desnecessariamente.
- **Tipagem:** Utilize `CloudflareEnv` como o primeiro parâmetro genérico de `WorkflowEntrypoint` para ter acesso aos seus bindings dentro do workflow.
- **Persistência Local:** Durante o desenvolvimento, o BunCF salva o estado em `.wrangler/state/v3/workflows`. Se precisar "limpar" tudo, basta remover este diretório.
