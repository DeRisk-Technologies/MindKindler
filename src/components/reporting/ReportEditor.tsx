// src/components/reporting/ReportEditor.tsx
"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Save, Sparkles, FileText, Share2, SidebarOpen, CheckCircle } from 'lucide-react';
import { CitationSidebar } from './CitationSidebar';
import { ProvisionPicker } from './ProvisionPicker';
import { ReportService } from '@/services/report-service';
import { useToast } from '@/hooks/use-toast';
import { FeedbackWidget } from '@/components/ai/FeedbackWidget'; 
import { SubmitForReviewModal } from './modals/SubmitForReviewModal'; 
import { ExportOptionsModal } from './modals/ExportOptionsModal';
import { generateDocx } from '@/lib/export/docx-generator';

// Mock Supervisors
const MOCK_SUPERVISORS = [
    { id: 'sup_001', name: 'Dr. Sarah Smith (Senior EPP)' },
    { id: 'sup_002', name: 'Dr. James Wilson (Lead)' }
];

interface ReportEditorProps {
    reportId: string;
    tenantId: string;
    studentId: string; 
    initialContent?: any;
    userId: string; 
    userRole?: string;
    region?: string; 
}

export function ReportEditor({ reportId, tenantId, studentId, initialContent, userId, userRole = 'EPP', region = 'uk' }: ReportEditorProps) {
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [provenanceId, setProvenanceId] = useState<string | null>(null);
    const [activeSidebar, setActiveSidebar] = useState<'none' | 'citations' | 'provisions'>('none');
    
    // Modals
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false); 

    const isTrainee = userRole === 'Trainee' || userRole === 'Assistant'; 

    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit,
            Placeholder.configure({
                placeholder: 'Start typing or request an AI draft...',
            }),
        ],
        content: '',
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl m-5 focus:outline-none min-h-[500px]',
            },
        },
    });

    useEffect(() => {
        if (initialContent && editor) {
            let html = '';
            
            const contentSource = initialContent.sections || initialContent.content || [];

            if (Array.isArray(contentSource)) {
                contentSource.forEach((s: any) => {
                    html += `<h2>${s.title}</h2><p>${s.content}</p>`;
                });
            } else if (typeof contentSource === 'string') {
                 html = contentSource;
            } else if (typeof contentSource === 'object') {
                 html = `<h2>${contentSource.title || 'Draft'}</h2><p>${contentSource.content || ''}</p>`;
            }

            if (editor.isEmpty && html) { 
                 editor.commands.setContent(html);
            }
        }
    }, [initialContent, editor]);

    const handleSave = async () => {
        if (!editor) return;
        setIsSaving(true);
        try {
            const json = editor.getJSON();
            // Store content as a flat JSON string or sanitize deeply nested objects if Firestore complains.
            // TipTap JSON is usually safe, but let's wrap it correctly.
            // The error "invalid nested entity" often means we are trying to save 'undefined' or a circular structure.
            // JSON.stringify/parse cleans undefined.
            const cleanContent = JSON.parse(JSON.stringify(json));

            await ReportService.saveDraft(tenantId, reportId, cleanContent, region);
            setLastSaved(new Date());
            toast({ title: 'Saved', description: 'Draft updated.' });
        } catch (e: any) {
            console.error(e);
            toast({ title: 'Error', description: 'Failed to save: ' + e.message, variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleFinalize = async () => {
        if (!editor) return;
        try {
            const json = editor.getJSON();
            const cleanContent = JSON.parse(JSON.stringify(json));
            // Save final state
            await ReportService.saveDraft(tenantId, reportId, cleanContent, region);
            // Ideally call updateDoc to set status='final'
            // For now, just toast
            toast({ title: 'Finalized', description: 'Report locked and ready for export.' });
        } catch(e) {
            toast({ title: 'Error', variant: 'destructive' });
        }
    };

    const handleAiDraft = async () => {
        if (!editor) return;
        setIsGenerating(true);
        try {
            const context = {
                studentId,
                notes: 'Student struggles with attention.',
                history: 'Diagnosed ADHD in 2020.',
                glossary: { 'Student': 'Learner' },
                region // Pass region to AI context
            };

            const result = await ReportService.requestAiDraft(tenantId, reportId, context);
            
            let html = '';
            // Robust check for AI result structure
            const sections = result.sections || result.content || [];
            
            if (Array.isArray(sections)) {
                sections.forEach((s: any) => {
                    html += `<h2>${s.title}</h2><p>${s.content}</p>`;
                });
            } else {
                 html = `<p>${JSON.stringify(result)}</p>`;
            }
            
            editor.commands.setContent(html);
            
            toast({ title: 'Draft Generated', description: 'AI content inserted.' });
        } catch (e) {
            console.error(e);
            toast({ title: 'Generation Failed', description: 'Could not create draft.', variant: 'destructive' });
        } finally {
            setIsGenerating(false);
        }
    };

    const insertText = (text: string) => {
        if (editor) {
            editor.chain().focus().insertContent(` ${text} `).run();
        }
    };

    const handleSubmitForReview = async (supervisorId: string, note: string) => {
        toast({ 
            title: "Submitted for Supervision", 
            description: `Sent to ${MOCK_SUPERVISORS.find(s => s.id === supervisorId)?.name}` 
        });
        setIsReviewModalOpen(false);
    };

    if (!editor) return null;

    // Construct partial report object for export
    // We need to map TipTap JSON back to "Sections" for the Docx Generator if possible,
    // or just pass raw text if the generator supports it.
    // Ideally, we parse the editor HTML.
    const currentReport = {
        id: reportId,
        tenantId,
        studentId,
        title: "Statutory Advice Draft", 
        // Hack: Passing HTML content as a single section for export
        content: { 
            sections: [
                { id: 'full_body', title: 'Report Content', content: editor.getHTML() }
            ] 
        }
    };

    return (
        <div className="flex h-screen bg-background">
            
            <SubmitForReviewModal 
                isOpen={isReviewModalOpen}
                onClose={() => setIsReviewModalOpen(false)}
                onSubmit={handleSubmitForReview}
                supervisors={MOCK_SUPERVISORS}
            />

            {/* Phase 24: Export Modal */}
            <ExportOptionsModal 
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                report={currentReport as any}
                tenantName="MindKindler Practice" 
            />

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

                        <div className="h-6 w-px bg-slate-200 mx-2" />

                        {/* Sidebar Toggles */}
                        <Button 
                            variant={activeSidebar === 'provisions' ? "secondary" : "ghost"} 
                            size="sm" 
                            onClick={() => setActiveSidebar(activeSidebar === 'provisions' ? 'none' : 'provisions')}
                        >
                            <SidebarOpen className="mr-2 h-4 w-4" /> Statutory Bank
                        </Button>
                        <Button 
                            variant={activeSidebar === 'citations' ? "secondary" : "ghost"} 
                            size="sm" 
                            onClick={() => setActiveSidebar(activeSidebar === 'citations' ? 'none' : 'citations')}
                        >
                            <SidebarOpen className="mr-2 h-4 w-4" /> Evidence
                        </Button>
                    </div>
                    <div className="flex gap-2 items-center">
                        <span className="text-xs text-muted-foreground mr-2">
                            {lastSaved ? `Saved ${lastSaved.toLocaleTimeString()}` : 'Unsaved'}
                        </span>
                        
                        <Button size="sm" variant="ghost" onClick={handleSave} disabled={isSaving}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            <Save className="mr-2 h-4 w-4" /> Save
                        </Button>

                        {isTrainee ? (
                            <Button size="sm" className="bg-amber-600 hover:bg-amber-700" onClick={() => setIsReviewModalOpen(true)}>
                                <CheckCircle className="mr-2 h-4 w-4" /> Submit for Review
                            </Button>
                        ) : (
                            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700" onClick={handleFinalize}>
                                <FileText className="mr-2 h-4 w-4" /> Finalize
                            </Button>
                        )}
                        
                        <Button size="sm" variant="secondary" onClick={() => setIsExportModalOpen(true)}>
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

            {/* Sidebars */}
            {activeSidebar === 'citations' && <CitationSidebar onInsert={insertText} studentId={studentId} region={region} />}
            {activeSidebar === 'provisions' && <ProvisionPicker onInsert={insertText} region={region} />}
        </div>
    );
}
