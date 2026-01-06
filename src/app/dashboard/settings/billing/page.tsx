"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { billingService } from '@/services/finance/billing-service';
import { Subscription, Invoice, Plan, PaymentMethod } from '@/types/finance';
import { CreditCard, CheckCircle, Download, Loader2 } from 'lucide-react';

export default function BillingPage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [plans, setPlans] = useState<Plan[]>([]);

    useEffect(() => {
        let isMounted = true;
        async function loadData() {
            try {
                const tenantId = 'default-tenant'; // In prod: useAuth().tenantId
                const [sub, inv, pm, allPlans] = await Promise.all([
                    billingService.getCurrentSubscription(tenantId),
                    billingService.getInvoices(tenantId),
                    billingService.getPaymentMethods(tenantId),
                    billingService.getPlans() // Synchronous but good to standardise
                ]);
                
                if (isMounted) {
                    setSubscription(sub);
                    setInvoices(inv);
                    setPaymentMethods(pm);
                    setPlans(allPlans);
                }
            } catch (error) {
                console.error(error);
                if (isMounted) {
                    toast({ title: "Error", description: "Failed to load billing info.", variant: "destructive" });
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        }
        loadData();
        return () => { isMounted = false; };
    }, [toast]);

    const handleUpgrade = async (planId: string) => {
        toast({ title: "Processing Upgrade", description: "Redirecting to secure checkout..." });
    };

    const currentPlan = plans.find(p => p.id === subscription?.planId);

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin"/></div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Billing & Invoices</h2>
                    <p className="text-muted-foreground">Manage your subscription, payment methods, and billing history.</p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                
                {/* Current Plan */}
                <Card className="md:col-span-1">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            Current Plan
                            {subscription?.status === 'active' && <Badge className="bg-green-600">Active</Badge>}
                        </CardTitle>
                        <CardDescription>Your subscription renewal details.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-baseline">
                            <span className="text-2xl font-bold">{currentPlan?.name || 'Unknown Plan'}</span>
                            <span className="text-xl font-medium text-muted-foreground">
                                ${(currentPlan?.amount || 0) / 100} / {currentPlan?.interval}
                            </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                            Next billing date: {subscription?.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : 'N/A'}
                        </div>
                        <div className="pt-2">
                            <h4 className="font-medium text-sm mb-2">Included Features:</h4>
                            <ul className="text-sm space-y-1">
                                {currentPlan?.features.map(f => (
                                    <li key={f} className="flex items-center gap-2">
                                        <CheckCircle className="h-3 w-3 text-green-500"/> 
                                        {f.replace(/_/g, ' ')}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" variant="outline">Manage Subscription</Button>
                    </CardFooter>
                </Card>

                {/* Payment Methods */}
                <Card className="md:col-span-1">
                    <CardHeader>
                        <CardTitle>Payment Methods</CardTitle>
                        <CardDescription>Securely stored via Stripe/Adyen.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {paymentMethods.map(pm => (
                            <div key={pm.id} className="flex items-center justify-between p-3 border rounded bg-muted/20">
                                <div className="flex items-center gap-3">
                                    <CreditCard className="h-5 w-5 text-slate-600"/>
                                    <div>
                                        <div className="font-medium">{pm.details.brand} •••• {pm.details.last4}</div>
                                        <div className="text-xs text-muted-foreground">Expires {pm.details.expiryMonth}/{pm.details.expiryYear}</div>
                                    </div>
                                </div>
                                {pm.isDefault && <Badge variant="secondary">Default</Badge>}
                            </div>
                        ))}
                    </CardContent>
                    <CardFooter>
                        <Button variant="ghost" className="w-full gap-2">
                            <CreditCard className="h-4 w-4"/> Add New Card
                        </Button>
                    </CardFooter>
                </Card>
            </div>

            {/* Invoices */}
            <Card>
                <CardHeader>
                    <CardTitle>Invoice History</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Invoice</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {invoices.map(inv => (
                                <TableRow key={inv.id}>
                                    <TableCell className="font-medium">{inv.number}</TableCell>
                                    <TableCell>
                                        <Badge variant={inv.status === 'paid' ? 'outline' : 'destructive'} className={inv.status === 'paid' ? 'text-green-600 border-green-200' : ''}>
                                            {inv.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>${(inv.total / 100).toFixed(2)}</TableCell>
                                    <TableCell>{inv.dueDate}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                            <Download className="h-4 w-4 text-muted-foreground"/>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Plan Upgrade Options */}
            <div className="mt-8">
                <h3 className="text-xl font-bold mb-4">Available Plans</h3>
                <div className="grid md:grid-cols-3 gap-6">
                    {plans.map(plan => (
                        <Card key={plan.id} className={`flex flex-col ${subscription?.planId === plan.id ? 'border-primary ring-1 ring-primary' : ''}`}>
                            <CardHeader>
                                <CardTitle>{plan.name}</CardTitle>
                                <div className="text-3xl font-bold mt-2">
                                    ${plan.amount / 100} <span className="text-sm font-normal text-muted-foreground">/{plan.interval}</span>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <ul className="space-y-2">
                                    {plan.features.map(f => (
                                        <li key={f} className="flex items-center gap-2 text-sm">
                                            <CheckCircle className="h-4 w-4 text-green-500"/>
                                            {f.replace(/_/g, ' ')}
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                            <CardFooter>
                                <Button 
                                    className="w-full" 
                                    variant={subscription?.planId === plan.id ? "secondary" : "default"}
                                    onClick={() => handleUpgrade(plan.id)}
                                    disabled={subscription?.planId === plan.id}
                                >
                                    {subscription?.planId === plan.id ? 'Current Plan' : 'Upgrade'}
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
