'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { dashboardAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface DashboardStats {
  overview: {
    leads: number;
    customers: number;
    bookings: number;
    payments: number;
    totalRevenue: number;
    conversionRate: number;
  };
  leadsBreakdown: Record<string, number>;
  bookingsBreakdown: Record<string, { count: number; totalValue: number }>;
  upcomingDepartures: Array<{
    id: string;
    bookingNumber: string;
    customer: string;
    package: string;
    departureDate: string;
    status: string;
    daysUntil: number;
  }>;
  recentActivity: {
    leads: Array<{
      id: string;
      firstName: string;
      lastName: string;
      status: string;
      createdAt: string;
    }>;
    bookings: Array<{
      id: string;
      bookingNumber: string;
      customer: string;
      totalAmount: number;
      status: string;
      createdAt: string;
    }>;
  };
}

const BOOKING_STATUSES: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800' },
  CONFIRMED: { label: 'Confirmé', color: 'bg-blue-100 text-blue-800' },
  PAYMENT_PENDING: { label: 'Paiement en attente', color: 'bg-orange-100 text-orange-800' },
  PAID: { label: 'Payé', color: 'bg-green-100 text-green-800' },
};

export default function DashboardPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setIsLoading(true);
      const response = await dashboardAPI.getStats();
      setStats(response.data.data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTimeAgo = (date: string) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'À l\'instant';
    if (seconds < 3600) return `Il y a ${Math.floor(seconds / 60)} min`;
    if (seconds < 86400) return `Il y a ${Math.floor(seconds / 3600)}h`;
    return `Il y a ${Math.floor(seconds / 86400)} jours`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Chargement du tableau de bord...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Erreur lors du chargement des statistiques</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold">Bienvenue, {user?.firstName} ! 👋</h1>
        <p className="text-gray-600 mt-2">Voici un aperçu de votre activité</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Leads actifs"
          value={stats.overview.leads.toString()}
          subtitle={`${stats.leadsBreakdown.NEW || 0} nouveaux`}
          icon="🎯"
          iconBg="bg-blue-100"
          onClick={() => router.push('/dashboard/leads')}
        />
        <StatCard
          title="Réservations"
          value={stats.overview.bookings.toString()}
          subtitle={`${stats.bookingsBreakdown.CONFIRMED?.count || 0} confirmées`}
          icon="✈️"
          iconBg="bg-green-100"
          onClick={() => router.push('/dashboard/bookings')}
        />
        <StatCard
          title="Chiffre d'affaires"
          value={formatCurrency(stats.overview.totalRevenue)}
          subtitle={`${stats.overview.payments} paiements`}
          icon="💰"
          iconBg="bg-yellow-100"
          onClick={() => router.push('/dashboard/bookings')}
        />
        <StatCard
          title="Taux de conversion"
          value={`${stats.overview.conversionRate}%`}
          subtitle={`${stats.overview.customers} clients`}
          icon="📈"
          iconBg="bg-purple-100"
          onClick={() => router.push('/dashboard/customers')}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Departures */}
        <Card>
          <CardHeader>
            <CardTitle>Prochains départs</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.upcomingDepartures.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>Aucun départ prévu dans les 30 prochains jours</p>
              </div>
            ) : (
              <div className="space-y-4">
                {stats.upcomingDepartures.map((departure) => (
                  <div
                    key={departure.id}
                    className="flex items-start justify-between pb-4 border-b last:border-0 hover:bg-gray-50 p-2 rounded cursor-pointer transition-colors"
                    onClick={() => router.push(`/dashboard/bookings/${departure.id}`)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">{departure.customer}</p>
                        <Badge className={BOOKING_STATUSES[departure.status]?.color || 'bg-gray-100'}>
                          {BOOKING_STATUSES[departure.status]?.label || departure.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{departure.package}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <p className="text-xs text-gray-500">{formatDate(departure.departureDate)}</p>
                        <p className="text-xs text-gray-500">•</p>
                        <p className="text-xs text-gray-500">{departure.bookingNumber}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`text-lg font-bold ${
                          departure.daysUntil <= 7
                            ? 'text-red-600'
                            : departure.daysUntil <= 14
                            ? 'text-orange-600'
                            : 'text-blue-600'
                        }`}
                      >
                        {departure.daysUntil}
                      </div>
                      <p className="text-xs text-gray-500">jours</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Activité récente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Recent Bookings */}
              {stats.recentActivity.bookings.slice(0, 3).map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-start gap-3 pb-4 border-b hover:bg-gray-50 p-2 rounded cursor-pointer transition-colors"
                  onClick={() => router.push(`/dashboard/bookings/${booking.id}`)}
                >
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">✈️</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      Nouvelle réservation: {booking.customer}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-gray-500">{formatCurrency(booking.totalAmount)}</p>
                      <p className="text-xs text-gray-500">•</p>
                      <p className="text-xs text-gray-500">{formatTimeAgo(booking.createdAt)}</p>
                    </div>
                  </div>
                  <Badge className={BOOKING_STATUSES[booking.status]?.color || 'bg-gray-100'} >
                    {BOOKING_STATUSES[booking.status]?.label || booking.status}
                  </Badge>
                </div>
              ))}

              {/* Recent Leads */}
              {stats.recentActivity.leads.slice(0, 2).map((lead) => (
                <div
                  key={lead.id}
                  className="flex items-start gap-3 pb-4 border-b last:border-0 hover:bg-gray-50 p-2 rounded cursor-pointer transition-colors"
                  onClick={() => router.push(`/dashboard/leads/${lead.id}`)}
                >
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">👤</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      Nouveau lead: {lead.firstName} {lead.lastName}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{formatTimeAgo(lead.createdAt)}</p>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">{lead.status}</Badge>
                </div>
              ))}

              {stats.recentActivity.bookings.length === 0 &&
                stats.recentActivity.leads.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>Aucune activité récente</p>
                  </div>
                )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">État des leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(stats.leadsBreakdown).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{status}</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
              {Object.keys(stats.leadsBreakdown).length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">Aucun lead</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">État des réservations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(stats.bookingsBreakdown).map(([status, data]) => (
                <div key={status} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{status}</span>
                  <span className="font-medium">{data.count}</span>
                </div>
              ))}
              {Object.keys(stats.bookingsBreakdown).length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">Aucune réservation</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Actions rapides</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <button
                onClick={() => router.push('/dashboard/leads/new')}
                className="w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 transition-colors"
              >
                ➕ Nouveau lead
              </button>
              <button
                onClick={() => router.push('/dashboard/customers/new')}
                className="w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 transition-colors"
              >
                👤 Nouveau client
              </button>
              <button
                onClick={() => router.push('/dashboard/bookings/new')}
                className="w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 transition-colors"
              >
                ✈️ Nouvelle réservation
              </button>
              <button
                onClick={() => router.push('/dashboard/quotes/new')}
                className="w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 transition-colors"
              >
                📄 Nouveau devis
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
  iconBg,
  onClick,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: string;
  iconBg: string;
  onClick?: () => void;
}) {
  return (
    <Card
      className={`${onClick ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}`}
      onClick={onClick}
    >
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className={`w-12 h-12 ${iconBg} rounded-lg flex items-center justify-center`}>
            <span className="text-2xl">{icon}</span>
          </div>
        </div>
        <h3 className="text-gray-600 text-sm mt-4">{title}</h3>
        <p className="text-2xl font-bold mt-1">{value}</p>
        <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
      </CardContent>
    </Card>
  );
}
