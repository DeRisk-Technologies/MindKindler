"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    Clock, 
    Settings, 
    Calendar, 
    Plane, 
    UserPlus, 
    Phone, 
    Globe, 
    Lock,
    Link2
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function AvailabilitySettingsDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  
  // --- State ---
  
  // Schedule
  const [schedule, setSchedule] = useState([
      { day: 'Monday', active: true, start: '09:00', end: '17:00' },
      { day: 'Tuesday', active: true, start: '09:00', end: '17:00' },
      { day: 'Wednesday', active: true, start: '09:00', end: '17:00' },
      { day: 'Thursday', active: true, start: '09:00', end: '17:00' },
      { day: 'Friday', active: true, start: '09:00', end: '16:00' },
      { day: 'Saturday', active: false, start: '10:00', end: '14:00' },
      { day: 'Sunday', active: false, start: '10:00', end: '14:00' },
  ]);

  // Regional Settings
  const [region, setRegion] = useState('UK');
  const [publicHolidays, setPublicHolidays] = useState(true);

  // Leave
  const [isOnLeave, setIsOnLeave] = useState(false);
  const [leaveStart, setLeaveStart] = useState('');
  const [leaveEnd, setLeaveEnd] = useState('');
  const [substituteId, setSubstituteId] = useState('');

  // Emergency Contacts
  const [contacts, setContacts] = useState([
      { id: '1', name: 'Partner', number: '+44 7700 900000', type: 'Mobile', privacy: 'admins_only' }
  ]);
  const [newContact, setNewContact] = useState({ name: '', number: '', type: 'WhatsApp', privacy: 'admins_only' });

  // Integrations
  const [integrations, setIntegrations] = useState({
      google: false,
      outlook: false,
      apple: false,
      calendly: false
  });

  // --- Handlers ---

  const handleSave = () => {
      // Logic to save to backend would go here
      // e.g. communityService.updateAvailability(...)
      toast({ title: "Availability Updated", description: "Your settings have been saved." });
      setOpen(false);
  };

  const toggleDay = (index: number) => {
      const newSchedule = [...schedule];
      newSchedule[index].active = !newSchedule[index].active;
      setSchedule(newSchedule);
  };

  const updateTime = (index: number, field: 'start' | 'end', value: string) => {
      const newSchedule = [...schedule];
      newSchedule[index] = { ...newSchedule[index], [field]: value };
      setSchedule(newSchedule);
  };

  const addContact = () => {
      if (!newContact.name || !newContact.number) return;
      setContacts([...contacts, { ...newContact, id: Date.now().toString() }]);
      setNewContact({ name: '', number: '', type: 'WhatsApp', privacy: 'admins_only' });
  };

  const removeContact = (id: string) => {
      setContacts(contacts.filter(c => c.id !== id));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
            <Settings className="h-4 w-4" /> Availability & Sync
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Availability & Integrations</DialogTitle>
          <DialogDescription>
            Manage your working hours, leave, emergency contacts, and calendar sync.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="schedule" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="schedule">Schedule</TabsTrigger>
                <TabsTrigger value="leave">Leave & Holidays</TabsTrigger>
                <TabsTrigger value="emergency">Emergency</TabsTrigger>
                <TabsTrigger value="integrations">Sync</TabsTrigger>
            </TabsList>

            {/* --- 1. General Schedule --- */}
            <TabsContent value="schedule" className="space-y-4 py-4">
                <div className="flex items-center justify-between p-4 bg-muted/20 rounded-lg">
                    <div className="space-y-1">
                        <h4 className="font-medium flex items-center gap-2"><Globe className="h-4 w-4"/> Regional Settings</h4>
                        <p className="text-xs text-muted-foreground">Import public holidays based on your region.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Select value={region} onValueChange={setRegion}>
                            <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="Region" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="UK">United Kingdom</SelectItem>
                                <SelectItem value="US">United States</SelectItem>
                                <SelectItem value="CA">Canada</SelectItem>
                            </SelectContent>
                        </Select>
                        <div className="flex items-center gap-2">
                            <Checkbox id="holidays" checked={publicHolidays} onCheckedChange={(c) => setPublicHolidays(c as boolean)} />
                            <Label htmlFor="holidays" className="text-sm">Auto-block Public Holidays</Label>
                        </div>
                    </div>
                </div>

                <div className="space-y-2 border rounded-lg p-4">
                    <h4 className="font-medium mb-3">Standard Working Hours</h4>
                    {schedule.map((day, index) => (
                        <div key={day.day} className="flex items-center gap-4 py-1">
                            <div className="w-28 flex items-center gap-2">
                                <Checkbox 
                                    id={`day-${index}`} 
                                    checked={day.active} 
                                    onCheckedChange={() => toggleDay(index)} 
                                />
                                <Label htmlFor={`day-${index}`} className={!day.active ? "text-muted-foreground" : ""}>
                                    {day.day}
                                </Label>
                            </div>
                            {day.active ? (
                                <div className="flex items-center gap-2">
                                    <Input 
                                        type="time" 
                                        value={day.start} 
                                        className="w-24 h-8" 
                                        onChange={(e) => updateTime(index, 'start', e.target.value)}
                                    />
                                    <span className="text-muted-foreground">-</span>
                                    <Input 
                                        type="time" 
                                        value={day.end} 
                                        className="w-24 h-8"
                                        onChange={(e) => updateTime(index, 'end', e.target.value)}
                                    />
                                </div>
                            ) : (
                                <span className="text-sm text-muted-foreground italic pl-2">Off</span>
                            )}
                        </div>
                    ))}
                </div>
            </TabsContent>

            {/* --- 2. Leave & Holidays --- */}
            <TabsContent value="leave" className="space-y-4 py-4">
                <Card>
                    <CardContent className="pt-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <h4 className="font-medium flex items-center gap-2"><Plane className="h-4 w-4"/> Out of Office Mode</h4>
                                <p className="text-sm text-muted-foreground">Block your calendar and assign a substitute.</p>
                            </div>
                            <Checkbox checked={isOnLeave} onCheckedChange={(c) => setIsOnLeave(c as boolean)} className="h-5 w-5" />
                        </div>

                        {isOnLeave && (
                            <div className="grid gap-4 pl-6 border-l-2 border-primary/20">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>From</Label>
                                        <Input type="date" value={leaveStart} onChange={(e) => setLeaveStart(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>To</Label>
                                        <Input type="date" value={leaveEnd} onChange={(e) => setLeaveEnd(e.target.value)} />
                                    </div>
                                </div>
                                
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2"><UserPlus className="h-4 w-4"/> Nominated Substitute</Label>
                                    <Select value={substituteId} onValueChange={setSubstituteId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select colleague..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="dr-jones">Dr. Jones (Educational Psychologist)</SelectItem>
                                            <SelectItem value="sarah-admin">Sarah (Admin Support)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground">
                                        Your chatbot will direct urgent queries to this person during your leave.
                                    </p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>

            {/* --- 3. Emergency Contacts --- */}
            <TabsContent value="emergency" className="space-y-4 py-4">
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Who should be contacted in a critical emergency? You can restrict visibility of these details.
                    </p>
                    
                    <div className="space-y-3">
                        {contacts.map(contact => (
                            <div key={contact.id} className="flex items-center justify-between p-3 border rounded bg-white">
                                <div className="flex items-center gap-3">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <div className="font-medium text-sm">{contact.name} ({contact.type})</div>
                                        <div className="text-xs text-muted-foreground">{contact.number}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="flex gap-1">
                                        <Lock className="h-3 w-3" /> 
                                        {contact.privacy === 'admins_only' ? 'Admins Only' : 'Everyone'}
                                    </Badge>
                                    <Button variant="ghost" size="sm" onClick={() => removeContact(contact.id)} className="text-red-500 h-6 w-6 p-0">×</Button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-4 gap-2 items-end pt-2">
                        <div className="col-span-1 space-y-1">
                             <Input placeholder="Name" value={newContact.name} onChange={(e) => setNewContact({...newContact, name: e.target.value})} />
                        </div>
                        <div className="col-span-1 space-y-1">
                             <Input placeholder="Number" value={newContact.number} onChange={(e) => setNewContact({...newContact, number: e.target.value})} />
                        </div>
                         <div className="col-span-1 space-y-1">
                             <Select value={newContact.type} onValueChange={(v) => setNewContact({...newContact, type: v})}>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Mobile">Mobile</SelectItem>
                                    <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                                    <SelectItem value="Home">Home</SelectItem>
                                </SelectContent>
                             </Select>
                        </div>
                        <div className="col-span-1 space-y-1 flex gap-1">
                             <Select value={newContact.privacy} onValueChange={(v) => setNewContact({...newContact, privacy: v})}>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="admins_only">Admins Only</SelectItem>
                                    <SelectItem value="colleagues">Colleagues</SelectItem>
                                </SelectContent>
                             </Select>
                             <Button onClick={addContact} size="icon"><UserPlus className="h-4 w-4"/></Button>
                        </div>
                    </div>
                </div>
            </TabsContent>

            {/* --- 4. Integrations (Nylas/Cronofy) --- */}
            <TabsContent value="integrations" className="space-y-4 py-4">
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg mb-4">
                    <h4 className="font-medium text-blue-900 flex items-center gap-2">
                        <Link2 className="h-4 w-4"/> Unified Sync Engine
                    </h4>
                    <p className="text-sm text-blue-700 mt-1">
                        MindKindler uses Nylas to securely sync with your external calendars in real-time. 
                        We never store your passwords.
                    </p>
                </div>

                <div className="grid gap-4">
                    {[
                        { id: 'google', label: 'Google Calendar', icon: 'G' },
                        { id: 'outlook', label: 'Outlook / Office 365', icon: 'O' },
                        { id: 'apple', label: 'iCloud Calendar', icon: 'A' },
                        { id: 'calendly', label: 'Calendly', icon: 'C' }
                    ].map(provider => (
                        <div key={provider.id} className="flex items-center justify-between p-4 border rounded hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600">
                                    {provider.icon}
                                </div>
                                <span className="font-medium">{provider.label}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">
                                    {integrations[provider.id as keyof typeof integrations] ? 'Syncing' : 'Disconnected'}
                                </span>
                                <Button 
                                    variant={integrations[provider.id as keyof typeof integrations] ? "destructive" : "default"}
                                    size="sm"
                                    onClick={() => setIntegrations(prev => ({ 
                                        ...prev, 
                                        [provider.id]: !prev[provider.id as keyof typeof integrations] 
                                    }))}
                                >
                                    {integrations[provider.id as keyof typeof integrations] ? 'Disconnect' : 'Connect'}
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </TabsContent>

        </Tabs>

        <DialogFooter>
          <Button onClick={handleSave}>Save Settings</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
