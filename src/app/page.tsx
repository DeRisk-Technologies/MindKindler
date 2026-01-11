// src/app/page.tsx

"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Globe, ShieldCheck, CheckCircle2, GraduationCap, BarChart3, Lock, Zap } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/logo";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl">
            {/* Logo component already contains a Link to / */}
            <Logo />
          </div>
          <nav className="hidden md:flex gap-6 text-sm font-medium text-slate-600">
            <Link href="/features" className="hover:text-primary transition-colors">Features</Link>
            <Link href="/compliance" className="hover:text-primary transition-colors">Compliance</Link>
            <Link href="#pricing" className="hover:text-primary transition-colors">Pricing</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Log in</Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-indigo-600 hover:bg-indigo-700">Start Free Trial</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        
        {/* Hero Section */}
        <section className="relative overflow-hidden py-24 md:py-32 bg-white">
          <div className="container relative z-10 flex flex-col items-center text-center">
            <Badge className="mb-6 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200 px-3 py-1 rounded-full flex items-center gap-2">
              <ShieldCheck className="h-3 w-3" /> Now Available: UK Local Authority Pack
            </Badge>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 max-w-4xl mb-6 leading-tight">
              The Statutory Operating System for <span className="text-indigo-600">Educational Psychology</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-600 max-w-2xl mb-10">
              MindKindler combines clinical assessment tools, AI-powered reporting, and statutory compliance (EYFS/SEND) into one secure platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Link href="/signup">
                <Button size="lg" className="w-full sm:w-auto text-base h-12 px-8 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200">
                  Get Started <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-base h-12 px-8">
                View Interactive Demo
              </Button>
            </div>
            
            <div className="mt-16 flex items-center justify-center gap-8 text-sm text-slate-400 font-medium">
              <span className="flex items-center gap-2"><Lock className="h-4 w-4"/> GDPR Compliant</span>
              <span className="flex items-center gap-2"><Globe className="h-4 w-4"/> Data Sovereignty</span>
              <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4"/> HCPC Ready</span>
            </div>
          </div>
          
          {/* Abstract Background Decoration */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl opacity-30 pointer-events-none">
             <div className="absolute top-20 left-10 w-72 h-72 bg-purple-200 rounded-full blur-3xl mix-blend-multiply filter animate-blob"></div>
             <div className="absolute top-20 right-10 w-72 h-72 bg-indigo-200 rounded-full blur-3xl mix-blend-multiply filter animate-blob animation-delay-2000"></div>
             <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-200 rounded-full blur-3xl mix-blend-multiply filter animate-blob animation-delay-4000"></div>
          </div>
        </section>

        {/* Value Props Grid (Teaser) */}
        <section className="py-24 bg-slate-50">
          <div className="container">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                <div className="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center mb-6">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold mb-3">Psychometric Analysis</h3>
                <p className="text-slate-600 leading-relaxed mb-4">
                  Visualize WISC-V scores with 95% Confidence Intervals. Detect learning difficulties like Dyslexia via automated discrepancy analysis.
                </p>
                <Link href="/features" className="text-blue-600 font-semibold text-sm hover:underline">Explore Clinical Tools &rarr;</Link>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                <div className="h-12 w-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-6">
                  <Zap className="h-6 w-6 text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold mb-3">AI Report Writer</h3>
                <p className="text-slate-600 leading-relaxed mb-4">
                  Draft statutory reports (EHCP) in seconds. Our RAG engine respects legal constraints, ensuring no medical diagnoses are hallucinated.
                </p>
                <Link href="/features" className="text-indigo-600 font-semibold text-sm hover:underline">See AI Engine &rarr;</Link>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                <div className="h-12 w-12 bg-emerald-50 rounded-xl flex items-center justify-center mb-6">
                  <ShieldCheck className="h-6 w-6 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold mb-3">Statutory Compliance</h3>
                <p className="text-slate-600 leading-relaxed mb-4">
                  Built-in workflows for EYFS 2025 "First Day Calling" and Safer Recruitment (Single Central Record) vetting.
                </p>
                <Link href="/compliance" className="text-emerald-600 font-semibold text-sm hover:underline">View Compliance Standards &rarr;</Link>
              </div>

            </div>
            
            <div className="text-center mt-12">
               <Link href="/features">
                  <Button variant="outline" size="lg">Explore Full Platform Capabilities</Button>
               </Link>
            </div>
          </div>
        </section>

        {/* Feature Highlight: UK Pack */}
        <section className="py-24 bg-white border-y border-slate-100">
           <div className="container flex flex-col lg:flex-row items-center gap-16">
              <div className="lg:w-1/2">
                 <Badge className="mb-4 bg-indigo-100 text-indigo-800 hover:bg-indigo-100">Marketplace Exclusive</Badge>
                 <h2 className="text-3xl md:text-4xl font-bold mb-6 text-slate-900">Adapt to your jurisdiction instantly.</h2>
                 <p className="text-lg text-slate-600 mb-8">
                    MindKindler uses a "Country OS" architecture. Install the UK Pack to activate local laws, norms, and reporting templates.
                 </p>
                 <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                       <CheckCircle2 className="h-6 w-6 text-green-500 mt-0.5" />
                       <div>
                          <span className="font-semibold block text-slate-900">Unique Pupil Number (UPN)</span>
                          <span className="text-slate-500">Schema automatically extends to capture DfE required fields.</span>
                       </div>
                    </li>
                    <li className="flex items-start gap-3">
                       <CheckCircle2 className="h-6 w-6 text-green-500 mt-0.5" />
                       <div>
                          <span className="font-semibold block text-slate-900">Single Central Record (SCR)</span>
                          <span className="text-slate-500">Track DBS Checks and Prohibition Orders in a compliant register.</span>
                       </div>
                    </li>
                 </ul>
                 <div className="mt-8">
                    <Link href="/compliance"><Button variant="link" className="px-0 text-indigo-600">Read Compliance Statement &rarr;</Button></Link>
                 </div>
              </div>
              <div className="lg:w-1/2 relative">
                 <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-2xl transform rotate-3 scale-105 opacity-10"></div>
                 <img 
                   src="/api/placeholder/600/400" 
                   alt="Dashboard Preview" 
                   className="rounded-2xl shadow-2xl border border-slate-200 relative z-10 bg-slate-50" 
                 />
              </div>
           </div>
        </section>

        {/* CTA */}
        <section className="py-24 bg-slate-900 text-white text-center">
           <div className="container max-w-3xl">
              <GraduationCap className="h-12 w-12 mx-auto text-indigo-400 mb-6" />
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to modernize your practice?</h2>
              <p className="text-lg text-slate-300 mb-10">
                 Join 500+ Educational Psychologists and LEAs using MindKindler to deliver better outcomes for children.
              </p>
              <Link href="/signup">
                <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100 h-14 px-8 text-lg font-semibold">
                   Start Your Free Trial
                </Button>
              </Link>
              <p className="mt-6 text-sm text-slate-500">No credit card required for demo.</p>
           </div>
        </section>

      </main>

      <footer className="py-8 bg-white border-t text-center text-sm text-slate-500">
         <div className="container">
            <p>&copy; 2024 MindKindler. All rights reserved.</p>
         </div>
      </footer>
    </div>
  );
}
