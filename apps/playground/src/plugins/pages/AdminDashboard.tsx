import React from 'react';

export default function AdminDashboard() {
  const stats = [
    { label: 'Total Posts', value: '1,284', change: '+12%', icon: '📝' },
    { label: 'Active Users', value: '42.5k', change: '+5.4%', icon: '👥' },
    { label: 'Avg. Session', value: '4m 32s', change: '-2.1%', icon: '⏱️' },
    { label: 'Conversion', value: '3.2%', change: '+0.8%', icon: '📈' },
  ];

  const recentActivity = [
    {
      id: 1,
      user: 'John Doe',
      action: 'Published a new post',
      time: '2 mins ago',
      status: 'Success',
    },
    {
      id: 2,
      user: 'Jane Smith',
      action: 'Updated settings',
      time: '15 mins ago',
      status: 'Pending',
    },
    {
      id: 3,
      user: 'Mike Ross',
      action: 'Deleted a comment',
      time: '1 hour ago',
      status: 'Success',
    },
    {
      id: 4,
      user: 'Harvey Specter',
      action: 'Invited a member',
      time: '3 hours ago',
      status: 'Failure',
    },
  ];

  return (
    <div className="flex min-h-screen bg-background font-sans text-foreground overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card/30 backdrop-blur-xl hidden lg:flex flex-col">
        <div className="p-6 border-b border-border">
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-cyan-400 bg-clip-text text-transparent">
            Buncf Admin
          </h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {['Dashboard', 'Content', 'Analytics', 'Users', 'Settings'].map(
            (item) => (
              <button
                key={item}
                className={`w-full text-left px-4 py-2 rounded-lg transition-all hover:bg-accent/50 ${
                  item === 'Dashboard'
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'text-muted-foreground'
                }`}
              >
                {item}
              </button>
            ),
          )}
        </nav>
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 p-2 rounded-lg bg-accent/20">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
              AD
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">Admin User</p>
              <p className="text-xs text-muted-foreground truncate">
                admin@buncf.dev
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 max-h-screen overflow-y-auto">
        {/* Header */}
        <header className="h-16 border-b border-border bg-background/50 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between px-8">
          <div className="flex items-center gap-4 w-full max-w-xl">
            <div className="relative w-full group">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                🔍
              </span>
              <input
                type="text"
                placeholder="Search commands, users, content..."
                className="w-full bg-accent/30 border border-border rounded-full py-1.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-accent/50 group transition-all">
              <span className="text-lg">🔔</span>
              <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full border border-background"></span>
            </button>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Overview</h2>
            <p className="text-muted-foreground">
              Manage your content and monitor platform health.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="group p-6 rounded-2xl bg-card/40 border border-border hover:border-primary/50 transition-all hover:shadow-[0_0_30px_-10px_rgba(var(--primary),0.2)]"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 rounded-lg bg-primary/10 text-xl">
                    {stat.icon}
                  </div>
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      stat.change.startsWith('+')
                        ? 'bg-green-500/10 text-green-500'
                        : 'bg-destructive/10 text-destructive'
                    }`}
                  >
                    {stat.change}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
              </div>
            ))}
          </div>

          {/* Activity Section */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Recent Activity Table */}
            <div className="xl:col-span-2 rounded-2xl border border-border bg-card/20 backdrop-blur-sm overflow-hidden flex flex-col">
              <div className="p-6 border-b border-border flex items-center justify-between">
                <h3 className="font-semibold">Recent Platform Activity</h3>
                <button className="text-sm text-primary hover:underline">
                  View All
                </button>
              </div>
              <div className="overflow-x-auto overflow-y-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-accent/30">
                    <tr>
                      <th className="px-6 py-4">User</th>
                      <th className="px-6 py-4">Action</th>
                      <th className="px-6 py-4 text-center">Status</th>
                      <th className="px-6 py-4 text-right">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {recentActivity.map((row) => (
                      <tr
                        key={row.id}
                        className="hover:bg-accent/10 transition-colors"
                      >
                        <td className="px-6 py-4 font-medium">{row.user}</td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {row.action}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center">
                            <span
                              className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                                row.status === 'Success'
                                  ? 'bg-green-500/10 text-green-500'
                                  : row.status === 'Pending'
                                    ? 'bg-yellow-500/10 text-yellow-500'
                                    : 'bg-destructive/10 text-destructive'
                              }`}
                            >
                              {row.status}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right text-muted-foreground">
                          {row.time}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right Column / Widgets */}
            <div className="space-y-6">
              {/* Upgrade Card */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/20 via-card to-card border border-primary/30 relative overflow-hidden group">
                <div className="absolute -right-8 -top-8 w-24 h-24 bg-primary/20 blur-3xl rounded-full group-hover:bg-primary/40 transition-all"></div>
                <h3 className="text-lg font-bold mb-2">Upgrade to Buncf Pro</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Unlock advanced analytics, custom domains, and
                  enterprise-grade support.
                </p>
                <button className="w-full bg-primary text-primary-foreground font-bold py-2 rounded-xl hover:opacity-90 transition-all shadow-lg shadow-primary/20">
                  Get Started
                </button>
              </div>

              {/* System Health */}
              <div className="p-6 rounded-2xl border border-border bg-card/20 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">System Health</h3>
                  <span className="flex items-center gap-1.5 text-xs text-green-500 font-medium">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    Operational
                  </span>
                </div>
                <div className="space-y-3">
                  {['Worker Latency', 'API Availability', 'Database Load'].map(
                    (item, i) => (
                      <div key={item} className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">{item}</span>
                          <span>{90 + i}%</span>
                        </div>
                        <div className="w-full h-1 bg-accent/30 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${90 + i}%` }}
                          ></div>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
