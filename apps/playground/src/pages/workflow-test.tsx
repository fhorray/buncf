import { useState } from 'react';

export default function WorkflowTestPage() {
  const [email, setEmail] = useState('user@example.com');
  const [userId, setUserId] = useState('12345');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const startWorkflow = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Use a API que executa o workflow via binding
      const res = await fetch('/api/start-workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, userId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to start workflow');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '2rem',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: '600px',
          margin: '0 auto',
          background: 'white',
          borderRadius: '16px',
          padding: '2rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}
      >
        <h1
          style={{
            fontSize: '1.875rem',
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '0.5rem',
          }}
        >
          ⚡ Workflow Tester
        </h1>
        <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
          Teste o UserSignupWorkflow diretamente desta página
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '0.5rem',
              }}
            >
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '1rem',
                transition: 'border-color 0.2s',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '0.5rem',
              }}
            >
              User ID
            </label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="12345"
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '1rem',
                transition: 'border-color 0.2s',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <button
            onClick={startWorkflow}
            disabled={loading || !email || !userId}
            style={{
              marginTop: '1rem',
              padding: '0.875rem 1.5rem',
              background: loading
                ? '#9ca3af'
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              boxShadow: '0 4px 14px 0 rgba(118, 75, 162, 0.39)',
            }}
          >
            {loading ? '⏳ Iniciando...' : '🚀 Iniciar Workflow'}
          </button>
        </div>

        {error && (
          <div
            style={{
              marginTop: '1.5rem',
              padding: '1rem',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              color: '#dc2626',
            }}
          >
            <strong>Erro:</strong> {error}
          </div>
        )}

        {result && (
          <div
            style={{
              marginTop: '1.5rem',
              padding: '1rem',
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '8px',
              color: '#166534',
            }}
          >
            <strong>✅ Workflow iniciado!</strong>
            <pre
              style={{
                marginTop: '0.5rem',
                fontSize: '0.875rem',
                overflow: 'auto',
                background: '#dcfce7',
                padding: '0.5rem',
                borderRadius: '4px',
              }}
            >
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        <div
          style={{
            marginTop: '2rem',
            padding: '1rem',
            background: '#f3f4f6',
            borderRadius: '8px',
            fontSize: '0.875rem',
            color: '#6b7280',
          }}
        >
          <strong>💡 Dica:</strong> Após iniciar o workflow, acesse o{' '}
          <a
            href="/_buncf/workflows"
            target="_blank"
            style={{ color: '#667eea', textDecoration: 'underline' }}
          >
            Dashboard de Workflows
          </a>{' '}
          para acompanhar a execução e enviar eventos.
        </div>
      </div>
    </div>
  );
}
