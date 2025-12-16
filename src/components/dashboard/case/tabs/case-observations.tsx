"use client";

import { useState } from "react";
import { Case, Observation } from "@/types/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mic, Paperclip, Send, User, Lock, Globe, Users } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CaseObservationsProps {
  caseData: Case;
}

export function CaseObservations({ caseData }: CaseObservationsProps) {
  // Mock observations
  const [observations, setObservations] = useState<Observation[]>([
    {
      id: "1",
      caseId: caseData.id,
      authorId: "user_1",
      authorRole: "Teacher",
      date: new Date().toISOString(),
      content: "John struggled to stay seated during math class today. He was frequently distracted by noises outside.",
      privacyLevel: "team"
    },
    {
      id: "2",
      caseId: caseData.id,
      authorId: "user_2",
      authorRole: "Educational Psychologist",
      date: new Date(Date.now() - 86400000).toISOString(),
      content: "Initial observation during recess showed positive social interaction with peers.",
      privacyLevel: "private"
    }
  ]);

  const [newNote, setNewNote] = useState("");
  const [privacy, setPrivacy] = useState<'public' | 'team' | 'private'>('team');

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    
    const note: Observation = {
      id: Date.now().toString(),
      caseId: caseData.id,
      authorId: "current_user", // Replace with actual user ID
      authorRole: "Educational Psychologist",
      date: new Date().toISOString(),
      content: newNote,
      privacyLevel: privacy
    };

    setObservations([note, ...observations]);
    setNewNote("");
  };

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <div className="md:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Add Observation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Textarea 
                placeholder="Type your observation here..." 
                className="min-h-[100px]"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" title="Voice Input">
                    <Mic className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" title="Attach File">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Select value={privacy} onValueChange={(val: any) => setPrivacy(val)}>
                    <SelectTrigger className="w-[140px] h-9">
                      <div className="flex items-center gap-2">
                        {privacy === 'public' && <Globe className="h-3 w-3" />}
                        {privacy === 'team' && <Users className="h-3 w-3" />}
                        {privacy === 'private' && <Lock className="h-3 w-3" />}
                        <SelectValue />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="team">Team Only</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                      <SelectItem value="public">Public (Report)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAddNote}>
                  Add Note <Send className="ml-2 h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Timeline</h3>
          {observations.map((obs) => (
            <Card key={obs.id} className="overflow-hidden">
              <CardHeader className="bg-muted/30 py-3 flex flex-row items-center space-y-0 gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{obs.authorRole}</p>
                    <span className="text-xs text-muted-foreground">{new Date(obs.date).toLocaleString()}</span>
                  </div>
                </div>
                {obs.privacyLevel === 'private' && <Lock className="h-3 w-3 text-muted-foreground" />}
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{obs.content}</p>
                {obs.attachments && obs.attachments.length > 0 && (
                  <div className="mt-3 flex gap-2">
                    {obs.attachments.map((file, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        <Paperclip className="mr-1 h-3 w-3" /> Attachment {i+1}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Filter & Search</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Search Keywords</Label>
              <Input placeholder="e.g. anxiety, math..." />
            </div>
            <div className="space-y-2">
              <Label>Filter by Author</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="All Authors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Authors</SelectItem>
                  <SelectItem value="teacher">Teachers</SelectItem>
                  <SelectItem value="psychologist">Psychologists</SelectItem>
                  <SelectItem value="parent">Parents</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
