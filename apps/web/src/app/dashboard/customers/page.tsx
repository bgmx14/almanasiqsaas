'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { customersAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  dateOfBirth?: string;
  nationality?: string;
  passportNumber?: string;
  passportExpiry?: string;
  source?: string;
  tags: string[];
  createdAt: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  useEffect(() => {
    fetchCustomers();
  }, [page]);

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const params: any = { page, limit };
      if (search) params.search = search;

      const response = await customersAPI.getAll(params);
      setCustomers(response.data.data);
      setTotal(response.data.meta.total);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchCustomers();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clients</h1>
          <p className="text-gray-600 mt-1">
            Gérez votre base de clients pèlerins
          </p>
        </div>
        <Link href="/dashboard/customers/new">
          <Button>
            <span className="mr-2">+</span>
            Nouveau Client
          </Button>
        </Link>
      </div>

      {/* Search & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="md:col-span-3 p-4">
          <div className="flex gap-4">
            <Input
              placeholder="Rechercher par nom, email ou téléphone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch}>
              🔍 Rechercher
            </Button>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Total Clients</div>
          <div className="text-2xl font-bold mt-1">{total}</div>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Passeport
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Nationalité
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date inscription
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    Chargement...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    Aucun client trouvé
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <Link
                        href={`/dashboard/customers/${customer.id}`}
                        className="font-medium text-blue-600 hover:text-blue-800"
                      >
                        {customer.firstName} {customer.lastName}
                      </Link>
                      {customer.dateOfBirth && (
                        <div className="text-xs text-gray-500 mt-1">
                          Né(e) le {new Date(customer.dateOfBirth).toLocaleDateString('fr-FR')}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {customer.email && (
                        <div className="text-gray-900">{customer.email}</div>
                      )}
                      <div className="text-gray-500">{customer.phone}</div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {customer.passportNumber ? (
                        <div>
                          <div className="font-mono">{customer.passportNumber}</div>
                          {customer.passportExpiry && (
                            <div className="text-xs text-gray-500">
                              Exp: {new Date(customer.passportExpiry).toLocaleDateString('fr-FR')}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">Non renseigné</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {customer.nationality || (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(customer.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex space-x-2">
                        <Link href={`/dashboard/customers/${customer.id}`}>
                          <Button size="sm" variant="outline">
                            Voir
                          </Button>
                        </Link>
                        <Link href={`/dashboard/bookings/new?customerId=${customer.id}`}>
                          <Button size="sm" variant="ghost">
                            ✈️
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
