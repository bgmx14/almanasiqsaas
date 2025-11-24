'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { customersAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatCurrency } from '@omraflow/shared';

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  dateOfBirth?: string;
  gender?: string;
  nationality?: string;
  address?: string;
  city?: string;
  zipCode?: string;
  country?: string;
  passportNumber?: string;
  passportExpiry?: string;
  passportCountry?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyRelation?: string;
  medicalConditions?: string;
  dietaryRestrictions?: string;
  mobilityIssues: boolean;
  source?: string;
  tags: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export default function CustomerDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCustomer();
  }, [params.id]);

  const fetchCustomer = async () => {
    setIsLoading(true);
    try {
      const response = await customersAPI.getOne(params.id);
      setCustomer(response.data.data);
    } catch (error) {
      console.error('Error fetching customer:', error);
      alert('Erreur lors du chargement du client');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce client ? Cette action est irréversible.')) {
      return;
    }

    try {
      await customersAPI.delete(params.id);
      alert('Client supprimé avec succès');
      router.push('/dashboard/customers');
    } catch (error) {
      alert('Erreur lors de la suppression');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl">Chargement...</div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Client non trouvé</h2>
        <Link href="/dashboard/customers">
          <Button>Retour à la liste</Button>
        </Link>
      </div>
    );
  }

  const isPassportExpiringSoon = customer.passportExpiry &&
    new Date(customer.passportExpiry) < new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <h1 className="text-3xl font-bold">
              {customer.firstName} {customer.lastName}
            </h1>
            {customer.mobilityIssues && (
              <Badge variant="warning">♿ PMR</Badge>
            )}
          </div>
          <p className="text-gray-600">
            Client depuis le {new Date(customer.createdAt).toLocaleDateString('fr-FR')}
          </p>
        </div>
        <div className="flex space-x-2">
          <Link href={`/dashboard/bookings/new?customerId=${customer.id}`}>
            <Button>
              <span className="mr-2">✈️</span>
              Nouvelle Réservation
            </Button>
          </Link>
          <Link href={`/dashboard/customers/${customer.id}/edit`}>
            <Button variant="outline">
              <span className="mr-2">✏️</span>
              Modifier
            </Button>
          </Link>
          <Button variant="destructive" onClick={handleDelete}>
            🗑️
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {isPassportExpiringSoon && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">⚠️</div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Le passeport expire bientôt le{' '}
                {new Date(customer.passportExpiry!).toLocaleDateString('fr-FR')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Informations de Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Email</div>
                  <div className="font-medium">
                    {customer.email || <span className="text-gray-400">Non renseigné</span>}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Téléphone</div>
                  <div className="font-medium">{customer.phone}</div>
                </div>
              </div>
              {customer.address && (
                <div>
                  <div className="text-sm text-gray-600 mb-1">Adresse</div>
                  <div className="font-medium">
                    {customer.address}
                    {customer.city && `, ${customer.city}`}
                    {customer.zipCode && ` ${customer.zipCode}`}
                    {customer.country && `, ${customer.country}`}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle>Informations Personnelles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {customer.dateOfBirth && (
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Date de naissance</div>
                    <div className="font-medium">
                      {new Date(customer.dateOfBirth).toLocaleDateString('fr-FR')}
                      {' ('}
                      {Math.floor((Date.now() - new Date(customer.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))}
                      {' ans)'}
                    </div>
                  </div>
                )}
                {customer.gender && (
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Genre</div>
                    <div className="font-medium">
                      {customer.gender === 'MALE' ? 'Homme' : 'Femme'}
                    </div>
                  </div>
                )}
                {customer.nationality && (
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Nationalité</div>
                    <div className="font-medium">{customer.nationality}</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Passport */}
          <Card>
            <CardHeader>
              <CardTitle>Passeport</CardTitle>
            </CardHeader>
            <CardContent>
              {customer.passportNumber ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Numéro</div>
                      <div className="font-medium font-mono">{customer.passportNumber}</div>
                    </div>
                    {customer.passportExpiry && (
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Date d'expiration</div>
                        <div className={`font-medium ${isPassportExpiringSoon ? 'text-yellow-600' : ''}`}>
                          {new Date(customer.passportExpiry).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                    )}
                    {customer.passportCountry && (
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Pays d'émission</div>
                        <div className="font-medium">{customer.passportCountry}</div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">Aucune information de passeport enregistrée</p>
              )}
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          {customer.emergencyContactName && (
            <Card>
              <CardHeader>
                <CardTitle>Contact d'Urgence</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Nom</div>
                    <div className="font-medium">{customer.emergencyContactName}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Téléphone</div>
                    <div className="font-medium">{customer.emergencyContactPhone}</div>
                  </div>
                  {customer.emergencyRelation && (
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Relation</div>
                      <div className="font-medium">{customer.emergencyRelation}</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Medical Info */}
          {(customer.medicalConditions || customer.dietaryRestrictions || customer.mobilityIssues) && (
            <Card>
              <CardHeader>
                <CardTitle>Informations Médicales</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {customer.medicalConditions && (
                  <div>
                    <div className="text-sm text-gray-600 mb-2">Conditions médicales</div>
                    <div className="bg-gray-50 p-3 rounded-md whitespace-pre-wrap">
                      {customer.medicalConditions}
                    </div>
                  </div>
                )}
                {customer.dietaryRestrictions && (
                  <div>
                    <div className="text-sm text-gray-600 mb-2">Restrictions alimentaires</div>
                    <div className="bg-gray-50 p-3 rounded-md whitespace-pre-wrap">
                      {customer.dietaryRestrictions}
                    </div>
                  </div>
                )}
                {customer.mobilityIssues && (
                  <div className="flex items-center space-x-2">
                    <Badge variant="warning">♿</Badge>
                    <span>Personne à mobilité réduite</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {customer.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-3 rounded-md whitespace-pre-wrap">
                  {customer.notes}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions Rapides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href={`/dashboard/bookings/new?customerId=${customer.id}`}>
                <Button className="w-full">
                  <span className="mr-2">✈️</span>
                  Nouvelle Réservation
                </Button>
              </Link>
              <Button className="w-full" variant="outline">
                <span className="mr-2">📄</span>
                Créer Devis
              </Button>
              <Button className="w-full" variant="outline">
                <span className="mr-2">📞</span>
                Appeler
              </Button>
              <Button className="w-full" variant="outline">
                <span className="mr-2">📧</span>
                Envoyer Email
              </Button>
              <Button className="w-full" variant="outline">
                <span className="mr-2">📱</span>
                Envoyer SMS
              </Button>
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Statistiques</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-sm text-gray-600">Réservations totales</div>
                <div className="text-2xl font-bold">0</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Valeur client totale</div>
                <div className="text-2xl font-bold text-green-600">0€</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Dernière Omra</div>
                <div className="text-sm">Jamais</div>
              </div>
            </CardContent>
          </Card>

          {/* Documents Status */}
          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Passeport</span>
                {customer.passportNumber ? (
                  <Badge variant="success">✓</Badge>
                ) : (
                  <Badge variant="error">✗</Badge>
                )}
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Photo d'identité</span>
                <Badge variant="secondary">-</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Certificat vaccination</span>
                <Badge variant="secondary">-</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Assurance</span>
                <Badge variant="secondary">-</Badge>
              </div>
              <Button className="w-full mt-4" size="sm" variant="outline">
                Gérer Documents
              </Button>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
                  <div className="flex-1">
                    <div className="font-medium">Client créé</div>
                    <div className="text-gray-500">
                      {new Date(customer.createdAt).toLocaleString('fr-FR')}
                    </div>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 rounded-full bg-gray-300 mt-1.5" />
                  <div className="flex-1">
                    <div className="font-medium">Dernière modification</div>
                    <div className="text-gray-500">
                      {new Date(customer.updatedAt).toLocaleString('fr-FR')}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
