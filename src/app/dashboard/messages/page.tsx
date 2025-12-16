"use client";

import { useFirestoreCollection } from "@/hooks/use-firestore";
import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { auth, db } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { Loader2, Plus, Search, Send, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";

export default function MessagesPage() {
  const { data: users } = useFirestoreCollection<any>("users", "displayName", "asc");
  const [activeTab, setActiveTab] = useState("inbox");
  const [selectedThread, setSelectedThread] = useState<any>(null);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [threads, setThreads] = useState<any[]>([]);
  const [threadMessages, setThreadMessages] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isNewMsgOpen, setIsNewMsgOpen] = useState(false);
  const [newMsgRecipient, setNewMsgRecipient] = useState("");
  
  useEffect(() => {
     const unsub = auth.onAuthStateChanged(u => setCurrentUser(u));
     return () => unsub();
  }, []);

  // Fetch threads where current user is a participant
  useEffect(() => {
    if (!currentUser) return;

    const q = query(
        collection(db, "threads"), 
        where("participants", "array-contains", currentUser.uid),
        orderBy("lastMessageAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setThreads(data);
    });
    return () => unsubscribe();
  }, [currentUser]);

  // Fetch messages for selected thread
  useEffect(() => {
      if (!selectedThread) return;
      const q = query(
          collection(db, `threads/${selectedThread.id}/messages`),
          orderBy("createdAt", "asc")
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
          setThreadMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
      return () => unsubscribe();
  }, [selectedThread]);

  const handleSendMessage = async () => {
      if (!messageInput.trim() || !selectedThread || !currentUser) return;
      
      await addDoc(collection(db, `threads/${selectedThread.id}/messages`), {
          text: messageInput,
          senderId: currentUser.uid,
          createdAt: serverTimestamp()
      });
      
      // Update thread last message
      // Note: In real app, use batch/cloud function
      
      setMessageInput("");
  };

  const startNewChat = async () => {
      if (!newMsgRecipient || !currentUser) return;
      
      // Check if thread exists or create new
      // Simplified: always create new or finding existing is complex client-side query
      // For prototype, we create a new thread entry
      const recipientUser = users.find(u => u.id === newMsgRecipient || u.uid === newMsgRecipient);
      
      const ref = await addDoc(collection(db, "threads"), {
          participants: [currentUser.uid, newMsgRecipient],
          participantNames: [currentUser.displayName || "Me", recipientUser?.displayName || "User"],
          lastMessage: "Chat started",
          lastMessageAt: serverTimestamp(),
          startedBy: currentUser.uid
      });
      
      setIsNewMsgOpen(false);
      setSelectedThread({ id: ref.id, participantNames: [currentUser.displayName, recipientUser?.displayName] });
  };

  // Filter threads for tabs (mock logic as status isn't fully implemented in schema yet)
  // In real app, each thread needs a per-user status (read/unread/archived)
  const filteredThreads = threads.filter(t => {
      // Basic Search
      const names = t.participantNames?.join(" ").toLowerCase() || "";
      return names.includes(searchQuery.toLowerCase());
  });

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col md:flex-row gap-4">
      {/* Sidebar List */}
      <Card className="w-full md:w-80 flex flex-col">
        <CardHeader className="p-4 border-b space-y-3">
             <div className="flex items-center justify-between">
                <CardTitle>Messages</CardTitle>
                <Dialog open={isNewMsgOpen} onOpenChange={setIsNewMsgOpen}>
                    <DialogTrigger asChild>
                         <Button size="icon" variant="ghost"><Plus className="h-5 w-5" /></Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>New Message</DialogTitle></DialogHeader>
                        <div className="space-y-4 py-4">
                            <Select onValueChange={setNewMsgRecipient}>
                                <SelectTrigger><SelectValue placeholder="Select Recipient" /></SelectTrigger>
                                <SelectContent>
                                    {users.filter(u => u.uid !== currentUser?.uid).map(u => (
                                        <SelectItem key={u.id} value={u.uid || u.id}>{u.displayName} ({u.role})</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button onClick={startNewChat} className="w-full">Start Chat</Button>
                        </div>
                    </DialogContent>
                </Dialog>
             </div>
             <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search..." className="pl-8" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
             </div>
        </CardHeader>
        <div className="flex-1 overflow-auto">
             <Tabs defaultValue="inbox" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="px-4 pt-2">
                    <TabsList className="w-full grid grid-cols-3">
                        <TabsTrigger value="inbox">Inbox</TabsTrigger>
                        <TabsTrigger value="sent">Sent</TabsTrigger>
                        <TabsTrigger value="archive">Archive</TabsTrigger>
                    </TabsList>
                </div>
                <TabsContent value="inbox" className="p-0 mt-2">
                    {filteredThreads.map(thread => (
                        <div 
                            key={thread.id} 
                            className={`p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors ${selectedThread?.id === thread.id ? 'bg-muted' : ''}`}
                            onClick={() => setSelectedThread(thread)}
                        >
                            <div className="flex justify-between mb-1">
                                <span className="font-semibold truncate max-w-[140px]">
                                    {thread.participantNames?.find((n: string) => !n.includes("Me") && n !== currentUser?.displayName) || "Unknown"}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {thread.lastMessageAt ? format(thread.lastMessageAt.toDate(), "MMM d") : ""}
                                </span>
                            </div>
                            <p className="text-sm text-muted-foreground truncate">{thread.lastMessage}</p>
                        </div>
                    ))}
                    {filteredThreads.length === 0 && <div className="p-4 text-center text-muted-foreground text-sm">No messages found.</div>}
                </TabsContent>
                {/* Sent/Archive Tabs would filter threads based on metadata in a real app */}
                 <TabsContent value="sent" className="p-4 text-center text-sm text-muted-foreground">Sent folder (Simulated)</TabsContent>
                 <TabsContent value="archive" className="p-4 text-center text-sm text-muted-foreground">Archived threads</TabsContent>
             </Tabs>
        </div>
      </Card>

      {/* Chat Area */}
      <Card className="flex-1 flex flex-col">
          {selectedThread ? (
              <>
                <CardHeader className="p-4 border-b flex flex-row items-center gap-3">
                    <Avatar>
                        <AvatarFallback>{selectedThread.participantNames?.[0]?.[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                        <CardTitle className="text-base">
                             {selectedThread.participantNames?.filter((n: string) => n !== currentUser?.displayName).join(", ")}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">Active now</p>
                    </div>
                </CardHeader>
                <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                        {threadMessages.map(msg => {
                            const isMe = msg.senderId === currentUser?.uid;
                            return (
                                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[70%] px-4 py-2 rounded-lg text-sm ${isMe ? 'bg-primary text-primary-foreground rounded-tr-none' : 'bg-muted rounded-tl-none'}`}>
                                        {msg.text}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </ScrollArea>
                <div className="p-4 border-t">
                    <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex gap-2">
                        <Input 
                            placeholder="Type a message..." 
                            value={messageInput} 
                            onChange={e => setMessageInput(e.target.value)} 
                        />
                        <Button type="submit" size="icon"><Send className="h-4 w-4" /></Button>
                    </form>
                </div>
              </>
          ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                  <User className="h-16 w-16 mb-4 opacity-20" />
                  <p>Select a conversation to start chatting.</p>
              </div>
          )}
      </Card>
    </div>
  );
}
