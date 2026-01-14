// src/components/dashboard/questionnaires/FormBuilder.tsx
"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Share2, Link as LinkIcon, Check, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

// Define the Schema Types matching the JSON pack
export interface FormFieldSchema {
    id: string;
    label: string;
    type: 'text' | 'number' | 'textarea' | 'select' | 'likert';
    required?: boolean;
    options?: string[]; // For select/likert
    placeholder?: string;
}

export interface FormSectionSchema {
    id: string;
    title: string;
    description?: string;
    fields: FormFieldSchema[];
}

export interface FormTemplate {
    id: string;
    title: string;
    description: string;
    sections: FormSectionSchema[];
}

interface FormBuilderProps {
    template: FormTemplate;
    onSubmit?: (data: any) => void;
    readOnly?: boolean;
    initialData?: any;
    studentName?: string;
}

export function FormBuilder({ template, onSubmit, readOnly = false, initialData = {}, studentName }: FormBuilderProps) {
    const { toast } = useToast();
    const [formData, setFormData] = useState<Record<string, any>>(initialData);
    const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    // Helper: Public Link Generator
    // In production, this would call an API to create a secure, time-limited token
    const publicLink = typeof window !== 'undefined' 
        ? `${window.location.origin}/portal/assessment/${template.id}?student=${encodeURIComponent(studentName || 'student')}`
        : '';

    const handleInputChange = (fieldId: string, value: any) => {
        if (readOnly) return;
        setFormData(prev => ({ ...prev, [fieldId]: value }));
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(publicLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast({ title: "Link Copied", description: "Share this with the teacher or parent." });
    };

    const handleSubmit = () => {
        // Basic Validation
        let missing = [];
        template.sections.forEach(section => {
            section.fields.forEach(field => {
                if (field.required && !formData[field.id]) {
                    missing.push(field.label);
                }
            });
        });

        if (missing.length > 0) {
            toast({ 
                title: "Missing Required Fields", 
                description: `Please complete: ${missing.slice(0, 3).join(', ')}...`, 
                variant: "destructive" 
            });
            return;
        }

        if (onSubmit) onSubmit(formData);
        toast({ title: "Form Submitted", description: "Data has been recorded." });
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            
            {/* Header / Actions */}
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">{template.title}</h2>
                    <p className="text-slate-500">{template.description}</p>
                    {studentName && (
                        <p className="text-sm font-medium text-indigo-600 mt-1">For: {studentName}</p>
                    )}
                </div>
                {!readOnly && (
                    <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline">
                                <Share2 className="w-4 h-4 mr-2" /> Share Form
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Share Assessment Form</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <p className="text-sm text-muted-foreground">
                                    Send this secure link to the classroom teacher or SENCO. They do not need a login.
                                </p>
                                <div className="flex items-center space-x-2">
                                    <div className="grid flex-1 gap-2">
                                        <Label htmlFor="link" className="sr-only">Link</Label>
                                        <Input id="link" value={publicLink} readOnly />
                                    </div>
                                    <Button size="sm" className="px-3" onClick={handleCopyLink}>
                                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            {/* Form Sections */}
            {template.sections.map((section) => (
                <Card key={section.id} className="border-t-4 border-t-indigo-500 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg">{section.title}</CardTitle>
                        {section.description && <CardDescription>{section.description}</CardDescription>}
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {section.fields.map((field) => (
                            <div key={field.id} className="space-y-2">
                                <Label className="text-sm font-medium text-slate-700">
                                    {field.label}
                                    {field.required && <span className="text-red-500 ml-1">*</span>}
                                </Label>

                                {/* Text Input */}
                                {field.type === 'text' && (
                                    <Input 
                                        placeholder={field.placeholder}
                                        value={formData[field.id] || ''}
                                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                                        disabled={readOnly}
                                    />
                                )}

                                {/* Number Input */}
                                {field.type === 'number' && (
                                    <Input 
                                        type="number"
                                        placeholder={field.placeholder}
                                        value={formData[field.id] || ''}
                                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                                        disabled={readOnly}
                                    />
                                )}

                                {/* Text Area */}
                                {field.type === 'textarea' && (
                                    <Textarea 
                                        placeholder={field.placeholder}
                                        value={formData[field.id] || ''}
                                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                                        disabled={readOnly}
                                        className="min-h-[100px]"
                                    />
                                )}

                                {/* Select */}
                                {field.type === 'select' && (
                                    <Select 
                                        value={formData[field.id]} 
                                        onValueChange={(val) => handleInputChange(field.id, val)}
                                        disabled={readOnly}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {field.options?.map((opt) => (
                                                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}

                                {/* Likert Scale */}
                                {field.type === 'likert' && (
                                    <RadioGroup 
                                        value={formData[field.id]} 
                                        onValueChange={(val) => handleInputChange(field.id, val)}
                                        disabled={readOnly}
                                        className="flex flex-wrap gap-4 mt-2"
                                    >
                                        {field.options?.map((opt, idx) => (
                                            <div key={opt} className="flex flex-col items-center space-y-1">
                                                <RadioGroupItem value={opt} id={`${field.id}-${idx}`} className="peer sr-only" />
                                                <Label 
                                                    htmlFor={`${field.id}-${idx}`}
                                                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-indigo-600 [&:has([data-state=checked])]:border-indigo-600 cursor-pointer w-20 text-center text-xs h-full"
                                                >
                                                    {opt}
                                                </Label>
                                            </div>
                                        ))}
                                    </RadioGroup>
                                )}
                            </div>
                        ))}
                    </CardContent>
                </Card>
            ))}

            {!readOnly && (
                <div className="flex justify-end pt-4">
                    <Button size="lg" className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700" onClick={handleSubmit}>
                        Submit Assessment
                    </Button>
                </div>
            )}
        </div>
    );
}
