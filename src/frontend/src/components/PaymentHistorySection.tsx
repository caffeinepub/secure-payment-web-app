import { useGetPaymentHistory } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Loader2, Receipt } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';

interface PaymentHistorySectionProps {
  userId: string;
}

export default function PaymentHistorySection({ userId }: PaymentHistorySectionProps) {
  const { data: payments, isLoading, error } = useGetPaymentHistory(userId);

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatAmount = (amount: bigint, currency: string) => {
    const value = Number(amount) / 100;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('complete') || statusLower.includes('success')) {
      return <Badge className="bg-green-500/10 text-green-700 dark:text-green-400">Completed</Badge>;
    }
    if (statusLower.includes('pending')) {
      return <Badge variant="secondary">Pending</Badge>;
    }
    if (statusLower.includes('fail') || statusLower.includes('cancel')) {
      return <Badge variant="destructive">Failed</Badge>;
    }
    return <Badge variant="outline">{status}</Badge>;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex min-h-[300px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertDescription>Failed to load payment history. Please try again.</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          Payment History
        </CardTitle>
        <CardDescription>View all your past transactions</CardDescription>
      </CardHeader>
      <CardContent>
        {!payments || payments.length === 0 ? (
          <div className="flex min-h-[200px] flex-col items-center justify-center text-center">
            <Receipt className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-lg font-medium text-muted-foreground">No transactions yet</p>
            <p className="text-sm text-muted-foreground">Your payment history will appear here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Transaction ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.transactionId}>
                    <TableCell className="whitespace-nowrap text-sm">
                      {formatDate(payment.timestamp)}
                    </TableCell>
                    <TableCell className="font-medium">{payment.description}</TableCell>
                    <TableCell className="whitespace-nowrap font-semibold">
                      {formatAmount(payment.amount, payment.currency)}
                    </TableCell>
                    <TableCell className="capitalize">{payment.paymentMethod}</TableCell>
                    <TableCell>{getStatusBadge(payment.status)}</TableCell>
                    <TableCell className="text-right">
                      <code className="rounded bg-muted px-2 py-1 text-xs">{payment.transactionId}</code>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
