// src/components/reporting/ReportEditor.tsx
"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Save, Sparkles, FileText, Share2, History, SidebarOpen, CheckCircle } from 'lucide-react';
import { CitationSidebar } from './CitationSidebar';
import { ProvisionPicker } from './ProvisionPicker';
import { ReportService } from '@/services/report-service';
import { useToast } from '@/hooks/use-toast';
import { Report } from '@/types/schema';
import { FeedbackWidget } from '@/components/ai/FeedbackWidget'; 
import { SubmitForReviewModal } from './modals/SubmitForReviewModal'; 
import { ExportOptionsModal } from './modals/ExportOptionsModal';

// Mock Supervisors (In real app, fetch from Staff Service)
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
    region?: string; // New Prop
}

export function ReportEditor({ reportId, tenantId, studentId, initialContent, userId, userRole = 'EPP', region = 'UK' }: ReportEditorProps) {
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
            if (initialContent.sections) {
                initialContent.sections.forEach((s: any) => {
                    html += `<h2>${s.title}</h2><p>${s.content}</p>`;
                });
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
            const context = {
                studentId,
                notes: 'Student struggles with attention.',
                history: 'Diagnosed ADHD in 2020.',
                glossary: { 'Student': 'Learner' },
                region // Pass region to AI context
            };

            const result = await ReportService.requestAiDraft(tenantId, reportId, context);
            
            let html = '';
            result.sections.forEach((s: any) => {
                html += `<h2>${s.title}</h2><p>${s.content}</p>`;
            });
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
    };

    if (!editor) return null;

    // Construct partial report object for export
    const currentReport = {
        id: reportId,
        tenantId,
        studentId,
        title: "Statutory Advice Draft", // Should ideally come from props
        content: { sections: initialContent?.sections || [] } // Using initial for now, but ideally editor state
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
                report={currentReport}
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
                            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
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
