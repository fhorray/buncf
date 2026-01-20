export const errorTemplateFn = `
  function getErrorHtml(title, message, stack) {
    // Parse stack for file link logic (runs on server to render initial HTML)
    let fileLink = '';

    // Attempt cleanup of stack to find user file
    // Format: at Function (<path>:<line>:<col>)
    if (stack) {
       // Search for strict file paths (e.g. C:/ or /User) avoiding internal/node_modules if possible
       const lines = stack.split('\\n');
       for (const line of lines) {
          // crude match for file path with line/col
          const match = line.match(/\\((?:[A-Z]:\\\\|\\/)([^:]+):(\\d+):(\\d+)\\)/) ||
                        line.match(/at (?:[A-Z]:\\\\|\\/)([^:]+):(\\d+):(\\d+)/);

          if (match) {
             const [_, file, line, col] = match;
             if (!file.includes('node_modules') && !file.includes('buncf/src')) {
                // If we found a likely user file
                const vscodeUrl = "vscode://file/" + file + ":" + line + ":" + col;
                // Add button html
                fileLink = '<a href="' + vscodeUrl + '" class="btn open-btn">📝 Open in Editor</a>';
                break;
             }
          }
       }
    }

    return \`<!DOCTYPE html>
    <html>
      <head>
        <title>\${title}</title>
        <style>
          body { background: #0d1117; color: #e6edf3; font-family: system-ui, -apple-system, sans-serif; padding: 0; margin: 0; height: 100vh; display: flex; align-items: center; justify-content: center; }
          .backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(4px); z-index: 9999; }
          .error-box { position: relative; width: 90%; max-width: 900px; max-height: 90vh; background: #161b22; border: 1px solid #30363d; border-radius: 12px; box-shadow: 0 24px 48px rgba(0,0,0,0.5); display: flex; flex-direction: column; overflow: hidden; animation: slideIn 0.3s ease-out; z-index: 10000; }
          .header { background: #21262d; padding: 1rem 1.5rem; border-bottom: 1px solid #30363d; display: flex; justify-content: space-between; align-items: start; }
          .title-area h1 { color: #ff7b72; font-size: 1.1rem; margin: 0; font-weight: 600; display: flex; align-items: center; gap: 0.75rem; }
          .title-area .badge { background: #7f1d1d; color: #fca5a5; font-size: 0.7rem; padding: 0.1rem 0.4rem; border-radius: 4px; border: 1px solid #ef4444; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
          .content { padding: 1.5rem; overflow-y: auto; }
          .message { font-size: 1.25rem; font-weight: 500; line-height: 1.5; color: #e6edf3; margin-bottom: 1.5rem; white-space: pre-wrap; word-break: break-word; }
          .stack-frame { background: #0d1117; padding: 1rem; border-radius: 8px; overflow-x: auto; border: 1px solid #30363d; font-family: 'JetBrains Mono', 'Fira Code', monospace; font-size: 0.85rem; color: #d2a8ff; line-height: 1.6; }
          .actions { padding: 1rem 1.5rem; border-top: 1px solid #30363d; background: #21262d; display: flex; justify-content: flex-end; gap: 0.75rem; }
          .btn { appearance: none; background: transparent; border: 1px solid #30363d; color: #c9d1d9; padding: 0.4rem 0.8rem; border-radius: 6px; font-size: 0.85rem; cursor: pointer; transition: all 0.2s; display: inline-flex; align-items: center; gap: 0.4rem; font-weight: 500; text-decoration: none; }
          .btn:hover { background: #30363d; color: #fff; }
          .open-btn { background: #1f6feb; border-color: #1f6feb; color: #fff; }
          .open-btn:hover { background: #388bfd; border-color: #388bfd; }
          @keyframes slideIn { from { opacity: 0; transform: translateY(10px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        </style>
      </head>
      <body>
        <div class="backdrop"></div>
        <div class="error-box">
          <div class="header">
            <div class="title-area">
              <h1><span class="badge">Error</span> \${title}</h1>
            </div>
          </div>
          <div class="content">
            <div class="message">\${message}</div>
            \${stack ? '<div class="stack-frame">' + stack + '</div>' : ''}
          </div>
          <div class="actions">
            \${fileLink}
            <button class="btn" style="opacity: 0.7; cursor: not-allowed">Live Reload Active</button>
          </div>
        </div>
        <script>
        (function() {
            const protocol = location.protocol === "https:" ? "wss:" : "ws:";
            const url = protocol + "//" + location.host + "/_buncf_livereload";
            function connect() {
                const ws = new WebSocket(url);
                ws.onclose = () => { setTimeout(connect, 1000); };
                ws.onmessage = (e) => { if (e.data === "reload") location.reload(); };
            }
            connect();
        })();
        </script>
      </body>
    </html>\`;
  }
  `;

