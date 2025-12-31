"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, FileText, Settings, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function PartnerRevenuePage() {
  const [stats, setStats] = useState({
    pendingPayouts: 0,
    platformRevenue: 0,
    totalTransactions: 0
  });

  useEffect(() => {
    async function fetchStats() {
      // In a real app, this would be an aggregation query or cloud function result.
      // Here we just fetch recent ledger entries to sum them up client-side for demo.
      const q = query(collection(db, "partnerRevenueLedger"), orderBy("createdAt", "desc"), limit(100));
      const snap = await getDocs(q);
      
      let pending = 0;
      let platform = 0;
      
      snap.forEach(doc => {
        const data = doc.data();
        if (data.status === 'pending') {
          pending += data.partnerEarnedAmount || 0;
        }
        platform += data.platformEarnedAmount || 0;
      });

      setStats({
        pendingPayouts: pending,
        platformRevenue: platform,
        totalTransactions: snap.size
      });
    }
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Partner Revenue Center</h2>
        <div className="flex space-x-2">
            <Link href="/dashboard/partners/revenue/rules">
                <Button variant="outline">
                    <Settings className="mr-2 h-4 w-4" />
                    Manage Rules
                </Button>
            </Link>
            <Link href="/dashboard/partners/revenue/statements">
                <Button>
                    <FileText className="mr-2 h-4 w-4" />
                    Statements
                </Button>
            </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payouts</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.pendingPayouts.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">To be included in next statements</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Revenue (Recent)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.platformRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">From last 100 transactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTransactions}</div>
            <p className="text-xs text-muted-foreground">Ledger entries processed</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                    <h4 className="text-base font-medium">Generate Monthly Statements</h4>
                    <p className="text-sm text-muted-foreground">
                        Process pending ledger entries for all partners.
                    </p>
                </div>
                <Link href="/dashboard/partners/revenue/statements">
                    <Button variant="ghost" size="sm">Go <ArrowRight className="ml-2 h-4 w-4" /></Button>
                </Link>
            </div>
             <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                    <h4 className="text-base font-medium">Review Invoices</h4>
                    <p className="text-sm text-muted-foreground">
                        See generated invoices waiting for payment.
                    </p>
                </div>
                <Link href="/dashboard/partners/revenue/invoices">
                    <Button variant="ghost" size="sm">Go <ArrowRight className="ml-2 h-4 w-4" /></Button>
                </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
