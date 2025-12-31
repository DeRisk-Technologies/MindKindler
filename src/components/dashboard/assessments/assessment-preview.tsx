"use client";

import { AssessmentTemplate } from "@/types/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Mic, Video, Volume2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface AssessmentPreviewProps {
  template: AssessmentTemplate;
}

export function AssessmentPreview({ template }: AssessmentPreviewProps) {
  return (
    <div className="max-w-3xl mx-auto space-y-8 p-6 bg-white dark:bg-zinc-950 border rounded-xl shadow-sm my-8">
       <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">{template.title}</h1>
          <p className="text-muted-foreground">{template.description}</p>
          <div className="flex justify-center gap-4 text-sm text-muted-foreground pt-2">
             <span>{template.questions.length} Questions</span>
             <span>•</span>
             <span>Category: {template.category}</span>
          </div>
       </div>

       <Separator />

       <div className="space-y-8">
          {template.questions.map((q, i) => (
             <div key={q.id} className="space-y-4">
                <div className="flex gap-2">
                   <span className="font-bold text-lg">{i + 1}.</span>
                   <div className="space-y-1 flex-1">
                      <p className="text-lg font-medium">{q.text} {q.required && <span className="text-red-500">*</span>}</p>
                      {q.hint && <p className="text-sm text-muted-foreground italic">Hint: {q.hint}</p>}
                   </div>
                   <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded h-fit">{q.points} pts</span>
                </div>

                <div className="pl-8">
                   {q.type === 'multiple-choice' && (
                      <RadioGroup>
                         {q.options?.map((opt, idx) => (
                            <div key={idx} className="flex items-center space-x-2">
                               <RadioGroupItem value={opt} id={`${q.id}-${idx}`} />
                               <Label htmlFor={`${q.id}-${idx}`}>{opt}</Label>
                            </div>
                         ))}
                      </RadioGroup>
                   )}

                   {q.type === 'true-false' && (
                      <RadioGroup>
                         <div className="flex items-center space-x-2">
                            <RadioGroupItem value="true" id={`${q.id}-true`} />
                            <Label htmlFor={`${q.id}-true`}>True</Label>
                         </div>
                         <div className="flex items-center space-x-2">
                            <RadioGroupItem value="false" id={`${q.id}-false`} />
                            <Label htmlFor={`${q.id}-false`}>False</Label>
                         </div>
                      </RadioGroup>
                   )}

                   {q.type === 'short-answer' && (
                      <Input placeholder="Type your answer here..." className="max-w-md" />
                   )}

                   {q.type === 'essay' && (
                      <Textarea placeholder="Type your response here..." />
                   )}
                   
                   {q.type === 'scale' && (
                       <div className="flex justify-between max-w-md">
                          {q.options?.map((opt, idx) => (
                             <div key={idx} className="flex flex-col items-center gap-2">
                                <div className="h-4 w-4 rounded-full border border-primary/50" />
                                <span className="text-xs">{opt}</span>
                             </div>
                          ))}
                       </div>
                   )}

                   {q.type === 'audio-response' && (
                      <Button variant="outline" className="w-full h-24 flex flex-col gap-2">
                         <Mic className="h-6 w-6" />
                         <span>Tap to Record Audio</span>
                      </Button>
                   )}

                   {q.type === 'video-response' && (
                      <Button variant="outline" className="w-full h-32 flex flex-col gap-2 border-dashed">
                         <Video className="h-6 w-6" />
                         <span>Tap to Record Video</span>
                      </Button>
                   )}
                </div>
                
                {i < template.questions.length - 1 && <Separator className="mt-8" />}
             </div>
          ))}
       </div>

       <div className="pt-8 flex justify-end">
          <Button size="lg">Submit Assessment</Button>
       </div>
    </div>
  );
}
