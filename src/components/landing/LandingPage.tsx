import React from 'react';
import { Button } from '@/components/ui/button';
import { Shield, CheckCircle, Brain, Lock, ArrowRight, Activity, Globe, Map } from 'lucide-react';
import Link from 'next/link';

export function LandingPage() {
    return (
        <div className="min-h-screen bg-white font-sans scroll-smooth">
            
            {/* Navigation */}
            <nav className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                        <Shield className="w-8 h-8 text-indigo-600" />
                        <span className="text-xl font-bold text-slate-900 tracking-tight">MindKindler</span>
                    </div>
                    <div className="hidden md:flex gap-8">
                        <Link href="/features" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Features</Link>
                        <Link href="/compliance" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Compliance</Link>
                        <Link href="/guardian" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">The Guardian</Link>
                    </div>
                    <div className="flex gap-4">
                        <Link href="/dashboard">
                            <Button variant="ghost" className="font-semibold text-slate-700">Login</Button>
                        </Link>
                        <Link href="/dashboard">
                            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200">
                                Get Started
                            </Button>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-24 pb-32 overflow-hidden">
                {/* Abstract Background Shapes */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[600px] h-[600px] bg-indigo-50 rounded-full blur-3xl -z-10 opacity-70"></div>
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[500px] h-[500px] bg-blue-50 rounded-full blur-3xl -z-10 opacity-70"></div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-600 text-sm font-bold mb-8 animate-fade-in-up">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                        </span>
                        New: Advanced UK Statutory Module Available
                    </div>
                    
                    <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight mb-6 leading-[1.1]">
                        The Global Operating System for <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                            Educational Psychology
                        </span>
                    </h1>
                    
                    <p className="max-w-2xl mx-auto text-xl text-slate-600 mb-10 leading-relaxed">
                        Automate the administrative burden of assessments, reports, and compliance. MindKindler empowers Educational Psychologists worldwide to focus on what matters: the child.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/dashboard">
                            <Button size="lg" className="h-14 px-8 text-lg bg-slate-900 hover:bg-slate-800 text-white rounded-full transition-all hover:scale-105">
                                Start Free Pilot <ArrowRight className="ml-2 w-5 h-5" />
                            </Button>
                        </Link>
                        <Link href="/features">
                            <Button size="lg" variant="outline" className="h-14 px-8 text-lg border-2 rounded-full hover:bg-slate-50">
                                Explore Platform
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Feature Highlights */}
            <section className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-3 gap-12">
                        {/* 1 */}
                        <div className="group p-8 rounded-2xl bg-slate-50 hover:bg-white border border-slate-100 hover:border-slate-200 hover:shadow-xl transition-all duration-300">
                            <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 mb-6 group-hover:scale-110 transition-transform">
                                <Brain className="w-7 h-7" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-3">AI Triangulation</h3>
                            <p className="text-slate-600 leading-relaxed">
                                Our engine reads Parent, School, and Medical reports instantly. It extracts findings and highlights contradictions (e.g. "Masking") automatically.
                            </p>
                        </div>

                        {/* 2 */}
                        <div className="group p-8 rounded-2xl bg-slate-50 hover:bg-white border border-slate-100 hover:border-slate-200 hover:shadow-xl transition-all duration-300">
                            <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 transition-transform">
                                <Globe className="w-7 h-7" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-3">Sovereign Compliance</h3>
                            <p className="text-slate-600 leading-relaxed">
                                Built for the world. Data stays in your region (GDPR for UK/EU, HIPAA for US). We support local statutory templates like UK EHCPs and US IDEA.
                            </p>
                        </div>

                        {/* 3 */}
                        <div className="group p-8 rounded-2xl bg-slate-50 hover:bg-white border border-slate-100 hover:border-slate-200 hover:shadow-xl transition-all duration-300">
                            <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 mb-6 group-hover:scale-110 transition-transform">
                                <Shield className="w-7 h-7" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-3">The Guardian</h3>
                            <p className="text-slate-600 leading-relaxed">
                                For Districts & LEAs. A background monitoring engine that detects systemic risks like school bullying clusters or sibling safeguarding issues.
                            </p>
                            <Link href="/guardian" className="text-emerald-600 font-bold text-sm mt-4 inline-flex items-center hover:underline">
                                Learn about Guardian <ArrowRight className="w-4 h-4 ml-1" />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Global Trust */}
            <section className="py-24 bg-slate-900 text-white overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <h2 className="text-3xl font-bold mb-12">Trusted by Clinical Leads Worldwide</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 opacity-70 text-lg font-semibold tracking-wider">
                        <div className="flex flex-col items-center gap-2">
                            <CheckCircle className="w-8 h-8 text-indigo-400" />
                            <span>NHS Certified (UK)</span>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <CheckCircle className="w-8 h-8 text-indigo-400" />
                            <span>HIPAA Ready (US)</span>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <CheckCircle className="w-8 h-8 text-indigo-400" />
                            <span>KHDA Aligned (UAE)</span>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <CheckCircle className="w-8 h-8 text-indigo-400" />
                            <span>Cyber Essentials+</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-16 bg-white border-t">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center gap-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Shield className="w-8 h-8 text-slate-300" />
                        <span className="font-bold text-2xl text-slate-800">MindKindler</span>
                    </div>
                    
                    <div className="flex gap-8 text-sm font-medium text-slate-600">
                        <Link href="/features" className="hover:text-indigo-600">Features</Link>
                        <Link href="/compliance" className="hover:text-indigo-600">Compliance</Link>
                        <Link href="/guardian" className="hover:text-indigo-600">Guardian</Link>
                        <a href="mailto:support@mindkindler.com" className="hover:text-indigo-600">Contact</a>
                    </div>

                    <div className="w-full h-px bg-slate-100 my-4" />

                    <div className="text-center space-y-2">
                        <p className="text-sm text-slate-400">
                            &copy; {new Date().getFullYear()} MindKindler. All rights reserved.
                        </p>
                        <a 
                            href="https://www.derisktechnologies.com" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs font-semibold text-slate-400 hover:text-indigo-600 transition-colors inline-flex items-center gap-1"
                        >
                            A Product of DeRisk Technologies Group <ArrowRight className="w-3 h-3" />
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
