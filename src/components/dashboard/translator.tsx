"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Languages, ArrowRight, Copy, Check, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { genkit } from "genkit"; // Client-side AI if available, or call function
import { httpsCallable, getFunctions } from "firebase/functions";

const FUNCTIONS_REGION = "europe-west3";

const LANGUAGES = [
    { code: "fr", name: "French" },
    { code: "es", name: "Spanish" },
    { code: "de", name: "German" },
    { code: "ar", name: "Arabic" },
    { code: "yo", name: "Yoruba" },
    { code: "ig", name: "Igbo" },
    { code: "ha", name: "Hausa" }
];

export function TranslatorTool() {
    const [input, setInput] = useState("");
    const [output, setOutput] = useState("");
    const [targetLang, setTargetLang] = useState("fr");
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const { toast } = useToast();

    const handleTranslate = async () => {
        if (!input) return;
        setLoading(true);
        try {
            // Using the existing 'generateClinicalReport' or a new specialized function
            // For now, we reuse the AI capabilities via a custom prompt
            // In production, create a dedicated 'translateContent' cloud function
            
            // Simulating cloud call for now to reuse structure
            const functions = getFunctions(undefined, FUNCTIONS_REGION);
            // Use a generic AI function if available, or mock for prototype speed if new function not deployed yet
            // Assuming we add a new 'translateContent' function in backend later.
            // For this immediate request, we'll use a client-side mock or existing function abuse
            
            // NOTE: Ideally, deploy a 'translateText' function. 
            // Mocking response to show UI immediately as per "Act don't tell" preference for UI first
            setTimeout(() => {
                // This is a placeholder until the backend function is deployed in next step
                setOutput(`[Translated to ${LANGUAGES.find(l=>l.code===targetLang)?.name}]: ${input}`);
                setLoading(false);
            }, 1000);

        } catch (e) {
            console.error(e);
            toast({ title: "Error", description: "Translation failed.", variant: "destructive" });
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(output);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast({ description: "Copied to clipboard" });
    };

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Languages className="h-5 w-5 text-primary" />
                    Clinical Translator
                </CardTitle>
                <CardDescription>Translate notes and reports for parents.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-4">
                    <div className="space-y-2">
                        <Textarea 
                            placeholder="Enter text to translate..." 
                            className="min-h-[150px]"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                        />
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <div className="flex-1 h-px bg-border" />
                        <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs text-muted-foreground">Translate to</span>
                            <Select value={targetLang} onValueChange={setTargetLang}>
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {LANGUAGES.map(l => (
                                        <SelectItem key={l.code} value={l.code}>{l.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button size="sm" onClick={handleTranslate} disabled={loading || !input}>
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                            </Button>
                        </div>
                        <div className="flex-1 h-px bg-border" />
                    </div>

                    <div className="space-y-2 relative">
                        <Textarea 
                            readOnly 
                            className="min-h-[150px] bg-muted/30"
                            placeholder="Translation will appear here..."
                            value={output}
                        />
                        {output && (
                            <Button
                                size="icon"
                                variant="ghost"
                                className="absolute top-2 right-2 h-8 w-8 bg-background/50 hover:bg-background"
                                onClick={copyToClipboard}
                            >
                                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                            </Button>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
