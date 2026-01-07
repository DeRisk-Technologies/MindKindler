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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Logo } from "@/components/logo";
import { auth, db, getRegionalDb } from "@/lib/firebase"; // Import Regional DB Loader
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

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
  const [regNumber, setRegNumber] = useState("");

  // Helper to determine label for registration number
  const getRegLabel = () => {
      const r = selectedRole.toLowerCase();
      if (r.includes("psychologist")) return "HCPC / License Number";
      if (r.includes("school")) return "URN / School ID";
      return "Registration / Employee ID";
  };
  
  const showRegField = ["educationalpsychologist", "clinicalpsychologist", "schooladministrator", "localeducationauthority"].includes(selectedRole.toLowerCase());

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    
    // Validate Selects
    if (!selectedRole) {
       toast({ title: "Role required", description: "Please select a role.", variant: "destructive" });
       setIsLoading(false);
       return;
    }
    if (!selectedRegion) {
        toast({ title: "Region required", description: "Please select your data residency region.", variant: "destructive" });
        setIsLoading(false);
        return;
    }

    try {
      // 1. Create Auth User (Global Identity)
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, {
        displayName: `${firstName} ${lastName}`,
      });

      // 2. Strict Data Sovereignty Logic
      // Step A: Write NON-PII Routing Info to Global DB
      // This allows the login process to find "Where is this user's data?"
      await setDoc(doc(db, "user_routing", user.uid), {
          uid: user.uid,
          region: selectedRegion,
          shardId: `mindkindler-${selectedRegion}`, // Convention
          email: user.email, // Needed for routing/recovery, generally acceptable
          role: selectedRole, // Useful for global routing checks without touching PII
          createdAt: serverTimestamp()
      });

      // Step B: Write FULL PII Profile to Regional Shard
      // This ensures names/roles/verification never live in the wrong jurisdiction.
      const regionalDb = getRegionalDb(selectedRegion);
      
      await setDoc(doc(regionalDb, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        firstName: firstName, 
        lastName: lastName,
        displayName: `${firstName} ${lastName}`,
        role: selectedRole,
        region: selectedRegion, 
        tenantId: "pending", // Independent tenants start as their own pending tenant
        verification: { 
            status: 'pending',
            hcpcNumber: regNumber || null // Store the captured ID
        }, 
        extensions: {
            registration_number: regNumber || null
        },
        createdAt: serverTimestamp(),
      });

      toast({
        title: "Account created",
        description: "Welcome to MindKindler! Your account is pending verification.",
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
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="m@example.com"
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="region">Data Residency Region</Label>
                <Select onValueChange={setSelectedRegion} required>
                    <SelectTrigger id="region">
                        <SelectValue placeholder="Select Region (GDPR Compliance)" />
                    </SelectTrigger>
                    <SelectContent>
                        {regions.map((r) => (
                            <SelectItem key={r.code} value={r.code}>{r.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground">Your data will be stored physically in this jurisdiction.</p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="role">Your Role</Label>
              <Select onValueChange={setSelectedRole} required>
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select your role" />
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

            {/* Dynamic Registration Number Field */}
            {showRegField && (
                <div className="grid gap-2 animate-in fade-in slide-in-from-top-2">
                    <Label htmlFor="regNumber" className="text-primary font-semibold">{getRegLabel()}</Label>
                    <Input 
                        id="regNumber" 
                        value={regNumber} 
                        onChange={(e) => setRegNumber(e.target.value)} 
                        placeholder="Required for verification"
                        required 
                    />
                    <p className="text-[10px] text-muted-foreground">This will be verified against the official register.</p>
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
