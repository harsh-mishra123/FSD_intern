import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Users as UsersIcon, Shield, Bell, LogOut, Hexagon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "../context/AuthContext";

export default function Sidebar({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  const isAdmin = user.role === "admin";

  return (
    <div className="min-h-screen flex bg-muted/30">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-background border-r border-border hidden md:block">
        <div className="h-full flex flex-col">
          <div className="px-6 py-6 border-b border-border">
            <Link to="/dashboard" className="flex items-center gap-2">
              <Hexagon className="h-6 w-6 text-primary" />
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                AdminPro
              </h2>
            </Link>
          </div>

          <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
            <Link 
              to="/dashboard" 
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${location.pathname === '/dashboard' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
            >
              <Bell className="mr-3 h-4 w-4" />
              Dashboard
            </Link>

            {isAdmin && (
              <>
                <div className="pt-4 pb-2">
                  <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Management</p>
                </div>
                <Link 
                  to="/admins" 
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${location.pathname === '/admins' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                >
                  <Shield className="mr-3 h-4 w-4" />
                  Admins
                </Link>
                <Link 
                  to="/users" 
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${location.pathname === '/users' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                >
                  <UsersIcon className="mr-3 h-4 w-4" />
                  Users
                </Link>
              </>
            )}
          </nav>

          <div className="p-4 border-t border-border">
            <div className="mb-4 px-2">
              <p className="text-sm font-medium text-foreground">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
            <Button
              onClick={logout}
              variant="outline"
              className="w-full justify-start text-muted-foreground"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        <main className="flex-1 p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
