import * as React from 'react';
import { renderToReadableStream } from 'react-dom/server';
import { BuncfRouter } from '../router/RouterProvider';
import { createRouteMatcher } from '../router/matcher';

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

  // Match the route
  const routeDefinitions = Object.entries(routes).map(([pattern, data]) => ({
    pattern,
    data,
  }));
  const matcher = createRouteMatcher(routeDefinitions);
  const match = matcher.match(url.pathname);

  let initialComponent = null;
  let initialData = null;
  let initialParams = {};
  const initialLayouts: Record<
    string,
    { Component: React.ComponentType<any>; meta?: any }
  > = {};
  const dataMap: Record<string, any> = {};

  if (match) {
    initialParams = match.params;

    // Load page component
    const importer = match.data;
    if (importer) {
      try {
        const module = await importer();
        if (module.default) {
          initialComponent = module.default;

          // Run Loader
          // @ts-ignore
          if (module.loader && typeof module.loader === 'function') {
            try {
              const query = Object.fromEntries(url.searchParams);
              // @ts-ignore
              const data = await module.loader({
                params: initialParams,
                query,
                request,
              });
              initialData = data;

              // Populate hydration map
              const queryString = url.searchParams.toString();
              const fetchKey =
                url.pathname + (queryString ? `?${queryString}` : '');
              dataMap[fetchKey] = data;
            } catch (e) {
              console.error('[buncf] SSR Loader Error:', e);
              // TODO: Handle loader error (render error boundary?)
            }
          }
        }
      } catch (e) {
        console.error('[buncf] SSR Import Error:', e);
      }
    }

    // Load Layouts
    const segments = url.pathname.split('/').filter(Boolean);
    const pathsToCheck = [
      '/',
      ...segments.map((_, i) => '/' + segments.slice(0, i + 1).join('/')),
    ];

    await Promise.all(
      pathsToCheck.map(async (pathKey) => {
        let layoutImporter = layouts[pathKey];
        if (!layoutImporter && pathKey === '/') layoutImporter = layouts[''];

        if (layoutImporter) {
          try {
            const mod = await layoutImporter();
            if (mod.default) {
              initialLayouts[pathKey] = {
                Component: mod.default,
                meta: mod.meta,
              };
            }
          } catch (e) {
            console.error(`Failed to load layout for ${pathKey}`, e);
          }
        }
      }),
    );
  }

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
            initialData={initialData}
            initialParams={initialParams}
            initialComponent={initialComponent}
            initialLayouts={initialLayouts}
            initialPathname={url.pathname}
            initialQuery={Object.fromEntries(url.searchParams)}
          />
        </div>
        {bootstrapScripts.map((src) => (
          <script key={src} type="module" src={src}></script>
        ))}
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__BUNCF_DATA__ = ${JSON.stringify(dataMap)}`,
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
