'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { leadsAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { LEAD_STATUSES } from '@omraflow/shared';

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  status: string;
  source?: string;
  budget?: number;
  numberOfPilgrims: number;
  score: number;
  createdAt: string;
  assignedTo?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  useEffect(() => {
    fetchLeads();
  }, [page, statusFilter]);

  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      const params: any = { page, limit };
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;

      const response = await leadsAPI.getAll(params);
      setLeads(response.data.data);
      setTotal(response.data.meta.total);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchLeads();
  };

  const getStatusColor = (status: string) => {
    const statusConfig = LEAD_STATUSES.find((s) => s.value === status);
    return statusConfig?.color || '#3B82F6';
  };

  const getStatusLabel = (status: string) => {
    const statusConfig = LEAD_STATUSES.find((s) => s.value === status);
    return statusConfig?.label || status;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Leads</h1>
          <p className="text-gray-600 mt-1">
            Gérez vos prospects et suivez votre pipeline
          </p>
        </div>
        <div className="flex space-x-3">
          <Link href="/dashboard/leads/pipeline">
            <Button variant="outline">
              <span className="mr-2">📊</span>
              Pipeline
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

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <Input
              placeholder="Rechercher par nom, email ou téléphone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <Select
            options={[
              { value: '', label: 'Tous les statuts' },
              ...LEAD_STATUSES.map((s) => ({ value: s.value, label: s.label })),
            ]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
          <Button onClick={handleSearch} variant="outline">
            🔍 Rechercher
          </Button>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-gray-600">Total Leads</div>
          <div className="text-2xl font-bold mt-1">{total}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Nouveaux (7j)</div>
          <div className="text-2xl font-bold mt-1 text-blue-600">
            {leads.filter((l) => l.status === 'NEW').length}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Qualifiés</div>
          <div className="text-2xl font-bold mt-1 text-green-600">
            {leads.filter((l) => l.status === 'QUALIFIED').length}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Taux conversion</div>
          <div className="text-2xl font-bold mt-1 text-purple-600">
            {total > 0
              ? Math.round((leads.filter((l) => l.status === 'WON').length / total) * 100)
              : 0}
            %
          </div>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lead
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pèlerins
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigné à
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    Chargement...
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    Aucun lead trouvé
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/dashboard/leads/${lead.id}`}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {lead.firstName} {lead.lastName}
                      </Link>
                      {lead.source && (
                        <div className="text-xs text-gray-500 mt-1">
                          Source: {lead.source}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {lead.email && (
                        <div className="text-gray-900">{lead.email}</div>
                      )}
                      <div className="text-gray-500">{lead.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge
                        style={{
                          backgroundColor: getStatusColor(lead.status) + '20',
                          color: getStatusColor(lead.status),
                        }}
                      >
                        {getStatusLabel(lead.status)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${lead.score}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600">{lead.score}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {lead.numberOfPilgrims}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {lead.assignedTo ? (
                        <div>
                          {lead.assignedTo.firstName} {lead.assignedTo.lastName}
                        </div>
                      ) : (
                        <span className="text-gray-400">Non assigné</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex space-x-2">
                        <Link href={`/dashboard/leads/${lead.id}`}>
                          <Button size="sm" variant="outline">
                            Voir
                          </Button>
                        </Link>
                        <Link href={`/dashboard/leads/${lead.id}/edit`}>
                          <Button size="sm" variant="ghost">
                            ✏️
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > limit && (
          <div className="px-6 py-4 border-t flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Affichage {(page - 1) * limit + 1} à {Math.min(page * limit, total)} sur{' '}
              {total} résultats
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                Précédent
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page * limit >= total}
              >
                Suivant
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
