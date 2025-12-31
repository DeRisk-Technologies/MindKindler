"use client";

import { useFirestoreCollection } from "@/hooks/use-firestore";
import { Notification } from "@/types/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { auth } from "@/lib/firebase";
import { markAsRead } from "@/lib/notifications";
import { Check } from "lucide-react";

export default function NotificationHistoryPage() {
    const { data: notifications, loading } = useFirestoreCollection<Notification>("notifications", "createdAt", "desc");
    const myNotifications = notifications.filter(n => n.recipientUserId === (auth.currentUser?.uid || "unknown"));

    if (loading) return <div>Loading...</div>;

    return (
        <div className="p-8 space-y-8">
            <h1 className="text-3xl font-bold">Notification History</h1>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Status</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Subject</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {myNotifications.map(n => (
                                <TableRow key={n.id} className={n.read ? 'opacity-70' : 'bg-blue-50/10'}>
                                    <TableCell>
                                        {n.read ? <Badge variant="outline">Read</Badge> : <Badge className="bg-blue-500">New</Badge>}
                                    </TableCell>
                                    <TableCell><Badge variant="secondary" className="capitalize">{n.category}</Badge></TableCell>
                                    <TableCell>
                                        <div className="font-medium">{n.title}</div>
                                        <div className="text-sm text-muted-foreground">{n.message}</div>
                                    </TableCell>
                                    <TableCell>{new Date(n.createdAt).toLocaleString()}</TableCell>
                                    <TableCell className="text-right">
                                        {!n.read && (
                                            <Button size="sm" variant="ghost" onClick={() => markAsRead(n.id)}>
                                                <Check className="h-4 w-4 mr-2"/> Mark Read
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {myNotifications.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8">No history.</TableCell></TableRow>}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
