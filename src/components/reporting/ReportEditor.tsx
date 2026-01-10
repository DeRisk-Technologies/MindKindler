// src/components/reporting/ReportEditor.tsx
"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Save, Sparkles, FileText, Share2, History } from 'lucide-react';
import { CitationSidebar } from './CitationSidebar';
import { ReportService } from '@/services/report-service';
import { useToast } from '@/hooks/use-toast';
import { Report } from '@/types/schema';
import { FeedbackWidget } from '@/components/ai/FeedbackWidget'; 

interface ReportEditorProps {
    reportId: string;
    tenantId: string;
    studentId: string; // Used for context fetching
    initialContent?: any;
    userId: string; // Added for feedback
}

export function ReportEditor({ reportId, tenantId, studentId, initialContent, userId }: ReportEditorProps) {
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [provenanceId, setProvenanceId] = useState<string | null>(null); // Track AI run

    const editor = useEditor({
        immediatelyRender: false, // FIX: SSR Hydration mismatch error
        extensions: [
            StarterKit,
            Placeholder.configure({
                placeholder: 'Start typing or request an AI draft...',
            }),
        ],
        content: '', // Will populate
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl m-5 focus:outline-none min-h-[500px]',
            },
        },
    });

    // Populate initial content
    useEffect(() => {
        if (initialContent && editor) {
            // Transform structured sections to HTML for Tiptap
            let html = '';
            if (initialContent.sections) {
                initialContent.sections.forEach((s: any) => {
                    html += `<h2>${s.title}</h2><p>${s.content}</p>`;
                });
            } else if (typeof initialContent === 'string') {
                 // Handle if initialContent is raw HTML string or other format
                 // But typically our structure is sections array
            }
            // Only set content if empty to prevent overwriting user changes on re-renders, 
            // or if we explicitly want to load a draft. 
            // For now, assuming initial load:
            if (editor.isEmpty) { 
                 editor.commands.setContent(html);
            }
        }
    }, [initialContent, editor]);

    const handleSave = async () => {
        if (!editor) return;
        setIsSaving(true);
        try {
            const json = editor.getJSON();
            // In reality, we'd parse Tiptap JSON back to 'sections' or save purely as JSON blob
            // For now, saving raw JSON as content
            await ReportService.saveDraft(tenantId, reportId, json);
            setLastSaved(new Date());
            toast({ title: 'Saved', description: 'Draft updated.' });
        } catch (e) {
            toast({ title: 'Error', description: 'Failed to save.', variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleAiDraft = async () => {
        if (!editor) return;
        setIsGenerating(true);
        try {
            // Mock context - in real app would gather from props/store
            const context = {
                studentId,
                notes: 'Student struggles with attention.',
                history: 'Diagnosed ADHD in 2020.',
                glossary: { 'Student': 'Learner' } // Test glossary
            };

            const result = await ReportService.requestAiDraft(tenantId, reportId, context);
            
            // Populate Editor
            let html = '';
            result.sections.forEach((s: any) => {
                html += `<h2>${s.title}</h2><p>${s.content}</p>`;
            });
            editor.commands.setContent(html);
            
            // Assuming result includes provenance ID in V2 service response
            // setProvenanceId(result.provenanceId); 

            toast({ title: 'Draft Generated', description: 'AI content inserted.' });
        } catch (e) {
            console.error(e);
            toast({ title: 'Generation Failed', description: 'Could not create draft.', variant: 'destructive' });
        } finally {
            setIsGenerating(false);
        }
    };

    const insertCitation = (token: string) => {
        if (editor) {
            editor.chain().focus().insertContent(` ${token} `).run();
        }
    };

    if (!editor) return null;

    return (
        <div className="flex h-screen bg-background">
            {/* Main Editor Area */}
            <div className="flex-1 flex flex-col">
                {/* Toolbar */}
                <div className="border-b p-2 flex items-center justify-between bg-white dark:bg-card">
                    <div className="flex gap-2 items-center">
                        <Button variant="outline" size="sm" onClick={handleAiDraft} disabled={isGenerating}>
                            {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Sparkles className="mr-2 h-4 w-4 text-indigo-500"/>}
                            AI Draft
                        </Button>
                        
                        {provenanceId && (
                            <FeedbackWidget 
                                tenantId={tenantId} 
                                userId={userId} 
                                traceId={provenanceId} 
                                feature="consultationReport" 
                            />
                        )}

                        <Button variant="ghost" size="sm">
                            <History className="mr-2 h-4 w-4" /> Versions
                        </Button>
                    </div>
                    <div className="flex gap-2 items-center">
                        <span className="text-xs text-muted-foreground mr-2">
                            {lastSaved ? `Saved ${lastSaved.toLocaleTimeString()}` : 'Unsaved'}
                        </span>
                        <Button size="sm" onClick={handleSave} disabled={isSaving}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            <Save className="mr-2 h-4 w-4" /> Save
                        </Button>
                        <Button size="sm" variant="secondary">
                            <Share2 className="mr-2 h-4 w-4" /> Export
                        </Button>
                    </div>
                </div>

                {/* Canvas */}
                <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900 p-8">
                    <div className="max-w-3xl mx-auto bg-white dark:bg-card min-h-[800px] shadow-sm border rounded-lg p-8">
                        <EditorContent editor={editor} />
                    </div>
                </div>
            </div>

            {/* Sidebar */}
            <CitationSidebar onInsert={insertCitation} />
        </div>
    );
}
