'use client';

import { useAuthStore } from '@/stores/authStore';

export default function DashboardPage() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          Bienvenue, {user?.firstName} ! 👋
        </h1>
        <p className="text-gray-600 mt-2">
          Voici un aperçu de votre activité
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Leads actifs"
          value="24"
          change="+12%"
          icon="🎯"
          positive
        />
        <StatCard
          title="Réservations"
          value="156"
          change="+8%"
          icon="✈️"
          positive
        />
        <StatCard
          title="CA du mois"
          value="45,230€"
          change="+23%"
          icon="💰"
          positive
        />
        <StatCard
          title="Taux conversion"
          value="34%"
          change="+5%"
          icon="📈"
          positive
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Activité récente</h2>
          <div className="space-y-3">
            <ActivityItem
              icon="✅"
              text="Nouveau paiement reçu de Fatima Zahr"
              time="Il y a 5 min"
            />
            <ActivityItem
              icon="👤"
              text="Nouveau lead: Mohammed Ben Ali"
              time="Il y a 23 min"
            />
            <ActivityItem
              icon="📄"
              text="Document vérifié pour Ahmed Boussa"
              time="Il y a 1h"
            />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Prochains départs</h2>
          <div className="space-y-3">
            <DepartureItem
              name="Groupe Ramadan 2025"
              date="15 Mars 2025"
              pilgrims={45}
            />
            <DepartureItem
              name="Omra Avril"
              date="10 Avril 2025"
              pilgrims={32}
            />
            <DepartureItem name="Omra Mai" date="5 Mai 2025" pilgrims={28} />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  change,
  icon,
  positive,
}: {
  title: string;
  value: string;
  change: string;
  icon: string;
  positive?: boolean;
}) {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex items-center justify-between">
        <span className="text-3xl">{icon}</span>
        <span
          className={`text-sm font-medium ${
            positive ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {change}
        </span>
      </div>
      <h3 className="text-gray-600 text-sm mt-4">{title}</h3>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}

function ActivityItem({
  icon,
  text,
  time,
}: {
  icon: string;
  text: string;
  time: string;
}) {
  return (
    <div className="flex items-start space-x-3 pb-3 border-b last:border-0">
      <span className="text-xl">{icon}</span>
      <div className="flex-1">
        <p className="text-sm">{text}</p>
        <p className="text-xs text-gray-500 mt-1">{time}</p>
      </div>
    </div>
  );
}

function DepartureItem({
  name,
  date,
  pilgrims,
}: {
  name: string;
  date: string;
  pilgrims: number;
}) {
  return (
    <div className="flex items-center justify-between pb-3 border-b last:border-0">
      <div>
        <p className="font-medium">{name}</p>
        <p className="text-sm text-gray-600">{date}</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium">{pilgrims} pèlerins</p>
      </div>
    </div>
  );
}
