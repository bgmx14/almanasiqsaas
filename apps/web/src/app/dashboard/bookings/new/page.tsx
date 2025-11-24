'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { bookingsAPI, customersAPI, packagesAPI } from '@/lib/api';

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
}

interface Package {
  id: string;
  name: string;
  type: string;
  description?: string;
  basePrice: number;
  duration: number;
  currency: string;
}

export default function NewBookingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const customerId = searchParams.get('customerId');

  const [formData, setFormData] = useState({
    customerId: customerId || '',
    packageId: '',
    departureDate: '',
    returnDate: '',
    totalAmount: '',
    groupId: '',
    specialRequests: '',
  });

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchCustomersAndPackages();
  }, []);

  useEffect(() => {
    if (formData.packageId) {
      const pkg = packages.find((p) => p.id === formData.packageId);
      setSelectedPackage(pkg || null);
      if (pkg) {
        setFormData((prev) => ({
          ...prev,
          totalAmount: pkg.basePrice.toString(),
        }));

        // Auto-calculate return date based on package duration
        if (formData.departureDate && pkg.duration) {
          const departure = new Date(formData.departureDate);
          const returnDate = new Date(departure);
          returnDate.setDate(returnDate.getDate() + pkg.duration);
          setFormData((prev) => ({
            ...prev,
            returnDate: returnDate.toISOString().split('T')[0],
          }));
        }
      }
    }
  }, [formData.packageId, packages]);

  useEffect(() => {
    // Auto-calculate return date when departure changes
    if (formData.departureDate && selectedPackage?.duration) {
      const departure = new Date(formData.departureDate);
      const returnDate = new Date(departure);
      returnDate.setDate(returnDate.getDate() + selectedPackage.duration);
      setFormData((prev) => ({
        ...prev,
        returnDate: returnDate.toISOString().split('T')[0],
      }));
    }
  }, [formData.departureDate, selectedPackage]);

  const fetchCustomersAndPackages = async () => {
    try {
      const [customersResponse, packagesResponse] = await Promise.all([
        customersAPI.getAll({ limit: 100 }),
        packagesAPI.getAll({ limit: 100, isActive: true }),
      ]);
      setCustomers(customersResponse.data.data);
      setPackages(packagesResponse.data.data);
    } catch (error) {
      console.error('Error fetching data:', error);
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

    if (!formData.customerId) {
      newErrors.customerId = 'Le client est requis';
    }

    if (!formData.packageId) {
      newErrors.packageId = 'Le package est requis';
    }

    if (!formData.departureDate) {
      newErrors.departureDate = 'La date de départ est requise';
    }

    if (!formData.returnDate) {
      newErrors.returnDate = 'La date de retour est requise';
    }

    if (formData.departureDate && formData.returnDate) {
      const departure = new Date(formData.departureDate);
      const returnDate = new Date(formData.returnDate);
      if (returnDate <= departure) {
        newErrors.returnDate = 'La date de retour doit être après la date de départ';
      }
    }

    if (!formData.totalAmount || parseFloat(formData.totalAmount) <= 0) {
      newErrors.totalAmount = 'Le montant total est requis et doit être positif';
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

      const bookingData = {
        customerId: formData.customerId,
        packageId: formData.packageId,
        departureDate: new Date(formData.departureDate).toISOString(),
        returnDate: new Date(formData.returnDate).toISOString(),
        totalAmount: parseFloat(formData.totalAmount),
        groupId: formData.groupId || undefined,
        specialRequests: formData.specialRequests || undefined,
      };

      await bookingsAPI.create(bookingData);
      router.push('/dashboard/bookings');
    } catch (error: any) {
      console.error('Error creating booking:', error);
      setErrors({
        submit: error.response?.data?.error?.message || 'Erreur lors de la création de la réservation',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(amount);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nouvelle réservation</h1>
          <p className="mt-1 text-sm text-gray-500">
            Créez une nouvelle réservation pour un client
          </p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          Annuler
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer & Package Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Client et Package</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client <span className="text-red-500">*</span>
                </label>
                <Select
                  value={formData.customerId}
                  onChange={(e) => handleInputChange('customerId', e.target.value)}
                >
                  <option value="">Sélectionner un client...</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.firstName} {customer.lastName}
                      {customer.email ? ` (${customer.email})` : ''}
                    </option>
                  ))}
                </Select>
                {errors.customerId && (
                  <p className="mt-1 text-sm text-red-600">{errors.customerId}</p>
                )}
                {customers.length === 0 && (
                  <p className="mt-1 text-sm text-gray-500">
                    Aucun client disponible.{' '}
                    <button
                      type="button"
                      onClick={() => router.push('/dashboard/customers/new')}
                      className="text-blue-600 hover:underline"
                    >
                      Créer un client
                    </button>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Package <span className="text-red-500">*</span>
                </label>
                <Select
                  value={formData.packageId}
                  onChange={(e) => handleInputChange('packageId', e.target.value)}
                >
                  <option value="">Sélectionner un package...</option>
                  {packages.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.name} - {formatCurrency(pkg.basePrice, pkg.currency)} ({pkg.duration}{' '}
                      jours)
                    </option>
                  ))}
                </Select>
                {errors.packageId && (
                  <p className="mt-1 text-sm text-red-600">{errors.packageId}</p>
                )}
                {packages.length === 0 && (
                  <p className="mt-1 text-sm text-gray-500">Aucun package actif disponible.</p>
                )}
              </div>
            </div>

            {selectedPackage && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">{selectedPackage.name}</h4>
                {selectedPackage.description && (
                  <p className="text-sm text-blue-800 mb-2">{selectedPackage.description}</p>
                )}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-blue-700">Type:</span>{' '}
                    <span className="font-medium text-blue-900">{selectedPackage.type}</span>
                  </div>
                  <div>
                    <span className="text-blue-700">Durée:</span>{' '}
                    <span className="font-medium text-blue-900">
                      {selectedPackage.duration} jours
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-700">Prix de base:</span>{' '}
                    <span className="font-medium text-blue-900">
                      {formatCurrency(selectedPackage.basePrice, selectedPackage.currency)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dates */}
        <Card>
          <CardHeader>
            <CardTitle>Dates du voyage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Input
                  type="date"
                  label="Date de départ"
                  value={formData.departureDate}
                  onChange={(e) => handleInputChange('departureDate', e.target.value)}
                  error={errors.departureDate}
                  required
                />
              </div>
              <div>
                <Input
                  type="date"
                  label="Date de retour"
                  value={formData.returnDate}
                  onChange={(e) => handleInputChange('returnDate', e.target.value)}
                  error={errors.returnDate}
                  required
                />
              </div>
            </div>

            {formData.departureDate && formData.returnDate && (
              <div className="text-sm text-gray-600">
                Durée totale:{' '}
                {Math.ceil(
                  (new Date(formData.returnDate).getTime() -
                    new Date(formData.departureDate).getTime()) /
                    (1000 * 60 * 60 * 24)
                )}{' '}
                jours
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle>Tarification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Input
                  type="number"
                  label="Montant total"
                  value={formData.totalAmount}
                  onChange={(e) => handleInputChange('totalAmount', e.target.value)}
                  error={errors.totalAmount}
                  min="0"
                  step="0.01"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Le montant total de la réservation en EUR
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informations complémentaires</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Textarea
                label="Demandes spéciales (optionnel)"
                placeholder="Allergies, préférences de chambre, besoins particuliers..."
                value={formData.specialRequests}
                onChange={(e) => handleInputChange('specialRequests', e.target.value)}
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

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
          <Button type="submit" isLoading={isLoading}>
            Créer la réservation
          </Button>
        </div>
      </form>
    </div>
  );
}
