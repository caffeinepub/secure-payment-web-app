import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Shield, CreditCard, Lock, Smartphone } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const { login, loginStatus } = useInternetIdentity();

  const handleLogin = async () => {
    try {
      await login();
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.message === 'User is already authenticated') {
        toast.error('Already authenticated. Please refresh the page.');
      } else {
        toast.error('Login failed. Please try again.');
      }
    }
  };

  const isLoggingIn = loginStatus === 'logging-in';

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Hero Section */}
      <div className="container px-4 py-12">
        <div className="mx-auto max-w-6xl">
          {/* Logo and Title */}
          <div className="mb-12 text-center">
            <div className="mb-4 flex justify-center">
              <img
                src="/assets/generated/payment-logo-transparent.dim_200x200.png"
                alt="SecurePay Logo"
                className="h-24 w-24"
              />
            </div>
            <h1 className="mb-3 text-4xl font-bold tracking-tight sm:text-5xl">SecurePay</h1>
            <p className="text-lg text-muted-foreground">Secure payments with Aadhaar authentication</p>
          </div>

          {/* Hero Image */}
          <div className="mb-12 flex justify-center">
            <img
              src="/assets/generated/mobile-payment-hero.dim_800x600.png"
              alt="Mobile Payment"
              className="max-h-[300px] w-auto rounded-2xl shadow-2xl"
            />
          </div>

          {/* Login Card */}
          <div className="mx-auto max-w-md">
            <Card className="border-2 shadow-xl">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Welcome</CardTitle>
                <CardDescription>Login to access your secure payment dashboard</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Button
                  onClick={handleLogin}
                  disabled={isLoggingIn}
                  size="lg"
                  className="w-full text-base font-semibold"
                >
                  {isLoggingIn ? 'Logging in...' : 'Login with Internet Identity'}
                </Button>

                <div className="space-y-3 pt-4">
                  <div className="flex items-start gap-3 text-sm">
                    <Shield className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                    <div>
                      <p className="font-medium">Secure Authentication</p>
                      <p className="text-muted-foreground">Your identity is protected with blockchain technology</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-sm">
                    <Lock className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                    <div>
                      <p className="font-medium">Privacy First</p>
                      <p className="text-muted-foreground">Aadhaar numbers are masked for your security</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Features Grid */}
          <div className="mx-auto mt-16 grid max-w-4xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">Secure Registration</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Register with your Aadhaar number for verified identity</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <CreditCard className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">Stripe Payments</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Make secure transactions with industry-leading payment processing</p>
              </CardContent>
            </Card>

            <Card className="text-center sm:col-span-2 lg:col-span-1">
              <CardHeader>
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Smartphone className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">Mobile Optimized</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Native-like experience designed for Android devices</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
