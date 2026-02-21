'use client';

import React, { useEffect, useState } from 'react';
import { CreditCard, Plus, Trash2, Loader2, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { api, API_ENDPOINTS } from '@/lib/api';
import { isApiSuccess } from '@/types';
import { toast } from 'sonner';
import { PaymentMethodListSchema, type PaymentMethod } from '../schemas';

export function PaymentMethods() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [methodToDelete, setMethodToDelete] = useState<PaymentMethod | null>(null);

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      const response = await api.get<PaymentMethod[]>(API_ENDPOINTS.BILLING.PAYMENT_METHODS);
      if (isApiSuccess(response)) {
        // Zod validation: Zero-Trust Data Layer
        const validatedMethods = PaymentMethodListSchema.parse(response.data);
        setPaymentMethods(validatedMethods);
      } else {
        toast.error(response.error.message || 'Failed to load payment methods');
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to load payment methods');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPaymentMethod = () => {
    // Open Stripe customer portal for adding payment methods
    const portalUrl = process.env.NEXT_PUBLIC_STRIPE_CUSTOMER_PORTAL_URL;
    if (portalUrl) {
      window.open(portalUrl, '_blank');
    } else {
      toast.error('Customer portal URL not configured');
    }
  };

  const handleDeletePaymentMethod = async () => {
    if (!methodToDelete) return;

    try {
      setDeletingId(methodToDelete.id);
      const response = await api.delete(
        `${API_ENDPOINTS.BILLING.PAYMENT_METHODS}/${methodToDelete.id}`
      );

      if (isApiSuccess(response)) {
        toast.success('Payment method removed');
        setPaymentMethods((prev) => prev.filter((pm) => pm.id !== methodToDelete.id));
      } else {
        toast.error('Failed to remove payment method');
      }
    } catch (error) {
      console.error('Error deleting payment method:', error);
      toast.error('Failed to remove payment method');
    } finally {
      setDeletingId(null);
      setMethodToDelete(null);
    }
  };

  const getCardBrandIcon = (brand: string) => {
    // You can replace these with actual card brand icons/images
    return brand.toUpperCase();
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Methods
          </CardTitle>
          <CardDescription>Manage your payment methods and billing information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Methods
              </CardTitle>
              <CardDescription>Manage your payment methods and billing information</CardDescription>
            </div>
            <Button onClick={handleAddPaymentMethod} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Card
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {paymentMethods.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border py-12 text-center">
              <CreditCard className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">No payment methods</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Add a payment method to manage your subscription
              </p>
              <Button onClick={handleAddPaymentMethod} variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Add Payment Method
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-16 items-center justify-center rounded-md bg-muted text-xs font-bold">
                      {getCardBrandIcon(method.brand)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {method.brand} •••• {method.last4}
                        </p>
                        {method.isDefault && (
                          <Badge variant="default" className="text-xs">
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Default
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Expires {method.expiryMonth.toString().padStart(2, '0')}/{method.expiryYear}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setMethodToDelete(method)}
                    disabled={method.isDefault || deletingId !== null}
                  >
                    {deletingId === method.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 text-destructive" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={methodToDelete !== null} onOpenChange={() => setMethodToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove payment method?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this payment method? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePaymentMethod} className="bg-destructive text-destructive-foreground">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
