'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { leadsAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LEAD_STATUSES } from '@omraflow/shared';
import { formatDate, formatCurrency } from '@omraflow/shared';

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  dateOfBirth?: string;
  status: string;
  source?: string;
  budget?: number;
  numberOfPilgrims: number;
  preferredDate?: string;
  score: number;
  notes?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  lastContactedAt?: string;
  assignedTo?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  communications: Array<{
    id: string;
    type: string;
    direction: string;
    subject?: string;
    body: string;
    createdAt: string;
  }>;
  quotes: Array<{
    id: string;
    quoteNumber: string;
    title: string;
    total: number;
    status: string;
    createdAt: string;
  }>;
}

export default function LeadDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [lead, setLead] = useState<Lead | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConverting, setIsConverting] = useState(false);

  useEffect(() => {
    fetchLead();
  }, [params.id]);

  const fetchLead = async () => {
    setIsLoading(true);
    try {
      const response = await leadsAPI.getOne(params.id);
      setLead(response.data.data);
    } catch (error) {
      console.error('Error fetching lead:', error);
      alert('Erreur lors du chargement du lead');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConvert = async () => {
    if (!confirm('Voulez-vous convertir ce lead en client ?')) {
      return;
    }

    setIsConverting(true);
    try {
      await leadsAPI.convert(params.id);
      alert('Lead converti en client avec succès !');
      router.push('/dashboard/customers');
    } catch (error: any) {
      alert(error.response?.data?.error?.message || 'Erreur lors de la conversion');
    } finally {
      setIsConverting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce lead ? Cette action est irréversible.')) {
      return;
    }

    try {
      await leadsAPI.delete(params.id);
      alert('Lead supprimé avec succès');
      router.push('/dashboard/leads');
    } catch (error) {
      alert('Erreur lors de la suppression');
    }
  };

  const getStatusConfig = (status: string) => {
    return LEAD_STATUSES.find((s) => s.value === status) || LEAD_STATUSES[0];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl">Chargement...</div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Lead non trouvé</h2>
        <Link href="/dashboard/leads">
          <Button>Retour à la liste</Button>
        </Link>
      </div>
    );
  }

  const statusConfig = getStatusConfig(lead.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <h1 className="text-3xl font-bold">
              {lead.firstName} {lead.lastName}
            </h1>
            <Badge
              style={{
                backgroundColor: statusConfig.color + '20',
                color: statusConfig.color,
              }}
            >
              {statusConfig.label}
            </Badge>
          </div>
          <p className="text-gray-600">
            Lead créé le {new Date(lead.createdAt).toLocaleDateString('fr-FR')}
          </p>
        </div>
        <div className="flex space-x-2">
          <Link href={`/dashboard/leads/${lead.id}/edit`}>
            <Button variant="outline">
              <span className="mr-2">✏️</span>
              Modifier
            </Button>
          </Link>
          <Button variant="outline" onClick={handleConvert} isLoading={isConverting}>
            <span className="mr-2">✅</span>
            Convertir en Client
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <span className="mr-2">🗑️</span>
            Supprimer
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Info */}
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
                    {lead.email || <span className="text-gray-400">Non renseigné</span>}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Téléphone</div>
                  <div className="font-medium">{lead.phone}</div>
                </div>
                {lead.dateOfBirth && (
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Date de naissance</div>
                    <div className="font-medium">
                      {new Date(lead.dateOfBirth).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                )}
                {lead.assignedTo && (
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Assigné à</div>
                    <div className="font-medium">
                      {lead.assignedTo.firstName} {lead.assignedTo.lastName}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Project Details */}
          <Card>
            <CardHeader>
              <CardTitle>Détails du Projet</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Nombre de pèlerins</div>
                  <div className="font-medium text-lg">{lead.numberOfPilgrims}</div>
                </div>
                {lead.budget && (
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Budget</div>
                    <div className="font-medium text-lg text-green-600">
                      {formatCurrency(lead.budget, 'EUR')}
                    </div>
                  </div>
                )}
                {lead.source && (
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Source</div>
                    <div className="font-medium capitalize">{lead.source}</div>
                  </div>
                )}
                {lead.preferredDate && (
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Date souhaitée</div>
                    <div className="font-medium">
                      {new Date(lead.preferredDate).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                )}
              </div>
              {lead.notes && (
                <div>
                  <div className="text-sm text-gray-600 mb-2">Notes</div>
                  <div className="bg-gray-50 p-3 rounded-md whitespace-pre-wrap">
                    {lead.notes}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Communications */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Historique des Communications</CardTitle>
                <Button size="sm" variant="outline">
                  <span className="mr-2">+</span>
                  Ajouter
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {lead.communications && lead.communications.length > 0 ? (
                <div className="space-y-3">
                  {lead.communications.map((comm) => (
                    <div key={comm.id} className="border-l-4 border-blue-500 pl-4 py-2">
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-medium">
                          {comm.type === 'EMAIL' && '📧'}
                          {comm.type === 'SMS' && '💬'}
                          {comm.type === 'CALL' && '📞'}
                          {comm.type === 'NOTE' && '📝'}
                          <span className="ml-2">{comm.subject || comm.type}</span>
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(comm.createdAt).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">{comm.body}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  Aucune communication enregistrée
                </p>
              )}
            </CardContent>
          </Card>

          {/* Quotes */}
          {lead.quotes && lead.quotes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Devis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {lead.quotes.map((quote) => (
                    <div
                      key={quote.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <div>
                        <div className="font-medium">{quote.title}</div>
                        <div className="text-sm text-gray-500">
                          {quote.quoteNumber} •{' '}
                          {new Date(quote.createdAt).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600">
                          {formatCurrency(quote.total, 'EUR')}
                        </div>
                        <Badge variant="secondary">{quote.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Stats & Actions */}
        <div className="space-y-6">
          {/* Lead Score */}
          <Card>
            <CardHeader>
              <CardTitle>Score du Lead</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="relative inline-flex items-center justify-center w-32 h-32">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-gray-200"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 56}`}
                      strokeDashoffset={`${2 * Math.PI * 56 * (1 - lead.score / 100)}`}
                      className="text-blue-600"
                    />
                  </svg>
                  <span className="absolute text-3xl font-bold">{lead.score}</span>
                </div>
                <p className="text-sm text-gray-600 mt-2">Score de qualification</p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions Rapides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full" variant="outline">
                <span className="mr-2">📞</span>
                Appeler
              </Button>
              <Button className="w-full" variant="outline">
                <span className="mr-2">📧</span>
                Envoyer Email
              </Button>
              <Button className="w-full" variant="outline">
                <span className="mr-2">💬</span>
                Envoyer SMS
              </Button>
              <Button className="w-full" variant="outline">
                <span className="mr-2">📄</span>
                Créer Devis
              </Button>
            </CardContent>
          </Card>

          {/* Activity Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
                  <div className="flex-1">
                    <div className="font-medium">Lead créé</div>
                    <div className="text-gray-500">
                      {new Date(lead.createdAt).toLocaleString('fr-FR')}
                    </div>
                  </div>
                </div>
                {lead.lastContactedAt && (
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5" />
                    <div className="flex-1">
                      <div className="font-medium">Dernier contact</div>
                      <div className="text-gray-500">
                        {new Date(lead.lastContactedAt).toLocaleString('fr-FR')}
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 rounded-full bg-gray-300 mt-1.5" />
                  <div className="flex-1">
                    <div className="font-medium">Dernière mise à jour</div>
                    <div className="text-gray-500">
                      {new Date(lead.updatedAt).toLocaleString('fr-FR')}
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
