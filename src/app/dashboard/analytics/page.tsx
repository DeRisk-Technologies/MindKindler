// src/app/dashboard/analytics/page.tsx
"use client";

import { useEffect, useState } from "react";
import { collection, query, getDocs, limit, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Loader2 } from "lucide-react";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function AnalyticsPage() {
    const [loading, setLoading] = useState(true);
    const [gradeData, setGradeData] = useState<any[]>([]);
    const [riskData, setRiskData] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Fetch Assessment Results
                const resultsSnap = await getDocs(query(collection(db, "assessment_results"), limit(50)));
                const scores = resultsSnap.docs.map(d => d.data());

                // Aggregation: Average Score by Subject
                const subjectMap: Record<string, { total: number, count: number }> = {};
                scores.forEach(s => {
                    const subj = s.subject || 'General';
                    if (!subjectMap[subj]) subjectMap[subj] = { total: 0, count: 0 };
                    subjectMap[subj].total += s.totalScore;
                    subjectMap[subj].count++;
                });

                const chartData = Object.keys(subjectMap).map(subj => ({
                    subject: subj,
                    average: Math.round(subjectMap[subj].total / subjectMap[subj].count)
                }));
                setGradeData(chartData);

                // 2. Fetch Students for Risk Distribution
                const studentsSnap = await getDocs(query(collection(db, "students"), limit(50)));
                const students = studentsSnap.docs.map(d => d.data());
                
                const riskMap: Record<string, number> = { Low: 0, Medium: 0, High: 0 };
                students.forEach(s => {
                    const level = s.riskLevel || 'Low';
                    if (riskMap[level] !== undefined) riskMap[level]++;
                });

                const pieData = Object.keys(riskMap).map(key => ({ name: key, value: riskMap[key] }));
                setRiskData(pieData);

            } catch (e) {
                console.error("Analytics Load Failed", e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">District Analytics</h2>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Assessment Performance</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <ResponsiveContainer width="100%" height={350}>
                            <BarChart data={gradeData}>
                                <XAxis dataKey="subject" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} />
                                <Tooltip />
                                <Bar dataKey="average" fill="#adfa1d" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Risk Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={350}>
                            <PieChart>
                                <Pie
                                    data={riskData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {riskData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
