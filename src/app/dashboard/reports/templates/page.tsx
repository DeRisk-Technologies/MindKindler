// src/app/dashboard/reports/templates/page.tsx
"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, FileText, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { doc, getDoc, collection, getDocs, addDoc } from 'firebase/firestore';
import { getRegionalDb, db as globalDb } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';

interface Template {
  id: string;
  name: string;
  description: string;
  type: 'statutory' | 'clinical' | 'referral' | 'custom';
  tags: string[];
  structure?: any;
}

const MOCK_TEMPLATES: Template[] = [
  {
    id: 'referral_camhs',
    name: 'CAMHS Referral Letter',
    description: 'Standard referral to Child & Adolescent Mental Health Services focusing on emotional regulation and anxiety.',
    type: 'referral',
    tags: ['Mental Health', 'Anxiety', 'Referral']
  },
  {
    id: 'referral_salt',
    name: 'Speech & Language Referral',
    description: 'Referral for communication assessment highlighting receptive/expressive language gaps.',
    type: 'referral',
    tags: ['Communication', 'SALT', 'Referral']
  },
  {
    id: 'school_obs_summary',
    name: 'School Observation Summary',
    description: 'Feedback for teachers following a classroom observation.',
    type: 'clinical',
    tags: ['School', 'Observation']
  }
];

function TemplatesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const sourceSessionId = searchParams.get('sourceSessionId');
  
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [templates, setTemplates] = useState<Template[]>(MOCK_TEMPLATES);
  const [search, setSearch] = useState('');
  
  // Load session data if context exists to pre-fetch student
  const [studentId, setStudentId] = useState<string | null>(null);
  const [studentName, setStudentName] = useState<string>("");

  useEffect(() => {
    async function loadContext() {
       if (!user) return;
       
       try {
           // Resolve Region
           let region = user.region;
           if (!region || region === 'default') {
               const rRef = doc(globalDb, 'user_routing', user.uid);
               const rSnap = await getDoc(rRef);
               region = rSnap.exists() ? rSnap.data().region : 'uk';
           }
           
           if (sourceSessionId) {
               const db = getRegionalDb(region);
               const sessionSnap = await getDoc(doc(db, 'consultation_sessions', sourceSessionId));
               if (sessionSnap.exists()) {
                   const sData = sessionSnap.data();
                   setStudentId(sData.studentId);
                   
                   // Fetch Student Name
                   if (sData.studentId) {
                       const stSnap = await getDoc(doc(db, 'students', sData.studentId));
                       if (stSnap.exists()) {
                           const st = stSnap.data();
                           setStudentName(`${st.identity?.firstName?.value || ''} ${st.identity?.lastName?.value || ''}`);
                       }
                   }
               }
           }
       } catch (e) {
           console.error("Context load failed", e);
       } finally {
           setLoading(false);
       }
    }
    loadContext();
  }, [user, sourceSessionId]);

  const filteredTemplates = templates.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) || 
    t.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()))
  );

  const handleCreate = async (template: Template) => {
      if (!studentId) {
          toast({ variant: "destructive", title: "Missing Context", description: "No student selected." });
          return;
      }
      
      setGenerating(template.id);
      
      try {
          // Trigger Generation Logic similar to Report Builder but optimized for referrals
          // 1. Resolve DB
          let region = user?.region || 'uk';
          // (Mock region resolution if needed, relying on stored state usually)
          const db = getRegionalDb(region);

          // 2. Fetch Data
          const studentSnap = await getDoc(doc(db, 'students', studentId));
          const sessionSnap = sourceSessionId ? await getDoc(doc(db, 'consultation_sessions', sourceSessionId)) : null;
          
          const rawStudent = studentSnap.exists() ? studentSnap.data() : {};
          const rawSession = sessionSnap?.exists() ? sessionSnap.data() : {};

          // 3. Redact PII (Helper logic duplicated for safety)
          // Ideally this should be a shared utility
          const redactedStudent = {
              identity: {
                  firstName: { value: rawStudent.identity?.firstName?.value || "Student" },
                  lastName: { value: rawStudent.identity?.lastName?.value ? rawStudent.identity.lastName.value.charAt(0) + "." : "" },
                  age: "Unknown" // Simplify
              },
              // Allow some medical context for referrals if relevant, else strip
              health: rawStudent.health || {} 
          };

          // 4. Call AI
          const generateFn = httpsCallable(functions, 'generateClinicalReport');
          const result = await generateFn({
              tenantId: user?.tenantId,
              studentId: studentId,
              templateId: template.id,
              contextPackId: 'uk_la_pack', // Default
              studentContext: redactedStudent,
              sessionContext: rawSession
          });

          const responseData = result.data as any;

          // 5. Save Report
          const newReport = {
              title: `${template.name} - ${studentName}`,
              templateId: template.id,
              studentId: studentId,
              studentName: studentName,
              status: 'draft',
              type: template.type,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              content: responseData.sections || [],
              createdBy: user?.uid
          };
          
          const ref = await addDoc(collection(db, 'reports'), newReport);
          
          toast({ title: "Draft Created", description: "Redirecting to editor..." });
          router.push(`/dashboard/reports/editor/${ref.id}`);

      } catch (e) {
          console.error(e);
          toast({ variant: "destructive", title: "Generation Failed", description: "Could not create draft." });
      } finally {
          setGenerating(null);
      }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
        <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-800">Report Templates</h1>
            <p className="text-slate-500 mt-2">Choose a template to generate documents based on consultation evidence.</p>
        </div>

        {sourceSessionId && (
            <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-lg mb-8 flex items-center gap-3">
                <Sparkles className="text-indigo-600 h-5 w-5" />
                <div>
                    <p className="text-sm font-medium text-indigo-900">Context Active</p>
                    <p className="text-xs text-indigo-700">Generating for <span className="font-bold">{studentName}</span> based on recent session.</p>
                </div>
            </div>
        )}

        <div className="relative mb-6">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input 
                placeholder="Search templates (e.g., 'Referral', 'Observation')..." 
                className="pl-10 max-w-md"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />
        </div>

        {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin h-8 w-8 text-slate-300" /></div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTemplates.map(template => (
                    <Card key={template.id} className="hover:shadow-md transition-shadow cursor-pointer border-slate-200">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <Badge variant={template.type === 'referral' ? 'destructive' : 'secondary'} className="mb-2">
                                    {template.type}
                                </Badge>
                            </div>
                            <CardTitle className="text-lg">{template.name}</CardTitle>
                            <CardDescription className="line-clamp-2 min-h-[40px]">
                                {template.description}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                {template.tags.map(tag => (
                                    <span key={tag} className="text-[10px] bg-slate-100 px-2 py-1 rounded text-slate-600">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="pt-0">
                            <Button 
                                className="w-full" 
                                variant="outline"
                                onClick={() => handleCreate(template)}
                                disabled={!!generating}
                            >
                                {generating === template.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                                {generating === template.id ? 'Drafting...' : 'Use Template'}
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        )}
    </div>
  );
}

export default function TemplatesPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-slate-300" /></div>}>
            <TemplatesContent />
        </Suspense>
    );
}
