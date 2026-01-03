// src/app/dashboard/integrations/page.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Database, FileSpreadsheet, Activity, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function IntegrationsPage() {
  return (
    <div className="space-y-6 p-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Integrations</h2>
        <p className="text-muted-foreground">Connect external systems to sync data.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* CSV Import */}
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">CSV Importer</CardTitle>
                <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">Active</div>
                <p className="text-xs text-muted-foreground mb-4">Bulk upload students/rosters</p>
                <Button variant="outline" className="w-full" asChild>
                    <Link href="/dashboard/integrations/csv/new">New Import</Link>
                </Button>
            </CardContent>
        </Card>

        {/* OneRoster (Now Active) */}
        <Card className="border-orange-200 bg-orange-50/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">OneRoster 1.1</CardTitle>
                <ShieldCheck className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-orange-700">Ready</div>
                <p className="text-xs text-muted-foreground mb-4">Sync grades from Canvas/PowerSchool</p>
                <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white" asChild>
                    <Link href="/dashboard/integrations/oneroster/configure">Configure</Link>
                </Button>
            </CardContent>
        </Card>

        {/* Ed-Fi (Still Coming Soon) */}
        <Card className="opacity-60">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ed-Fi Alliance</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">Planned</div>
                <p className="text-xs text-muted-foreground mb-4">District-wide interoperability</p>
                <Button disabled variant="secondary" className="w-full">Coming Q3</Button>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
