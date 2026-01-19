import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Plus,
  Trash2,
  Pencil,
  X,
  Save,
  Search,
  User,
  Mail,
  Loader2,
  Database,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useFetcher } from 'buncf/router';

// --- Types ---

interface UserData {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

type SortField = 'name' | 'email' | 'created_at';
type SortOrder = 'asc' | 'desc';

// --- Components ---

// Simple Toast Notification Component
function Toast({
  message,
  type,
  onClose,
}: {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}) {
  return (
    <div
      className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md border animate-in slide-in-from-right-full duration-300 ${
        type === 'success'
          ? 'bg-emerald-950/80 border-emerald-500/30 text-emerald-200'
          : 'bg-red-950/80 border-red-500/30 text-red-200'
      }`}
    >
      {type === 'success' ? (
        <CheckCircle2 className="w-5 h-5" />
      ) : (
        <AlertCircle className="w-5 h-5" />
      )}
      <span className="font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-75">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// Table Loading Skeleton
function TableSkeleton() {
  return (
    <>
      {[1, 2, 3, 4].map((i) => (
        <TableRow key={i} className="border-white/5">
          <TableCell colSpan={4} className="p-4">
            <div className="flex items-center gap-4 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-white/10" />
              <div className="space-y-2 flex-1">
                <div className="h-4 w-32 bg-white/10 rounded" />
                <div className="h-3 w-24 bg-white/5 rounded" />
              </div>
            </div>
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

// --- Main Page ---

export const meta = () => [{ title: 'Dashboard • User Management' }];

export default function UserManagementPage() {
  const {
    data: users,
    isLoading: loading,
    submit,
    mutate,
    state,
  } = useFetcher<UserData[]>('/api/users', {
    onSuccess: (data, variables) => {
      console.log(data);
      console.log(variables);

      return;
      // Check if this was a create action (variables has name/email)
      // or we can just blindly clear form since this is the page's main fetcher
      if (variables?.name && variables?.email) {
        setNewName('');
        setNewEmail('');
        showToast('User created successfully', 'success');
        setCreating(false);
      }
    },
    onError: (err) => {
      showToast('Failed to perform action', 'error');
      setCreating(false);
    },
  });

  // Local State
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  // Form & Edit State
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [creating, setCreating] = useState(false);

  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');

  // Helpers
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc'); // Default to asc for new field
    }
  };

  // Actions
  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail) return;

    setCreating(true);
    // Side effects handled by onSuccess/onError
    await submit(
      { name: newName, email: newEmail },
      { method: 'POST', action: '/api/users' },
    );
  };

  const deleteUser = async (id: string) => {
    if (!confirm('Are you sure? This action cannot be undone.')) return;
    try {
      await fetch(`/api/users/${id}`, { method: 'DELETE' });
      mutate();
      showToast('User deleted', 'success');
    } catch {
      showToast('Failed to delete user', 'error');
    }
  };

  const saveEdit = async () => {
    if (!editingUser) return;
    try {
      await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, email: editEmail }),
      });
      mutate();
      showToast('User updated', 'success');
      setEditingUser(null);
    } catch {
      showToast('Failed to update user', 'error');
    }
  };

  // Derived Data
  const processedUsers = useMemo(() => {
    if (!users) return [];

    let result = [...users];

    // Filter
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(
        (u) =>
          u.name.toLowerCase().includes(lower) ||
          u.email.toLowerCase().includes(lower),
      );
    }

    // Sort
    result.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      // Handle date comparisons
      if (sortField === 'created_at') {
        valA = new Date(a.created_at).getTime();
        valB = new Date(b.created_at).getTime();
      } else {
        valA = valA.toString().toLowerCase();
        valB = valB.toString().toLowerCase();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [users, searchTerm, sortField, sortOrder]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 min-h-[80vh]">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-gradient-to-br from-primary/20 to-purple-500/10 rounded-xl border border-primary/20 shadow-lg shadow-primary/5">
              <Database className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-white/90 to-white/70 tracking-tight">
                User Management
              </h1>
            </div>
          </div>
          <p className="text-muted-foreground text-lg ml-1">
            Cloudflare D1 Database • Drizzle ORM • Buncf
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Create User Card (Left/Top) */}
        <Card className="lg:col-span-1 border-primary/20 bg-background/40 backdrop-blur-xl h-fit sticky top-6 shadow-2xl shadow-black/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <div className="p-1.5 bg-green-500/10 rounded-lg border border-green-500/20 text-green-400">
                <Plus className="w-4 h-4" />
              </div>
              Create User
            </CardTitle>
            <CardDescription>Add a new record to the database</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={createUser} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground ml-1 uppercase tracking-wider">
                  Full Name
                </label>
                <div className="relative group">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    placeholder="e.g. Alice Wonderland"
                    className="pl-9 bg-black/20 border-white/10 focus:border-primary/50 focus:bg-black/40 transition-all"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    disabled={creating}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground ml-1 uppercase tracking-wider">
                  Email Address
                </label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    type="email"
                    placeholder="alice@example.com"
                    className="pl-9 bg-black/20 border-white/10 focus:border-primary/50 focus:bg-black/40 transition-all"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    disabled={creating}
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full mt-4 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white shadow-lg shadow-primary/20 border-0"
                disabled={creating || !newName || !newEmail}
              >
                {creating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Add to Database
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Directory Table (Right/Center) */}
        <Card className="lg:col-span-2 border-primary/20 bg-background/40 backdrop-blur-xl shadow-2xl shadow-black/50 overflow-hidden flex flex-col">
          <CardHeader className="flex lg:flex-row flex-col lg:items-center justify-between space-y-4 lg:space-y-0 pb-6 border-b border-white/5 bg-white/[0.02]">
            <div className="space-y-1">
              <CardTitle className="text-xl">Users Directory</CardTitle>
              <CardDescription>
                <span className="font-mono text-primary">
                  {processedUsers.length}
                </span>{' '}
                records found
              </CardDescription>
            </div>
            <div className="relative w-full lg:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                className="pl-9 bg-black/20 border-white/10 focus:border-primary/50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>

          <div className="flex-1 overflow-auto">
            <Table>
              <TableHeader className="bg-white/[0.02]">
                <TableRow className="hover:bg-transparent border-white/5">
                  <TableHead
                    className="pl-6 w-[250px] cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-2">
                      Name{' '}
                      {sortField === 'name' &&
                        (sortOrder === 'asc' ? (
                          <ChevronUp className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        ))}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('email')}
                  >
                    <div className="flex items-center gap-2">
                      Email{' '}
                      {sortField === 'email' &&
                        (sortOrder === 'asc' ? (
                          <ChevronUp className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        ))}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('created_at')}
                  >
                    <div className="flex items-center gap-2">
                      Joined{' '}
                      {sortField === 'created_at' &&
                        (sortOrder === 'asc' ? (
                          <ChevronUp className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        ))}
                    </div>
                  </TableHead>
                  <TableHead className="text-right pr-6">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && !users ? (
                  <TableSkeleton />
                ) : processedUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-64 text-center">
                      <div className="flex flex-col items-center justify-center gap-4 text-muted-foreground/50">
                        <div className="p-4 rounded-full bg-white/5 border border-white/5">
                          <User className="h-8 w-8" />
                        </div>
                        <p>No users found matching your criteria.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  processedUsers.map((user) => (
                    <TableRow
                      key={user.id}
                      className="group hover:bg-white/[0.03] border-white/5 transition-colors"
                    >
                      <TableCell className="pl-6 font-medium">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-blue-500/20 ring-2 ring-transparent group-hover:ring-blue-500/50 transition-all">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-base">{user.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground group-hover:text-gray-300 transition-colors">
                        {user.email}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm font-mono opacity-70">
                        {new Date(user.created_at).toLocaleDateString(
                          undefined,
                          { month: 'short', day: 'numeric', year: 'numeric' },
                        )}
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-blue-500/20 hover:text-blue-400 rounded-lg"
                            onClick={() => {
                              setEditingUser(user);
                              setEditName(user.name);
                              setEditEmail(user.email);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-red-500/20 hover:text-red-400 rounded-lg"
                            onClick={() => deleteUser(user.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#0d1117] border border-primary/20 rounded-2xl shadow-2xl p-6 relative animate-in zoom-in-95 slide-in-from-bottom-5 duration-200 ring-1 ring-white/10">
            <button
              onClick={() => setEditingUser(null)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4 border border-blue-500/20">
                <Pencil className="w-6 h-6 text-blue-400" />
              </div>
              <h2 className="text-xl font-bold text-white">
                Edit User Details
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                Updating record for{' '}
                <span className="text-white font-medium">
                  {editingUser.name}
                </span>
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase">
                  Full Name
                </label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="bg-black/40 border-white/10 focus:border-primary/50 h-10"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase">
                  Email
                </label>
                <Input
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="bg-black/40 border-white/10 focus:border-primary/50 h-10"
                />
              </div>

              <div className="flex gap-3 mt-8">
                <Button
                  variant="outline"
                  className="flex-1 border-white/10 hover:bg-white/5"
                  onClick={() => setEditingUser(null)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white border-0"
                  onClick={saveEdit}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
