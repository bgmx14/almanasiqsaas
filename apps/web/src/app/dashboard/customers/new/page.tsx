'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { customersAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { COUNTRIES } from '@omraflow/shared';

export default function NewCustomerPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    nationality: '',
    address: '',
    city: '',
    zipCode: '',
    country: 'FR',
    passportNumber: '',
    passportExpiry: '',
    passportCountry: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyRelation: '',
    medicalConditions: '',
    dietaryRestrictions: '',
    mobilityIssues: false,
    notes: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const finalValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

    setFormData((prev) => ({ ...prev, [name]: finalValue }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'Le prénom est requis';
    if (!formData.lastName.trim()) newErrors.lastName = 'Le nom est requis';
    if (!formData.phone.trim()) newErrors.phone = 'Le téléphone est requis';
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email invalide';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsLoading(true);
    try {
      const data = {
        ...formData,
        email: formData.email || undefined,
        dateOfBirth: formData.dateOfBirth || undefined,
        gender: formData.gender || undefined,
        passportExpiry: formData.passportExpiry || undefined,
      };

      await customersAPI.create(data);
      router.push('/dashboard/customers');
    } catch (error: any) {
      alert(error.response?.data?.error?.message || 'Erreur lors de la création');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Nouveau Client</h1>
        <p className="text-gray-600 mt-1">Ajoutez un nouveau client pèlerin</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informations personnelles */}
        <Card>
          <CardHeader>
            <CardTitle>Informations Personnelles</CardTitle>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Date de naissance"
                name="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={handleChange}
              />
              <Select
                label="Genre"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                options={[
                  { value: 'MALE', label: 'Homme' },
                  { value: 'FEMALE', label: 'Femme' },
                ]}
              />
              <Select
                label="Nationalité"
                name="nationality"
                value={formData.nationality}
                onChange={handleChange}
                options={COUNTRIES.map((c) => ({ value: c.code, label: `${c.flag} ${c.name}` }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardHeader>
            <CardTitle>Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
            <Input
              label="Adresse"
              name="address"
              value={formData.address}
              onChange={handleChange}
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Ville"
                name="city"
                value={formData.city}
                onChange={handleChange}
              />
              <Input
                label="Code postal"
                name="zipCode"
                value={formData.zipCode}
                onChange={handleChange}
              />
              <Select
                label="Pays"
                name="country"
                value={formData.country}
                onChange={handleChange}
                options={COUNTRIES.map((c) => ({ value: c.code, label: `${c.flag} ${c.name}` }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Passeport */}
        <Card>
          <CardHeader>
            <CardTitle>Informations Passeport</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Numéro de passeport"
                name="passportNumber"
                value={formData.passportNumber}
                onChange={handleChange}
              />
              <Input
                label="Date d'expiration"
                name="passportExpiry"
                type="date"
                value={formData.passportExpiry}
                onChange={handleChange}
              />
              <Select
                label="Pays d'émission"
                name="passportCountry"
                value={formData.passportCountry}
                onChange={handleChange}
                options={COUNTRIES.map((c) => ({ value: c.code, label: `${c.flag} ${c.name}` }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact d'urgence */}
        <Card>
          <CardHeader>
            <CardTitle>Contact d'Urgence</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Nom"
                name="emergencyContactName"
                value={formData.emergencyContactName}
                onChange={handleChange}
              />
              <Input
                label="Téléphone"
                name="emergencyContactPhone"
                type="tel"
                value={formData.emergencyContactPhone}
                onChange={handleChange}
              />
              <Input
                label="Relation"
                name="emergencyRelation"
                placeholder="ex: Époux, Fils, Ami..."
                value={formData.emergencyRelation}
                onChange={handleChange}
              />
            </div>
          </CardContent>
        </Card>

        {/* Informations médicales */}
        <Card>
          <CardHeader>
            <CardTitle>Informations Médicales & Préférences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              label="Conditions médicales"
              name="medicalConditions"
              value={formData.medicalConditions}
              onChange={handleChange}
              placeholder="Allergies, maladies chroniques, traitements..."
              rows={3}
            />
            <Textarea
              label="Restrictions alimentaires"
              name="dietaryRestrictions"
              value={formData.dietaryRestrictions}
              onChange={handleChange}
              placeholder="Végétarien, allergies, halal strict..."
              rows={2}
            />
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="mobilityIssues"
                name="mobilityIssues"
                checked={formData.mobilityIssues}
                onChange={handleChange}
                className="rounded"
              />
              <label htmlFor="mobilityIssues" className="text-sm">
                Problèmes de mobilité (PMR)
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Informations supplémentaires..."
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
            Créer le client
          </Button>
        </div>
      </form>
    </div>
  );
}
