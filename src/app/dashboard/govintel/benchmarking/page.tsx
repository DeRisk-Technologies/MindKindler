"use client";

import { generateBenchmark, BenchmarkSnapshot } from "@/govintel/benchmarking/scorecard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, TrendingUp, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function BenchmarkingPage() {
    const [benchmark, setBenchmark] = useState<BenchmarkSnapshot | null>(null);
    const [loading, setLoading] = useState(false);
    const [scope, setScope] = useState<"councilComparison"|"stateComparison">("councilComparison");
    const router = useRouter();

    const handleRun = async () => {
        setLoading(true);
        // Mock ID for parent scope
        const res = await generateBenchmark(scope, "demo_parent");
        setBenchmark(res);
        setLoading(false);
    };

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Benchmarking</h1>
                    <p className="text-muted-foreground">Compare performance across regions.</p>
                </div>
                <div className="flex gap-2">
                    <Select value={scope} onValueChange={(v:any) => setScope(v)}>
                        <SelectTrigger className="w-[200px]"><SelectValue/></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="councilComparison">Council Comparison</SelectItem>
                            <SelectItem value="stateComparison">State Comparison</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button onClick={handleRun} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Run Benchmark
                    </Button>
                </div>
            </div>

            {benchmark ? (
                <div className="space-y-8">
                    {/* Charts */}
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader><CardTitle>Overall Score Ranking</CardTitle></CardHeader>
                            <CardContent className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={benchmark.units.slice(0, 10)} layout="vertical">
                                        <XAxis type="number" domain={[0, 100]} />
                                        <YAxis dataKey="unitName" type="category" width={80} />
                                        <Tooltip />
                                        <Bar dataKey="scores.overall" fill="#4f46e5" radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle>Outcomes vs Safeguarding</CardTitle></CardHeader>
                            <CardContent className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={benchmark.units.slice(0, 10)}>
                                        <XAxis dataKey="unitName" />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar dataKey="scores.outcomes" fill="#22c55e" name="Outcomes" />
                                        <Bar dataKey="scores.safeguarding" fill="#ef4444" name="Safeguarding" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Table */}
                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Rank</TableHead>
                                        <TableHead>Unit Name</TableHead>
                                        <TableHead>Overall</TableHead>
                                        <TableHead>Outcomes</TableHead>
                                        <TableHead>Safeguarding</TableHead>
                                        <TableHead>Compliance</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {benchmark.units.map((u, i) => (
                                        <TableRow key={i}>
                                            <TableCell className="font-bold">#{i+1}</TableCell>
                                            <TableCell>{u.unitName}</TableCell>
                                            <TableCell><Badge variant="outline">{u.scores.overall}</Badge></TableCell>
                                            <TableCell>{u.suppressed.includes('outcomes') ? "—" : u.scores.outcomes}</TableCell>
                                            <TableCell>{u.suppressed.includes('safeguarding') ? "—" : u.scores.safeguarding}</TableCell>
                                            <TableCell>{u.scores.compliance}</TableCell>
                                            <TableCell>
                                                {u.outlierStatus === 'top10' && <Badge className="bg-green-600"><TrendingUp className="h-3 w-3 mr-1"/> Top Tier</Badge>}
                                                {u.outlierStatus === 'bottom10' && <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1"/> Risk</Badge>}
                                                {u.outlierStatus === 'normal' && <span className="text-muted-foreground text-xs">Normal</span>}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button size="sm" variant="ghost" onClick={() => router.push(`/dashboard/govintel/benchmarking/${u.unitId}`)}>
                                                    Details
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            ) : (
                <div className="text-center py-20 border-2 border-dashed rounded-lg bg-slate-50 text-muted-foreground">
                    Click "Run Benchmark" to generate a comparison report.
                </div>
            )}
        </div>
    );
}
