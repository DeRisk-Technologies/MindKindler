"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { 
    Bot, 
    MessageSquare, 
    Send, 
    X, 
    MoreVertical, 
    Phone, 
    Video, 
    Search, 
    ArrowLeft, 
    Loader2, 
    User,
    Eye,
    EyeOff
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { auth, db } from "@/lib/firebase";
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  addDoc, 
  serverTimestamp, 
  doc, 
  updateDoc, 
  getDoc,
  limit,
  setDoc,
  deleteDoc
} from "firebase/firestore";
import { format } from "date-fns";
import dynamic from 'next/dynamic';
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Dynamically import EmojiPicker to avoid SSR issues
const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false });

// --- Types ---

interface ChatUser {
  uid: string;
  displayName: string;
  photoURL?: string;
  role?: string;
  online?: boolean;
  isVisible?: boolean; // New Field: user preference for visibility
  lastSeen?: any;
}

interface ChatThread {
  id: string;
  participants: string[];
  participantDetails?: Record<string, { displayName: string, photoURL?: string }>;
  lastMessage: string;
  lastMessageAt: any;
  unreadCount?: number;
  isTyping?: Record<string, boolean>;
  type: 'direct' | 'group';
  status?: 'pending' | 'accepted' | 'rejected';
  startedBy?: string;
}

interface ChatMessage {
  id: string;
  text: string;
  senderId: string;
  createdAt: any;
  readBy?: string[];
  type?: 'text' | 'image' | 'file';
}

