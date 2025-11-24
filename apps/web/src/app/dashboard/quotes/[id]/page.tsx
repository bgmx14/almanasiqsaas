'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { quotesAPI } from '@/lib/api';

interface QuoteItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Quote {
  id: string;
  quoteNumber: string;
  title: string;
  description?: string;
  items: QuoteItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  validUntil: string;
  status: 'DRAFT' | 'SENT' | 'VIEWED' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  leadId?: string;
  customerId?: string;
  lead?: { id: string; firstName: string; lastName: string; email?: string; phone?: string };
  customer?: { id: string; firstName: string; lastName: string; email?: string; phone?: string };
  sentAt?: string;
  viewedAt?: string;
  acceptedAt?: string;
  rejectedAt?: string;
  createdAt: string;
  updatedAt: string;
}

const QUOTE_STATUSES = [
  { value: 'DRAFT', label: 'Brouillon', color: 'bg-gray-100 text-gray-800' },
  { value: 'SENT', label: 'Envoyé', color: 'bg-blue-100 text-blue-800' },
  { value: 'VIEWED', label: 'Consulté', color: 'bg-purple-100 text-purple-800' },
  { value: 'ACCEPTED', label: 'Accepté', color: 'bg-green-100 text-green-800' },
  { value: 'REJECTED', label: 'Refusé', color: 'bg-red-100 text-red-800' },
  { value: 'EXPIRED', label: 'Expiré', color: 'bg-orange-100 text-orange-800' },
];

