"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { sendNotification } from "@/lib/notifications";
import { auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

export default function NotificationTesterPage() {
    const { toast } = useToast();

    const trigger = async (type: any, category: any, title: string) => {
        try {
            await sendNotification({
                tenantId: "default",
                recipientUserId: auth.currentUser?.uid || "unknown",
                type,
                category,
                title,
                message: `This is a test alert generated at ${new Date().toLocaleTimeString()}.`,
                link: "/dashboard",
                metadata: {}
            });
            toast({ title: "Sent", description: "Check the bell icon." });
        } catch (e) {
            toast({ title: "Error", variant: "destructive" });
        }
    };

    return (
        <div className="p-8 space-y-8">
            <h1 className="text-3xl font-bold">Notification Tester</h1>
            <p className="text-muted-foreground">Simulate system events to verify the Unified Notification Center.</p>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader><CardTitle>Assessment</CardTitle></CardHeader>
                    <CardContent>
                        <Button className="w-full" onClick={() => trigger('success', 'assessment', 'Assessment Finalized')}>
                            Simulate Completion
                        </Button>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Guardian</CardTitle></CardHeader>
                    <CardContent>
                        <Button className="w-full" variant="destructive" onClick={() => trigger('error', 'guardian', 'Action Blocked')}>
                            Simulate Block
                        </Button>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Training</CardTitle></CardHeader>
                    <CardContent>
                        <Button className="w-full" variant="outline" onClick={() => trigger('info', 'training', 'New Assignment')}>
                            Simulate Assignment
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
