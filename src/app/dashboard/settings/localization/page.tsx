"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save } from "lucide-react";
import { getTenantLocalizationSettings, updateTenantLocalizationSettings } from "@/services/localization-service";
import { TenantLocalizationSettings } from "@/types/schema";
import { SUPPORTED_LOCALES } from "@/i18n/types";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function LocalizationSettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [settings, setSettings] = useState<TenantLocalizationSettings>({
    defaultLocale: 'en-GB',
    supportedLocales: ['en-GB'],
    allowUserLocaleOverride: true,
    updatedAt: '',
    updatedBy: ''
  });

  useEffect(() => {
    async function load() {
      const user = auth.currentUser;
      if (!user) return;
      
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const tid = userDoc.data()?.tenantId || 'global'; 
        setTenantId(tid);

        const data = await getTenantLocalizationSettings(tid);
        setSettings(data);
      } catch (e) {
        console.error("Failed to load settings", e);
        toast({ title: "Error", description: "Could not load localization settings.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSave = async () => {
    if (!tenantId) return;
    setSaving(true);
    try {
      await updateTenantLocalizationSettings(tenantId, settings, auth.currentUser?.uid || 'unknown');
      toast({ title: "Saved", description: "Localization settings updated." });
    } catch (e) {
      toast({ title: "Error", description: "Failed to save settings.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const toggleSupportedLocale = (code: string) => {
    setSettings(prev => {
      const current = prev.supportedLocales;
      const next = current.includes(code)
        ? current.filter(c => c !== code)
        : [...current, code];
      
      // Ensure default is always supported
      if (!next.includes(prev.defaultLocale)) {
          return { ...prev, supportedLocales: next, defaultLocale: next[0] || 'en-GB' }; 
      }
      return { ...prev, supportedLocales: next };
    });
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-6 max-w-4xl p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Localization Settings</h1>
        <p className="text-muted-foreground">
          Configure language preferences for your organization ({tenantId}).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Regional Preferences</CardTitle>
          <CardDescription>Set the default language and allowed regions for your users.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            
            {/* Default Locale */}
            <div className="grid gap-2">
                <Label>Default Language</Label>
                <Select 
                    value={settings.defaultLocale} 
                    onValueChange={(val) => setSettings({...settings, defaultLocale: val})}
                >
                    <SelectTrigger className="w-[280px]">
                        <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                        {SUPPORTED_LOCALES.filter(l => settings.supportedLocales.includes(l.code)).map(l => (
                            <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Fallback language for new users or guests.</p>
            </div>

            {/* Supported Locales */}
            <div className="grid gap-2">
                <Label>Supported Languages</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border rounded-lg p-4">
                    {SUPPORTED_LOCALES.map(l => (
                        <div key={l.code} className="flex items-center space-x-2">
                            <Checkbox 
                                id={`lang-${l.code}`} 
                                checked={settings.supportedLocales.includes(l.code)}
                                onCheckedChange={() => toggleSupportedLocale(l.code)}
                                disabled={l.code === settings.defaultLocale} // Can't disable the default
                            />
                            <Label htmlFor={`lang-${l.code}`} className="font-normal cursor-pointer">
                                {l.label} <span className="text-xs text-muted-foreground ml-1">({l.code})</span>
                            </Label>
                        </div>
                    ))}
                </div>
            </div>

            {/* User Override */}
            <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                    <Label className="text-base">Allow User Override</Label>
                    <p className="text-sm text-muted-foreground">
                        Users can select their own language from the list above.
                    </p>
                </div>
                <Switch 
                    checked={settings.allowUserLocaleOverride}
                    onCheckedChange={(c) => setSettings({...settings, allowUserLocaleOverride: c})}
                />
            </div>
        </CardContent>
        <CardFooter className="justify-end bg-muted/20 py-4">
            <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Configuration
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
