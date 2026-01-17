# Integração Hono com Buncf

O buncf suporta uma integração híbrida poderosa com o [Hono](https://hono.dev/), permitindo que você utilize a excelente Developer Experience (DX) do Hono para suas APIs, enquanto aproveita a performance do Roteador Nativo do Bun e o sistema de arquivos do buncf.

## 🚀 Como Funciona

Em vez de configurar o servidor manualmente, você utiliza o sistema de rotas do buncf para carregar o Hono. O `createApp().routes` do buncf converte automaticamente rotas "Catch-All" (ex: `[...route].ts`) para o formato Wildcard do Bun (`*`), permitindo que o Hono assuma o controle de caminhos específicos.

### Estrutura Recomendada (Catch-All)

A maneira mais limpa de integrar é criar um arquivo "Catch-All" na sua pasta de API.

**Arquivo:** `src/api/[...route].ts`

```typescript
import { Hono } from 'hono';

// Inicialize o Hono (defina o basePath se estiver dentro de /api)
const app = new Hono().basePath('/api');

// Defina suas rotas Hono
app.get('/hello', (c) => {
  return c.json({
    message: 'Olá do Hono rodando dentro do Buncf!',
    path: c.req.path
  });
});

app.get('/users/:id', (c) => {
  return c.json({ userId: c.req.param('id') });
});

// Exporte o fetch do Hono
// O Buncf conecta isso automaticamente ao servidor Bun
export default app.fetch;
```

### Prioridade de Rotas

O sistema híbrido respeita a hierarquia de arquivos:

1.  **Arquivos Específicos:** `src/api/users.ts` (Tem prioridade máxima)
2.  **Catch-All (Hono):** `src/api/[...route].ts` (Captura o que não foi atendido acima)

Isso permite que você migre gradualmente ou use Hono apenas para sub-seções complexas da sua API.

## 🛠️ Instalação Manual

Se você não usou o template Hono no `buncf init`, basta instalar o pacote:

```bash
bun add hono
```

E criar o arquivo `src/api/[...route].ts` conforme o exemplo acima.

## ⚡ Performance

Esta integração utiliza o `Bun.serve({ routes })` nativo. Isso significa que o roteamento inicial (descobrir qual arquivo chamar) é feito em código nativo C++ de altíssima performance (Zig/C++ do Bun), e apenas a execução da lógica da rota é passada para o JavaScript do Hono.
