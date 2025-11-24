'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { bookingsAPI } from '@/lib/api';

interface Payment {
  id: string;
  amount: number;
  method: string;
  status: string;
  reference?: string;
  createdAt: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  status: string;
  dueDate: string;
  createdAt: string;
}

interface Booking {
  id: string;
  bookingNumber: string;
  customerId: string;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    dateOfBirth?: string;
    passportNumber?: string;
    passportExpiry?: string;
  };
  packageId: string;
  package: {
    id: string;
    name: string;
    type: string;
    description?: string;
    basePrice: number;
    duration: number;
    inclusions: any[];
    exclusions: any[];
  };
  groupId?: string;
  group?: {
    id: string;
    name: string;
    description?: string;
    departureDate: string;
    returnDate: string;
  };
  departureDate: string;
  returnDate: string;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  currency: string;
  status: 'PENDING' | 'CONFIRMED' | 'PAYMENT_PENDING' | 'PAID' | 'CHECKED_IN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELED' | 'REFUNDED';
  contractSigned: boolean;
  contractSignedAt?: string;
  contractUrl?: string;
  roomNumber?: string;
  roomType?: string;
  specialRequests?: string;
  payments: Payment[];
  invoices: Invoice[];
  createdAt: string;
  updatedAt: string;
}

const BOOKING_STATUSES = [
  { value: 'PENDING', label: 'En attente', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'CONFIRMED', label: 'Confirmé', color: 'bg-blue-100 text-blue-800' },
  { value: 'PAYMENT_PENDING', label: 'Paiement en attente', color: 'bg-orange-100 text-orange-800' },
  { value: 'PAID', label: 'Payé', color: 'bg-green-100 text-green-800' },
  { value: 'CHECKED_IN', label: 'Enregistré', color: 'bg-purple-100 text-purple-800' },
  { value: 'IN_PROGRESS', label: 'En cours', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'COMPLETED', label: 'Terminé', color: 'bg-gray-100 text-gray-800' },
  { value: 'CANCELED', label: 'Annulé', color: 'bg-red-100 text-red-800' },
  { value: 'REFUNDED', label: 'Remboursé', color: 'bg-pink-100 text-pink-800' },
];

