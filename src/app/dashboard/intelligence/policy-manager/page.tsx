"use client";

import { useFirestoreCollection } from "@/hooks/use-firestore";
import { PolicyRule } from "@/types/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, ShieldAlert, Loader2, Import, AlertTriangle, GitBranch, History } from "lucide-react";
import { useState } from "react";
import { addDoc, collection, updateDoc, doc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { detectConflicts } from "@/ai/guardian/conflicts";

import ukPack from "@/ai/guardian/packs/uk.json";
import usPack from "@/ai/guardian/packs/us.json";
import euPack from "@/ai/guardian/packs/eu_gdpr.json";

export default function PolicyManagerPage() {
    const { data: rules, loading } = useFirestoreCollection<PolicyRule>("policyRules", "createdAt", "desc");
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Form
    const [title, setTitle] = useState("");
    const [triggerEvent, setTriggerEvent] = useState("assessment.finalize");
    const [condition, setCondition] = useState("missing_consent");
    const [severity, setSeverity] = useState<"info"|"warning"|"critical">("warning");
    const [remediation, setRemediation] = useState("");
    const [mode, setMode] = useState<"advisory"|"enforce">("advisory");
    const [rolloutMode, setRolloutMode] = useState<"live"|"simulate">("live");
    const [blockActions, setBlockActions] = useState(false);
    const [allowOverride, setAllowOverride] = useState(true);

    // Versioning
    const [editRuleId, setEditRuleId] = useState<string | null>(null);
    const [baseVersion, setBaseVersion] = useState(1);

    const handleCreate = async () => {
        setIsSaving(true);
        try {
            // Versioning Logic
            if (editRuleId) {
                // Deprecate Old
                await updateDoc(doc(db, "policyRules", editRuleId), { status: "deprecated" });
            }

            const ruleData = {
                title,
                triggerEvent,
                triggerCondition: condition,
                severity,
                remediation,
                mode,
                rolloutMode,
                blockActions: mode === 'enforce' ? blockActions : false,
                appliesToActions: [triggerEvent],
                allowOverride,
                enabled: true,
                tenantId: 'default',
                jurisdiction: 'Custom',
                description: 'Manual rule',
                createdAt: new Date().toISOString(),
                // Version fields
                version: editRuleId ? baseVersion + 1 : 1,
                status: 'active',
                previousRuleId: editRuleId || null
            };
            
            await addDoc(collection(db, "policyRules"), ruleData);
            toast({ title: "Rule Published", description: editRuleId ? `Version ${baseVersion + 1} is now active.` : "New rule created." });
            setOpen(false);
            resetForm();
        } catch (e) {
            toast({ title: "Error", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    const handleEdit = (rule: PolicyRule) => {
        setEditRuleId(rule.id);
        setBaseVersion(rule.version);
        setTitle(rule.title);
        setTriggerEvent(rule.triggerEvent);
        setCondition(rule.triggerCondition || "");
        setSeverity(rule.severity);
        setRemediation(rule.remediation);
        setMode(rule.mode);
        setBlockActions(rule.blockActions);
        setAllowOverride(rule.allowOverride);
        setRolloutMode(rule.rolloutMode || "live");
        setOpen(true);
    }

    const resetForm = () => {
        setEditRuleId(null);
        setBaseVersion(1);
        setTitle("");
        setTriggerEvent("assessment.finalize");
        setCondition("missing_consent");
        setSeverity("warning");
        setRemediation("");
        setMode("advisory");
        setBlockActions(false);
        setAllowOverride(true);
        setRolloutMode("live");
    };

    const importPack = async (packName: string, packData: any[]) => {
        if (!confirm(`Import ${packName} rules? This will add ${packData.length} new rules.`)) return;
        setIsSaving(true);
        try {
            const batchPromises = packData.map(async (rule) => {
                await addDoc(collection(db, "policyRules"), {
                    ...rule,
                    tenantId: 'default',
                    jurisdiction: packName,
                    createdAt: new Date().toISOString(),
                    version: 1,
                    status: 'active',
                    rolloutMode: 'live'
                });
            });
            await Promise.all(batchPromises);
            toast({ title: "Import Successful", description: `Added rules from ${packName} pack.` });
        } catch (e) {
            toast({ title: "Import Failed", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    const runHealthCheck = async () => {
        const conflicts = await detectConflicts();
        if (conflicts.length > 0) {
            toast({ 
                title: "Conflicts Detected", 
                description: `Found ${conflicts.length} potential issues. Check console/logs.`, 
                variant: "destructive" 
            });
        } else {
            toast({ title: "Policy Health Good", description: "No conflicts detected." });
        }
    }

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Policy Rules Manager</h1>
                    <p className="text-muted-foreground">Define guardrails and compliance checks.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={runHealthCheck}><ShieldAlert className="mr-2 h-4 w-4"/> Health Check</Button>
                    
                    <Dialog>
                        <DialogTrigger asChild><Button variant="outline"><Import className="mr-2 h-4 w-4"/> Import Pack</Button></DialogTrigger>
                        <DialogContent>
                            <DialogHeader><DialogTitle>Import Jurisdiction Pack</DialogTitle></DialogHeader>
                            <div className="grid gap-4 py-4">
                                <Button variant="secondary" onClick={() => importPack("UK", ukPack)} className="justify-start">🇬🇧 UK (KCSIE)</Button>
                                <Button variant="secondary" onClick={() => importPack("US", usPack)} className="justify-start">🇺🇸 US (FERPA)</Button>
                                <Button variant="secondary" onClick={() => importPack("EU", euPack)} className="justify-start">🇪🇺 EU (GDPR)</Button>
                            </div>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if(!o) resetForm(); }}>
                        <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4"/> New Rule</Button></DialogTrigger>
                        <DialogContent className="max-w-lg">
                            <DialogHeader>
                                <DialogTitle>{editRuleId ? "Create New Version" : "Define Policy Rule"}</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                {editRuleId && (
                                    <div className="bg-blue-50 border-blue-200 border p-2 rounded text-xs text-blue-800 flex items-center">
                                        <History className="h-3 w-3 mr-1"/> Creating Version {baseVersion + 1} (supersedes v{baseVersion})
                                    </div>
                                )}
                                <div className="grid gap-2">
                                    <Label>Rule Title</Label>
                                    <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Require Consent" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>Trigger Event</Label>
                                        <Select value={triggerEvent} onValueChange={setTriggerEvent}>
                                            <SelectTrigger><SelectValue/></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="assessment.finalize">Assessment Finalize</SelectItem>
                                                <SelectItem value="document.upload">Document Upload</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Check Condition</Label>
                                        <Select value={condition} onValueChange={setCondition}>
                                            <SelectTrigger><SelectValue/></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="missing_consent">Missing Consent</SelectItem>
                                                <SelectItem value="missing_metadata">Missing Metadata</SelectItem>
                                                <SelectItem value="pii_leak">PII in Public Doc</SelectItem>
                                                <SelectItem value="safeguarding_recommended">Safeguarding Risk</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>Severity</Label>
                                        <Select value={severity} onValueChange={(v:any) => setSeverity(v)}>
                                            <SelectTrigger><SelectValue/></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="info">Info</SelectItem>
                                                <SelectItem value="warning">Warning</SelectItem>
                                                <SelectItem value="critical">Critical</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Mode</Label>
                                        <Select value={mode} onValueChange={(v:any) => setMode(v)}>
                                            <SelectTrigger><SelectValue/></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="advisory">Advisory</SelectItem>
                                                <SelectItem value="enforce">Enforcement</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label>Rollout Strategy</Label>
                                    <Select value={rolloutMode} onValueChange={(v:any) => setRolloutMode(v)}>
                                        <SelectTrigger><SelectValue/></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="live">Live (Active)</SelectItem>
                                            <SelectItem value="simulate">Simulation (Dry Run)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {rolloutMode === 'simulate' && <p className="text-[10px] text-muted-foreground">Rules will be evaluated but will NOT block actions, even if Enforce is selected.</p>}
                                </div>

                                {mode === 'enforce' && (
                                    <div className="bg-red-50 border border-red-200 p-4 rounded-md space-y-3">
                                        <div className="flex items-center gap-2 text-red-800 font-semibold text-sm">
                                            <ShieldAlert className="h-4 w-4"/> Enforcement Settings
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Switch checked={blockActions} onCheckedChange={setBlockActions} id="block" />
                                            <Label htmlFor="block">Block Action execution?</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Checkbox checked={allowOverride} onCheckedChange={(c) => setAllowOverride(!!c)} id="override" />
                                            <Label htmlFor="override">Allow Override Requests?</Label>
                                        </div>
                                    </div>
                                )}

                                <div className="grid gap-2">
                                    <Label>Remediation Guidance</Label>
                                    <Input value={remediation} onChange={e => setRemediation(e.target.value)} placeholder="What should the user do?" />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleCreate} disabled={isSaving}>
                                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} {editRuleId ? "Publish New Version" : "Save Rule"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Title</TableHead>
                                <TableHead>Ver</TableHead>
                                <TableHead>Condition</TableHead>
                                <TableHead>Mode</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {rules.map(r => (
                                <TableRow key={r.id}>
                                    <TableCell className="font-medium flex items-center gap-2">
                                        {r.mode === 'enforce' && r.blockActions ? <ShieldAlert className="h-4 w-4 text-red-600"/> : <AlertTriangle className="h-4 w-4 text-yellow-500"/>}
                                        {r.title}
                                    </TableCell>
                                    <TableCell><Badge variant="secondary" className="text-xs">v{r.version || 1}</Badge></TableCell>
                                    <TableCell>{r.triggerCondition}</TableCell>
                                    <TableCell>
                                        <div className="flex gap-1">
                                            <Badge variant={r.mode === 'enforce' ? 'destructive' : 'outline'} className="uppercase text-[10px]">{r.mode}</Badge>
                                            {r.rolloutMode === 'simulate' && <Badge variant="secondary" className="text-[10px]">Sim</Badge>}
                                        </div>
                                    </TableCell>
                                    <TableCell><Badge variant={r.status === 'active' ? 'default' : 'secondary'}>{r.status}</Badge></TableCell>
                                    <TableCell className="text-right">
                                        {r.status === 'active' && (
                                            <Button size="sm" variant="ghost" onClick={() => handleEdit(r)}>
                                                <GitBranch className="h-4 w-4 mr-1"/> Version
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
