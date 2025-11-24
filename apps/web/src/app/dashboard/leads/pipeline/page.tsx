'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { leadsAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LEAD_STATUSES } from '@omraflow/shared';

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  status: string;
  budget?: number;
  numberOfPilgrims: number;
  score: number;
}

export default function PipelinePage() {
  const [leadsByStatus, setLeadsByStatus] = useState<Record<string, Lead[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      const response = await leadsAPI.getAll({ limit: 100 });
      const leads = response.data.data;

      // Group leads by status
      const grouped: Record<string, Lead[]> = {};
      LEAD_STATUSES.forEach((status) => {
        grouped[status.value] = leads.filter((lead: Lead) => lead.status === status.value);
      });

      setLeadsByStatus(grouped);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    try {
      await leadsAPI.update(leadId, { status: newStatus });
      fetchLeads(); // Refresh
    } catch (error) {
      console.error('Error updating lead:', error);
      alert('Erreur lors de la mise à jour du statut');
    }
  };

  const getTotalValue = (leads: Lead[]) => {
    return leads.reduce((sum, lead) => sum + (lead.budget || 0), 0);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl">Chargement du pipeline...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pipeline de Vente</h1>
          <p className="text-gray-600 mt-1">
            Vue Kanban de vos leads par étape
          </p>
        </div>
        <div className="flex space-x-3">
          <Link href="/dashboard/leads">
            <Button variant="outline">
              <span className="mr-2">📋</span>
              Vue Liste
            </Button>
          </Link>
          <Link href="/dashboard/leads/new">
            <Button>
              <span className="mr-2">+</span>
              Nouveau Lead
            </Button>
          </Link>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {LEAD_STATUSES.map((status) => {
          const leads = leadsByStatus[status.value] || [];
          const totalValue = getTotalValue(leads);

          return (
            <div
              key={status.value}
              className="flex-shrink-0 w-80"
              style={{ minWidth: '320px' }}
            >
              {/* Column Header */}
              <div
                className="rounded-t-lg p-4 mb-2"
                style={{ backgroundColor: status.color + '15' }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold">{status.label}</h3>
                    <Badge
                      variant="secondary"
                      style={{
                        backgroundColor: status.color + '30',
                        color: status.color,
                      }}
                    >
                      {leads.length}
                    </Badge>
                  </div>
                  {totalValue > 0 && (
                    <div className="text-sm text-gray-600">
                      {new Intl.NumberFormat('fr-FR', {
                        style: 'currency',
                        currency: 'EUR',
                        maximumFractionDigits: 0,
                      }).format(totalValue)}
                    </div>
                  )}
                </div>
              </div>

              {/* Column Content */}
              <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
                {leads.length === 0 ? (
                  <Card className="p-4 text-center text-gray-500 text-sm">
                    Aucun lead
                  </Card>
                ) : (
                  leads.map((lead) => (
                    <Card
                      key={lead.id}
                      className="p-4 hover:shadow-md transition-shadow cursor-move"
                    >
                      <div className="space-y-2">
                        {/* Lead Name */}
                        <div className="flex items-start justify-between">
                          <Link
                            href={`/dashboard/leads/${lead.id}`}
                            className="font-medium text-blue-600 hover:text-blue-800"
                          >
                            {lead.firstName} {lead.lastName}
                          </Link>
                          <div className="text-xs text-gray-500">
                            Score: {lead.score}
                          </div>
                        </div>

                        {/* Contact Info */}
                        <div className="text-sm text-gray-600 space-y-1">
                          {lead.email && (
                            <div className="truncate">📧 {lead.email}</div>
                          )}
                          <div>📱 {lead.phone}</div>
                        </div>

                        {/* Budget & Pilgrims */}
                        <div className="flex items-center justify-between text-sm">
                          {lead.budget && (
                            <div className="text-green-600 font-medium">
                              {new Intl.NumberFormat('fr-FR', {
                                style: 'currency',
                                currency: 'EUR',
                              }).format(lead.budget)}
                            </div>
                          )}
                          <div className="text-gray-600">
                            👥 {lead.numberOfPilgrims} pèlerin
                            {lead.numberOfPilgrims > 1 ? 's' : ''}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="pt-2 border-t flex items-center justify-between">
                          <select
                            className="text-xs border rounded px-2 py-1"
                            value={lead.status}
                            onChange={(e) =>
                              handleStatusChange(lead.id, e.target.value)
                            }
                          >
                            {LEAD_STATUSES.map((s) => (
                              <option key={s.value} value={s.value}>
                                {s.label}
                              </option>
                            ))}
                          </select>
                          <Link href={`/dashboard/leads/${lead.id}`}>
                            <Button size="sm" variant="ghost">
                              👁️
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Stats */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Résumé du Pipeline</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-sm text-gray-600">Total Leads</div>
            <div className="text-2xl font-bold">
              {Object.values(leadsByStatus).reduce(
                (sum, leads) => sum + leads.length,
                0
              )}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Valeur Totale</div>
            <div className="text-2xl font-bold text-green-600">
              {new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'EUR',
                maximumFractionDigits: 0,
              }).format(
                Object.values(leadsByStatus).reduce(
                  (sum, leads) => sum + getTotalValue(leads),
                  0
                )
              )}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Taux Conversion</div>
            <div className="text-2xl font-bold text-purple-600">
              {Object.values(leadsByStatus).reduce(
                (sum, leads) => sum + leads.length,
                0
              ) > 0
                ? Math.round(
                    ((leadsByStatus['WON']?.length || 0) /
                      Object.values(leadsByStatus).reduce(
                        (sum, leads) => sum + leads.length,
                        0
                      )) *
                      100
                  )
                : 0}
              %
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Valeur Moyenne</div>
            <div className="text-2xl font-bold text-blue-600">
              {Object.values(leadsByStatus).reduce(
                (sum, leads) => sum + leads.length,
                0
              ) > 0
                ? new Intl.NumberFormat('fr-FR', {
                    style: 'currency',
                    currency: 'EUR',
                    maximumFractionDigits: 0,
                  }).format(
                    Object.values(leadsByStatus).reduce(
                      (sum, leads) => sum + getTotalValue(leads),
                      0
                    ) /
                      Object.values(leadsByStatus).reduce(
                        (sum, leads) => sum + leads.length,
                        0
                      )
                  )
                : '0€'}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
