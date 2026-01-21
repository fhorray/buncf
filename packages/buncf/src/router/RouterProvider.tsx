/**
 * Buncf Router - Client-side Provider
 *
 * Handles navigation, route matching, and dynamic page importing on the client.
 */

import React, {
  useState,
  useEffect,
  type ReactNode,
  type ComponentType,
} from 'react';
import { routerStore, type RouteState } from './client';
import { loaderClient } from './loader-client';

export interface PageProps {
  params: Record<string, string>;
  query: Record<string, string>;
}

export interface RouterProviderProps {
  /**
   * Root layout component (Legacy support, use /src/pages/_layout.tsx instead)
   */
  layout?: ComponentType<{ children: ReactNode }>;

  /**
   * Map of route patterns to dynamic imports
   */
  routes?: Record<
    string,
    () => Promise<{ default: ComponentType<any>; meta?: any }>
  >;

  /**
   * Map of layout patterns to dynamic imports
   */
  layouts?: Record<
    string,
    () => Promise<{
      default: ComponentType<{ children: ReactNode }>;
      meta?: any;
    }>
  >;

  /**
   * Initial data for SSR
   */
  initialData?: any;

  /**
   * Initial params for SSR
   */
  initialParams?: Record<string, string>;

  /**
   * Initial query for SSR
   */
  initialQuery?: Record<string, string>;

  /**
   * Initial pathname for SSR
   */
  initialPathname?: string;

  /**
   * Initial Component for SSR
   */
  initialComponent?: ComponentType<any>;

  /**
   * Initial Layouts for SSR
   */
  initialLayouts?: Record<
    string,
    { Component: ComponentType<any>; meta?: any }
  >;
}

/**
 * 404 Page Component
 */
function NotFoundPage() {
  return (
    <div
      style={{ padding: '40px', fontFamily: 'sans-serif', textAlign: 'center' }}
    >
      <h1 style={{ color: '#e11d48', fontSize: '2rem' }}>
        404 - Page Not Found
      </h1>
      <p style={{ color: '#4b5563' }}>
        The page you are looking for does not exist.
      </p>
      <a href="/" style={{ color: '#2563eb', textDecoration: 'underline' }}>
        Go Home
      </a>
    </div>
  );
}

/**
 * Error Page Component
 */
function ErrorPage({ error }: { error: Error }) {
  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif' }}>
      <h1 style={{ color: '#e11d48' }}>Something went wrong</h1>
      <pre
        style={{
          background: '#f3f4f6',
          padding: '20px',
          borderRadius: '8px',
          overflowX: 'auto',
        }}
      >
        {error.message}
      </pre>
    </div>
  );
}

/**
 * Recursive Layout Wrapper
 */
function RecursiveLayouts({
  layouts,
  pathname,
  children,
}: {
  layouts: Record<
    string,
    { Component: ComponentType<{ children: ReactNode }>; meta?: any }
  >;
  pathname: string;
  children: ReactNode;
}) {
  // Determine active layouts based on path segments
  // /dashboard/settings -> ["/", "/dashboard"]
  const safePathname = pathname || "/";
  const segments = safePathname.split('/').filter(Boolean);
  const activeLayoutPaths = ['/']; // Always check root

  let current = '';
  for (const segment of segments) {
    current += '/' + segment;
    activeLayoutPaths.push(current);
  }

  // Filter to only existing layouts
  const LayoutComponents = activeLayoutPaths
    .map((p) => layouts[p] || (p === '/' ? layouts[''] : null)) // handle empty string root key if present
    .filter(
      (
        l,
      ): l is {
        Component: ComponentType<{ children: ReactNode }>;
        meta?: any;
      } => !!l && !!l.Component,
    )
    .map((l) => l.Component);

  // If no nested layouts found, just return children
  if (LayoutComponents.length === 0) return <>{children}</>;

  // Nest them: Root(Dashboard(Children))
  // We use reduceRight to build from inside out
  return LayoutComponents.reduceRight(
    (acc, Layout) => {
      return React.createElement(Layout, null, acc);
    },
    (<>{children}</>) as ReactNode,
  );
}