export function AIAssistantFloat() {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'ai' | 'chat'>('ai');
  
  // AI State
  const [aiMessages, setAiMessages] = useState<{ role: 'user' | 'assistant', text: string }[]>([
    { role: 'assistant', text: 'Hello! I am your AI assistant. How can I help you today?' }
  ]);
  const [aiInput, setAiInput] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);

  // Chat State
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isUserVisible, setIsUserVisible] = useState(true); // Local state for immediate UI feedback
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThread, setActiveThread] = useState<ChatThread | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<ChatUser[]>([]);
  const [showNewChat, setShowNewChat] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  // Track other users' online status in real-time
  const [usersStatus, setUsersStatus] = useState<Record<string, { online: boolean, isVisible?: boolean }>>({});

  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Initialize Auth & Presence
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setCurrentUser(user);
      if (user) {
        // Fetch current visibility setting
        const userRef = doc(db, 'users', user.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
            const data = snap.data();
            // Default to true if field is missing
            setIsUserVisible(data.isVisible !== false);
        }

        // Set online status initially
        // Note: isVisible is stored in Firestore to persist preference
        setDoc(userRef, { 
          online: true,
          lastSeen: serverTimestamp(),
          isVisible: snap.exists() ? (snap.data().isVisible !== false) : true
        }, { merge: true }).catch(console.error);

        // Optional: Handle window close/offline (simplified)
        window.addEventListener('beforeunload', () => {
             // Best effort offline status
             // In real app, use Realtime Database 'onDisconnect'
             // Firestore doesn't support 'onDisconnect' natively for writing data
        });
      }
    });
    return () => unsubscribe();
  }, []);

  // Toggle Visibility
  const toggleVisibility = async () => {
      if (!currentUser) return;
      
      const newValue = !isUserVisible;
      setIsUserVisible(newValue); // Optimistic update
      
      try {
          await updateDoc(doc(db, 'users', currentUser.uid), {
              isVisible: newValue,
              online: newValue // If hidden, effectively offline to others
          });
          
          toast({
              title: newValue ? "You are now Online" : "You are appearing Offline",
              description: newValue ? "Other users can see when you are active." : "Your online status is hidden from other users."
          });
      } catch (e) {
          console.error("Error updating visibility:", e);
          setIsUserVisible(!newValue); // Revert
          toast({ title: "Error", description: "Could not update status.", variant: "destructive" });
      }
  };

  // Fetch Threads
  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, "threads"),
      where("participants", "array-contains", currentUser.uid),
      orderBy("lastMessageAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedThreads = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ChatThread[];
      setThreads(loadedThreads);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Subscribe to Users Status (for online indicators)
  // Only subscribe to users we have threads with or are searching for
  // Simplified: Global subscription for prototype (careful with scale)
  useEffect(() => {
      if (!currentUser) return;
      
      // Better approach: Subscribe only to participant UIDs from threads
      const q = query(collection(db, 'users'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
          const statusMap: Record<string, { online: boolean, isVisible?: boolean }> = {};
          snapshot.docs.forEach(doc => {
              const data = doc.data();
              statusMap[doc.id] = { 
                  online: data.online, 
                  isVisible: data.isVisible !== false 
              };
          });
          setUsersStatus(statusMap);
      });
      return () => unsubscribe();
  }, [currentUser]);

  // Fetch Messages for Active Thread
  useEffect(() => {
    if (!activeThread) return;

    const q = query(
      collection(db, `threads/${activeThread.id}/messages`),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ChatMessage[];
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [activeThread]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, aiMessages, mode]);

  // Fetch Users for New Chat
  useEffect(() => {
    if (showNewChat) {
      const fetchUsers = async () => {
        try {
          const q = query(collection(db, 'users'), limit(50));
          const snap = await import('firebase/firestore').then(mod => mod.getDocs(q));
          const userList = snap.docs.map(doc => ({ uid: doc.id, ...doc.data() })) as ChatUser[];
          setUsers(userList.filter(u => u.uid !== currentUser?.uid));
          setFilteredUsers(userList.filter(u => u.uid !== currentUser?.uid));
        } catch (e) {
          console.error("Error fetching users:", e);
        }
      };
      fetchUsers();
    }
  }, [showNewChat, currentUser]);

  // Filter users
  useEffect(() => {
    if (!searchQuery) {
      setFilteredUsers(users);
    } else {
      setFilteredUsers(users.filter(u => 
        u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.role?.toLowerCase().includes(searchQuery.toLowerCase())
      ));
    }
  }, [searchQuery, users]);


  // --- AI Handlers ---

  const handleAiSend = () => {
    if (!aiInput.trim()) return;
    setAiMessages(prev => [...prev, { role: 'user', text: aiInput }]);
    setAiInput("");
    setIsAiTyping(true);
    
    // Mock response
    setTimeout(() => {
      setAiMessages(prev => [...prev, { role: 'assistant', text: "I'm processing that request. (This is a mock response)" }]);
      setIsAiTyping(false);
    }, 1500);
  };

  // --- Chat Handlers ---

  const handleChatSend = async () => {
    if (!chatInput.trim() || !activeThread || !currentUser) return;
    
    try {
      await addDoc(collection(db, `threads/${activeThread.id}/messages`), {
        text: chatInput,
        senderId: currentUser.uid,
        createdAt: serverTimestamp(),
        readBy: [currentUser.uid]
      });
      
      await updateDoc(doc(db, "threads", activeThread.id), {
        lastMessage: chatInput,
        lastMessageAt: serverTimestamp()
      });
      
      setChatInput("");
      setShowEmojiPicker(false);
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Could not send message.",
        variant: "destructive"
      });
    }
  };

  const startNewChat = async (targetUser: ChatUser) => {
    if (!currentUser) return;

    // Check if thread exists locally first
    const existingThread = threads.find(t => 
      t.participants.length === 2 && 
      t.participants.includes(targetUser.uid) && 
      t.participants.includes(currentUser.uid)
    );

    if (existingThread) {
      setActiveThread(existingThread);
      setShowNewChat(false);
      setMode('chat');
    } else {
      try {
        const newThreadRef = await addDoc(collection(db, "threads"), {
          participants: [currentUser.uid, targetUser.uid],
          participantDetails: {
            [currentUser.uid]: { displayName: currentUser.displayName || "Unknown", photoURL: currentUser.photoURL || "" },
            [targetUser.uid]: { displayName: targetUser.displayName || "Unknown", photoURL: targetUser.photoURL || "" }
          },
          lastMessage: "Chat started",
          lastMessageAt: serverTimestamp(),
          type: 'direct',
          status: 'pending',
          startedBy: currentUser.uid
        });

        // Optimistically set active
        setActiveThread({
          id: newThreadRef.id,
          participants: [currentUser.uid, targetUser.uid],
          participantDetails: {
            [currentUser.uid]: { displayName: currentUser.displayName || "Me", photoURL: currentUser.photoURL || "" },
            [targetUser.uid]: { displayName: targetUser.displayName || "User", photoURL: targetUser.photoURL || "" }
          },
          lastMessage: "Chat started",
          lastMessageAt: new Date(),
          type: 'direct',
          status: 'pending',
          startedBy: currentUser.uid
        });
        
        setShowNewChat(false);
        setMode('chat');
      } catch (error) {
        console.error("Error creating thread:", error);
        toast({ title: "Error", description: "Failed to start conversation", variant: "destructive" });
      }
    }
  };
  
  const acceptRequest = async (threadId: string) => {
     try {
         await updateDoc(doc(db, "threads", threadId), {
             status: 'accepted'
         });
         toast({ title: "Connected", description: "You can now chat with this user." });
     } catch (e) {
         console.error(e);
     }
  };
  
  const rejectRequest = async (threadId: string) => {
      try {
          await deleteDoc(doc(db, "threads", threadId));
          toast({ title: "Request Rejected" });
          setActiveThread(null);
      } catch (e) {
          console.error(e);
      }
  };

  const getOtherParticipant = (thread: ChatThread) => {
    if (!currentUser) return null;
    const otherId = thread.participants.find(p => p !== currentUser.uid);
    if (!otherId) return null; 
    
    // Use stored details
    let details: any = { uid: otherId, displayName: "User", photoURL: "" };
    if (thread.participantDetails && thread.participantDetails[otherId]) {
        details = { uid: otherId, ...thread.participantDetails[otherId] };
    }
    
    // Augment with real-time status if available
    if (usersStatus[otherId]) {
        // Only show as online if they are actually online AND visible
        const status = usersStatus[otherId];
        details.online = status.online && status.isVisible;
    }
    
    return details;
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <TooltipProvider>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button 
            size="icon" 
            className={cn(
              "h-14 w-14 rounded-full shadow-xl transition-all duration-300", 
              isOpen ? "bg-red-500 hover:bg-red-600 rotate-90" : "bg-primary hover:bg-primary/90"
            )}
          >
            {isOpen ? <X className="h-6 w-6 text-white" /> : <MessageSquare className="h-8 w-8 text-white" />}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[380px] h-[600px] p-0 mb-4 mr-2 shadow-2xl border-2 border-primary/20 overflow-hidden flex flex-col bg-background rounded-xl" align="end" sideOffset={10}>
          
          {/* Header */}
          <div className="bg-primary p-3 flex items-center justify-between text-primary-foreground shadow-md z-10">
             <div className="flex items-center gap-2">
                 {activeThread && mode === 'chat' ? (
                     <Button variant="ghost" size="icon" className="h-8 w-8 text-white -ml-2 hover:bg-white/20" onClick={() => setActiveThread(null)}>
                         <ArrowLeft className="h-5 w-5" />
                     </Button>
                 ) : null}
                 
                 {mode === 'ai' ? (
                    <>
                        <Bot className="h-5 w-5" />
                        <h3 className="font-semibold text-sm">AI Assistant</h3>
                    </>
                 ) : (
                    activeThread ? (
                        <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8 border border-white/30">
                                <AvatarFallback>{getOtherParticipant(activeThread)?.displayName?.[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                                <span className="font-semibold text-sm leading-none">{getOtherParticipant(activeThread)?.displayName}</span>
                                {getOtherParticipant(activeThread)?.online ? (
                                    <span className="text-[10px] text-green-200 flex items-center gap-1 font-medium">
                                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block"></span>
                                        Online
                                    </span>
                                ) : (
                                    <span className="text-[10px] opacity-70">Offline</span>
                                )}
                            </div>
                        </div>
                    ) : (
                        <h3 className="font-semibold text-sm">Messages</h3>
                    )
                 )}
             </div>
             
             <div className="flex gap-1 items-center">
                 {/* Visibility Toggle */}
                 {mode === 'chat' && !activeThread && !showNewChat && (
                     <Tooltip>
                         <TooltipTrigger asChild>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 hover:bg-white/20 text-white mr-1" 
                                onClick={toggleVisibility}
                            >
                                {isUserVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4 opacity-70" />}
                            </Button>
                         </TooltipTrigger>
                         <TooltipContent side="bottom" className="text-xs">
                             {isUserVisible ? "You are visible to others" : "You are appearing offline"}
                         </TooltipContent>
                     </Tooltip>
                 )}

                 {!activeThread && (
                     <div className="flex bg-primary-foreground/20 rounded-lg p-0.5">
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className={cn("h-7 px-2 text-xs", mode === 'ai' && "bg-white text-primary hover:bg-white/90")}
                            onClick={() => setMode('ai')}
                        >
                            AI
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className={cn("h-7 px-2 text-xs", mode === 'chat' && "bg-white text-primary hover:bg-white/90")}
                            onClick={() => setMode('chat')}
                        >
                            Chat
                        </Button>
                     </div>
                 )}
                 {mode === 'chat' && activeThread && (
                     <>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/20 text-white"><Phone className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/20 text-white"><Video className="h-4 w-4" /></Button>
                     </>
                 )}
                 {mode === 'chat' && !activeThread && !showNewChat && (
                     <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/20 text-white" onClick={() => setShowNewChat(true)}>
                         <MessageSquare className="h-4 w-4" />
                     </Button>
                 )}
             </div>
          </div>
          
          {/* Content Area */}
          <div className="flex-1 overflow-hidden relative bg-muted/30">
            
            {/* AI MODE */}
            {mode === 'ai' && (
                <div className="h-full flex flex-col">
                    <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                        <div className="space-y-4">
                        {aiMessages.map((msg, i) => (
                            <div 
                            key={i} 
                            className={cn(
                                "flex w-max max-w-[85%] flex-col gap-2 rounded-2xl px-4 py-2 text-sm shadow-sm",
                                msg.role === "user" 
                                ? "ml-auto bg-primary text-primary-foreground rounded-br-none" 
                                : "bg-white dark:bg-zinc-800 text-foreground rounded-bl-none border"
                            )}
                            >
                            {msg.text}
                            </div>
                        ))}
                        {isAiTyping && (
                            <div className="flex items-center gap-1 bg-white dark:bg-zinc-800 px-3 py-2 rounded-2xl w-fit border">
                                <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce"></span>
                                <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce delay-75"></span>
                                <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce delay-150"></span>
                            </div>
                        )}
                        </div>
                    </ScrollArea>
                    <div className="p-3 bg-background border-t">
                        <form onSubmit={(e) => { e.preventDefault(); handleAiSend(); }} className="flex gap-2 relative">
                            <Input 
                                placeholder="Ask AI..." 
                                value={aiInput}
                                onChange={(e) => setAiInput(e.target.value)}
                                className="flex-1 pr-10 rounded-full bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary/50"
                            />
                            <Button type="submit" size="icon" className="rounded-full w-10 h-10 shrink-0">
                                <Send className="h-4 w-4" />
                            </Button>
                        </form>
                    </div>
                </div>
            )}

            {/* CHAT MODE - THREAD LIST */}
            {mode === 'chat' && !activeThread && !showNewChat && (
                <ScrollArea className="h-full">
                    {/* Offline Warning */}
                    {!isUserVisible && (
                        <div className="bg-amber-100 dark:bg-amber-950/30 p-2 text-center text-xs text-amber-800 dark:text-amber-500 border-b border-amber-200">
                            You are currently appearing offline.
                        </div>
                    )}
                    
                    {threads.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground p-6 text-center">
                            <MessageSquare className="h-12 w-12 mb-3 opacity-20" />
                            <p className="text-sm">No conversations yet.</p>
                            <Button variant="link" onClick={() => setShowNewChat(true)}>Start a new chat</Button>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {threads.map(thread => {
                                const other = getOtherParticipant(thread);
                                const isPending = thread.status === 'pending' && thread.startedBy !== currentUser?.uid;
                                return (
                                    <div 
                                        key={thread.id} 
                                        className="p-3 hover:bg-muted/50 cursor-pointer flex items-center gap-3 transition-colors"
                                        onClick={() => setActiveThread(thread)}
                                    >
                                        <div className="relative">
                                            <Avatar className="h-12 w-12">
                                                <AvatarImage src={other?.photoURL} />
                                                <AvatarFallback>{other?.displayName?.[0]}</AvatarFallback>
                                            </Avatar>
                                            {other.online && (
                                                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-baseline mb-0.5">
                                                <h4 className="font-semibold text-sm truncate">{other?.displayName}</h4>
                                                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                                    {thread.lastMessageAt?.toDate ? format(thread.lastMessageAt.toDate(), "h:mm a") : ""}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <p className={cn("text-xs truncate max-w-[180px]", isPending ? "text-primary italic" : "text-muted-foreground")}>
                                                    {isPending ? "Request pending..." : thread.lastMessage}
                                                </p>
                                                {isPending && <span className="h-2 w-2 bg-primary rounded-full"></span>}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </ScrollArea>
            )}

            {/* CHAT MODE - NEW CHAT */}
            {mode === 'chat' && showNewChat && (
                <div className="flex flex-col h-full">
                    <div className="p-3 border-b flex items-center gap-2 bg-background">
                        <Button variant="ghost" size="icon" className="h-8 w-8 -ml-1" onClick={() => setShowNewChat(false)}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div className="relative flex-1">
                            <Search className="absolute left-2 top-2.5 h-3 w-3 text-muted-foreground" />
                            <Input 
                                placeholder="Search users..." 
                                className="h-8 text-xs pl-7 bg-muted/50 border-none" 
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                autoFocus
                            />
                        </div>
                    </div>
                    <ScrollArea className="flex-1">
                        <div className="p-2">
                             <h4 className="text-xs font-semibold text-muted-foreground px-2 py-1 mb-1">Suggested</h4>
                             {filteredUsers.map(user => (
                                 <div 
                                    key={user.uid} 
                                    className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded-lg cursor-pointer transition-colors"
                                    onClick={() => startNewChat(user)}
                                 >
                                     <Avatar className="h-10 w-10">
                                         <AvatarImage src={user.photoURL} />
                                         <AvatarFallback>{user.displayName?.[0] || "?"}</AvatarFallback>
                                     </Avatar>
                                     <div className="flex flex-col">
                                         <span className="text-sm font-medium">{user.displayName}</span>
                                         <span className="text-xs text-muted-foreground">{user.role || "User"}</span>
                                     </div>
                                 </div>
                             ))}
                        </div>
                    </ScrollArea>
                </div>
            )}

            {/* CHAT MODE - ACTIVE THREAD */}
            {mode === 'chat' && activeThread && (
                <div className="h-full flex flex-col">
                    {/* Request Handling */}
                    {activeThread.status === 'pending' && activeThread.startedBy !== currentUser?.uid && (
                        <div className="bg-muted p-3 text-sm flex flex-col gap-2 border-b">
                            <p className="text-center text-muted-foreground">
                                {getOtherParticipant(activeThread)?.displayName} wants to send you a message.
                            </p>
                            <div className="flex gap-2 justify-center">
                                <Button size="sm" variant="destructive" onClick={() => rejectRequest(activeThread.id)}>Block</Button>
                                <Button size="sm" onClick={() => acceptRequest(activeThread.id)}>Accept</Button>
                            </div>
                        </div>
                    )}

                    <ScrollArea className="flex-1 p-4 bg-[url('/chat-bg-pattern.png')] bg-repeat" ref={scrollRef}>
                        <div className="space-y-4">
                            {messages.map((msg, i) => {
                                const isMe = msg.senderId === currentUser?.uid;
                                return (
                                    <div key={msg.id} className={cn("flex w-full", isMe ? "justify-end" : "justify-start")}>
                                        <div 
                                            className={cn(
                                                "max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm relative group",
                                                isMe ? "bg-primary text-primary-foreground rounded-br-none" : "bg-white dark:bg-zinc-800 border rounded-bl-none"
                                            )}
                                        >
                                            {msg.text}
                                            <div className={cn("text-[10px] mt-1 opacity-70 flex items-center justify-end gap-1", isMe ? "text-primary-foreground/80" : "text-muted-foreground")}>
                                                {msg.createdAt?.toDate ? format(msg.createdAt.toDate(), "h:mm a") : "Sending..."}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </ScrollArea>
                    
                    {/* Input Area */}
                    <div className="p-2 bg-background border-t">
                        {activeThread.status === 'pending' && activeThread.startedBy !== currentUser?.uid ? (
                            <div className="text-center text-xs text-muted-foreground p-2">
                                Accept the request to reply.
                            </div>
                        ) : (
                            <div className="flex items-end gap-2 relative">
                                <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                                    <PopoverTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0 text-muted-foreground">
                                            <span className="text-lg">😊</span>
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-full p-0 border-none bg-transparent shadow-none" side="top" align="start">
                                        <EmojiPicker 
                                            onEmojiClick={(e) => setChatInput(prev => prev + e.emoji)} 
                                            width={300} 
                                            height={350}
                                        />
                                    </PopoverContent>
                                </Popover>
                                
                                <Input 
                                    placeholder="Type a message..." 
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleChatSend()}
                                    className="flex-1 min-h-[40px] max-h-[100px] py-2 rounded-2xl bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary/50"
                                />
                                
                                <Button 
                                    onClick={handleChatSend} 
                                    size="icon" 
                                    className="h-10 w-10 shrink-0 rounded-full"
                                    disabled={!chatInput.trim()}
                                >
                                    <Send className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            )}
            
          </div>
        </PopoverContent>
      </Popover>
      </TooltipProvider>
    </div>
  );
}
