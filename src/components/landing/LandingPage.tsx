import React from 'react';
import { Button } from '@/components/ui/button';
import { Shield, CheckCircle, Brain, Lock, ArrowRight, Activity, LayoutDashboard, FileText, PieChart } from 'lucide-react';
import Link from 'next/link';

export function LandingPage() {
    return (
        <div className="min-h-screen bg-white font-sans scroll-smooth">
            
            {/* Navigation */}
            <nav className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                        <Shield className="w-8 h-8 text-blue-600" />
                        <span className="text-xl font-bold text-slate-900 tracking-tight">MindKindler</span>
                    </div>
                    <div className="hidden md:flex gap-8">
                        <Link href="#features" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Features</Link>
                        <Link href="#compliance" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Compliance</Link>
                        <Link href="#guardian" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">The Guardian</Link>
                    </div>
                    <div className="flex gap-4">
                        <Link href="/dashboard">
                            <Button variant="ghost" className="font-semibold text-slate-700">Login</Button>
                        </Link>
                        <Link href="/dashboard">
                            <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200">
                                Start Pilot
                            </Button>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-20 pb-32 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-50 via-white to-purple-50 -z-10" />
                
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full text-blue-700 text-sm font-bold mb-8 animate-fade-in-up">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                        </span>
                        Now Live: The Statutory OS for UK EPPs
                    </div>
                    
                    <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight mb-6 leading-tight">
                        The Operating System for <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                            Educational Psychology
                        </span>
                    </h1>
                    
                    <p className="max-w-2xl mx-auto text-xl text-slate-600 mb-10 leading-relaxed">
                        MindKindler is the world's first AI-powered Clinical OS. We automate the 20-Week Statutory Clock, triangulate evidence instantly, and monitor systemic risk with "The Guardian".
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/dashboard">
                            <Button size="lg" className="h-14 px-8 text-lg bg-slate-900 hover:bg-slate-800 text-white rounded-full">
                                Access Dashboard <ArrowRight className="ml-2 w-5 h-5" />
                            </Button>
                        </Link>
                        <Link href="#features">
                            <Button size="lg" variant="outline" className="h-14 px-8 text-lg border-2 rounded-full hover:bg-slate-50">
                                Explore Features
                            </Button>
                        </Link>
                    </div>

                    {/* Interactive UI Mockup */}
                    <div className="mt-16 relative mx-auto max-w-5xl rounded-xl shadow-2xl border border-slate-200 bg-white p-2 transform hover:scale-[1.01] transition-transform duration-500">
                        <div className="bg-slate-50 rounded-lg overflow-hidden border border-slate-100">
                            {/* Fake Browser Header */}
                            <div className="h-8 bg-white border-b flex items-center px-4 gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                                <div className="flex-1 text-center text-xs text-slate-400 font-mono">dashboard.mindkindler.app</div>
                            </div>
                            
                            {/* Dashboard Mockup Content */}
                            <div className="p-6 grid grid-cols-12 gap-6 text-left">
                                {/* Sidebar */}
                                <div className="col-span-2 hidden md:block space-y-4">
                                    <div className="h-8 w-8 bg-blue-600 rounded-md mb-6"></div>
                                    <div className="h-4 w-24 bg-slate-200 rounded"></div>
                                    <div className="h-4 w-20 bg-slate-200 rounded"></div>
                                    <div className="h-4 w-28 bg-slate-200 rounded"></div>
                                </div>
                                {/* Main */}
                                <div className="col-span-12 md:col-span-10">
                                    <div className="flex justify-between mb-6">
                                        <div className="h-8 w-48 bg-slate-200 rounded"></div>
                                        <div className="h-8 w-8 bg-slate-200 rounded-full"></div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4 mb-6">
                                        <div className="h-24 bg-white border rounded-lg p-4 shadow-sm">
                                            <div className="h-4 w-12 bg-red-100 rounded mb-2"></div>
                                            <div className="h-8 w-8 bg-red-500 rounded-full"></div>
                                        </div>
                                        <div className="h-24 bg-white border rounded-lg p-4 shadow-sm">
                                            <div className="h-4 w-12 bg-blue-100 rounded mb-2"></div>
                                            <div className="h-8 w-16 bg-blue-500 rounded"></div>
                                        </div>
                                        <div className="h-24 bg-white border rounded-lg p-4 shadow-sm">
                                            <div className="h-4 w-12 bg-green-100 rounded mb-2"></div>
                                            <div className="h-8 w-12 bg-green-500 rounded"></div>
                                        </div>
                                    </div>
                                    <div className="h-64 bg-white border rounded-lg p-4 shadow-sm flex flex-col gap-3">
                                        <div className="h-8 w-full bg-slate-50 rounded border-b flex items-center px-4">
                                            <div className="h-3 w-3 bg-red-500 rounded-full mr-2"></div>
                                            <span className="text-xs text-red-600 font-bold">BREACH RISK DETECTED: Sarah Smith (Week 22)</span>
                                        </div>
                                        <div className="h-8 w-full bg-slate-50 rounded border-b"></div>
                                        <div className="h-8 w-full bg-slate-50 rounded border-b"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Floating Badge */}
                        <div className="absolute -bottom-6 -right-6 bg-slate-900 text-white px-6 py-4 rounded-lg shadow-xl flex items-center gap-3 animate-bounce-slow">
                            <Activity className="w-6 h-6 text-green-400" />
                            <div>
                                <div className="text-xs text-slate-400 uppercase font-bold">System Status</div>
                                <div className="font-bold">Guardian Active</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section id="features" className="py-24 bg-white scroll-mt-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-slate-900 mb-4">Everything an Educational Psychologist needs. Nothing they don't.</h2>
                        <p className="text-lg text-slate-600"> Built specifically for the UK SEND Code of Practice (2015).</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="p-8 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-lg transition-shadow group">
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 transition-transform">
                                <Activity className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">20-Week Statutory Clock</h3>
                            <p className="text-slate-600 leading-relaxed">
                                Never miss a deadline. Our workflow engine tracks every case from Week 0 to Week 20, alerting you to breach risks weeks in advance.
                            </p>
                        </div>
                        
                        <div className="p-8 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-lg transition-shadow group">
                            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 mb-6 group-hover:scale-110 transition-transform">
                                <Brain className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Triangulation Engine</h3>
                            <p className="text-slate-600 leading-relaxed">
                                Stop copy-pasting. Our AI reads Parent, School, and Medical reports, extracts the findings, and highlights contradictions automatically.
                            </p>
                        </div>

                        <div className="p-8 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-lg transition-shadow group">
                            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600 mb-6 group-hover:scale-110 transition-transform">
                                <Lock className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Secure Parent Portal</h3>
                            <p className="text-slate-600 leading-relaxed">
                                No more email chains. Send parents a secure "Magic Link" to review drafts on their phone. Feedback syncs directly to your dashboard.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Compliance Section */}
            <section id="compliance" className="py-20 bg-slate-50 border-y border-slate-200 scroll-mt-20">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <h2 className="text-2xl font-bold text-slate-900 mb-12">Trusted by Clinical Leads across the UK</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 opacity-60 grayscale hover:grayscale-0 transition-all">
                        <div className="flex items-center justify-center font-bold text-xl text-slate-400">NHS Certified</div>
                        <div className="flex items-center justify-center font-bold text-xl text-slate-400">Cyber Essentials+</div>
                        <div className="flex items-center justify-center font-bold text-xl text-slate-400">GDPR Compliant</div>
                        <div className="flex items-center justify-center font-bold text-xl text-slate-400">HCPC Standards</div>
                    </div>
                </div>
            </section>

            {/* The Guardian Section */}
            <section id="guardian" className="py-24 bg-slate-900 text-white overflow-hidden relative scroll-mt-20">
                <div className="absolute top-0 right-0 w-1/3 h-full bg-blue-600/10 blur-3xl rounded-full translate-x-1/2" />
                
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center gap-16">
                    <div className="flex-1">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-900/50 border border-blue-700 rounded-full text-blue-300 text-xs font-bold mb-6">
                            <Shield className="w-3 h-3" />
                            DISTRICT INTELLIGENCE
                        </div>
                        <h2 className="text-4xl font-bold mb-6">Meet "The Guardian".<br />Your Systemic Risk Radar.</h2>
                        <p className="text-slate-300 text-lg mb-8 leading-relaxed">
                            While you focus on the child, The Guardian watches the district. It scans thousands of cases nightly to detect hidden clusters of risk—bullying outbreaks, postcode neglect spikes, and silent sibling risks.
                        </p>
                        
                        <ul className="space-y-4 mb-8">
                            {[
                                'School Cluster Detection (>3 cases)',
                                'Sibling Risk Propagation',
                                'Statutory Breach Prediction'
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-green-400" />
                                    <span className="text-slate-200">{item}</span>
                                </li>
                            ))}
                        </ul>

                        <Link href="/guardian">
                            <Button className="bg-blue-600 hover:bg-blue-500 text-white">
                                Enter Command Center
                            </Button>
                        </Link>
                    </div>
                    
                    <div className="flex-1 w-full max-w-md bg-slate-800 rounded-2xl border border-slate-700 p-6 shadow-2xl relative z-10">
                        {/* Mock UI for Guardian Card */}
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                            <span className="text-sm font-bold text-red-400 uppercase tracking-widest">Live Alert Detected</span>
                        </div>
                        <div className="bg-slate-900/50 p-4 rounded border border-red-500/30 mb-4">
                            <div className="flex justify-between mb-2">
                                <span className="text-red-400 font-bold text-sm">SIBLING RISK</span>
                                <span className="text-slate-500 text-xs">Now</span>
                            </div>
                            <p className="text-slate-300 text-sm">
                                Detected active Safeguarding Risk for Case A. Sibling (Case B) flagged for immediate proactive check.
                            </p>
                        </div>
                         <div className="bg-slate-900/50 p-4 rounded border border-orange-500/30">
                            <div className="flex justify-between mb-2">
                                <span className="text-orange-400 font-bold text-sm">SCHOOL CLUSTER</span>
                                <span className="text-slate-500 text-xs">2h ago</span>
                            </div>
                            <p className="text-slate-300 text-sm">
                                4 Cases at York High flagged for 'Self Harm' in last 30 days. Anomaly detected.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-white border-t py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2">
                        <Shield className="w-6 h-6 text-slate-400" />
                        <span className="font-bold text-slate-700">MindKindler</span>
                    </div>
                    <p className="text-sm text-slate-500">
                        © 2026 MindKindler Ltd. Built for the UK Public Sector.
                    </p>
                    <div className="flex gap-6">
                        <span className="text-sm text-slate-400 cursor-not-allowed">Privacy</span>
                        <span className="text-sm text-slate-400 cursor-not-allowed">Terms</span>
                        <a href="mailto:support@mindkindler.app" className="text-sm text-slate-500 hover:text-slate-900">Contact</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
