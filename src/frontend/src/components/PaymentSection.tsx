import { useState } from 'react';
import { useCreateCheckoutSession } from '../hooks/useQueries';
import type { UserProfile } from '../backend';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { CreditCard, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface PaymentSectionProps {
  userProfile: UserProfile;
}

export default function PaymentSection({ userProfile }: PaymentSectionProps) {
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const createCheckout = useCreateCheckoutSession();

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (!description.trim()) {
      setError('Please enter a payment description');
      return;
    }

    try {
      const baseUrl = `${window.location.protocol}//${window.location.host}`;
      const successUrl = `${baseUrl}/#/payment-success`;
      const cancelUrl = `${baseUrl}/#/payment-cancel`;

      const items = [
        {
          currency,
          productName: description,
          productDescription: `Payment for ${description}`,
          priceInCents: BigInt(Math.round(amountNum * 100)),
          quantity: BigInt(1),
        },
      ];

      const session = await createCheckout.mutateAsync({ items, successUrl, cancelUrl });
      
      // Redirect to Stripe checkout
      window.location.href = session.url;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create payment session';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Create Payment
        </CardTitle>
        <CardDescription>Enter payment details to proceed with Stripe checkout</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handlePayment} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger id="currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD - US Dollar</SelectItem>
                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                  <SelectItem value="GBP">GBP - British Pound</SelectItem>
                  <SelectItem value="INR">INR - Indian Rupee</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="What is this payment for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" size="lg" disabled={createCheckout.isPending}>
            {createCheckout.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Session...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Proceed to Stripe Checkout
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
