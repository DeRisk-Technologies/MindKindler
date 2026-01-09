"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Logo } from "@/components/logo";
import { auth, db, getRegionalDb } from "@/lib/firebase"; 
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Briefcase } from "lucide-react";

export const dynamic = 'force-dynamic';

const roles = [
  "Admin",
  "EducationalPsychologist",
  "Teacher",
  "Parent",
  "Student",
  "SchoolAdministrator",
  "LocalEducationAuthority",
  "ClinicalPsychologist",
  "TrainingDesigner",
  "HR",
];

const regions = [
    { code: "uk", label: "United Kingdom (GDPR)" },
    { code: "us", label: "United States (FERPA)" },
    { code: "eu", label: "European Union (GDPR)" },
    { code: "ae", label: "UAE (Local)" },
    { code: "sa", label: "Saudi Arabia (Local)" },
];

export default function SignupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("");
  
  // Independent Practice Logic
  const [isIndependent, setIsIndependent] = useState(false);
  const [practiceName, setPracticeName] = useState("");

  const isClinician = selectedRole.toLowerCase().includes("psychologist");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const hcpc = formData.get("hcpc") as string; // Capture Registration Number
    
    if (!selectedRole || !selectedRegion) {
       toast({ title: "Incomplete Form", description: "Role and Region are required.", variant: "destructive" });
       setIsLoading(false);
       return;
    }

    try {
      // 1. Create Auth User
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: `${firstName} ${lastName}` });

      // 2. Determine Tenant Context
      let tenantId = "pending";
      let tenantName = "Pending Assignment";

      // Logic: If Independent Practitioner, create a "Practice Tenant" immediately
      if (isClinician && isIndependent && practiceName) {
          // Generate a clean tenant slug
          const slug = practiceName.toLowerCase().replace(/[^a-z0-9]/g, '-') + `-${selectedRegion}`;
          tenantId = slug;
          tenantName = practiceName;

          // Create Organization in Global DB (Control Plane)
          await setDoc(doc(db, "organizations", tenantId), {
              id: tenantId,
              name: practiceName,
              type: "PrivatePractice",
              region: selectedRegion,
              ownerId: user.uid,
              createdAt: serverTimestamp(),
              subscription: { status: 'trial', plan: 'pro_monthly' }
          });
      }

      // 3. Global Routing (Default DB)
      await setDoc(doc(db, "user_routing", user.uid), {
          uid: user.uid,
          region: selectedRegion,
          shardId: `mindkindler-${selectedRegion}`,
          email: user.email,
          role: selectedRole, // Cache role for fast routing
          createdAt: serverTimestamp()
      });

      // 4. Regional Profile (Shard)
      const regionalDb = getRegionalDb(selectedRegion);
      
      await setDoc(doc(regionalDb, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        firstName, 
        lastName,
        displayName: `${firstName} ${lastName}`,
        role: selectedRole,
        region: selectedRegion, 
        tenantId: tenantId, // Assigned immediately if Independent
        isPracticeOwner: isIndependent, // Flag for UI logic
        
        // Trust Engine: Capture registration number immediately
        extensions: {
            registration_number: hcpc,
            practice_name: practiceName
        },
        verification: { 
            status: 'pending',
            hcpcNumber: hcpc // Store in canonical verification field too
        }, 
        createdAt: serverTimestamp(),
      });

      toast({
        title: "Account created",
        description: isIndependent 
            ? `Welcome! Your practice "${practiceName}" is ready.` 
            : "Welcome! Please wait for Admin approval.",
      });

      router.push("/dashboard");
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Error",
        description: error.message || "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/50 p-4">
      <Card className="mx-auto w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
            <Logo />
          </div>
          <CardTitle className="text-2xl">Create an Account</CardTitle>
          <CardDescription>
            Join MindKindler to start supporting children's development
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            
            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" name="firstName" placeholder="Jane" required />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" name="lastName" placeholder="Doe" required />
                </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="m@example.com" required />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="region">Region</Label>
                    <Select onValueChange={setSelectedRegion} required>
                        <SelectTrigger id="region">
                            <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                            {regions.map((r) => <SelectItem key={r.code} value={r.code}>{r.label}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="role">Role</Label>
                    <Select onValueChange={setSelectedRole} required>
                        <SelectTrigger id="role">
                            <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                            {roles.map((role) => (
                                <SelectItem key={role} value={role.toLowerCase()}>
                                    {role.replace(/([A-Z])/g, " $1").trim()}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Independent Practice Logic */}
            {isClinician && (
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-300">
                    <div className="flex items-center space-x-2">
                        <Checkbox 
                            id="independent" 
                            checked={isIndependent} 
                            onCheckedChange={(checked) => setIsIndependent(checked as boolean)}
                        />
                        <Label htmlFor="independent" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            I am an Independent Practitioner
                        </Label>
                    </div>

                    {isIndependent && (
                        <div className="space-y-2">
                            <Label htmlFor="practiceName" className="flex items-center gap-2">
                                <Briefcase className="h-3 w-3" /> Practice Name
                            </Label>
                            <Input 
                                id="practiceName" 
                                value={practiceName}
                                onChange={(e) => setPracticeName(e.target.value)}
                                placeholder="e.g. Martha Springfield Psychology" 
                                required 
                            />
                            <p className="text-[10px] text-muted-foreground">This will be your dedicated workspace.</p>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="hcpc">Registration Number (e.g. HCPC)</Label>
                        <Input id="hcpc" name="hcpc" placeholder="Reg Number" />
                    </div>
                </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Create account
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Already have an account?{" "}
            <Link href="/login" className="underline">
              Log in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
