// src/app/compliance/page.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { Shield, Lock, Globe, FileCheck, Server, Eye, CheckCircle } from "lucide-react";

export default function CompliancePage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl">
            {/* Logo component already contains a Link to / */}
            <Logo />
          </div>
          <nav className="hidden md:flex gap-6 text-sm font-medium text-slate-600">
            <Link href="/features" className="hover:text-primary transition-colors">Features</Link>
            <Link href="/compliance" className="text-indigo-600 font-semibold">Compliance</Link>
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
                <Badge variant="outline" className="mb-4 border-green-200 bg-green-50 text-green-700">Enterprise Grade Security</Badge>
                <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">Built for <span className="text-green-600">Trust & Sovereignty</span></h1>
                <p className="text-lg text-slate-600 mb-8">MindKindler enforces strict data residency, PII redaction, and audit trails to meet the demands of Governments and Healthcare providers.</p>
            </div>
        </section>

        {/* Core Pillars */}
        <section className="py-16 bg-slate-50">
            <div className="container grid grid-cols-1 md:grid-cols-3 gap-8">
                
                <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
                    <Globe className="h-10 w-10 text-blue-500 mb-4" />
                    <h3 className="text-xl font-bold mb-2">Data Sovereignty</h3>
                    <p className="text-slate-600">
                        Our "Split-Brain" architecture ensures clinical data never leaves your legal jurisdiction. UK data stays in London (aws-eu-west-2), US data in Virginia.
                    </p>
                </div>

                <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
                    <Eye className="h-10 w-10 text-purple-500 mb-4" />
                    <h3 className="text-xl font-bold mb-2">Guardian Engine</h3>
                    <p className="text-slate-600">
                        Real-time PII redaction prevents names or addresses from leaking into AI prompts. Anonymization runs automatically before any data processing.
                    </p>
                </div>

                <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
                    <FileCheck className="h-10 w-10 text-amber-500 mb-4" />
                    <h3 className="text-xl font-bold mb-2">Chain of Custody</h3>
                    <p className="text-slate-600">
                        Every action—view, edit, export—is logged in an immutable Audit Ledger. See exactly who accessed a student record and when.
                    </p>
                </div>

            </div>
        </section>

        {/* UK Specifics */}
        <section className="py-20 bg-white border-y border-slate-100">
            <div className="container max-w-4xl">
                <h2 className="text-3xl font-bold mb-8 text-center">UK Statutory Alignment</h2>
                <div className="space-y-6">
                    <div className="flex items-start gap-4">
                        <CheckCircle className="h-6 w-6 text-green-600 shrink-0" />
                        <div>
                            <h4 className="font-bold text-lg">Appendix K (Advice for EHCP)</h4>
                            <p className="text-slate-600">Our templates are strictly aligned with the Code of Practice 2015, enforcing the "No Medical Diagnosis" rule for educational advice.</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4">
                        <CheckCircle className="h-6 w-6 text-green-600 shrink-0" />
                        <div>
                            <h4 className="font-bold text-lg">Safer Recruitment (SCR)</h4>
                            <p className="text-slate-600">Integrated tracking for DBS Checks and Prohibition Orders ensures your practice remains compliant with KCSIE.</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4">
                        <CheckCircle className="h-6 w-6 text-green-600 shrink-0" />
                        <div>
                            <h4 className="font-bold text-lg">HCPC Verification</h4>
                            <p className="text-slate-600">We verify the registration status of every EPP on the platform against the Health and Care Professions Council register.</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

      </main>
      
      <footer className="py-8 bg-white border-t text-center text-sm text-slate-500">
         <div className="container">
            <p>&copy; 2024 MindKindler. Secure by Design.</p>
         </div>
      </footer>
    </div>
  );
}
