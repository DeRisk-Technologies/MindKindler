// src/components/upload/TrustedAssistantToggle.tsx
"use client";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

export function TrustedAssistantToggle({ userId, initialValue, tenantId }: any) {
    const [trusted, setTrusted] = useState(initialValue);
    const { toast } = useToast();

    const handleToggle = async (val: boolean) => {
        setTrusted(val);
        try {
            // Note: In real app, only Admins can write to user roles
            await updateDoc(doc(db, `tenants/${tenantId}/users`, userId), {
                isTrustedAssistant: val
            });
            toast({ title: "Updated", description: `User is now ${val ? 'Trusted' : 'Restricted'}.` });
        } catch (e) {
            toast({ title: "Error", description: "Failed to update permissions.", variant: "destructive" });
            setTrusted(!val); // Revert
        }
    };

    return (
        <div className="flex items-center space-x-2">
            <Switch id="trusted-mode" checked={trusted} onCheckedChange={handleToggle} />
            <Label htmlFor="trusted-mode">Trusted Assistant (Can Publish)</Label>
        </div>
    );
}
