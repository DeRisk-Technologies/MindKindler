"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { auth, db } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";

export function UserNav() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (u) => {
      setUser(u);
      if (u) {
         try {
             // Try to fetch from user_routing first to find shard, but for nav display global is usually fine
             // If we want shard-specific role display, we need usePermissions logic here too.
             // For simple display, let's assume global doc or fallback.
             const snap = await getDoc(doc(db, "users", u.uid));
             if (snap.exists()) {
                 setUserData(snap.data());
             }
         } catch (e) {
             console.error("Nav Load Error", e);
         }
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  const initials = userData?.displayName
    ? userData.displayName.split(" ").map((n: string) => n[0]).join("").substring(0,2).toUpperCase()
    : user?.email?.substring(0, 2).toUpperCase() || "U";

  // Pretty Role Formatter
  const formatRole = (role: string) => {
      if (!role) return "User";
      if (role.toLowerCase() === 'epp' || role.toLowerCase() === 'educationalpsychologist') return 'Ed. Psychologist';
      if (role.toLowerCase() === 'clinicalpsychologist') return 'Clinical Psych.';
      // Split PascalCase
      return role.replace(/([A-Z])/g, " $1").trim();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8 border border-slate-200">
            <AvatarImage src="/avatars/01.png" alt="@user" />
            <AvatarFallback className="bg-indigo-50 text-indigo-700 font-bold">{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{userData?.displayName || "User"}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email}
            </p>
             <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-bold text-white bg-indigo-600 px-2 py-0.5 rounded-full capitalize">
                    {formatRole(userData?.role)}
                </span>
                {userData?.region && <span className="text-[10px] text-slate-400 uppercase">{userData.region}</span>}
             </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => router.push("/dashboard/settings/profile")}>
            My Profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push("/dashboard/settings/compliance")}>
            Compliance
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
          Log out
          <DropdownMenuShortcut>⇧Q</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
