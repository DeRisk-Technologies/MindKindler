"use client";

import { useFirestoreCollection } from "@/hooks/use-firestore";
import { RolloutChecklist } from "@/types/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Check, Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { addDoc, collection, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";

export default function ChecklistPage() {
    const { programId } = useParams() as { programId: string };
    const { data: lists, loading } = useFirestoreCollection<RolloutChecklist>("rolloutChecklists");
    const programLists = lists.filter(l => l.programId === programId);
    const { toast } = useToast();
    const router = useRouter();

    const [newItem, setNewItem] = useState("");

    const handleCreateDefault = async () => {
        // Mock default categories
        const defaults = ["Governance", "Training", "Data"];
        for (const cat of defaults) {
            await addDoc(collection(db, "rolloutChecklists"), {
                programId,
                category: cat,
                items: [
                    { title: `Define ${cat} Policies`, required: true, status: 'notStarted', owner: 'admin' },
                    { title: `Review ${cat} Settings`, required: false, status: 'notStarted', owner: 'epp' }
                ]
            });
        }
        toast({ title: "Defaults Created", description: "Standard checklist applied." });
    };

    const handleToggleItem = async (listId: string, itemIdx: number, currentStatus: string) => {
        const list = programLists.find(l => l.id === listId);
        if (!list) return;
        
        const newItems = [...list.items];
        newItems[itemIdx].status = currentStatus === 'done' ? 'notStarted' : 'done';
        
        await updateDoc(doc(db, "rolloutChecklists", listId), { items: newItems });
    };

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Onboarding Checklist</h1>
                {programLists.length === 0 && <Button onClick={handleCreateDefault}>Load Defaults</Button>}
            </div>

            <div className="grid gap-6">
                {programLists.map(list => (
                    <Card key={list.id}>
                        <CardHeader className="py-3 bg-slate-50 border-b"><CardTitle className="text-base">{list.category}</CardTitle></CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableBody>
                                    {list.items.map((item, i) => (
                                        <TableRow key={i}>
                                            <TableCell className="w-[50px]">
                                                <Button size="sm" variant={item.status === 'done' ? 'default' : 'outline'} className="h-6 w-6 p-0 rounded-full" onClick={() => handleToggleItem(list.id, i, item.status)}>
                                                    {item.status === 'done' && <Check className="h-3 w-3"/>}
                                                </Button>
                                            </TableCell>
                                            <TableCell className={item.status === 'done' ? 'line-through text-muted-foreground' : ''}>
                                                {item.title}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {item.required && <Badge variant="secondary">Required</Badge>}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
