'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { quotesAPI, leadsAPI, customersAPI } from '@/lib/api';

interface QuoteItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
}

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
}

export default function NewQuotePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const leadId = searchParams.get('leadId');
  const customerId = searchParams.get('customerId');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    clientType: leadId ? 'lead' : customerId ? 'customer' : '',
    leadId: leadId || '',
    customerId: customerId || '',
    validUntil: '',
    tax: '20',
    discount: '0',
  });

  const [items, setItems] = useState<QuoteItem[]>([
    { description: '', quantity: 1, unitPrice: 0, total: 0 },
  ]);

  const [leads, setLeads] = useState<Lead[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchLeadsAndCustomers();
  }, []);

  useEffect(() => {
    // Set default validity to 30 days from now
    const defaultValidUntil = new Date();
    defaultValidUntil.setDate(defaultValidUntil.getDate() + 30);
    setFormData((prev) => ({
      ...prev,
      validUntil: defaultValidUntil.toISOString().split('T')[0],
    }));
  }, []);

  const fetchLeadsAndCustomers = async () => {
    try {
      const [leadsResponse, customersResponse] = await Promise.all([
        leadsAPI.getAll({ limit: 100 }),
        customersAPI.getAll({ limit: 100 }),
      ]);
      setLeads(leadsResponse.data.data);
      setCustomers(customersResponse.data.data);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleItemChange = (index: number, field: keyof QuoteItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    // Recalculate total for this item
    if (field === 'quantity' || field === 'unitPrice') {
      newItems[index].total = newItems[index].quantity * newItems[index].unitPrice;
    }

    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0, total: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + item.total, 0);
  };

  const calculateTax = () => {
    return (calculateSubtotal() * parseFloat(formData.tax || '0')) / 100;
  };

  const calculateDiscount = () => {
    return parseFloat(formData.discount || '0');
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax() - calculateDiscount();
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Le titre est requis';
    }

    if (!formData.clientType) {
      newErrors.clientType = 'Veuillez sélectionner un type de client';
    }

    if (formData.clientType === 'lead' && !formData.leadId) {
      newErrors.leadId = 'Veuillez sélectionner un prospect';
    }

    if (formData.clientType === 'customer' && !formData.customerId) {
      newErrors.customerId = 'Veuillez sélectionner un client';
    }

    if (!formData.validUntil) {
      newErrors.validUntil = 'La date de validité est requise';
    }

    // Validate items
    items.forEach((item, index) => {
      if (!item.description.trim()) {
        newErrors[`item_${index}_description`] = 'La description est requise';
      }
      if (item.quantity <= 0) {
        newErrors[`item_${index}_quantity`] = 'La quantité doit être supérieure à 0';
      }
      if (item.unitPrice <= 0) {
        newErrors[`item_${index}_unitPrice`] = 'Le prix unitaire doit être supérieur à 0';
      }
    });

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

      const quoteData = {
        title: formData.title,
        description: formData.description || undefined,
        leadId: formData.clientType === 'lead' ? formData.leadId : undefined,
        customerId: formData.clientType === 'customer' ? formData.customerId : undefined,
        items: items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
        })),
        subtotal: calculateSubtotal(),
        tax: calculateTax(),
        discount: calculateDiscount(),
        total: calculateTotal(),
        validUntil: new Date(formData.validUntil).toISOString(),
        status: 'DRAFT',
      };

      await quotesAPI.create(quoteData);
      router.push('/dashboard/quotes');
    } catch (error: any) {
      console.error('Error creating quote:', error);
      setErrors({ submit: error.response?.data?.error?.message || 'Erreur lors de la création du devis' });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nouveau devis</h1>
          <p className="mt-1 text-sm text-gray-500">
            Créez un devis pour un prospect ou un client
          </p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          Annuler
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informations générales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Input
                  label="Titre du devis"
                  placeholder="Ex: Package Omra Ramadan 2024"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  error={errors.title}
                  required
                />
              </div>
              <div className="md:col-span-2">
                <Textarea
                  label="Description (optionnel)"
                  placeholder="Détails supplémentaires..."
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Client Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Client</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type de client <span className="text-red-500">*</span>
                </label>
                <Select
                  value={formData.clientType}
                  onChange={(e) => handleInputChange('clientType', e.target.value)}
                >
                  <option value="">Sélectionner...</option>
                  <option value="lead">Prospect</option>
                  <option value="customer">Client</option>
                </Select>
                {errors.clientType && (
                  <p className="mt-1 text-sm text-red-600">{errors.clientType}</p>
                )}
              </div>

              {formData.clientType === 'lead' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prospect <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={formData.leadId}
                    onChange={(e) => handleInputChange('leadId', e.target.value)}
                  >
                    <option value="">Sélectionner un prospect...</option>
                    {leads.map((lead) => (
                      <option key={lead.id} value={lead.id}>
                        {lead.firstName} {lead.lastName} {lead.email ? `(${lead.email})` : ''}
                      </option>
                    ))}
                  </Select>
                  {errors.leadId && (
                    <p className="mt-1 text-sm text-red-600">{errors.leadId}</p>
                  )}
                </div>
              )}

              {formData.clientType === 'customer' && (
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
                        {customer.firstName} {customer.lastName} {customer.email ? `(${customer.email})` : ''}
                      </option>
                    ))}
                  </Select>
                  {errors.customerId && (
                    <p className="mt-1 text-sm text-red-600">{errors.customerId}</p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Line Items */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Articles / Prestations</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              + Ajouter un article
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-3">
                <div className="flex items-start justify-between">
                  <span className="text-sm font-medium text-gray-700">Article {index + 1}</span>
                  {items.length > 1 && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeItem(index)}
                    >
                      Supprimer
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="md:col-span-2">
                    <Input
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      error={errors[`item_${index}_description`]}
                    />
                  </div>
                  <div>
                    <Input
                      type="number"
                      placeholder="Quantité"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                      error={errors[`item_${index}_quantity`]}
                      min="0"
                      step="1"
                    />
                  </div>
                  <div>
                    <Input
                      type="number"
                      placeholder="Prix unitaire"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                      error={errors[`item_${index}_unitPrice`]}
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium text-gray-700">
                    Total: {formatCurrency(item.total)}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Pricing & Validity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Validité</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                type="date"
                label="Valide jusqu'au"
                value={formData.validUntil}
                onChange={(e) => handleInputChange('validUntil', e.target.value)}
                error={errors.validUntil}
                required
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Calculs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Input
                    type="number"
                    label="TVA (%)"
                    value={formData.tax}
                    onChange={(e) => handleInputChange('tax', e.target.value)}
                    min="0"
                    max="100"
                    step="0.01"
                  />
                </div>
                <div>
                  <Input
                    type="number"
                    label="Remise (€)"
                    value={formData.discount}
                    onChange={(e) => handleInputChange('discount', e.target.value)}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Sous-total:</span>
                  <span className="font-medium">{formatCurrency(calculateSubtotal())}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">TVA ({formData.tax}%):</span>
                  <span className="font-medium">{formatCurrency(calculateTax())}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Remise:</span>
                  <span className="font-medium text-red-600">
                    -{formatCurrency(calculateDiscount())}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
                  <span>Total:</span>
                  <span className="text-blue-600">{formatCurrency(calculateTotal())}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

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
            Créer le devis
          </Button>
        </div>
      </form>
    </div>
  );
}