export function BuncfRouter({
  layout: LegacyRootLayout,
  routes = {},
  layouts: layoutImporters = {},
  initialData,
  initialParams,
  initialQuery,
  initialPathname,
  initialComponent,
  initialLayouts,
}: RouterProviderProps) {
  const [route, setRoute] = useState<RouteState>(() => {
    const state = routerStore.getState();
    if (initialPathname) {
      return {
        pathname: initialPathname,
        params: initialParams || {},
        query: initialQuery || {},
      };
    }
    return state;
  });

  const [PageComponent, setPageComponent] = useState<ComponentType<any> | null>(
    () => initialComponent || null,
  );
  // Store loaded layouts: path -> { Component, meta }
  const [loadedLayouts, setLoadedLayouts] = useState<
    Record<string, { Component: ComponentType<any>; meta?: any }>
  >(initialLayouts || {});
  // Store page data from loader
  const [pageData, setPageData] = useState<any>(initialData || null);

  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);

  // Track current pathname to prevent loops
  const currentPathRef = React.useRef(routerStore.getState().pathname);

  // Subscribe to router store updates
  useEffect(() => {
    const unsubscribe = routerStore.subscribe((state) => {
      setRoute(state);
      // Only reload page if pathname changed
      if (state.pathname !== currentPathRef.current) {
        currentPathRef.current = state.pathname;
        loadPage(state.pathname);
      }
    });
    return () => {
      unsubscribe();
    };
  }, []); // Only run once, loadPage closure might be stale but we handle that?
  // actually loadPage is not stable if we don't useCallback it.

  // Subscribe to LoaderClient (Global Revalidation)
  useEffect(() => {
    return loaderClient.subscribe(() => {
      // Trigger re-fetch for current page
      // This happens when any fetcher action invalidates the cache
      loadPage(currentPathRef.current);
    });
  }, []); // We rely on mutable refs or stable functions.
  // Note: loadPage below captures 'loadedLayouts' from render scope.
  // If we run calling it from this effect, it might use stale 'loadedLayouts'.
  // We should fix loadPage to use functional updates or be stable.

  // Initial load
  useEffect(() => {
    loadPage(route.pathname);
  }, []);

  // SEO Helper
  const applyMeta = (metaFns: any[], data: any, params: any) => {
    try {
      // Collect all tags from all meta functions (Layouts -> Page)
      let allTags: any[] = [];

      for (const fn of metaFns) {
        if (typeof fn !== 'function') continue;
        const tags = fn({ data, params, query: routerStore.getState().query });
        if (Array.isArray(tags)) {
          allTags = [...allTags, ...tags];
        }
      }

      if (allTags.length === 0) return;

      // clear previous buncf meta tags
      document
        .querySelectorAll('meta[data-buncf="true"]')
        .forEach((el) => el.remove());

      // Deduplicate based on name/property? Or just append?
      // For title, last one wins. For others, usually append, but duplicates can be bad.
      // Let's enforce "Last Writer Wins" for unique attributes (name, property) to allow overrides.

      const uniqueTags = new Map<string, any>();

      allTags.forEach((tag) => {
        if (tag.title) {
          document.title = tag.title;
        } else {
          // Generate a key for deduplication
          const key = tag.name
            ? `name:${tag.name}`
            : tag.property
              ? `property:${tag.property}`
              : JSON.stringify(tag);
          uniqueTags.set(key, tag);
        }
      });

      uniqueTags.forEach((tag) => {
        if (!tag.title) {
          const meta = document.createElement('meta');
          Object.entries(tag).forEach(([key, value]) => {
            meta.setAttribute(key, String(value));
          });
          meta.setAttribute('data-buncf', 'true');
          document.head.appendChild(meta);
        }
      });
    } catch (e) {
      console.error('[buncf] Failed to apply meta:', e);
    }
  };

  async function loadPage(pathname: string) {
    setError(null);
    setLoading(true);

    try {
      // 1. Load Layouts for this path
      const segments = pathname.split('/').filter(Boolean);
      const pathsToCheck = [
        '/',
        ...segments.map((_, i) => '/' + segments.slice(0, i + 1).join('/')),
      ];

      const newLayouts: Record<
        string,
        { Component: ComponentType<any>; meta?: any }
      > = { ...loadedLayouts };
      let layoutsUpdated = false;

      // Load all applicable layouts in parallel
      await Promise.all(
        pathsToCheck.map(async (pathKey) => {
          if (newLayouts[pathKey]) return; // Already loaded

          let importer = layoutImporters[pathKey];
          // Try root fallback if pathKey is "/"
          if (!importer && pathKey === '/') importer = layoutImporters[''];

          if (importer) {
            try {
              const mod = await importer();
              if (mod.default) {
                newLayouts[pathKey] = {
                  Component: mod.default,
                  meta: mod.meta,
                };
                layoutsUpdated = true;
              }
            } catch (e) {
              console.error(`Failed to load layout for ${pathKey}`, e);
            }
          }
        }),
      );

      if (layoutsUpdated) {
        if (routerStore.getState().pathname !== pathname) return;
        setLoadedLayouts(newLayouts);
      }

      // 2. Find matching route
      let importer = routes[pathname];
      let matchedParams: Record<string, string> = {};

      // Try resolving index or trailing slash variations
      if (!importer) {
        if (pathname === '/') importer = routes['/index'];
        else if (pathname.endsWith('/'))
          importer = routes[pathname.slice(0, -1)];
        else importer = routes[`${pathname}/`];
      }

      // Dynamic Route Matching
      if (!importer) {
        const routeKeys = Object.keys(routes);

        // Sort keys to prioritize specific routes over catch-alls
        routeKeys.sort((a, b) => {
          const aCatchAll = a.includes('[...');
          const bCatchAll = b.includes('[...');
          if (aCatchAll && !bCatchAll) return 1;
          if (!aCatchAll && bCatchAll) return -1;
          return 0;
        });

        for (const key of routeKeys) {
          // Skip special
          if (key.startsWith('/_')) continue;

          // Convert /blog/[slug] to regex
          // (Simplified matching logic reuse)
          if (!key.includes('[') && !key.includes('*')) continue;

          const paramNames: string[] = [];
          const escapeRegex = (str: string) =>
            str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

          const segments = [];
          let lastIndex = 0;
          const placerRegex =
            /(\[\.\.\.([a-zA-Z0-9_]+)\])|(\[([a-zA-Z0-9_]+)\])|(:([a-zA-Z0-9_]+))/g;
          let matchRegex;

          while ((matchRegex = placerRegex.exec(key)) !== null) {
            const staticPart = key.slice(lastIndex, matchRegex.index);
            if (staticPart) segments.push(escapeRegex(staticPart));

            if (matchRegex[2]) {
              paramNames.push(matchRegex[2]);
              segments.push('(.*)');
            } else if (matchRegex[4]) {
              paramNames.push(matchRegex[4]);
              segments.push('([^/]+)');
            } else if (matchRegex[6]) {
              paramNames.push(matchRegex[6]);
              segments.push('([^/]+)');
            }
            lastIndex = placerRegex.lastIndex;
          }

          const remaining = key.slice(lastIndex);
          if (remaining) segments.push(escapeRegex(remaining));

          const regexStr = segments.join('');
          const regex = new RegExp(`^${regexStr}/?$`);
          const match = pathname.match(regex);

          if (match) {
            importer = routes[key];
            match.slice(1).forEach((val, i) => {
              const paramName = paramNames[i];
              if (paramName) {
                matchedParams[paramName] = decodeURIComponent(val || '');
              }
            });
            break;
          }
        }
      }

      if (!importer) {
        // Fallback: Check for custom _notfound
        const notFoundImporter = routes['/_notfound'];
        if (notFoundImporter) {
          const mod = await notFoundImporter();
          setPageComponent(() => mod.default);
          return;
        }

        if (routerStore.getState().pathname !== pathname) return;
        setPageComponent(() => NotFoundPage);
        return;
      }

      // Update params in store
      if (Object.keys(matchedParams).length > 0) {
        routerStore.setParams(matchedParams);
      }

      // 3. Import page component
      const module = await importer();
      if (routerStore.getState().pathname !== pathname) return;

      if (!module.default) {
        throw new Error(
          `Page at ${pathname} does not export a default component`,
        );
      }

      // 4. Run Loader with Cache
      // @ts-ignore
      if (module.loader && typeof module.loader === 'function') {
        try {
          // Create a unique key for this request: pathname + query
          // We need the full URL or at least path+query
          // routerStore.getState().query is an object, lets serialize it consistently
          const queryObj = routerStore.getState().query;
          const queryString = new URLSearchParams(queryObj).toString();
          const fetchKey = pathname + (queryString ? `?${queryString}` : '');

          // Use LoaderClient to fetch/cache
          const data = await loaderClient.fetch(fetchKey, async () => {
            // @ts-ignore
            return await module.loader({
              params: matchedParams,
              query: queryObj,
            });
          });

          if (routerStore.getState().pathname !== pathname) return;
          setPageData(data);
        } catch (loaderErr) {
          if (routerStore.getState().pathname !== pathname) return;
          console.error('[buncf] Loader failed:', loaderErr);
          throw loaderErr;
        }
      } else {
        setPageData(null);
      }

      // 5. Apply SEO Meta (Cascading: Root Layout -> Nested Layouts -> Page)
      // Collect meta from loaded layouts relevant to this path
      // Reuse 'segments' from above
      const layoutPaths = [
        '/',
        ...segments.map((_, i) => '/' + segments.slice(0, i + 1).join('/')),
      ];

      const metaFns = layoutPaths
        .map((p) => loadedLayouts[p] || (p === '/' ? loadedLayouts[''] : null))
        .filter((l) => !!l && !!l.meta)
        .map((l) => l!.meta);

      // Add page meta
      if (module.meta) metaFns.push(module.meta);

      // @ts-ignore
      applyMeta(metaFns, pageData, matchedParams);

      setPageComponent(() => module.default);
    } catch (err: any) {
      if (routerStore.getState().pathname !== pathname) return;
      console.error('[buncf] Failed to load page:', err);
      setError(err);
    } finally {
      if (routerStore.getState().pathname === pathname) {
        setLoading(false);
      }
    }
  }

  // --- Rendering Helpers ---

  // Merge Legacy Layout with Nested Layouts
  // If LegacyRootLayout is provided, it wraps everything (outside recursive layouts)s
  // Or we treat it as the "/" root layout if none exists?
  // For safety, let's wrap RecursiveLayouts with Legacy if present.

  const contentNode = (
    <>
      {PageComponent ? (
        <PageComponent
          params={route.params}
          query={route.query}
          data={pageData}
        />
      ) : (
        <div />
      )}
    </>
  );

  const wrappedWithNested = (
    <RecursiveLayouts layouts={loadedLayouts} pathname={route.pathname}>
      {contentNode}
    </RecursiveLayouts>
  );

  const finalContent = LegacyRootLayout ? (
    <LegacyRootLayout>{wrappedWithNested}</LegacyRootLayout>
  ) : (
    wrappedWithNested
  );

  // Error Handling
  if (error) {
    const CustomError = routes['/_error']
      ? React.lazy(routes['/_error'] as any)
      : null;
    const ErrorComp = CustomError ? (
      <React.Suspense fallback={<ErrorPage error={error} />}>
        <CustomError error={error} />
      </React.Suspense>
    ) : (
      <ErrorPage error={error} />
    );

    return LegacyRootLayout ? (
      <LegacyRootLayout>{ErrorComp}</LegacyRootLayout>
    ) : (
      ErrorComp
    );
  }

  // Loading Handling
  const CustomLoading = routes['/_loading']
    ? React.lazy(routes['/_loading'] as any)
    : null;
  if (loading && CustomLoading) {
    const LoadingComp = (
      <React.Suspense fallback={null}>
        <CustomLoading />
      </React.Suspense>
    );
    return LegacyRootLayout ? (
      <LegacyRootLayout>{LoadingComp}</LegacyRootLayout>
    ) : (
      LoadingComp
    );
  }

  return finalContent;
}