export const clientErrorScriptCode = `
<script>
(function() {
    // 1. Live Reload
    const protocol = location.protocol === "https:" ? "wss:" : "ws:";
    const url = protocol + "//" + location.host + "/_buncf_livereload";
    function connect() {
        const ws = new WebSocket(url);
        ws.onclose = () => { setTimeout(connect, 1000); };
        ws.onmessage = (e) => {
             if (e.data === "reload") location.reload();
        };
    }
    connect();

    // 2. Client Side Error Overlay
    function showError(title, message, stack) {
        if (document.getElementById('buncf-error-overlay')) return;

        let fileUrl = null;
        if (stack) {
            // Match (at http://localhost:3000/src/pages/index.tsx:10:5)
            const match = stack.match(/((?:http:\\/\\/|\\/)[^:]+):(\\d+):(\\d+)/);
            if (match) {
                let path = match[1];
                try {
                    const u = new URL(path);
                    path = u.pathname;
                } catch(e) {}

                if (path.match(/\\.(tsx|ts|jsx|js)$/)) {
                     // We store params to call server opener
                     fileUrl = { path, line: match[2], col: match[3] };
                }
            }
        }

        const overlay = document.createElement('div');
        overlay.id = 'buncf-error-overlay';
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);backdrop-filter:blur(4px);z-index:99999;display:flex;align-items:center;justify-content:center;font-family:system-ui,-apple-system,sans-serif;animation:buncfSlideIn 0.2s ease-out;';

        let fileBtnHtml = '';
        if (fileUrl) {
            fileBtnHtml = '<button id="buncf-open-btn" style="background:#1f6feb;border:1px solid #1f6feb;color:#fff;padding:0.4rem 0.8rem;border-radius:6px;font-size:0.85rem;cursor:pointer;font-weight:500;display:flex;align-items:center;gap:0.4rem;">📝 Open in Editor</button>';
        }

        const cardHtml = \`
           <div style="position:relative;width:90%;max-width:900px;max-height:90vh;background:#161b22;border:1px solid #30363d;border-radius:12px;box-shadow:0 24px 48px rgba(0,0,0,0.5);display:flex;flex-direction:column;overflow:hidden;color:#e6edf3;">
             <div style="background:#21262d;padding:1rem 1.5rem;border-bottom:1px solid #30363d;display:flex;justify-content:space-between;align-items:start;">
                <h1 style="color:#ff7b72;font-size:1.1rem;margin:0;font-weight:600;display:flex;align-items:center;gap:0.75rem;">
                  <span style="background:#7f1d1d;color:#fca5a5;font-size:0.7rem;padding:0.1rem 0.4rem;border-radius:4px;border:1px solid #ef4444;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Runtime Error</span>
                  \${title}
                </h1>
                <button id="buncf-close-btn" style="background:transparent;border:none;color:#8b949e;cursor:pointer;padding:4px;border-radius:4px;display:flex;">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
             </div>
             <div style="padding:1.5rem;overflow-y:auto;">
               <div style="font-size:1.25rem;font-weight:500;line-height:1.5;color:#e6edf3;margin-bottom:1.5rem;white-space:pre-wrap;word-break:break-word;">\${message}</div>
               \${stack ? '<div style="background:#0d1117;padding:1rem;border-radius:8px;overflow-x:auto;border:1px solid #30363d;font-family:monospace;font-size:0.85rem;color:#d2a8ff;line-height:1.6;">' + stack + '</div>' : ''}
             </div>
             <div style="padding:1rem 1.5rem;border-top:1px solid #30363d;background:#21262d;display:flex;justify-content:flex-end;gap:0.75rem;">
                \${fileBtnHtml}
             </div>
           </div>
           <style>@keyframes buncfSlideIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }</style>
        \`;

        overlay.innerHTML = cardHtml;
        document.body.appendChild(overlay);

        document.getElementById('buncf-close-btn').onclick = () => overlay.remove();

        if (fileUrl) {
            document.getElementById('buncf-open-btn').onclick = () => {
                const url = '/_buncf/open-editor?file=' + encodeURIComponent(fileUrl.path) + '&line=' + fileUrl.line + '&col=' + fileUrl.col;
                fetch(url).catch(e => console.error(e));
            };
        }
    }

    window.addEventListener('error', (event) => {
        showError('Runtime Error', event.message, event.error ? event.error.stack : null);
    });

    window.addEventListener('unhandledrejection', (event) => {
        showError('Unhandled Promise Rejection', event.reason.message || String(event.reason), event.reason.stack);
    });
})();
</script>
`;
