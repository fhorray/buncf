import * as React from 'react';
import { renderToReadableStream } from 'react-dom/server';
import { BuncfRouter } from '../router/RouterProvider';
// We need routerStore to be initialized with server state
// But routerStore is a singleton. For SSR, we need a Request-scoped store.
// For this MVP Foundation, we will assume strict "Render-only" mode where
// we pass initial state as props to BuncfRouter, bypassing the singleton client store for the initial render.

export interface RenderOptions {
  request: Request;
  // The Manifest or Route Map must be passed in,
  // or we use the file system router if running in Bun.
  routes: Record<string, any>;
  layouts: Record<string, any>;
  bootstrapScripts?: string[];
}

export async function renderApp(options: RenderOptions): Promise<Response> {
  const { request, routes, layouts, bootstrapScripts = [] } = options;
  const url = new URL(request.url);

  // TODO: Preload data (Loader) for the matched route here
  // For now, we render the shell.

  const stream = await renderToReadableStream(
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Meta tags injection would happen here */}
      </head>
      <body>
        <div id="root">
          <BuncfRouter
            // We need to modify RouterProvider to accept initial Path/Query
            // This effectively "hydrates" the router on the server
            // For now, we assume client-side navigation will take over.
            routes={routes}
            layouts={layouts}
          />
        </div>
        {bootstrapScripts.map((src) => (
          <script key={src} type="module" src={src}></script>
        ))}
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__BUNCF_DATA__ = ${JSON.stringify({})}`,
          }}
        />
      </body>
    </html>,
    {
      bootstrapScripts,
      onError(error) {
        console.error('[buncf] SSR Error:', error);
      },
    },
  );

  return new Response(stream, {
    headers: { 'Content-Type': 'text/html' },
  });
}
