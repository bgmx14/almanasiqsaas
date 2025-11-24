'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { paymentsAPI, bookingsAPI } from '@/lib/api';

interface Booking {
  id: string;
  bookingNumber: string;
  customer: { firstName: string; lastName: string };
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  currency: string;
}

const PAYMENT_METHODS = [
  { value: 'CARD', label: 'Carte bancaire' },
  { value: 'BANK_TRANSFER', label: 'Virement bancaire' },
  { value: 'CHECK', label: 'Chèque' },
  { value: 'CASH', label: 'Espèces' },
  { value: 'PAYPAL', label: 'PayPal' },
  { value: 'APPLE_PAY', label: 'Apple Pay' },
  { value: 'GOOGLE_PAY', label: 'Google Pay' },
];

export default function NewPaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId');

  const [formData, setFormData] = useState({
    bookingId: bookingId || '',
    amount: '',
    method: 'CARD',
    reference: '',
    notes: '',
    paidAt: new Date().toISOString().split('T')[0],
  });

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    if (formData.bookingId) {
      const booking = bookings.find((b) => b.id === formData.bookingId);
      setSelectedBooking(booking || null);
      if (booking && !formData.amount) {
        // Pre-fill with balance due
        setFormData((prev) => ({
          ...prev,
          amount: booking.balanceDue.toString(),
        }));
      }
    }
  }, [formData.bookingId, bookings]);

  const fetchBookings = async () => {
    try {
      const response = await bookingsAPI.getAll({ limit: 100 });
      // Filter out canceled bookings and fully paid bookings
      const activeBookings = response.data.data.filter(
        (b: Booking) => b.status !== 'CANCELED' && b.balanceDue > 0
      );
      setBookings(activeBookings);

      // If bookingId is in URL, find and set that booking
      if (bookingId) {
        const booking = activeBookings.find((b: Booking) => b.id === bookingId);
        if (booking) {
          setSelectedBooking(booking);
          setFormData((prev) => ({
            ...prev,
            amount: booking.balanceDue.toString(),
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.bookingId) {
      newErrors.bookingId = 'La réservation est requise';
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Le montant est requis et doit être positif';
    }

    if (selectedBooking && parseFloat(formData.amount) > selectedBooking.balanceDue) {
      newErrors.amount = `Le montant ne peut pas dépasser le solde restant (${formatCurrency(
        selectedBooking.balanceDue,
        selectedBooking.currency
      )})`;
    }

    if (!formData.method) {
      newErrors.method = 'Le mode de paiement est requis';
    }

    if (!formData.paidAt) {
      newErrors.paidAt = 'La date de paiement est requise';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      setIsLoading(true);

      const paymentData = {
        bookingId: formData.bookingId,
        amount: parseFloat(formData.amount),
        method: formData.method,
        reference: formData.reference || undefined,
        notes: formData.notes || undefined,
        paidAt: new Date(formData.paidAt).toISOString(),
        status: 'COMPLETED',
      };

      await paymentsAPI.create(paymentData);

      // Redirect to booking detail page
      router.push(`/dashboard/bookings/${formData.bookingId}`);
    } catch (error: any) {
      console.error('Error creating payment:', error);
      setErrors({
        submit: error.response?.data?.error?.message || 'Erreur lors de l\'enregistrement du paiement',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(amount);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Enregistrer un paiement</h1>
          <p className="mt-1 text-sm text-gray-500">
            Enregistrez un nouveau paiement pour une réservation
          </p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          Annuler
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Booking Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Réservation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Réservation <span className="text-red-500">*</span>
              </label>
              <Select
                value={formData.bookingId}
                onChange={(e) => handleInputChange('bookingId', e.target.value)}
                disabled={!!bookingId} // Disable if coming from booking detail page
              >
                <option value="">Sélectionner une réservation...</option>
                {bookings.map((booking) => (
                  <option key={booking.id} value={booking.id}>
                    {booking.bookingNumber} - {booking.customer.firstName}{' '}
                    {booking.customer.lastName} - Reste:{' '}
                    {formatCurrency(booking.balanceDue, booking.currency)}
                  </option>
                ))}
              </Select>
              {errors.bookingId && (
                <p className="mt-1 text-sm text-red-600">{errors.bookingId}</p>
              )}
              {bookings.length === 0 && (
                <p className="mt-1 text-sm text-gray-500">
                  Aucune réservation avec solde impayé disponible.
                </p>
              )}
            </div>

            {selectedBooking && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-3">Détails de la réservation</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-blue-700">Client:</span>{' '}
                    <span className="font-medium text-blue-900">
                      {selectedBooking.customer.firstName} {selectedBooking.customer.lastName}
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-700">Numéro:</span>{' '}
                    <span className="font-medium text-blue-900">
                      {selectedBooking.bookingNumber}
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-700">Montant total:</span>{' '}
                    <span className="font-medium text-blue-900">
                      {formatCurrency(selectedBooking.totalAmount, selectedBooking.currency)}
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-700">Déjà payé:</span>{' '}
                    <span className="font-medium text-green-600">
                      {formatCurrency(selectedBooking.paidAmount, selectedBooking.currency)}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-blue-700">Reste à payer:</span>{' '}
                    <span className="font-bold text-orange-600 text-base">
                      {formatCurrency(selectedBooking.balanceDue, selectedBooking.currency)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Details */}
        <Card>
          <CardHeader>
            <CardTitle>Détails du paiement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Input
                  type="number"
                  label="Montant"
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  error={errors.amount}
                  min="0"
                  step="0.01"
                  required
                />
                {selectedBooking && (
                  <div className="mt-2 flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleInputChange('amount', selectedBooking.balanceDue.toString())
                      }
                    >
                      Solde complet
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleInputChange(
                          'amount',
                          (selectedBooking.balanceDue / 2).toFixed(2)
                        )
                      }
                    >
                      50%
                    </Button>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mode de paiement <span className="text-red-500">*</span>
                </label>
                <Select
                  value={formData.method}
                  onChange={(e) => handleInputChange('method', e.target.value)}
                >
                  {PAYMENT_METHODS.map((method) => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </Select>
                {errors.method && <p className="mt-1 text-sm text-red-600">{errors.method}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Input
                  type="text"
                  label="Référence (optionnel)"
                  placeholder="Numéro de transaction, chèque..."
                  value={formData.reference}
                  onChange={(e) => handleInputChange('reference', e.target.value)}
                />
              </div>
              <div>
                <Input
                  type="date"
                  label="Date de paiement"
                  value={formData.paidAt}
                  onChange={(e) => handleInputChange('paidAt', e.target.value)}
                  error={errors.paidAt}
                  required
                />
              </div>
            </div>

            <div>
              <Textarea
                label="Notes (optionnel)"
                placeholder="Informations complémentaires sur le paiement..."
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        {selectedBooking && formData.amount && parseFloat(formData.amount) > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Résumé</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Montant du paiement:</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(parseFloat(formData.amount), selectedBooking.currency)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Solde actuel:</span>
                  <span className="font-medium text-orange-600">
                    {formatCurrency(selectedBooking.balanceDue, selectedBooking.currency)}
                  </span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                  <span className="text-gray-600 font-medium">Nouveau solde:</span>
                  <span
                    className={`font-bold ${
                      selectedBooking.balanceDue - parseFloat(formData.amount) > 0
                        ? 'text-orange-600'
                        : 'text-green-600'
                    }`}
                  >
                    {formatCurrency(
                      selectedBooking.balanceDue - parseFloat(formData.amount),
                      selectedBooking.currency
                    )}
                  </span>
                </div>
                {selectedBooking.balanceDue - parseFloat(formData.amount) <= 0 && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800 font-medium">
                      ✓ Cette réservation sera entièrement soldée
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Message */}
        {errors.submit && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{errors.submit}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Annuler
          </Button>
          <Button type="submit" isLoading={isLoading} disabled={!selectedBooking}>
            Enregistrer le paiement
          </Button>
        </div>
      </form>
    </div>
  );
}
