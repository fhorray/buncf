import React from 'react';
import { useFetcher, Link } from 'buncf/router';

// Loader: Fetches data from our API
// This will be automatically cached by the new LoaderClient
export const loader = async () => {
  // Determine API URL based on environment or relative path
  // Since we are client-side navigation, relative fetch works if on same domain
  const res = await fetch('/api/cache-test');
  if (!res.ok) throw new Error('Failed to fetch time');
  return res.json();
};

export const meta = () => [{ title: 'Global Cache Demo' }];

export default function CacheDemo({ data }: { data: any }) {
  const fetcher = useFetcher();

  return (
    <div className="p-10 font-sans max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">
        ⚡ Global Cache & Revalidation
      </h1>

      <div className=" p-6 rounded-lg mb-8 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Server Data</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded shadow">
            <p className="text-sm text-gray-500 uppercase">Server Time (ISO)</p>
            <p className="text-black font-mono text-lg">
              {data?.iso || 'Loading...'}
            </p>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <p className="text-sm text-gray-500 uppercase">Random ID</p>
            <p className="font-mono text-lg text-blue-600 font-bold">
              {data?.id || '...'}
            </p>
          </div>
        </div>
        <p className="mt-4 text-sm text-gray-600">
          ℹ️ Navigate away and come back. If the <b>Random ID</b> stays the
          same, the Global Cache is working!
        </p>
      </div>

      <div className="space-y-6">
        <div className="flex gap-4 items-center border-b pb-6">
          <Link href="/" className="text-blue-500 hover:underline">
            ← Back Home (Test Cache)
          </Link>
          <Link href="/rpc-demo" className="text-blue-500 hover:underline">
            Go to RPC Demo (Test Cache)
          </Link>
        </div>

        <div>
          <h3 className="text-lg font-bold mb-2">Test Auto-Revalidation</h3>
          <p className="mb-4 text-gray-600">
            Submitting this form will call a POST endpoint. On success,{' '}
            <code>useFetcher</code> will automatically invalidate the cache,
            causing the Server Data above to refresh immediately.
          </p>

          <fetcher.Form
            method="POST"
            action="/api/cache-test"
            className="flex gap-4 items-center"
          >
            <button
              disabled={fetcher.isSubmitting}
              className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800 disabled:opacity-50 transition-all font-medium"
            >
              {fetcher.isSubmitting
                ? 'Updating...'
                : 'Trigger Mutation & Revalidate'}
            </button>

            {fetcher.state !== 'idle' && (
              <span className="text-sm text-gray-500 animate-pulse">
                {fetcher.state === 'submitting'
                  ? 'Submitting...'
                  : 'Reloading Data...'}
              </span>
            )}
          </fetcher.Form>

          {fetcher.data && (
            <div className="mt-4 p-3 bg-green-50 text-green-700 rounded border border-green-200">
              ✅ {fetcher.data.message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
