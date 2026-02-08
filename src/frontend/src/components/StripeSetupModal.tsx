import { useState, useEffect } from 'react';
import { useIsStripeConfigured, useSetStripeConfiguration, useIsCallerAdmin } from '../hooks/useQueries';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { AlertCircle, Loader2, Settings } from 'lucide-react';
import { toast } from 'sonner';

export default function StripeSetupModal() {
  const [secretKey, setSecretKey] = useState('');
  const [countries, setCountries] = useState('US,CA,GB,IN');
  const [error, setError] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const { data: isConfigured, isLoading: configLoading } = useIsStripeConfigured();
  const { data: isAdmin, isLoading: adminLoading } = useIsCallerAdmin();
  const setConfig = useSetStripeConfiguration();

  useEffect(() => {
    // Show modal only if user is admin and Stripe is not configured
    if (!configLoading && !adminLoading && isAdmin && !isConfigured) {
      setIsOpen(true);
    }
  }, [isConfigured, isAdmin, configLoading, adminLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!secretKey.trim()) {
      setError('Stripe secret key is required');
      return;
    }

    const countryList = countries
      .split(',')
      .map((c) => c.trim().toUpperCase())
      .filter((c) => c.length === 2);

    if (countryList.length === 0) {
      setError('Please enter at least one valid country code (e.g., US, CA, GB)');
      return;
    }

    try {
      await setConfig.mutateAsync({
        secretKey: secretKey.trim(),
        allowedCountries: countryList,
      });
      toast.success('Stripe configuration saved successfully!');
      setIsOpen(false);
    } catch (err: any) {
      setError(err.message || 'Failed to save configuration');
      toast.error('Configuration failed');
    }
  };

  // Don't show modal if not admin or already configured
  if (!isAdmin || isConfigured || configLoading || adminLoading) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Settings className="h-6 w-6" />
            Configure Stripe
          </DialogTitle>
          <DialogDescription>
            Set up Stripe payment processing to enable transactions. This is required before users can make payments.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="secretKey">Stripe Secret Key</Label>
            <Input
              id="secretKey"
              type="password"
              placeholder="sk_test_..."
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Get your secret key from the{' '}
              <a
                href="https://dashboard.stripe.com/apikeys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Stripe Dashboard
              </a>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="countries">Allowed Countries</Label>
            <Input
              id="countries"
              placeholder="US,CA,GB,IN"
              value={countries}
              onChange={(e) => setCountries(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Comma-separated list of 2-letter country codes (e.g., US, CA, GB, IN)
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button type="submit" className="flex-1" disabled={setConfig.isPending}>
              {setConfig.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Configuration'
              )}
            </Button>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Skip
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
