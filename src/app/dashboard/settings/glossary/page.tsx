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
import { Loader2, Save, Upload, Download, Globe, Trash2, Plus } from "lucide-react";
import { getGlossary, saveGlossaryDraft, publishGlossary } from "@/services/glossary-service";
import { GlossaryDoc } from "@/types/schema";
import { SUPPORTED_LOCALES } from "@/i18n/types";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function GlossaryManagerPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tenantId, setTenantId] = useState<string | null>(null);
  
  const [selectedLocale, setSelectedLocale] = useState('en-GB');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [glossaryDoc, setGlossaryDoc] = useState<GlossaryDoc | null>(null);
  const [entries, setEntries] = useState<Record<string, string>>({});
  
  // New Entry State
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

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

  // Load Data
  useEffect(() => {
      if (!tenantId) return;
      setLoading(true);
      
      async function fetchData() {
          const doc = await getGlossary(tenantId!, selectedLocale);
          setGlossaryDoc(doc);
          setEntries(doc?.entries || {});
          setLoading(false);
      }
      fetchData();
  }, [tenantId, selectedLocale]);

  // Actions
  const handleAdd = () => {
      if (!newKey.trim() || !newValue.trim()) return;
      setEntries(prev => ({ ...prev, [newKey.trim()]: newValue.trim() }));
      setNewKey('');
      setNewValue('');
  };

  const handleRemove = (key: string) => {
      const next = { ...entries };
      delete next[key];
      setEntries(next);
  };

  const handleSaveDraft = async () => {
      if (!tenantId) return;
      setSaving(true);
      try {
          await saveGlossaryDraft(tenantId, selectedLocale, entries, auth.currentUser?.uid || 'unknown');
          toast({ title: "Draft Saved", description: "Changes saved locally." });
          const doc = await getGlossary(tenantId, selectedLocale);
          setGlossaryDoc(doc);
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
           await saveGlossaryDraft(tenantId, selectedLocale, entries, auth.currentUser?.uid || 'unknown');
           await publishGlossary(tenantId, selectedLocale, auth.currentUser?.uid || 'unknown');
           toast({ title: "Published!", description: "Glossary terms are now active in AI prompts." });
           
           const doc = await getGlossary(tenantId, selectedLocale);
           setGlossaryDoc(doc);
      } catch (e) {
          toast({ title: "Error", description: "Failed to publish.", variant: "destructive" });
      } finally {
          setSaving(false);
      }
  };

  // Filter
  const filteredKeys = useMemo(() => {
      return Object.keys(entries).filter(key => 
          key.toLowerCase().includes(searchTerm.toLowerCase()) || 
          entries[key].toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [entries, searchTerm]);

  return (
    <div className="space-y-6 max-w-5xl p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Glossary Manager</h1>
        <p className="text-muted-foreground">
          Define preferred terminology for AI generation and UI replacements.
        </p>
      </div>

      <Card>
          <CardHeader>
              <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                  <div className="grid gap-2 w-[200px]">
                    <Label>Target Language</Label>
                    <Select value={selectedLocale} onValueChange={setSelectedLocale}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {SUPPORTED_LOCALES.map(l => <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>)}
                        </SelectContent>
                    </Select>
                  </div>
                  <div className="relative">
                       <Input 
                            placeholder="Search terms..." 
                            value={searchTerm} 
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-[250px]"
                       />
                  </div>
              </div>
          </CardHeader>
          <CardContent>
              {loading ? (
                  <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>
              ) : (
                  <div className="space-y-4">
                      {/* Add New */}
                      <div className="flex gap-2 items-end border p-4 rounded-lg bg-muted/10">
                          <div className="grid gap-2 flex-1">
                              <Label>Canonical Term (e.g. "Student")</Label>
                              <Input value={newKey} onChange={e => setNewKey(e.target.value)} placeholder="Original term..." />
                          </div>
                          <div className="grid gap-2 flex-1">
                              <Label>Preferred Term (e.g. "Learner")</Label>
                              <Input value={newValue} onChange={e => setNewValue(e.target.value)} placeholder="Replacement..." />
                          </div>
                          <Button onClick={handleAdd} disabled={!newKey || !newValue}>
                              <Plus className="h-4 w-4" /> Add
                          </Button>
                      </div>

                      <div className="border rounded-md">
                          <Table>
                              <TableHeader>
                                  <TableRow>
                                      <TableHead className="w-[40%]">Original Term</TableHead>
                                      <TableHead className="w-[40%]">Preferred Term</TableHead>
                                      <TableHead className="text-right">Action</TableHead>
                                  </TableRow>
                              </TableHeader>
                              <TableBody>
                                  {filteredKeys.map(key => (
                                      <TableRow key={key}>
                                          <TableCell className="font-medium">{key}</TableCell>
                                          <TableCell>{entries[key]}</TableCell>
                                          <TableCell className="text-right">
                                              <Button variant="ghost" size="icon" onClick={() => handleRemove(key)}>
                                                  <Trash2 className="h-4 w-4 text-destructive" />
                                              </Button>
                                          </TableCell>
                                      </TableRow>
                                  ))}
                                  {filteredKeys.length === 0 && (
                                      <TableRow>
                                          <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                                              No glossary terms defined for this locale.
                                          </TableCell>
                                      </TableRow>
                                  )}
                              </TableBody>
                          </Table>
                      </div>
                  </div>
              )}
          </CardContent>
          <CardFooter className="flex justify-between bg-muted/20 py-4">
              <div className="flex items-center">
                   {glossaryDoc && (
                       <Badge variant={glossaryDoc.status === 'published' ? 'default' : 'secondary'}>
                           Status: {glossaryDoc.status === 'published' ? 'Live' : 'Draft'}
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
