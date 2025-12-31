"use client";

import { useFirestoreCollection } from "@/hooks/use-firestore";
import { Notification } from "@/types/schema";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, Check, ExternalLink } from "lucide-react";
import { auth } from "@/lib/firebase";
import { markAsRead, markAllAsRead } from "@/lib/notifications";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

export function NotificationBell() {
    // In real app, filter by recipientUserId inside hook query for performance
    const { data: notifications } = useFirestoreCollection<Notification>("notifications", "createdAt", "desc");
    const router = useRouter();
    
    // Filter for current user (mock)
    const myNotifications = notifications.filter(n => n.recipientUserId === (auth.currentUser?.uid || "unknown"));
    const unreadCount = myNotifications.filter(n => !n.read).length;

    const handleRead = (n: Notification) => {
        markAsRead(n.id);
        if (n.link) router.push(n.link);
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-600 animate-pulse" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between p-4 border-b bg-slate-50">
                    <h4 className="font-semibold text-sm">Notifications ({unreadCount})</h4>
                    <Button variant="ghost" size="sm" className="h-auto p-1 text-xs" onClick={() => markAllAsRead(auth.currentUser?.uid || "unknown")}>
                        Mark all read
                    </Button>
                </div>
                <ScrollArea className="h-[300px]">
                    {myNotifications.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground text-sm">No notifications</div>
                    ) : (
                        <div className="divide-y">
                            {myNotifications.map(n => (
                                <div 
                                    key={n.id} 
                                    className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer ${n.read ? 'opacity-60' : 'bg-blue-50/30'}`}
                                    onClick={() => handleRead(n)}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <Badge variant="outline" className="text-[10px] uppercase tracking-wider">{n.category}</Badge>
                                        <span className="text-[10px] text-muted-foreground">{new Date(n.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <h5 className="text-sm font-medium leading-tight mb-1">{n.title}</h5>
                                    <p className="text-xs text-muted-foreground line-clamp-2">{n.message}</p>
                                    {n.link && <div className="mt-2 text-xs text-blue-600 flex items-center"><ExternalLink className="h-3 w-3 mr-1"/> View</div>}
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
                <div className="p-2 border-t text-center">
                    <Button variant="link" size="sm" className="text-xs w-full" onClick={() => router.push('/dashboard/notifications')}>
                        View All History
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}
