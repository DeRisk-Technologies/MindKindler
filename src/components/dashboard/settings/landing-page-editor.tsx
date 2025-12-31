"use client";

import { useEffect, useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { OrganizationSettings } from "@/types/settings";
import { Upload, Save, Loader2, Image as ImageIcon, CheckCircle } from "lucide-react";

// Mock upload function (Simulating Storage)
// In a real implementation, you'd use firebase/storage `uploadBytes` and `getDownloadURL`
const uploadImageMock = async (file: File) => {
    return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            resolve(reader.result as string); // Returns base64 for immediate preview/storage (limitations apply)
        };
        reader.readAsDataURL(file);
    });
};

export function LandingPageEditor() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<OrganizationSettings['landingPage']>({
    heroTitle: "Empowering Minds, Shaping Futures",
    heroSubtitle: "Advanced AI-driven support for educational psychology.",
    heroImageUrl: "",
    showFeatures: true,
    featuresTitle: "Why Choose MindKindler?",
    features: [
      { title: "AI Reports", description: "Automated clinical documentation.", icon: "FileText" },
      { title: "Scheduling", description: "Smart calendar management.", icon: "Calendar" },
      { title: "Secure", description: "HIPAA/GDPR compliant.", icon: "Shield" }
    ]
  });

  const [branding, setBranding] = useState<OrganizationSettings['branding']>({
    companyName: "MindKindler",
    logoUrl: ""
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, "organization_settings", "global");
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data() as OrganizationSettings;
          if (data.landingPage) setSettings(data.landingPage);
          if (data.branding) setBranding(data.branding);
        }
      } catch (e) {
        console.error("Failed to load settings", e);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      await setDoc(doc(db, "organization_settings", "global"), {
        landingPage: settings,
        branding: branding
      }, { merge: true });
      toast({ title: "Settings Saved", description: "Landing page updated successfully." });
    } catch (e) {
      toast({ title: "Error", description: "Could not save settings.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const onDropLogo = useCallback(async (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
          const url = await uploadImageMock(acceptedFiles[0]);
          setBranding(prev => ({ ...prev, logoUrl: url }));
          toast({ title: "Logo Uploaded", description: "Image processed successfully." });
      }
  }, []);

  const onDropHero = useCallback(async (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
          const url = await uploadImageMock(acceptedFiles[0]);
          setSettings(prev => ({ ...prev, heroImageUrl: url }));
          toast({ title: "Hero Image Uploaded", description: "Image processed successfully." });
      }
  }, []);

  const { getRootProps: getLogoProps, getInputProps: getLogoInput } = useDropzone({ onDrop: onDropLogo, accept: {'image/*': []}, maxFiles: 1 });
  const { getRootProps: getHeroProps, getInputProps: getHeroInput } = useDropzone({ onDrop: onDropHero, accept: {'image/*': []}, maxFiles: 1 });

  const updateFeature = (index: number, field: string, value: string) => {
    const newFeatures = [...settings.features];
    newFeatures[index] = { ...newFeatures[index], [field]: value };
    setSettings({ ...settings, features: newFeatures });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Landing Page & Branding</CardTitle>
        <CardDescription>Customize the look and feel of your public landing page.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="hero">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="hero">Hero Section</TabsTrigger>
            <TabsTrigger value="branding">Branding</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
          </TabsList>
          
          <TabsContent value="hero" className="space-y-4 pt-4">
            <div className="grid gap-2">
              <Label>Hero Title</Label>
              <Input 
                value={settings.heroTitle} 
                onChange={(e) => setSettings({...settings, heroTitle: e.target.value})} 
              />
            </div>
            <div className="grid gap-2">
              <Label>Subtitle</Label>
              <Textarea 
                value={settings.heroSubtitle} 
                onChange={(e) => setSettings({...settings, heroSubtitle: e.target.value})} 
              />
            </div>
            <div className="grid gap-2">
              <Label>Hero Image</Label>
              <div {...getHeroProps()} className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors text-center">
                  <input {...getHeroInput()} />
                  {settings.heroImageUrl ? (
                      <div className="relative w-full h-32">
                          <img src={settings.heroImageUrl} alt="Hero" className="w-full h-full object-cover rounded-md opacity-80" />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white font-medium rounded-md">Click to Replace</div>
                      </div>
                  ) : (
                      <>
                        <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">Drag & drop or click to upload hero image</p>
                      </>
                  )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="branding" className="space-y-4 pt-4">
            <div className="grid gap-2">
              <Label>Platform Name</Label>
              <Input 
                value={branding.companyName} 
                onChange={(e) => setBranding({...branding, companyName: e.target.value})} 
              />
            </div>
            <div className="grid gap-2">
              <Label>Logo</Label>
              <div className="flex gap-4 items-center">
                  <div {...getLogoProps()} className="border-2 border-dashed rounded-lg p-4 w-32 h-32 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors text-center shrink-0">
                      <input {...getLogoInput()} />
                      {branding.logoUrl ? (
                          <img src={branding.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                      ) : (
                          <>
                            <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                            <span className="text-xs text-muted-foreground">Upload</span>
                          </>
                      )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                      <p>Upload a transparent PNG or SVG for best results.</p>
                      <p className="mt-1">Recommended size: 200x200px</p>
                  </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="features" className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <Label>Show Features Section</Label>
              <Switch 
                checked={settings.showFeatures} 
                onCheckedChange={(c) => setSettings({...settings, showFeatures: c})} 
              />
            </div>
            <div className="grid gap-2">
               <Label>Section Title</Label>
               <Input 
                  value={settings.featuresTitle}
                  onChange={(e) => setSettings({...settings, featuresTitle: e.target.value})}
               />
            </div>
            {settings.features.map((feat, i) => (
              <div key={i} className="border p-3 rounded-lg space-y-2 bg-muted/20">
                <Input 
                  value={feat.title} 
                  onChange={(e) => updateFeature(i, 'title', e.target.value)} 
                  className="font-medium"
                />
                <Input 
                  value={feat.description} 
                  onChange={(e) => updateFeature(i, 'description', e.target.value)} 
                  className="text-sm"
                />
              </div>
            ))}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Changes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
