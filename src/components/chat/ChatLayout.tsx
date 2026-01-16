import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { ChatService } from '@/services/chat-service';
import { ChatChannel, ChatMessage } from '@/types/chat';
import { formatDistanceToNow } from 'date-fns';
import { Loader2, Send, Paperclip, Check, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

// --- Subcomponents ---

// 1. Message Bubble
const MessageBubble = ({ message, isMe }: { message: ChatMessage; isMe: boolean }) => {
    const isFlagged = message.guardian.status === 'flagged';
    const isRedacted = message.guardian.status === 'redacted';
    
    return (
        <div className={cn("flex w-full mt-2 space-x-3 max-w-md", isMe ? "ml-auto justify-end" : "")}>
             {!isMe && (
                <Avatar className="h-8 w-8">
                    <AvatarFallback>{message.senderId.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
            )}
            <div className={cn(
                "rounded-lg px-4 py-2 text-sm",
                isMe ? "bg-primary text-primary-foreground" : "bg-muted",
                isFlagged ? "border-2 border-red-500" : ""
            )}>
                {isFlagged && <div className="text-xs text-red-500 font-bold mb-1">Guardian Flag: {message.guardian.flaggedReason?.join(", ")}</div>}
                
                <p>
                    {isRedacted ? message.guardian.redactedContent : message.content}
                </p>
                
                <div className="flex justify-end items-center mt-1 space-x-1">
                    <span className="text-[10px] opacity-70">
                        {message.createdAt ? formatDistanceToNow(message.createdAt.toDate(), { addSuffix: true }) : 'Sending...'}
                    </span>
                    {isMe && message.id && (
                        <CheckCheck className="h-3 w-3 opacity-70" />
                    )}
                </div>
            </div>
        </div>
    );
};

// 2. Channel List Item
const ChannelItem = ({ channel, isSelected, onClick, currentUserId }: { channel: ChatChannel; isSelected: boolean; onClick: () => void; currentUserId: string }) => {
    // Determine display name (Logic: If DM, show other person's name)
    let displayName = channel.displayName;
    if (channel.type === 'direct_message' && !displayName) {
        const otherId = channel.participantIds.find(id => id !== currentUserId) || 'Unknown';
        displayName = channel.participants[otherId]?.displayName || 'Unknown User';
    }

    const hasUnread = false; // TODO: Implement unread logic

    return (
        <div 
            onClick={onClick}
            className={cn(
                "flex items-center space-x-4 p-3 rounded-lg cursor-pointer hover:bg-accent transition-colors",
                isSelected ? "bg-accent" : "bg-transparent"
            )}
        >
            <Avatar>
                 <AvatarFallback>{displayName?.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden">
                <div className="flex justify-between items-center mb-1">
                    <h4 className="text-sm font-semibold truncate">{displayName}</h4>
                    {channel.updatedAt && (
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                            {formatDistanceToNow(channel.updatedAt.toDate(), { addSuffix: false })}
                        </span>
                    )}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                    {channel.lastMessage?.isRedacted ? 
                        <span className="italic text-red-400">Message Redacted</span> : 
                        channel.lastMessage?.content || "No messages yet"}
                </p>
            </div>
            {hasUnread && <div className="h-2 w-2 rounded-full bg-blue-500" />}
        </div>
    );
};


// --- Main Component ---

export function ChatLayout() {
    const { user, userProfile } = useAuth();
    const [channels, setChannels] = useState<ChatChannel[]>([]);
    const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    
    const chatService = useRef<ChatService | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Initialize Service
    useEffect(() => {
        if (user && userProfile?.tenantId && !chatService.current) {
            // Determine Region (Mocking 'mindkindler-uk' for Pilot context)
            const region = 'mindkindler-uk'; 
            chatService.current = new ChatService(region, userProfile.tenantId);
        }
    }, [user, userProfile]);

    // Load Channels
    useEffect(() => {
        if (!user || !chatService.current) return;

        const unsubscribe = chatService.current.subscribeToChannels(user.uid, (data) => {
            setChannels(data);
            setIsLoading(false);
            if (!selectedChannelId && data.length > 0) {
                setSelectedChannelId(data[0].id);
            }
        });

        return () => unsubscribe();
    }, [user, selectedChannelId]); // Added selectedChannelId dependency to select first if none selected

    // Load Messages for Selected Channel
    useEffect(() => {
        if (!selectedChannelId || !chatService.current) return;

        const unsubscribe = chatService.current.subscribeToMessages(selectedChannelId, (data) => {
            setMessages(data);
            // Scroll to bottom
            setTimeout(() => {
                 messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 100);
        });

        return () => unsubscribe();
    }, [selectedChannelId]);

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !selectedChannelId || !chatService.current || !user) return;
        
        try {
            await chatService.current.sendMessage(selectedChannelId, user.uid, newMessage);
            setNewMessage("");
        } catch (error) {
            console.error("Failed to send message:", error);
        }
    };

    if (isLoading) {
        return <div className="flex h-[600px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    const selectedChannel = channels.find(c => c.id === selectedChannelId);

    return (
        <Card className="h-[700px] flex overflow-hidden border shadow-xl">
            {/* Sidebar: Channel List */}
            <div className="w-80 border-r flex flex-col bg-slate-50/50 dark:bg-slate-900/50">
                <div className="p-4 border-b">
                    <h3 className="font-bold text-lg">Messages</h3>
                    <Button variant="outline" size="sm" className="w-full mt-2">
                        + New Chat
                    </Button>
                </div>
                <ScrollArea className="flex-1">
                    <div className="p-2 space-y-1">
                        {channels.map(channel => (
                            <ChannelItem 
                                key={channel.id} 
                                channel={channel} 
                                isSelected={channel.id === selectedChannelId}
                                onClick={() => setSelectedChannelId(channel.id)}
                                currentUserId={user?.uid || ''}
                            />
                        ))}
                        {channels.length === 0 && (
                            <div className="text-center p-4 text-sm text-muted-foreground">
                                No conversations yet.
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col">
                {/* Header */}
                <div className="p-4 border-b flex justify-between items-center bg-background">
                    <div className="flex items-center space-x-3">
                         <Avatar>
                             <AvatarFallback>{selectedChannel?.displayName?.slice(0, 2) || '?'}</AvatarFallback>
                         </Avatar>
                         <div>
                             <h3 className="font-bold text-sm">
                                {selectedChannel?.displayName || 'Select a chat'}
                             </h3>
                             {selectedChannel?.type === 'case_room' && (
                                 <Badge variant="secondary" className="text-[10px] h-5">Case Room</Badge>
                             )}
                         </div>
                    </div>
                    {/* Actions */}
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4 bg-slate-50/30 dark:bg-slate-950/30">
                    <div className="space-y-4">
                        {messages.map(msg => (
                            <MessageBubble 
                                key={msg.id} 
                                message={msg} 
                                isMe={msg.senderId === user?.uid} 
                            />
                        ))}
                         <div ref={messagesEndRef} />
                    </div>
                </ScrollArea>

                {/* Input Area */}
                <div className="p-4 border-t bg-background">
                    <div className="flex space-x-2">
                        <Button variant="ghost" size="icon">
                            <Paperclip className="h-5 w-5 text-muted-foreground" />
                        </Button>
                        <Input 
                            placeholder="Type a message..." 
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            className="flex-1"
                        />
                        <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-2 text-center flex items-center justify-center space-x-1">
                        <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                        <span>Guardian Active: Scanning for PII & Clinical Risks</span>
                    </div>
                </div>
            </div>
        </Card>
    );
}
