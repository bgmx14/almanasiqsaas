'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { leadsAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { LEAD_STATUSES } from '@omraflow/shared';

export default function NewLeadPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    source: '',
    budget: '',
    numberOfPilgrims: '1',
    preferredDate: '',
    notes: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Le prénom est requis';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Le nom est requis';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Le téléphone est requis';
    } else if (!/^[\d\s+()-]+$/.test(formData.phone)) {
      newErrors.phone = 'Numéro de téléphone invalide';
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email invalide';
    }
    if (formData.budget && isNaN(Number(formData.budget))) {
      newErrors.budget = 'Le budget doit être un nombre';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsLoading(true);
    try {
      const data = {
        ...formData,
        budget: formData.budget ? Number(formData.budget) : undefined,
        numberOfPilgrims: Number(formData.numberOfPilgrims),
        email: formData.email || undefined,
      };

      await leadsAPI.create(data);
      router.push('/dashboard/leads');
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error?.message || 'Erreur lors de la création du lead';
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Nouveau Lead</h1>
        <p className="text-gray-600 mt-1">
          Ajoutez un nouveau prospect à votre pipeline
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informations personnelles */}
        <Card>
          <CardHeader>
            <CardTitle>Informations personnelles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Prénom"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                error={errors.firstName}
                required
              />
              <Input
                label="Nom"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                error={errors.lastName}
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
              />
              <Input
                label="Téléphone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                error={errors.phone}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Détails du projet */}
        <Card>
          <CardHeader>
            <CardTitle>Détails du projet Omra</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Source"
                name="source"
                value={formData.source}
                onChange={handleChange}
                options={[
                  { value: 'website', label: 'Site web' },
                  { value: 'facebook', label: 'Facebook' },
                  { value: 'instagram', label: 'Instagram' },
                  { value: 'referral', label: 'Recommandation' },
                  { value: 'phone', label: 'Téléphone' },
                  { value: 'email', label: 'Email' },
                  { value: 'walk-in', label: 'Visite agence' },
                  { value: 'other', label: 'Autre' },
                ]}
              />
              <Input
                label="Budget estimé (€)"
                name="budget"
                type="number"
                value={formData.budget}
                onChange={handleChange}
                error={errors.budget}
                placeholder="ex: 2500"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nombre de pèlerins"
                name="numberOfPilgrims"
                type="number"
                min="1"
                value={formData.numberOfPilgrims}
                onChange={handleChange}
                required
              />
              <Input
                label="Date de départ souhaitée"
                name="preferredDate"
                type="date"
                value={formData.preferredDate}
                onChange={handleChange}
              />
            </div>
            <Textarea
              label="Notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Informations supplémentaires sur le lead..."
              rows={4}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            Annuler
          </Button>
          <Button type="submit" isLoading={isLoading}>
            Créer le lead
          </Button>
        </div>
      </form>
    </div>
  );
}
