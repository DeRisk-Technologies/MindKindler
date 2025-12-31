"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Lightbulb, BookOpen } from "lucide-react";
import { useRouter } from "next/navigation";
import { analyzeWhatWorks } from "@/govintel/benchmarking/whatWorks";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

export default function UnitDetailPage({ params }: { params: { unitId: string } }) {
    const router = useRouter();

    // Mock Data Fetch (Real app would fetch specific benchmark unit from snapshot)
    const unit = {
        unitId: params.unitId,
        unitName: `Unit ${params.unitId.substring(0,4)}`,
        scores: { overall: 75, outcomes: 80, safeguarding: 60, compliance: 90, training: 40, capacity: 70 }
    };

    const whatWorks = analyzeWhatWorks([{ ...unit, outlierStatus: 'top10', rawMetrics: {}, suppressed: [] }]);

    const radarData = [
        { subject: 'Outcomes', A: unit.scores.outcomes, fullMark: 100 },
        { subject: 'Safeguarding', A: unit.scores.safeguarding, fullMark: 100 },
        { subject: 'Compliance', A: unit.scores.compliance, fullMark: 100 },
        { subject: 'Training', A: unit.scores.training, fullMark: 100 },
        { subject: 'Capacity', A: unit.scores.capacity, fullMark: 100 },
    ];

    return (
        <div className="p-8 space-y-8">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="h-5 w-5"/></Button>
                <div>
                    <h1 className="text-3xl font-bold">{unit.unitName}</h1>
                    <div className="flex gap-2 mt-1">
                        <Badge variant="outline">Score: {unit.scores.overall}</Badge>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card>
                    <CardHeader><CardTitle>Performance Profile</CardTitle></CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                <PolarGrid />
                                <PolarAngleAxis dataKey="subject" />
                                <PolarRadiusAxis />
                                <Radar name={unit.unitName} dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <h3 className="text-lg font-semibold flex items-center gap-2"><Lightbulb className="h-5 w-5 text-yellow-500"/> What Works Here</h3>
                    {whatWorks.map((insight, i) => (
                        <Card key={i} className="border-l-4 border-l-yellow-400">
                            <CardContent className="p-4">
                                <div className="font-bold text-sm mb-1">{insight.category}</div>
                                <p className="text-sm text-muted-foreground">{insight.insight}</p>
                                <div className="mt-2 flex gap-2">
                                    {insight.correlatedTraining.map(t => (
                                        <Badge key={t} variant="secondary" className="text-[10px]"><BookOpen className="h-3 w-3 mr-1"/> {t}</Badge>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