export default function BookingDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchBooking();
  }, [params.id]);

  const fetchBooking = async () => {
    try {
      setIsLoading(true);
      const response = await bookingsAPI.getOne(params.id);
      setBooking(response.data.data);
    } catch (error) {
      console.error('Error fetching booking:', error);
      router.push('/dashboard/bookings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!booking || !confirm('Confirmer cette réservation ?')) return;

    try {
      setActionLoading('confirm');
      // Note: This endpoint would need to be added to the API
      await bookingsAPI.update(booking.id, { status: 'CONFIRMED' });
      await fetchBooking();
      alert('Réservation confirmée !');
    } catch (error: any) {
      console.error('Error confirming booking:', error);
      alert(error.response?.data?.error?.message || 'Erreur lors de la confirmation');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async () => {
    if (!booking || !confirm('Êtes-vous sûr de vouloir annuler cette réservation ?')) return;

    try {
      setActionLoading('cancel');
      // Note: This endpoint would need to be added to the API
      await bookingsAPI.update(booking.id, { status: 'CANCELED' });
      await fetchBooking();
      alert('Réservation annulée');
    } catch (error: any) {
      console.error('Error canceling booking:', error);
      alert(error.response?.data?.error?.message || 'Erreur lors de l\'annulation');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!booking || !confirm('Êtes-vous sûr de vouloir supprimer cette réservation ? Cette action est irréversible.')) return;

    try {
      setActionLoading('delete');
      await bookingsAPI.delete(booking.id);
      router.push('/dashboard/bookings');
    } catch (error: any) {
      console.error('Error deleting booking:', error);
      alert(error.response?.data?.error?.message || 'Erreur lors de la suppression');
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: Booking['status']) => {
    const statusConfig = BOOKING_STATUSES.find((s) => s.value === status);
    return (
      <Badge className={statusConfig?.color || 'bg-gray-100 text-gray-800'}>
        {statusConfig?.label || status}
      </Badge>
    );
  };

  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(amount);
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

  const getDaysDifference = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getDaysUntilDeparture = (departureDate: string) => {
    const departure = new Date(departureDate);
    const today = new Date();
    const diffTime = departure.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Chargement...</div>
      </div>
    );
  }

  if (!booking) {
    return null;
  }

  const daysUntilDeparture = getDaysUntilDeparture(booking.departureDate);
  const tripDuration = getDaysDifference(booking.departureDate, booking.returnDate);
  const canConfirm = booking.status === 'PENDING';
  const canCancel = !['CANCELED', 'REFUNDED', 'COMPLETED'].includes(booking.status);
  const canDelete = booking.payments.length === 0 && !['COMPLETED'].includes(booking.status);
  const paymentProgress = booking.totalAmount > 0 ? (booking.paidAmount / booking.totalAmount) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">{booking.bookingNumber}</h1>
            {getStatusBadge(booking.status)}
            {booking.contractSigned && (
              <Badge className="bg-green-100 text-green-800">Contrat signé</Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Réservation pour {booking.customer.firstName} {booking.customer.lastName}
          </p>
        </div>
        <div className="flex gap-2">
          {canConfirm && (
            <Button
              onClick={handleConfirm}
              isLoading={actionLoading === 'confirm'}
              disabled={!!actionLoading}
            >
              Confirmer
            </Button>
          )}
          {canCancel && (
            <Button
              variant="destructive"
              onClick={handleCancel}
              isLoading={actionLoading === 'cancel'}
              disabled={!!actionLoading}
            >
              Annuler
            </Button>
          )}
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

      {/* Departure Alert */}
      {daysUntilDeparture > 0 && daysUntilDeparture <= 30 && booking.status !== 'CANCELED' && (
        <div className={`p-4 rounded-lg border ${daysUntilDeparture <= 7 ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'}`}>
          <p className={`text-sm ${daysUntilDeparture <= 7 ? 'text-red-800' : 'text-yellow-800'}`}>
            Départ dans {daysUntilDeparture} jour{daysUntilDeparture > 1 ? 's' : ''} - {formatDate(booking.departureDate)}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Booking Information */}
          <Card>
            <CardHeader>
              <CardTitle>Informations de la réservation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Date de départ</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(booking.departureDate)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Date de retour</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(booking.returnDate)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Durée du voyage</label>
                  <p className="mt-1 text-sm text-gray-900">{tripDuration} jours</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Devise</label>
                  <p className="mt-1 text-sm text-gray-900">{booking.currency}</p>
                </div>
              </div>

              {booking.group && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <label className="text-sm font-medium text-blue-900">Groupe</label>
                  <p className="mt-1 text-sm text-blue-800">{booking.group.name}</p>
                  {booking.group.description && (
                    <p className="mt-1 text-xs text-blue-700">{booking.group.description}</p>
                  )}
                </div>
              )}

              {(booking.roomNumber || booking.roomType) && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Hébergement</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {booking.roomType && `Type: ${booking.roomType}`}
                    {booking.roomNumber && ` - Chambre: ${booking.roomNumber}`}
                  </p>
                </div>
              )}

              {booking.specialRequests && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Demandes spéciales</label>
                  <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                    {booking.specialRequests}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Customer Information */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Client</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/dashboard/customers/${booking.customer.id}`)}
              >
                Voir le profil
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Nom complet</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {booking.customer.firstName} {booking.customer.lastName}
                  </p>
                </div>
                {booking.customer.email && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Email</label>
                    <p className="mt-1 text-sm text-gray-900">{booking.customer.email}</p>
                  </div>
                )}
                {booking.customer.phone && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Téléphone</label>
                    <p className="mt-1 text-sm text-gray-900">{booking.customer.phone}</p>
                  </div>
                )}
                {booking.customer.dateOfBirth && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Date de naissance</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {formatDate(booking.customer.dateOfBirth)}
                    </p>
                  </div>
                )}
              </div>

              {(booking.customer.passportNumber || booking.customer.passportExpiry) && (
                <div className="pt-3 border-t border-gray-200">
                  <label className="text-sm font-medium text-gray-700">Informations passeport</label>
                  <div className="mt-2 grid grid-cols-2 gap-4">
                    {booking.customer.passportNumber && (
                      <div>
                        <p className="text-xs text-gray-500">Numéro</p>
                        <p className="text-sm text-gray-900">{booking.customer.passportNumber}</p>
                      </div>
                    )}
                    {booking.customer.passportExpiry && (
                      <div>
                        <p className="text-xs text-gray-500">Expiration</p>
                        <p className="text-sm text-gray-900">
                          {formatDate(booking.customer.passportExpiry)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Package Details */}
          <Card>
            <CardHeader>
              <CardTitle>Package</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900">{booking.package.name}</h4>
                <p className="text-sm text-gray-500">{booking.package.type}</p>
              </div>

              {booking.package.description && (
                <p className="text-sm text-gray-700">{booking.package.description}</p>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Prix de base</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {formatCurrency(booking.package.basePrice)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Durée</label>
                  <p className="mt-1 text-sm text-gray-900">{booking.package.duration} jours</p>
                </div>
              </div>

              {booking.package.inclusions && booking.package.inclusions.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Inclus</label>
                  <ul className="space-y-1">
                    {booking.package.inclusions.map((item: any, index: number) => (
                      <li key={index} className="text-sm text-gray-700 flex items-start">
                        <svg
                          className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {typeof item === 'string' ? item : item.name || item.description}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payments History */}
          {booking.payments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Historique des paiements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {booking.payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {formatCurrency(payment.amount, booking.currency)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {payment.method} - {formatDate(payment.createdAt)}
                        </p>
                        {payment.reference && (
                          <p className="text-xs text-gray-400">Réf: {payment.reference}</p>
                        )}
                      </div>
                      <Badge
                        className={
                          payment.status === 'COMPLETED'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }
                      >
                        {payment.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Payment Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Résumé financier</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Montant total:</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(booking.totalAmount, booking.currency)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Montant payé:</span>
                  <span className="font-medium text-green-600">
                    {formatCurrency(booking.paidAmount, booking.currency)}
                  </span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                  <span className="text-gray-600 font-medium">Reste à payer:</span>
                  <span
                    className={`font-bold ${
                      booking.balanceDue > 0 ? 'text-orange-600' : 'text-green-600'
                    }`}
                  >
                    {formatCurrency(booking.balanceDue, booking.currency)}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div>
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Progression du paiement</span>
                  <span>{Math.round(paymentProgress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all"
                    style={{ width: `${paymentProgress}%` }}
                  ></div>
                </div>
              </div>

              <Button
                variant="default"
                className="w-full"
                onClick={() => router.push(`/dashboard/payments/new?bookingId=${booking.id}`)}
                disabled={booking.balanceDue <= 0 || booking.status === 'CANCELED'}
              >
                Enregistrer un paiement
              </Button>
            </CardContent>
          </Card>

          {/* Contract Status */}
          <Card>
            <CardHeader>
              <CardTitle>Contrat</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {booking.contractSigned ? (
                <>
                  <div className="flex items-center gap-2 text-green-600">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="font-medium">Contrat signé</span>
                  </div>
                  {booking.contractSignedAt && (
                    <p className="text-sm text-gray-600">
                      Signé le {formatDateTime(booking.contractSignedAt)}
                    </p>
                  )}
                  {booking.contractUrl && (
                    <Button variant="outline" className="w-full" size="sm">
                      Télécharger le contrat
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-orange-600">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="font-medium">En attente de signature</span>
                  </div>
                  <Button variant="outline" className="w-full" size="sm">
                    Générer le contrat
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions rapides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => router.push(`/dashboard/customers/${booking.customer.id}`)}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                Voir le client
              </Button>
              {booking.customer.email && (
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
              {booking.customer.phone && (
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
                  Appeler le client
                </Button>
              )}
            </CardContent>
          </Card>

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
                    <p className="text-sm font-medium text-gray-900">Créée</p>
                    <p className="text-xs text-gray-500">{formatDateTime(booking.createdAt)}</p>
                  </div>
                </div>

                {booking.status === 'CONFIRMED' && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Confirmée</p>
                      <p className="text-xs text-gray-500">{formatDateTime(booking.updatedAt)}</p>
                    </div>
                  </div>
                )}

                {booking.contractSigned && booking.contractSignedAt && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Contrat signé</p>
                      <p className="text-xs text-gray-500">
                        {formatDateTime(booking.contractSignedAt)}
                      </p>
                    </div>
                  </div>
                )}

                {booking.payments.length > 0 && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {booking.payments.length} paiement{booking.payments.length > 1 ? 's' : ''}
                      </p>
                      <p className="text-xs text-gray-500">
                        Dernier: {formatDate(booking.payments[0].createdAt)}
                      </p>
                    </div>
                  </div>
                )}

                {booking.status === 'CANCELED' && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Annulée</p>
                      <p className="text-xs text-gray-500">{formatDateTime(booking.updatedAt)}</p>
                    </div>
                  </div>
                )}

                {booking.updatedAt !== booking.createdAt && booking.status !== 'CANCELED' && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-gray-300 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Dernière modification</p>
                      <p className="text-xs text-gray-500">{formatDateTime(booking.updatedAt)}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
