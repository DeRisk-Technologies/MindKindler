"use client";

import { Question } from "@/types/schema";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GripVertical, Trash2, Image as ImageIcon, Plus, X } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface QuestionBlockProps {
  question: Question;
  index: number;
  onUpdate: (updates: Partial<Question>) => void;
  onDelete: () => void;
}

export function QuestionBlock({ question, index, onUpdate, onDelete }: QuestionBlockProps) {
  
  const handleOptionChange = (optIndex: number, val: string) => {
     if (!question.options) return;
     const newOptions = [...question.options];
     newOptions[optIndex] = val;
     onUpdate({ options: newOptions });
  };

  const addOption = () => {
     if (!question.options) return;
     onUpdate({ options: [...question.options, `Option ${question.options.length + 1}`] });
  };

  const removeOption = (optIndex: number) => {
     if (!question.options) return;
     onUpdate({ options: question.options.filter((_, i) => i !== optIndex) });
  };

  return (
    <Card className="relative group">
       <div className="absolute left-0 top-0 bottom-0 w-8 flex items-center justify-center cursor-move text-muted-foreground/50 hover:text-muted-foreground">
          <GripVertical className="h-5 w-5" />
       </div>
       
       <CardHeader className="pl-10 pr-12 py-4">
          <div className="flex items-center gap-4">
             <span className="font-bold text-lg text-muted-foreground">#{index + 1}</span>
             <Select 
               value={question.type} 
               onValueChange={(val: any) => onUpdate({ 
                 type: val, 
                 options: (val === 'multiple-choice' || val === 'scale') ? ["Option 1", "Option 2"] : undefined 
               })}
             >
                <SelectTrigger className="w-[180px]">
                   <SelectValue />
                </SelectTrigger>
                <SelectContent>
                   <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                   <SelectItem value="true-false">True/False</SelectItem>
                   <SelectItem value="short-answer">Short Answer</SelectItem>
                   <SelectItem value="essay">Essay</SelectItem>
                   <SelectItem value="scale">Likert Scale</SelectItem>
                   <SelectItem value="audio-response">Audio Response</SelectItem>
                   <SelectItem value="video-response">Video Response</SelectItem>
                </SelectContent>
             </Select>
             <div className="flex items-center gap-2 ml-auto">
                 <Label className="text-xs">Required</Label>
                 <Switch checked={question.required} onCheckedChange={(c) => onUpdate({ required: c })} />
                 <Label className="text-xs ml-2">Points</Label>
                 <Input type="number" className="w-16 h-8" value={question.points} onChange={(e) => onUpdate({ points: parseInt(e.target.value) || 0 })} />
             </div>
          </div>
       </CardHeader>
       
       <CardContent className="pl-10 space-y-4">
          <div className="space-y-2">
             <Label>Question Text</Label>
             <Textarea 
                value={question.text} 
                onChange={(e) => onUpdate({ text: e.target.value })} 
                placeholder="Enter your question here..."
                className="resize-none"
             />
          </div>

          {(question.type === 'multiple-choice' || question.type === 'scale') && (
             <div className="space-y-2">
                <Label>Options</Label>
                <div className="space-y-2">
                   {question.options?.map((opt, i) => (
                      <div key={i} className="flex items-center gap-2">
                         <div className="h-4 w-4 rounded-full border border-primary/50" />
                         <Input value={opt} onChange={(e) => handleOptionChange(i, e.target.value)} />
                         <Button variant="ghost" size="icon" onClick={() => removeOption(i)} disabled={question.options!.length <= 2}>
                            <X className="h-4 w-4 text-muted-foreground" />
                         </Button>
                      </div>
                   ))}
                </div>
                <Button variant="outline" size="sm" onClick={addOption} className="mt-2">
                   <Plus className="mr-2 h-3 w-3" /> Add Option
                </Button>
             </div>
          )}

          <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                 <ImageIcon className="mr-2 h-4 w-4" /> Add Media
              </Button>
              <Input placeholder="Hint text (optional)" className="flex-1" value={question.hint || ""} onChange={(e) => onUpdate({ hint: e.target.value })} />
          </div>
       </CardContent>

       <div className="absolute top-2 right-2">
          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80" onClick={onDelete}>
             <Trash2 className="h-4 w-4" />
          </Button>
       </div>
    </Card>
  );
}
