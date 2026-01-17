import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { Button } from './ui/button';
import { LayoutDashboard, Calculator, History as HistoryIcon, Settings as SettingsIcon, LogOut } from 'lucide-react';
import { cn } from '../lib/utils';

export function Layout() {
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Calculator', icon: Calculator },
    { path: '/rates', label: 'Edit Rates', icon: LayoutDashboard },
    { path: '/history', label: 'History', icon: HistoryIcon },
    { path: '/settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 border-r bg-card flex flex-col">
        <div className="p-6">
          <h1 className="text-xl font-bold tracking-tight">Exchange Office</h1>
          <p className="text-sm text-muted-foreground">Welcome, {user?.username}</p>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => (
            <Link key={item.path} to={item.path}>
              <Button 
                variant={location.pathname === item.path ? 'secondary' : 'ghost'} 
                className={cn("w-full justify-start gap-2", location.pathname === item.path && "bg-secondary")}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Button>
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t">
          <Button variant="outline" className="w-full gap-2" onClick={logout}>
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
