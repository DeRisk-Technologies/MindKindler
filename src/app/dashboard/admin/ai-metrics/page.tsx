// src/app/dashboard/admin/ai-metrics/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { collection, query, getDocs, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function AIMetricsPage() {
    const [metrics, setMetrics] = useState<any[]>([]);

    useEffect(() => {
        const fetch = async () => {
            const snap = await getDocs(query(collection(db, "ai_feedback"), limit(100)));
            const data = snap.docs.map(d => d.data());
            
            const featureCounts: Record<string, { positive: number, negative: number }> = {};
            
            data.forEach((d: any) => {
                if (!featureCounts[d.feature]) featureCounts[d.feature] = { positive: 0, negative: 0 };
                if (d.rating === 'positive') featureCounts[d.feature].positive++;
                else featureCounts[d.feature].negative++;
            });

            setMetrics(Object.keys(featureCounts).map(k => ({
                feature: k,
                ...featureCounts[k]
            })));
        };
        fetch();
    }, []);

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold">AI Model Performance</h2>
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader><CardTitle>User Feedback Sentiment</CardTitle></CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={metrics}>
                                <XAxis dataKey="feature" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="positive" fill="#22c55e" name="Helpful" />
                                <Bar dataKey="negative" fill="#ef4444" name="Issues" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
