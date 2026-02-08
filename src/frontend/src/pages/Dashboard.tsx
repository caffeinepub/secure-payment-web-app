import { useState } from 'react';
import type { UserProfile } from '../backend';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { CreditCard, History, User, Shield } from 'lucide-react';
import PaymentSection from '../components/PaymentSection';
import PaymentHistorySection from '../components/PaymentHistorySection';

interface DashboardProps {
  userProfile: UserProfile;
}

export default function Dashboard({ userProfile }: DashboardProps) {
  const [activeTab, setActiveTab] = useState('payment');

  return (
    <div className="container max-w-6xl px-4 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h2 className="mb-2 text-3xl font-bold tracking-tight">Welcome, {userProfile.name}</h2>
        <p className="text-muted-foreground">Manage your payments and view transaction history</p>
      </div>

      {/* User Info Card */}
      <Card className="mb-8 border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Account Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <p className="text-sm text-muted-foreground">User ID</p>
              <p className="font-mono text-sm font-medium">{userProfile.userId}</p>
            </div>
            <div className="flex-1 min-w-[200px]">
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="text-sm font-medium">{userProfile.email}</p>
            </div>
            <div className="flex-1 min-w-[200px]">
              <p className="text-sm text-muted-foreground">Aadhaar (Masked)</p>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <p className="font-mono text-sm font-medium">{userProfile.aadhaarMasked}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="payment" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Make Payment
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="payment" className="space-y-4">
          <PaymentSection userProfile={userProfile} />
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <PaymentHistorySection userId={userProfile.userId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
