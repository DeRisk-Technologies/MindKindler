// src/app/features/page.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, BrainCircuit, Activity, FileText, Globe, Store, Users, MessageSquare, Zap, Clock, ShieldCheck, Map as MapIcon } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/logo";

export default function FeaturesPage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl">
            {/* Logo component already contains a Link to / */}
            <Logo />
          </div>
          <nav className="hidden md:flex gap-6 text-sm font-medium text-slate-600">
            <Link href="/features" className="text-indigo-600 font-semibold">Features</Link>
            <Link href="/compliance" className="hover:text-primary transition-colors">Compliance</Link>
            <Link href="/#pricing" className="hover:text-primary transition-colors">Pricing</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login"><Button variant="ghost">Log in</Button></Link>
            <Link href="/signup"><Button className="bg-indigo-600 hover:bg-indigo-700">Start Free Trial</Button></Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="py-20 bg-white">
            <div className="container text-center max-w-4xl">
                <Badge variant="outline" className="mb-4 border-indigo-200 bg-indigo-50 text-indigo-700">Platform Overview</Badge>
                <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">A complete Operating System for <br/><span className="text-indigo-600">Modern Educational Psychology</span></h1>
                <p className="text-lg text-slate-600 mb-8">From referral to statutory report, MindKindler automates the administrative burden so you can focus on the child.</p>
            </div>
        </section>

        {/* Feature Grid */}
        <section className="py-16 bg-slate-50">
            <div className="container space-y-24">
                
                {/* 1. Clinical Intelligence */}
                <div className="flex flex-col md:flex-row items-center gap-12">
                    <div className="md:w-1/2">
                        <div className="h-12 w-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
                            <BrainCircuit className="h-6 w-6 text-purple-600" />
                        </div>
                        <h2 className="text-3xl font-bold mb-4">Deep Synthesis Engine</h2>
                        <p className="text-lg text-slate-600 mb-6">
                            Our AI doesn't just write; it thinks. By triangulating Teacher Questionnaires, Parent Profiles, and Clinical Observations, MindKindler identifies discrepancies (e.g. "Masking") that humans might miss.
                        </p>
                        <ul className="space-y-3">
                            <li className="flex items-center gap-2"><Zap className="h-4 w-4 text-amber-500"/> <span>Automated "Widening Gap" analysis</span></li>
                            <li className="flex items-center gap-2"><Activity className="h-4 w-4 text-emerald-500"/> <span>Psychometric Discrepancy detection</span></li>
                            <li className="flex items-center gap-2"><Clock className="h-4 w-4 text-blue-500"/> <span>Historical Context "Time Machine"</span></li>
                        </ul>
                    </div>
                    <div className="md:w-1/2 bg-white p-6 rounded-2xl shadow-xl border border-slate-100">
                        <img src="/api/placeholder/600/400" alt="AI Dashboard" className="rounded-lg bg-slate-100" />
                    </div>
                </div>

                {/* 2. Live Cockpit */}
                <div className="flex flex-col md:flex-row-reverse items-center gap-12">
                    <div className="md:w-1/2">
                        <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                            <MessageSquare className="h-6 w-6 text-blue-600" />
                        </div>
                        <h2 className="text-3xl font-bold mb-4">Live Consultation Cockpit</h2>
                        <p className="text-lg text-slate-600 mb-6">
                            Record, transcribe, and analyze sessions in real-time. Our secure "Co-Pilot" suggests follow-up questions based on the child's responses, ensuring you never miss a safeguarding cue.
                        </p>
                        <ul className="space-y-3">
                            <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-green-500"/> <span>Real-time Safeguarding Flags</span></li>
                            <li className="flex items-center gap-2"><Users className="h-4 w-4 text-indigo-500"/> <span>Person-Centered & Systemic Modes</span></li>
                        </ul>
                    </div>
                    <div className="md:w-1/2 bg-white p-6 rounded-2xl shadow-xl border border-slate-100">
                        <img src="/api/placeholder/600/400" alt="Live Cockpit" className="rounded-lg bg-slate-100" />
                    </div>
                </div>

                {/* 3. Marketplace */}
                <div className="flex flex-col md:flex-row items-center gap-12">
                    <div className="md:w-1/2">
                        <div className="h-12 w-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-6">
                            <Store className="h-6 w-6 text-emerald-600" />
                        </div>
                        <h2 className="text-3xl font-bold mb-4">Global Marketplace</h2>
                        <p className="text-lg text-slate-600 mb-6">
                            Adapt the platform to your local laws instantly. Install "Packs" for UK (Appendix K), US (IDEA/FERPA), or UAE (KHDA) to activate compliant report templates and workflows.
                        </p>
                        <div className="flex gap-2">
                            <Badge variant="secondary">UK EYFS</Badge>
                            <Badge variant="secondary">US IDEA</Badge>
                            <Badge variant="secondary">UAE KHDA</Badge>
                        </div>
                    </div>
                    <div className="md:w-1/2 bg-white p-6 rounded-2xl shadow-xl border border-slate-100">
                        <img src="/api/placeholder/600/400" alt="Marketplace" className="rounded-lg bg-slate-100" />
                    </div>
                </div>

            </div>
        </section>

        {/* Call to Action */}
        <section className="py-20 bg-slate-900 text-white text-center">
            <div className="container max-w-2xl">
                <h2 className="text-3xl font-bold mb-6">Experience the Future Today</h2>
                <Link href="/signup">
                    <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100 h-14 px-8 text-lg">
                        Get Started
                    </Button>
                </Link>
            </div>
        </section>
      </main>
      
      <footer className="py-8 bg-white border-t text-center text-sm text-slate-500">
         <div className="container">
            <p>&copy; 2024 MindKindler. Empowering EPPs globally.</p>
         </div>
      </footer>
    </div>
  );
}
