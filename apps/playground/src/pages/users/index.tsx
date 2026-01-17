/**
 * Users List Page
 * URL: /users
 *
 * Demonstrates: useSearchParams hook + Link with query params
 */
import { useSearchParams, Link } from 'buncf/router';
import { useState, useEffect } from 'react';

export default function UsersPage() {
  const [query, setQuery] = useSearchParams();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch users from API
  useEffect(() => {
    fetch('/api/users')
      .then((res) => res.json())
      .then((data) => {
        setUsers(data as any[]);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Filter by search query
  const search = query.search || '';
  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <Link
            href="/"
            className="text-sm font-medium text-primary hover:underline underline-offset-4 mb-4 inline-block"
          >
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-extrabold tracking-tight">Active Users</h1>
          <p className="text-muted-foreground mt-2">Manage and browse your application directory.</p>
        </div>

        {/* Search with query params */}
        <div className="relative w-full max-w-sm">
          <input
            type="text"
            placeholder="Search directory..."
            value={search}
            onChange={(e) => setQuery({ search: e.target.value })}
            className="w-full px-4 py-2.5 bg-background border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all pr-10"
          />
          <div className="absolute right-3 top-2.5 text-muted-foreground/50">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 animate-pulse">
            <div className="w-12 h-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin mb-4"></div>
            <p className="text-muted-foreground font-medium">Fetching users...</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className="group flex items-center justify-between bg-card p-5 rounded-2xl border shadow-sm hover:shadow-md hover:border-primary/30 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                  {user.name.charAt(0)}
                </div>
                <div>
                    <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">
                        {user.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <Link
                href={`/users/${user.id}`}
                className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-semibold hover:bg-muted transition-colors"
              >
                View Profile
              </Link>
            </div>
          ))}
          
          {filteredUsers.length === 0 && (
            <div className="text-center py-20 rounded-2xl border-2 border-dashed bg-muted/20">
              <p className="text-muted-foreground">No users found matching "{search}"</p>
              <button 
                onClick={() => setQuery({})}
                className="mt-4 text-primary font-semibold hover:underline"
              >
                Clear search
              </button>
            </div>
          )}
        </div>
      )}
      
      <div className="mt-8 text-[10px] text-center uppercase tracking-widest text-muted-foreground/30 font-bold">
        Live sync with ?search={search || 'null'}
      </div>
    </div>
  );
}
