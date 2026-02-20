// Last updated: 20th January 2025
import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import HighRiskAlerts from '@/components/notifications/HighRiskAlerts';
import RealtimeNotifications from '@/components/notifications/RealtimeNotifications';
import {
  Shield,
  LayoutDashboard,
  FileText,
  Activity,
  Users,
  LogOut,
  Settings,
  ClipboardList,
  Terminal,
  UserCircle,
  Database,
  PlusCircle,
  Gavel,
  
  Star,
  ShieldBan,
} from 'lucide-react';

interface AppLayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: [1, 2, 3, 4] },
  { name: 'Cases', href: '/cases', icon: FileText, roles: [1, 2, 3, 4] },
  { name: 'My Profile', href: '/my-profile', icon: UserCircle, roles: [4] },
  { name: 'Report Fraud', href: '/cases/new', icon: PlusCircle, roles: [4] },
  { name: 'Case Outcomes', href: '/my-decisions', icon: Gavel, roles: [4] },
  { name: 'Transactions', href: '/transactions', icon: Activity, roles: [1, 2, 3] },
  { name: 'Approvals', href: '/admin-decisions', icon: Gavel, roles: [1] },
  
  { name: 'Users', href: '/users', icon: Users, roles: [1] },
  { name: 'Investigations', href: '/investigations', icon: ClipboardList, roles: [1, 2] },
  { name: 'Performance', href: '/investigator-performance', icon: Star, roles: [1, 2] },
  { name: 'Blacklist', href: '/blacklist', icon: ShieldBan, roles: [1, 2] },
  { name: 'Query Debugger', href: '/query-debugger', icon: Terminal, roles: [1, 3] },
];

export default function AppLayout({ children }: AppLayoutProps) {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    // Clear React Query cache to prevent stale data on next login
    await signOut();
    navigate('/auth', { replace: true });
  };

  const getRoleName = (roleId: number) => {
    const roles: Record<number, string> = {
      1: 'Administrator',
      2: 'Investigator',
      3: 'Auditor',
      4: 'Customer',
    };
    return roles[roleId] || 'User';
  };

  const filteredNav = navigation.filter((item) =>
    item.roles.includes(profile?.role_id || 4)
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header Menu */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg gradient-primary">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg">Guardian Shield</span>
                <span className="text-xs text-muted-foreground">by <span className="font-bold">DataShaak</span></span>
              </div>
            </div>
            <nav className="flex items-center gap-2">
              <Button variant="ghost" asChild>
                <Link 
                  to="/query-debugger" 
                  className={cn(
                    "flex items-center gap-2",
                    location.pathname === '/query-debugger' && "bg-accent"
                  )}
                >
                  <Terminal className="h-4 w-4" />
                  Query Debugger
                </Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link 
                  to="/database-schema" 
                  className={cn(
                    "flex items-center gap-2",
                    location.pathname === '/database-schema' && "bg-accent"
                  )}
                >
                  <Database className="h-4 w-4" />
                  Database Schema
                </Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link 
                  to="/dashboard"
                  className={cn(
                    location.pathname === '/dashboard' && "bg-accent"
                  )}
                >
                  Dashboard
                </Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link 
                  to="/cases"
                  className={cn(
                    location.pathname.startsWith('/cases') && "bg-accent"
                  )}
                >
                  Cases
                </Link>
              </Button>
              {(profile?.role_id === 1 || profile?.role_id === 2 || profile?.role_id === 3) && (
                <Button variant="ghost" asChild>
                  <Link 
                    to="/transactions"
                    className={cn(
                      location.pathname === '/transactions' && "bg-accent"
                    )}
                  >
                    Transactions
                  </Link>
                </Button>
              )}
              {profile?.role_id === 1 && (
                <Button variant="ghost" asChild>
                  <Link 
                    to="/users"
                    className={cn(
                      location.pathname === '/users' && "bg-accent"
                    )}
                  >
                    Users
                  </Link>
                </Button>
              )}
              {(profile?.role_id === 1 || profile?.role_id === 2) && (
                <Button variant="ghost" asChild>
                  <Link 
                    to="/investigations"
                    className={cn(
                      location.pathname === '/investigations' && "bg-accent"
                    )}
                  >
                    Investigations
                  </Link>
                </Button>
              )}
            </nav>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-64 bg-sidebar text-sidebar-foreground flex flex-col">
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-sidebar-primary">
              <Shield className="h-5 w-5 text-sidebar-primary-foreground" />
            </div>
            <span className="font-bold text-lg">Guardian Shield</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {filteredNav.map((item) => {
            const isActive = location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-sidebar-accent flex items-center justify-center">
              <span className="text-sm font-medium">
                {profile?.full_name?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{profile?.full_name}</p>
              <p className="text-xs text-sidebar-foreground/60">
                {getRoleName(profile?.role_id || 4)}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto px-6 py-8">{children}</div>
        </main>
      </div>

      {/* Real-time HIGH risk alerts for admins */}
      <HighRiskAlerts />
      
      {/* Real-time notifications for new cases (admin) and assignments (investigator) */}
      <RealtimeNotifications />
    </div>
  );
}
