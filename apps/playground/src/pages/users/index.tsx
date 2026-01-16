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
        setUsers(data.users || []);
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
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/"
          className="text-blue-600 hover:underline mb-4 inline-block"
        >
          ← Back to Home
        </Link>

        <h1 className="text-4xl font-bold text-gray-800 mb-6">Users</h1>

        {/* Search with query params */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setQuery({ search: e.target.value })}
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <p className="text-sm text-gray-500 mt-2">
            URL updates with search params: ?search={search}
          </p>
        </div>

        {/* Users list */}
        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : (
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="bg-white p-4 rounded-lg shadow hover:shadow-md transition"
              >
                <Link
                  href={`/users/${user.id}`}
                  className="text-xl font-semibold text-blue-600 hover:underline"
                >
                  {user.name}
                </Link>
                <p className="text-gray-500">{user.email}</p>
              </div>
            ))}
            {filteredUsers.length === 0 && (
              <p className="text-gray-500">No users found.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
