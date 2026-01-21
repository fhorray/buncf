# 🚀 Exemplo de Workflow no Playground

Este guia mostra como usar o sistema de Workflows do BunCF no Playground.

## 📁 Estrutura

```
apps/playground/src/
├── workflows.ts          # Definição do workflow
├── index.ts              # Entrypoint (exporta o workflow)
├── api/
│   └── workflow/
│       └── start.ts      # API para iniciar o workflow
└── ...
```

## 🔧 Configuração

O workflow já está configurado no `wrangler.jsonc`:

```jsonc
{
  "workflows": [
    {
      "name": "user-signup",
      "binding": "MY_WORKFLOW",
      "class_name": "UserSignupWorkflow",
    },
  ],
}
```

## 🎯 Como Usar

### 1. Iniciar o Servidor

```bash
bun dev
```

### 2. Iniciar um Workflow via API

```bash
curl -X POST http://localhost:3000/api/workflow/start \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "userId": "12345"}'
```

Resposta esperada:

```json
{
  "success": true,
  "instanceId": "signup-12345-1234567890",
  "message": "Workflow iniciado com sucesso!",
  "dashboardUrl": "/_buncf/workflows"
}
```

### 3. Acompanhar no Dashboard

Acesse: [http://localhost:3000/\_buncf/workflows](http://localhost:3000/_buncf/workflows)

No dashboard você pode:

- Ver o status da instância (Running, Sleeping, Waiting, Complete)
- Inspecionar os passos executados
- Enviar eventos quando o workflow estiver aguardando

### 4. Enviar Evento de Confirmação

Quando o workflow atingir o passo `waitForEvent('email-confirmed')`, ele ficará no status **waiting**.

No Dashboard:

1. Clique na instância
2. No formulário "Send Event":
   - **Event Name:** `email-confirmed`
   - **Payload:** `{"confirmed": true, "code": "ABC123"}`
3. Clique em **Send**

O workflow continuará a execução automaticamente!

## 📊 Passos do Workflow

| Passo                     | Tipo                | Descrição                   |
| ------------------------- | ------------------- | --------------------------- |
| `fetch-user-data`         | `step.do`           | Busca dados do usuário      |
| `send-welcome-email`      | `step.do`           | Envia email de boas-vindas  |
| `wait-for-email-delivery` | `step.sleep`        | Aguarda 10 segundos         |
| `email-confirmed`         | `step.waitForEvent` | Aguarda confirmação externa |
| `process-confirmation`    | `step.do`           | Processa a confirmação      |
| `finalize`                | `step.do`           | Finaliza o cadastro         |

## 🔍 Dicas

- **Idempotência:** Cada `step.do` é executado apenas uma vez, mesmo se o workflow reiniciar.
- **Persistência:** O estado é salvo em `.wrangler/state/v3/workflows`.
- **Timeout:** O `waitForEvent` tem timeout de 1 hora por padrão.