export default function QuoteDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchQuote();
  }, [params.id]);

  const fetchQuote = async () => {
    try {
      setIsLoading(true);
      const response = await quotesAPI.getOne(params.id);
      setQuote(response.data.data);
    } catch (error) {
      console.error('Error fetching quote:', error);
      router.push('/dashboard/quotes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!quote || !confirm('Envoyer ce devis au client ?')) return;

    try {
      setActionLoading('send');
      await quotesAPI.send(quote.id);
      await fetchQuote();
      alert('Devis envoyé avec succès !');
    } catch (error: any) {
      console.error('Error sending quote:', error);
      alert(error.response?.data?.error?.message || 'Erreur lors de l\'envoi du devis');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAccept = async () => {
    if (!quote || !confirm('Accepter ce devis ?')) return;

    try {
      setActionLoading('accept');
      await quotesAPI.accept(quote.id);
      await fetchQuote();
      alert('Devis accepté !');
    } catch (error: any) {
      console.error('Error accepting quote:', error);
      alert(error.response?.data?.error?.message || 'Erreur lors de l\'acceptation du devis');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!quote || !confirm('Rejeter ce devis ?')) return;

    try {
      setActionLoading('reject');
      await quotesAPI.reject(quote.id);
      await fetchQuote();
      alert('Devis rejeté');
    } catch (error: any) {
      console.error('Error rejecting quote:', error);
      alert(error.response?.data?.error?.message || 'Erreur lors du rejet du devis');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!quote || !confirm('Êtes-vous sûr de vouloir supprimer ce devis ?')) return;

    try {
      setActionLoading('delete');
      await quotesAPI.delete(quote.id);
      router.push('/dashboard/quotes');
    } catch (error: any) {
      console.error('Error deleting quote:', error);
      alert(error.response?.data?.error?.message || 'Erreur lors de la suppression du devis');
      setActionLoading(null);
    }
  };

  const handleDownloadPDF = async () => {
    if (!quote) return;

    try {
      setActionLoading('pdf');
      const response = await quotesAPI.generatePDF(quote.id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${quote.quoteNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error: any) {
      console.error('Error downloading PDF:', error);
      alert(error.response?.data?.error?.message || 'Erreur lors du téléchargement du PDF');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: Quote['status']) => {
    const statusConfig = QUOTE_STATUSES.find((s) => s.value === status);
    return (
      <Badge className={statusConfig?.color || 'bg-gray-100 text-gray-800'}>
        {statusConfig?.label || status}
      </Badge>
    );
  };

  const isExpired = (validUntil: string) => {
    return new Date(validUntil) < new Date();
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

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Chargement...</div>
      </div>
    );
  }

  if (!quote) {
    return null;
  }

  const client = quote.customer || quote.lead;
  const canEdit = quote.status === 'DRAFT';
  const canSend = quote.status === 'DRAFT' && !isExpired(quote.validUntil);
  const canAccept = ['SENT', 'VIEWED'].includes(quote.status) && !isExpired(quote.validUntil);
  const canReject = ['SENT', 'VIEWED'].includes(quote.status);
  const canDelete = quote.status !== 'ACCEPTED';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">{quote.quoteNumber}</h1>
            {getStatusBadge(quote.status)}
            {isExpired(quote.validUntil) && quote.status !== 'ACCEPTED' && (
              <Badge className="bg-red-100 text-red-800">Expiré</Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-500">{quote.title}</p>
        </div>
        <div className="flex gap-2">
          {canSend && (
            <Button
              onClick={handleSend}
              isLoading={actionLoading === 'send'}
              disabled={!!actionLoading}
            >
              Envoyer
            </Button>
          )}
          {canAccept && (
            <Button
              onClick={handleAccept}
              variant="default"
              isLoading={actionLoading === 'accept'}
              disabled={!!actionLoading}
            >
              Accepter
            </Button>
          )}
          {canReject && (
            <Button
              onClick={handleReject}
              variant="destructive"
              isLoading={actionLoading === 'reject'}
              disabled={!!actionLoading}
            >
              Rejeter
            </Button>
          )}
          <Button
            variant="outline"
            onClick={handleDownloadPDF}
            isLoading={actionLoading === 'pdf'}
            disabled={!!actionLoading}
          >
            Télécharger PDF
          </Button>
          {canDelete && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              isLoading={actionLoading === 'delete'}
              disabled={!!actionLoading}
            >
              Supprimer
            </Button>
          )}
        </div>
      </div>

      {/* Expiry Warning */}
      {isExpired(quote.validUntil) && quote.status !== 'ACCEPTED' && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">
            Ce devis a expiré le {formatDate(quote.validUntil)}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quote Information */}
          <Card>
            <CardHeader>
              <CardTitle>Informations du devis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {quote.description && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Description</label>
                  <p className="mt-1 text-sm text-gray-900">{quote.description}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Date de création</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(quote.createdAt)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Valide jusqu'au</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(quote.validUntil)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Client Information */}
          {client && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {quote.customer ? 'Client' : 'Prospect'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <label className="text-sm font-medium text-gray-700">Nom</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {client.firstName} {client.lastName}
                  </p>
                </div>
                {client.email && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Email</label>
                    <p className="mt-1 text-sm text-gray-900">{client.email}</p>
                  </div>
                )}
                {client.phone && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Téléphone</label>
                    <p className="mt-1 text-sm text-gray-900">{client.phone}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Line Items */}
          <Card>
            <CardHeader>
              <CardTitle>Articles / Prestations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Description
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Qté
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Prix unitaire
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {quote.items.map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3 text-sm text-gray-900">{item.description}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                          {formatCurrency(item.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="mt-6 space-y-2 border-t border-gray-200 pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Sous-total:</span>
                  <span className="font-medium">{formatCurrency(quote.subtotal)}</span>
                </div>
                {quote.tax > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">TVA:</span>
                    <span className="font-medium">{formatCurrency(quote.tax)}</span>
                  </div>
                )}
                {quote.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Remise:</span>
                    <span className="font-medium text-red-600">
                      -{formatCurrency(quote.discount)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
                  <span>Total:</span>
                  <span className="text-blue-600">{formatCurrency(quote.total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Historique</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-gray-400 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Créé</p>
                    <p className="text-xs text-gray-500">{formatDateTime(quote.createdAt)}</p>
                  </div>
                </div>

                {quote.sentAt && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Envoyé</p>
                      <p className="text-xs text-gray-500">{formatDateTime(quote.sentAt)}</p>
                    </div>
                  </div>
                )}

                {quote.viewedAt && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Consulté</p>
                      <p className="text-xs text-gray-500">{formatDateTime(quote.viewedAt)}</p>
                    </div>
                  </div>
                )}

                {quote.acceptedAt && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Accepté</p>
                      <p className="text-xs text-gray-500">{formatDateTime(quote.acceptedAt)}</p>
                    </div>
                  </div>
                )}

                {quote.rejectedAt && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Rejeté</p>
                      <p className="text-xs text-gray-500">{formatDateTime(quote.rejectedAt)}</p>
                    </div>
                  </div>
                )}

                {quote.updatedAt !== quote.createdAt && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-gray-300 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Dernière modification</p>
                      <p className="text-xs text-gray-500">{formatDateTime(quote.updatedAt)}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions rapides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {client && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    const type = quote.customer ? 'customers' : 'leads';
                    router.push(`/dashboard/${type}/${client.id}`);
                  }}
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  Voir le {quote.customer ? 'client' : 'prospect'}
                </Button>
              )}
              {client?.email && (
                <Button variant="outline" className="w-full justify-start">
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  Envoyer un email
                </Button>
              )}
              {client?.phone && (
                <Button variant="outline" className="w-full justify-start">
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  Appeler
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
