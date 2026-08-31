import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { SessionProvider, useSession } from './context/SessionContext';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Consents from './pages/Consents';
import AuditLog from './pages/AuditLog';
import { Shield, User, FileCheck2, ScrollText, LogOut } from 'lucide-react';

function ProtectedRoute({ children }) {
  const { user, sessionKey } = useSession();
  if (!user || !sessionKey) {
    return <Navigate to="/" replace />;
  }
  return children;
}

function Layout({ children }) {
  const { logout } = useSession();
  const location = useLocation();

  const navItems = [
    { name: 'My Vault', path: '/profile', icon: User },
    { name: 'Consents', path: '/consents', icon: FileCheck2 },
    { name: 'Audit Log', path: '/audit-log', icon: ScrollText },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 gap-3 border-b border-slate-800">
          <Shield className="w-6 h-6 text-indigo-400" />
          <span className="font-bold text-lg tracking-wide">MahaSetu</span>
        </div>
        
        <nav className="flex-1 py-6 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition ${
                  isActive ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={logout}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <LogOut className="w-5 h-5" />
            Lock & Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4">
          <div className="flex items-center gap-2 text-white">
            <Shield className="w-6 h-6 text-indigo-400" />
            <span className="font-bold">MahaSetu</span>
          </div>
          <button onClick={logout} className="text-slate-400 p-2">
            <LogOut className="w-5 h-5" />
          </button>
        </header>

        {/* Mobile Nav */}
        <nav className="md:hidden bg-slate-800 flex overflow-x-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex flex-col items-center gap-1 px-4 py-3 min-w-24 text-xs font-medium ${
                  isActive ? 'text-white border-b-2 border-indigo-500' : 'text-slate-400'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <SessionProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          
          {/* Protected Routes wrapped in Layout */}
          <Route path="/profile" element={<ProtectedRoute><Layout><Profile /></Layout></ProtectedRoute>} />
          <Route path="/consents" element={<ProtectedRoute><Layout><Consents /></Layout></ProtectedRoute>} />
          <Route path="/audit-log" element={<ProtectedRoute><Layout><AuditLog /></Layout></ProtectedRoute>} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </SessionProvider>
  );
}
