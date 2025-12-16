"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { PaintBucket, Type } from "lucide-react";

export default function SettingsPage() {
  const { toast } = useToast();
  const [primaryColor, setPrimaryColor] = useState("#0f172a");
  const [fontFamily, setFontFamily] = useState("Inter");

  const handleSaveTheme = () => {
    // In a real app, save to Firestore and update CSS variables/Context
    console.log("Saving theme:", { primaryColor, fontFamily });
    toast({
      title: "Theme Updated",
      description: "Organization branding has been saved.",
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account, application preferences, and organization branding.
        </p>
      </div>

      <div className="grid max-w-3xl gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>
              This is how others will see you on the site.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" defaultValue="Dr. Evelyn Reed" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue="e.reed@mkindler.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Professional Title</Label>
              <Input id="title" defaultValue="Educational Psychologist" />
            </div>
          </CardContent>
          <CardFooter>
            <Button>Save Changes</Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>
              Customize the look and feel of the application.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label>Theme Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Select a light, dark, or system theme.
                </p>
              </div>
              <ThemeToggle />
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Organization Branding (Theme Editor)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor" className="flex items-center gap-2">
                    <PaintBucket className="h-4 w-4" />
                    Primary Color
                  </Label>
                  <div className="flex gap-2">
                    <Input 
                      id="primaryColor" 
                      type="color" 
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-12 p-1 h-10"
                    />
                    <Input 
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="font-mono"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fontFamily" className="flex items-center gap-2">
                    <Type className="h-4 w-4" />
                    Font Family
                  </Label>
                  <Input 
                    id="fontFamily" 
                    value={fontFamily} 
                    onChange={(e) => setFontFamily(e.target.value)}
                    placeholder="e.g., Inter, Roboto, Open Sans"
                  />
                </div>
              </div>
              <Button onClick={handleSaveTheme} variant="outline" className="w-full">
                Apply Custom Branding
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Delete Account</CardTitle>
            <CardDescription>
              Permanently delete your account and all associated data. This
              action cannot be undone.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive">Delete My Account</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
