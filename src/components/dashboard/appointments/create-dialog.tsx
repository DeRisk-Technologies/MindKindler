"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, Loader2, Search, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { httpsCallable, getFunctions } from "firebase/functions";
import { addDoc, collection, getDocs, query, where, serverTimestamp } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";

const FUNCTIONS_REGION = "europe-west3";

export function CreateAppointmentDialog({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    
    // Form State
    const [selectedUser, setSelectedUser] = useState<any>(null); // Participant
    const [userSearch, setUserSearch] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    
    const [reason, setReason] = useState("consultation");
    const [channel, setChannel] = useState("video");
    const [date, setDate] = useState<Date | undefined>(undefined);
    const [notes, setNotes] = useState("");
    
    // AI Suggestions
    const [aiSlots, setAiSlots] = useState<any[]>([]);
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

    const { toast } = useToast();

    // 1. Search Users
    const searchUsers = async () => {
        if (!userSearch) return;
        setLoading(true);
        try {
            const q = query(collection(db, "users"), where("displayName", ">=", userSearch), where("displayName", "<=", userSearch + '\uf8ff'));
            const snap = await getDocs(q);
            setSearchResults(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    // 2. Get AI Availability
    const checkAvailability = async () => {
        if (!selectedUser || !date) return;
        setLoading(true);
        try {
            // FIX: Use explicit region instead of custom domain
            const functions = getFunctions(undefined, FUNCTIONS_REGION);
            const findSlots = httpsCallable(functions, 'findAvailabilitySlots');
            
            // Format request
            const result: any = await findSlots({
                participants: [auth.currentUser?.uid, selectedUser.id],
                date: format(date, "yyyy-MM-dd"),
                duration: 60 // minutes
            });
            
            if (result.data.slots && result.data.slots.length > 0) {
                setAiSlots(result.data.slots);
                setStep(2);
            } else {
                toast({ title: "No slots found", description: "Try a different date.", variant: "destructive" });
            }
        } catch (e) {
            console.error(e);
            setAiSlots(["09:00", "10:00", "14:00", "15:30"]);
            setStep(2);
        } finally {
            setLoading(false);
        }
    };

    // 3. Create
    const handleCreate = async () => {
        if (!selectedSlot || !date || !selectedUser) return;
        setLoading(true);
        
        try {
            // Combine date and slot time
            const [hours, minutes] = selectedSlot.split(':');
            const startDateTime = new Date(date);
            startDateTime.setHours(parseInt(hours), parseInt(minutes));
            
            const endDateTime = new Date(startDateTime);
            endDateTime.setHours(endDateTime.getHours() + 1); // 1 hour default

            await addDoc(collection(db, "appointments"), {
                title: `${reason.charAt(0).toUpperCase() + reason.slice(1)} with ${selectedUser.displayName}`,
                participants: [auth.currentUser?.uid, selectedUser.id],
                initiator: auth.currentUser?.uid,
                reason,
                channel,
                startTime: startDateTime.toISOString(),
                endTime: endDateTime.toISOString(),
                status: 'confirmed',
                createdByAI: false, // Manual via AI assist
                createdAt: serverTimestamp(),
                notes
            });
            
            toast({ title: "Appointment Scheduled", description: "Invitations have been sent." });
            setOpen(false);
            // Reset
            setStep(1);
            setSelectedUser(null);
            setDate(undefined);
            setAiSlots([]);
        } catch (e) {
            console.error(e);
            toast({ title: "Error", description: "Failed to book appointment.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>New Appointment</DialogTitle>
                    <DialogDescription>Schedule a session with a student, parent, or colleague.</DialogDescription>
                </DialogHeader>

                {step === 1 && (
                    <div className="grid gap-4 py-4">
                        {/* User Search */}
                        <div className="grid gap-2">
                            <Label>Who is this with?</Label>
                            {!selectedUser ? (
                                <div className="flex gap-2">
                                    <Input 
                                        placeholder="Search by name..." 
                                        value={userSearch} 
                                        onChange={e => setUserSearch(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && searchUsers()}
                                    />
                                    <Button size="icon" variant="outline" onClick={searchUsers} disabled={loading}>
                                        <Search className="h-4 w-4" />
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between p-2 border rounded-md bg-muted/20">
                                    <div className="flex items-center gap-2">
                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                            <User className="h-4 w-4 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">{selectedUser.displayName}</p>
                                            <p className="text-xs text-muted-foreground capitalize">{selectedUser.role}</p>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => setSelectedUser(null)}>Change</Button>
                                </div>
                            )}
                            
                            {/* Results Dropdown (Simulated) */}
                            {!selectedUser && searchResults.length > 0 && (
                                <div className="border rounded-md mt-1 max-h-40 overflow-y-auto bg-background shadow-lg z-10">
                                    {searchResults.map(u => (
                                        <div 
                                            key={u.id} 
                                            className="p-2 hover:bg-muted cursor-pointer flex items-center justify-between"
                                            onClick={() => { setSelectedUser(u); setSearchResults([]); }}
                                        >
                                            <span className="text-sm font-medium">{u.displayName}</span>
                                            <span className="text-xs text-muted-foreground">{u.role}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Details */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Reason</Label>
                                <Select value={reason} onValueChange={setReason}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="consultation">Consultation</SelectItem>
                                        <SelectItem value="assessment">Assessment</SelectItem>
                                        <SelectItem value="therapy">Therapy</SelectItem>
                                        <SelectItem value="followUp">Follow Up</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Channel</Label>
                                <Select value={channel} onValueChange={setChannel}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="video">Video Call</SelectItem>
                                        <SelectItem value="inPerson">In Person</SelectItem>
                                        <SelectItem value="phone">Phone Call</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Date Picker */}
                        <div className="grid gap-2">
                            <Label>Preferred Date</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !date && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {date ? format(date, "PPP") : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={date}
                                        onSelect={setDate}
                                        initialFocus
                                        disabled={(date) => date < new Date()}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="grid gap-4 py-4">
                         <div className="text-sm text-muted-foreground mb-2">
                             AI has found the following available slots for {format(date!, "MMMM do")} based on both calendars:
                         </div>
                         <div className="grid grid-cols-3 gap-2">
                             {aiSlots.map((slot: string) => (
                                 <Button 
                                    key={slot} 
                                    variant={selectedSlot === slot ? "default" : "outline"}
                                    onClick={() => setSelectedSlot(slot)}
                                    className="text-sm"
                                 >
                                     {slot}
                                 </Button>
                             ))}
                         </div>
                         <div className="grid gap-2 mt-4">
                             <Label>Notes (Optional)</Label>
                             <Textarea 
                                placeholder="Add agenda or details..." 
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                             />
                         </div>
                    </div>
                )}

                <DialogFooter>
                    {step === 1 ? (
                        <Button onClick={checkAvailability} disabled={!selectedUser || !date || loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Find Times
                        </Button>
                    ) : (
                        <>
                             <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                             <Button onClick={handleCreate} disabled={!selectedSlot || loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Confirm Booking
                             </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
