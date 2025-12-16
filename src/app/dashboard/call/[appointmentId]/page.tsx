"use client";

import { use, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mic, MicOff, Video, VideoOff, PhoneOff, MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";

interface CallPageProps {
  params: Promise<{
    appointmentId: string;
  }>;
}

export default function CallPage(props: CallPageProps) {
  const params = use(props.params);
  const router = useRouter();
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [messages, setMessages] = useState<{ sender: string; text: string }[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    setMessages([...messages, { sender: "You", text: inputMessage }]);
    setInputMessage("");
  };

  const endCall = () => {
    // In a real app, you would save call metadata here
    router.push("/dashboard/appointments");
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex h-16 items-center justify-between border-b px-6">
        <div className="flex items-center gap-4">
          <Avatar>
            <AvatarImage src="" />
            <AvatarFallback>S</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-lg font-semibold">Student Name</h2>
            <p className="text-sm text-muted-foreground">Appointment #{params.appointmentId}</p>
          </div>
        </div>
        <div className="rounded-full bg-secondary px-4 py-1 font-mono text-sm">
          {formatTime(duration)}
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden">
        {/* Main Video Area */}
        <div className="relative flex-1 bg-black">
          <div className="absolute inset-0 flex items-center justify-center text-white">
            {isVideoOff ? (
              <Avatar className="h-32 w-32">
                <AvatarFallback className="text-4xl bg-muted text-foreground">You</AvatarFallback>
              </Avatar>
            ) : (
              <p className="text-muted-foreground">Camera Feed Placeholder</p>
            )}
          </div>
          
          {/* Controls */}
          <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 gap-4">
            <Button
              variant={isMuted ? "destructive" : "secondary"}
              size="icon"
              className="rounded-full h-12 w-12"
              onClick={() => setIsMuted(!isMuted)}
            >
              {isMuted ? <MicOff /> : <Mic />}
            </Button>
            <Button
              variant={isVideoOff ? "destructive" : "secondary"}
              size="icon"
              className="rounded-full h-12 w-12"
              onClick={() => setIsVideoOff(!isVideoOff)}
            >
              {isVideoOff ? <VideoOff /> : <Video />}
            </Button>
            <Button
              variant="destructive"
              size="icon"
              className="rounded-full h-12 w-12"
              onClick={endCall}
            >
              <PhoneOff />
            </Button>
          </div>
        </div>

        {/* Side Panel (Notes/Chat) */}
        <div className="w-80 border-l bg-card hidden md:flex flex-col">
          <div className="border-b p-4">
            <h3 className="font-semibold flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Session Notes
            </h3>
          </div>
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className="rounded-lg bg-muted p-3 text-sm">
                  <span className="font-semibold text-xs text-muted-foreground block mb-1">{msg.sender}</span>
                  {msg.text}
                </div>
              ))}
            </div>
          </ScrollArea>
          <div className="p-4 border-t">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input 
                placeholder="Take a note..." 
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
              />
              <Button type="submit" size="sm">Send</Button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
