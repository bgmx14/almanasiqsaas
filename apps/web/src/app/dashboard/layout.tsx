'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, loadUser, logout } = useAuthStore();

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Chargement...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white border-r">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 border-b">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <span className="text-2xl">🕋</span>
              <span className="font-bold text-xl text-blue-600">OmraFlow</span>
            </Link>
            <p className="text-sm text-gray-500 mt-1">{user?.tenant.name}</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            <NavLink href="/dashboard" icon="📊">
              Dashboard
            </NavLink>
            <NavLink href="/dashboard/leads" icon="🎯">
              Leads
            </NavLink>
            <NavLink href="/dashboard/customers" icon="👥">
              Clients
            </NavLink>
            <NavLink href="/dashboard/bookings" icon="✈️">
              Réservations
            </NavLink>
            <NavLink href="/dashboard/payments" icon="💳">
              Paiements
            </NavLink>
            <NavLink href="/dashboard/documents" icon="📄">
              Documents
            </NavLink>
            <NavLink href="/dashboard/communications" icon="💬">
              Communications
            </NavLink>
          </nav>

          {/* User menu */}
          <div className="p-4 border-t">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <button
                onClick={logout}
                className="text-gray-400 hover:text-gray-600"
                title="Déconnexion"
              >
                🚪
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="ml-64">
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}

function NavLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition"
    >
      <span>{icon}</span>
      <span>{children}</span>
    </Link>
  );
}
