"use client";

import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Upload, Download, Globe } from "lucide-react";
import { getTranslationOverride, saveTranslationDraft, publishTranslation } from "@/services/translation-service";
import { TenantLocalizationSettings, TranslationOverrideDoc } from "@/types/schema";
import { SUPPORTED_LOCALES } from "@/i18n/types";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import enGB from '@/i18n/locales/en-GB';

export default function TranslationManagerPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tenantId, setTenantId] = useState<string | null>(null);
  
  // Selection State
  const [selectedLocale, setSelectedLocale] = useState('en-GB');
  const [selectedNamespace, setSelectedNamespace] = useState('common');
  const [searchTerm, setSearchTerm] = useState('');

  // Data State
  const [baseEntries, setBaseEntries] = useState<Record<string, string>>({});
  const [overrideDoc, setOverrideDoc] = useState<TranslationOverrideDoc | null>(null);
  const [draftEntries, setDraftEntries] = useState<Record<string, string>>({});

  const namespaces = Object.keys(enGB);

  // Load Tenant ID
  useEffect(() => {
    async function loadTenant() {
        const user = auth.currentUser;
        if (!user) return;
        const userDoc = await getDoc(doc(db, "users", user.uid));
        setTenantId(userDoc.data()?.tenantId || 'global');
    }
    loadTenant();
  }, []);

  // Load Data when selection changes
  useEffect(() => {
      if (!tenantId) return;
      setLoading(true);
      
      async function fetchData() {
          // 1. Get Base Keys (from en-GB static file for now, acting as source of truth)
          // In real app, we might load the target locale base pack if available to show "Base Translation"
          const nsData = (enGB as any)[selectedNamespace] || {};
          setBaseEntries(nsData);

          // 2. Get Overrides
          const doc = await getTranslationOverride(tenantId!, selectedLocale, selectedNamespace);
          setOverrideDoc(doc);
          setDraftEntries(doc?.entries || {});
          
          setLoading(false);
      }
      fetchData();
  }, [tenantId, selectedLocale, selectedNamespace]);

  // Handle Updates
  const handleEntryChange = (key: string, value: string) => {
      setDraftEntries(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveDraft = async () => {
      if (!tenantId) return;
      setSaving(true);
      try {
          await saveTranslationDraft(tenantId, selectedLocale, selectedNamespace, draftEntries, auth.currentUser?.uid || 'unknown');
          toast({ title: "Draft Saved", description: "Changes saved but not yet live." });
          // Reload doc status
          const doc = await getTranslationOverride(tenantId, selectedLocale, selectedNamespace);
          setOverrideDoc(doc);
      } catch (e) {
          toast({ title: "Error", description: "Failed to save draft.", variant: "destructive" });
      } finally {
          setSaving(false);
      }
  };

  const handlePublish = async () => {
      if (!tenantId) return;
      setSaving(true);
      try {
           // Ensure draft is saved first/current
           await saveTranslationDraft(tenantId, selectedLocale, selectedNamespace, draftEntries, auth.currentUser?.uid || 'unknown');
           await publishTranslation(tenantId, selectedLocale, selectedNamespace, auth.currentUser?.uid || 'unknown');
           toast({ title: "Published!", description: "Translations are now live for all users." });
           
           const doc = await getTranslationOverride(tenantId, selectedLocale, selectedNamespace);
           setOverrideDoc(doc);
      } catch (e) {
          toast({ title: "Error", description: "Failed to publish.", variant: "destructive" });
      } finally {
          setSaving(false);
      }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
          try {
              const json = JSON.parse(evt.target?.result as string);
              setDraftEntries(prev => ({ ...prev, ...json }));
              toast({ title: "Imported", description: `Loaded ${Object.keys(json).length} keys.` });
          } catch (err) {
              toast({ title: "Error", description: "Invalid JSON file.", variant: "destructive" });
          }
      };
      reader.readAsText(file);
  };

  const handleExport = () => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(draftEntries, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href",     dataStr);
      downloadAnchorNode.setAttribute("download", `${selectedNamespace}_${selectedLocale}_overrides.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
  };

  // Filter
  const filteredKeys = useMemo(() => {
      return Object.keys(baseEntries).filter(key => 
          key.toLowerCase().includes(searchTerm.toLowerCase()) || 
          baseEntries[key].toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [baseEntries, searchTerm]);

  return (
    <div className="space-y-6 max-w-6xl p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Translation Manager</h1>
        <p className="text-muted-foreground">
          Customize terminology and translations for your organization.
        </p>
      </div>

      <Card>
          <CardHeader>
              <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                  <div className="flex gap-4">
                      <div className="grid gap-2 w-[200px]">
                        <Label>Target Language</Label>
                        <Select value={selectedLocale} onValueChange={setSelectedLocale}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {SUPPORTED_LOCALES.map(l => <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2 w-[200px]">
                        <Label>Namespace</Label>
                        <Select value={selectedNamespace} onValueChange={setSelectedNamespace}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {namespaces.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                            </SelectContent>
                        </Select>
                      </div>
                  </div>
                  <div className="flex gap-2">
                       <div className="relative">
                           <Input 
                                placeholder="Search keys..." 
                                value={searchTerm} 
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-[200px]"
                           />
                       </div>
                  </div>
              </div>
          </CardHeader>
          <CardContent>
              {loading ? (
                  <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>
              ) : (
                  <div className="border rounded-md">
                      <Table>
                          <TableHeader>
                              <TableRow>
                                  <TableHead className="w-[200px]">Key</TableHead>
                                  <TableHead className="w-[30%]">Base (Default)</TableHead>
                                  <TableHead>Tenant Override</TableHead>
                              </TableRow>
                          </TableHeader>
                          <TableBody>
                              {filteredKeys.map(key => (
                                  <TableRow key={key}>
                                      <TableCell className="font-mono text-xs text-muted-foreground">{key}</TableCell>
                                      <TableCell className="text-sm">{baseEntries[key]}</TableCell>
                                      <TableCell>
                                          <Input 
                                              value={draftEntries[key] || ''} 
                                              onChange={e => handleEntryChange(key, e.target.value)}
                                              placeholder="Enter custom text..."
                                              className={draftEntries[key] ? "border-primary/50 bg-primary/5" : ""}
                                          />
                                      </TableCell>
                                  </TableRow>
                              ))}
                          </TableBody>
                      </Table>
                  </div>
              )}
          </CardContent>
          <CardFooter className="flex justify-between bg-muted/20 py-4">
              <div className="flex gap-2 items-center">
                   <Button variant="outline" size="sm" onClick={() => document.getElementById('import-file')?.click()}>
                        <Upload className="mr-2 h-4 w-4" /> Import JSON
                   </Button>
                   <input id="import-file" type="file" className="hidden" accept=".json" onChange={handleImport} />
                   
                   <Button variant="outline" size="sm" onClick={handleExport}>
                        <Download className="mr-2 h-4 w-4" /> Export JSON
                   </Button>

                   {overrideDoc && (
                       <Badge variant={overrideDoc.status === 'published' ? 'default' : 'secondary'} className="ml-2">
                           {overrideDoc.status === 'published' ? 'Live' : 'Draft'}
                       </Badge>
                   )}
              </div>
              <div className="flex gap-2">
                  <Button variant="outline" onClick={handleSaveDraft} disabled={saving}>
                      Save Draft
                  </Button>
                  <Button onClick={handlePublish} disabled={saving}>
                      {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Globe className="mr-2 h-4 w-4" />}
                      Publish Live
                  </Button>
              </div>
          </CardFooter>
      </Card>
    </div>
  );
}
