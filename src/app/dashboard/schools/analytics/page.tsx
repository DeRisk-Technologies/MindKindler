// src/app/dashboard/schools/analytics/page.tsx
"use client";

import { useEffect, useState } from "react";
import { collection, query, getDocs, limit, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Loader2 } from "lucide-react";

export default function SchoolAnalyticsPage() {
    const [loading, setLoading] = useState(true);
    const [schoolData, setSchoolData] = useState<any[]>([]);

    useEffect(() => {
        const fetchSchoolData = async () => {
            try {
                // 1. Fetch Assessment Results
                const resultsSnap = await getDocs(query(collection(db, "assessment_results"), limit(100)));
                const scores = resultsSnap.docs.map(d => d.data());

                // 2. Fetch Students to map to schools
                const studentsSnap = await getDocs(query(collection(db, "students"), limit(50)));
                const studentSchoolMap: Record<string, string> = {}; // studentId -> schoolId
                studentsSnap.docs.forEach(d => {
                    const s = d.data();
                    if (s.schoolId) studentSchoolMap[d.id] = s.schoolId;
                });

                // 3. Aggregate Average Score per School
                const schoolStats: Record<string, { total: number, count: number }> = {};
                
                scores.forEach(result => {
                    const schoolId = studentSchoolMap[result.studentId];
                    if (!schoolId) return;

                    if (!schoolStats[schoolId]) schoolStats[schoolId] = { total: 0, count: 0 };
                    schoolStats[schoolId].total += result.totalScore;
                    schoolStats[schoolId].count++;
                });

                const chartData = Object.keys(schoolStats).map(sid => ({
                    school: sid.replace('sch_', 'School '), // Format ID for display
                    averageScore: Math.round(schoolStats[sid].total / schoolStats[sid].count)
                }));
                
                setSchoolData(chartData);

            } catch (e) {
                console.error("School Data Failed", e);
            } finally {
                setLoading(false);
            }
        };
        fetchSchoolData();
    }, []);

    if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">School Performance</h2>
            
            <Card>
                <CardHeader>
                    <CardTitle>Average Assessment Scores by School</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={schoolData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <XAxis type="number" domain={[0, 100]} />
                            <YAxis dataKey="school" type="category" width={100} />
                            <Tooltip />
                            <Bar dataKey="averageScore" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}
