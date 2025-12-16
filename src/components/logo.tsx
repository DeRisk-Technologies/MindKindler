import { BrainCog } from "lucide-react";
import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <BrainCog className="h-7 w-7 text-primary" />
      <span className="font-headline text-2xl font-bold">MindKindler</span>
    </Link>
  );
}
