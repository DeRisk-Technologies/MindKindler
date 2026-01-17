import React from 'react';
import { DistrictReport, SystemicAlert } from '../../types/analytics';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { AlertTriangle, ShieldAlert, TrendingUp, Activity, Map as MapIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import dynamic from 'next/dynamic';

// Dynamic Import for Map (Client Side Only)
const SchoolsMap = dynamic(() => import('../maps/SchoolsMap').then(mod => mod.SchoolsMap), { 
    ssr: false,
    loading: () => <div className="h-[400px] w-full bg-slate-100 animate-pulse rounded-lg flex items-center justify-center text-slate-400">Loading Geospatial Data...</div>
});

interface GuardianDashboardProps {
    report: DistrictReport;
}

export function GuardianDashboard({ report }: GuardianDashboardProps) {
    const { activeAlerts, breachProjections, topNeeds, totalActiveCases } = report;

    const sortedAlerts = [...activeAlerts].sort((a, b) => {
        const severityScore: Record<string, number> = { critical: 3, high: 2, medium: 1, low: 0 };
        return severityScore[b.severity] - severityScore[a.severity];
    });

    // Mock Schools for Visual (In prod: fetch from schools collection)
    const mockSchools = [
        { id: '1', name: 'Clifton Green Primary', address: { street: 'Water Lane, York', coordinates: { lat: 53.97, lng: -1.10 } }, stats: { activeCases: 3, studentsOnRoll: 420 }, senco: { name: 'Mrs. Senco', email: 'senco@clifton.sch.uk' } },
        { id: '2', name: 'York High School', address: { street: 'Cornlands Rd, York', coordinates: { lat: 53.95, lng: -1.12 } }, stats: { activeCases: 8, studentsOnRoll: 900 }, senco: { name: 'Mr. Lead', phone: '01904 123456' } },
        { id: '3', name: 'St Barnabas CE', address: { street: 'Jubilee Terrace, York', coordinates: { lat: 53.96, lng: -1.11 } }, stats: { activeCases: 0, studentsOnRoll: 210 } }
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-900">
                        <ShieldAlert className="w-6 h-6 text-indigo-600" />
                        Guardian Command Center
                    </h2>
                    <p className="text-sm text-gray-500">
                        Systemic Risk Monitoring & Statutory Compliance Overwatch
                    </p>
                </div>
                <Badge variant="outline" className="text-xs font-mono">
                    Last Scan: {new Date(report.generatedAt).toLocaleString()}
                </Badge>
            </div>

            {/* Top Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className={cn("border-l-4", breachProjections > 0 ? "border-l-red-500" : "border-l-green-500")}>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500 uppercase">Statutory Breaches (Projected)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-end gap-2">
                            <span className={cn("text-4xl font-bold", breachProjections > 0 ? "text-red-600" : "text-gray-900")}>
                                {breachProjections}
                            </span>
                            <span className="text-sm text-gray-400 mb-1">/ {totalActiveCases} Active Cases</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Cases at risk of missing the 20-week deadline.</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-indigo-500">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500 uppercase">Active Pattern Alerts</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-end gap-2">
                            <span className="text-4xl font-bold text-indigo-600">{activeAlerts.length}</span>
                            <span className="text-sm text-gray-400 mb-1">Systemic Risks</span>
                        </div>
                         <p className="text-xs text-gray-500 mt-2">Clusters detected across schools/postcodes.</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-blue-500">
                     <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500 uppercase">Total Caseload</CardTitle>
                    </CardHeader>
                     <CardContent>
                        <div className="flex items-end gap-2">
                            <span className="text-4xl font-bold text-gray-900">{totalActiveCases}</span>
                            <span className="text-sm text-gray-400 mb-1">Children</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Currently undergoing EHC Needs Assessment.</p>
                    </CardContent>
                </Card>
            </div>

            {/* Map Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MapIcon className="w-5 h-5 text-indigo-500" />
                        Geospatial Hotspots
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <SchoolsMap schools={mockSchools} />
                </CardContent>
            </Card>

            {/* Main Content Split */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left: Risk Radar */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="w-5 h-5 text-red-500" />
                            Risk Radar (Live Feed)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {sortedAlerts.length === 0 ? (
                            <div className="text-center py-12 text-gray-400">
                                No systemic risks detected. All quiet on the western front.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {sortedAlerts.map(alert => (
                                    <div key={alert.id} className={cn("p-4 rounded-lg border flex flex-col md:flex-row gap-4 items-start md:items-center", alert.severity === 'critical' ? "bg-red-50 border-red-200" : alert.severity === 'high' ? "bg-orange-50 border-orange-200" : "bg-amber-50 border-amber-200")}>
                                        <div className={cn("p-2 rounded-full shrink-0", alert.severity === 'critical' ? "bg-red-100 text-red-600" : alert.severity === 'high' ? "bg-orange-100 text-orange-600" : "bg-amber-100 text-amber-600")}>
                                            <AlertTriangle className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className={cn("font-bold text-sm uppercase tracking-wide", alert.severity === 'critical' ? "text-red-800" : "text-gray-800")}>{alert.type.replace('_', ' ')}</h4>
                                                <Badge variant="outline" className="bg-white/50">{alert.targetId}</Badge>
                                            </div>
                                            <p className="text-sm text-gray-700 font-medium">{alert.description}</p>
                                            <p className="text-xs text-gray-500 mt-1">Detected: {new Date(alert.detectedAt).toLocaleDateString()}</p>
                                        </div>
                                        <Badge className={cn("uppercase", alert.severity === 'critical' ? "bg-red-600" : "bg-gray-600")}>{alert.severity} Priority</Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Right: Needs Profile */}
                <Card>
                     <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-blue-500" />
                            District Needs Profile
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {Object.entries(topNeeds).map(([need, count]) => (
                                <div key={need}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="font-medium text-gray-700">{need}</span>
                                        <span className="text-gray-500">{Math.round((count / totalActiveCases) * 100)}% ({count})</span>
                                    </div>
                                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(count / totalActiveCases) * 100}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
