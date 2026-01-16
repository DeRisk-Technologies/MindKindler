"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Lock, Activity, Map, Users, AlertTriangle, ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/logo";

export default function GuardianPage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl">
            <Logo />
          </div>
          <nav className="hidden md:flex gap-6 text-sm font-medium text-slate-600">
            <Link href="/features" className="hover:text-primary transition-colors">Features</Link>
            <Link href="/compliance" className="hover:text-primary transition-colors">Compliance</Link>
            <Link href="/guardian" className="text-indigo-600 font-semibold">The Guardian</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login"><Button variant="ghost">Log in</Button></Link>
            <Link href="/signup"><Button className="bg-indigo-600 hover:bg-indigo-700">Get Started</Button></Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-1/2 h-full bg-indigo-600/10 blur-3xl rounded-full translate-x-1/3"></div>
            
            <div className="container relative z-10 text-center max-w-4xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-900/50 border border-indigo-700 rounded-full text-indigo-300 text-xs font-bold mb-6">
                    <Shield className="w-3 h-3" />
                    DISTRICT COMMAND CENTER
                </div>
                <h1 className="text-5xl md:text-6xl font-extrabold mb-6 tracking-tight">
                    See the <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Systemic Risk</span> before it happens.
                </h1>
                <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                    The Guardian is an AI-powered oversight engine for Local Authorities and Districts. It scans thousands of cases nightly to detect hidden clusters of risk that individual clinicians might miss.
                </p>
                <div className="flex justify-center gap-4">
                    <Link href="/signup">
                        <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100 h-14 px-8 font-semibold">
                            Deploy for your District
                        </Button>
                    </Link>
                </div>
            </div>
        </section>

        {/* The Problem */}
        <section className="py-20 bg-white">
            <div className="container">
                <div className="flex flex-col md:flex-row gap-16 items-center">
                    <div className="md:w-1/2">
                        <h2 className="text-3xl font-bold text-slate-900 mb-6">The Blind Spot in Public Health</h2>
                        <p className="text-lg text-slate-600 mb-6">
                            Educational Psychologists work case-by-case. But risks are often systemic. A bullying outbreak at one school, a spike in neglect in one postcode, or a sibling at risk in a different school.
                        </p>
                        <p className="text-lg text-slate-600">
                            Human oversight cannot scale to connect these dots in real-time. <strong>The Guardian can.</strong>
                        </p>
                    </div>
                    <div className="md:w-1/2 grid grid-cols-2 gap-4">
                        <div className="p-6 bg-red-50 rounded-xl border border-red-100">
                            <AlertTriangle className="w-8 h-8 text-red-500 mb-4" />
                            <h3 className="font-bold text-red-900">School Clusters</h3>
                            <p className="text-sm text-red-700 mt-2">Is School X seeing a sudden spike in Self-Harm reports?</p>
                        </div>
                        <div className="p-6 bg-amber-50 rounded-xl border border-amber-100">
                            <Users className="w-8 h-8 text-amber-500 mb-4" />
                            <h3 className="font-bold text-amber-900">Sibling Propagation</h3>
                            <p className="text-sm text-amber-700 mt-2">If Child A is high-risk, is their sibling (Child B) being watched?</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* How It Works */}
        <section className="py-24 bg-slate-50 border-y border-slate-200">
            <div className="container max-w-5xl">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold text-slate-900 mb-4">Autonomous Intelligence</h2>
                    <p className="text-slate-600">The Guardian runs 24/7 in the background of your MindKindler instance.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {/* Card 1 */}
                    <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 mb-6">
                            <Activity className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold mb-3">1. Continuous Scan</h3>
                        <p className="text-slate-600">
                            Every night, the engine aggregates anonymized clinical tags from all active cases in your jurisdiction.
                        </p>
                    </div>

                    {/* Card 2 */}
                    <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 mb-6">
                            <Map className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold mb-3">2. Pattern Recognition</h3>
                        <p className="text-slate-600">
                            It groups data by School, Postcode Sector, and Family linkage to identify statistical anomalies.
                        </p>
                    </div>

                    {/* Card 3 */}
                    <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-green-600 mb-6">
                            <Shield className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold mb-3">3. Proactive Alerting</h3>
                        <p className="text-slate-600">
                            District Admins receive a "Risk Radar" report, allowing proactive intervention *before* a crisis occurs.
                        </p>
                    </div>
                </div>
            </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-indigo-600 text-white text-center">
            <div className="container max-w-2xl">
                <h2 className="text-3xl font-bold mb-6">Protect your District with Data.</h2>
                <p className="text-indigo-100 text-lg mb-8">
                    Available now as part of the MindKindler Enterprise Suite for Local Authorities and School Districts.
                </p>
                <Link href="/signup">
                    <Button size="lg" className="bg-white text-indigo-600 hover:bg-indigo-50 h-14 px-8 font-semibold">
                        Request Guardian Access
                    </Button>
                </Link>
            </div>
        </section>

      </main>
      
      <footer className="py-12 bg-white border-t text-center">
         <div className="container flex flex-col items-center gap-4">
            <p className="text-sm text-slate-500">&copy; 2026 MindKindler.</p>
            <a 
                href="https://www.derisktechnologies.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs font-medium text-slate-400 hover:text-indigo-600 transition-colors"
            >
                A Product of DeRisk Technologies Group
            </a>
         </div>
      </footer>
    </div>
  );
}
