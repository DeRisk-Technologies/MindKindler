"use client";

import React from 'react';
import { Shield, Users, FilePlus, Settings, Bell, Search, LogOut, ShoppingBag, BookOpen, FileText, UploadCloud } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface AppShellProps {
    children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
    const router = useRouter();
    const pathname = usePathname();

    // If we are on the Landing Page, render just children (No App Shell)
    if (pathname === '/') {
        return <>{children}</>;
    }

    // Otherwise render the Dashboard Shell
    const navGroups = [
        {
            title: "Clinical Practice",
            items: [
                // FIXED: Points to the unified /cases path
                { label: 'My Caseload', icon: Users, path: '/dashboard/cases' },
                { label: 'Intake Wizard', icon: FilePlus, path: '/dashboard/new' },
                { label: 'Reporting', icon: FileText, path: '/dashboard/reports' },
            ]
        },
        {
            title: "District Intelligence",
            items: [
                { label: 'Guardian View', icon: Shield, path: '/guardian' },
            ]
        },
        {
            title: "Platform",
            items: [
                { label: 'Marketplace', icon: ShoppingBag, path: '/dashboard/marketplace/templates' },
                { label: 'Library & CPD', icon: BookOpen, path: '/dashboard/training' },
                { label: 'Settings', icon: Settings, path: '/dashboard/settings' },
                { label: 'Publisher Studio', icon: UploadCloud, path: '/dashboard/marketplace/publisher/new' },
            ]
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex">
            
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 text-white hidden md:flex flex-col fixed h-full z-20">
                {/* Logo */}
                <div 
                    className="h-16 flex items-center px-6 border-b border-slate-800 cursor-pointer hover:bg-slate-800 transition-colors"
                    onClick={() => router.push('/')}
                >
                    <Shield className="w-6 h-6 text-blue-400 mr-2" />
                    <span className="font-bold text-lg tracking-tight">MindKindler</span>
                </div>

                {/* Nav */}
                <nav className="flex-1 py-6 px-3 space-y-6 overflow-y-auto">
                    {navGroups.map((group, idx) => (
                        <div key={idx}>
                            <h3 className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                                {group.title}
                            </h3>
                            <div className="space-y-1">
                                {group.items.map((item) => (
                                    <button
                                        key={item.path}
                                        onClick={() => router.push(item.path)}
                                        className={cn(
                                            "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                                            (pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path)))
                                                ? "bg-blue-600 text-white" 
                                                : "text-slate-400 hover:bg-slate-800 hover:text-white"
                                        )}
                                    >
                                        <item.icon className="w-5 h-5" />
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* User Footer */}
                <div className="p-4 border-t border-slate-800">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 bg-blue-500">
                            <AvatarFallback>DR</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">Dr. Reynolds</p>
                            <p className="text-xs text-slate-500 truncate">Lead EPP (Admin)</p>
                        </div>
                        <LogOut className="w-4 h-4 text-slate-500 hover:text-white cursor-pointer" />
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
                
                {/* Top Header */}
                <header className="bg-white h-16 border-b flex items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 z-10">
                    <div className="flex items-center gap-4 md:hidden">
                        <Shield className="w-6 h-6 text-blue-600" />
                        <span className="font-bold text-gray-900">MindKindler</span>
                    </div>

                    <div className="hidden md:block flex-1 max-w-lg">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input 
                                type="text" 
                                placeholder="Search students, UPNs, or schools..." 
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" className="relative text-gray-500">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white" />
                        </Button>
                    </div>
                </header>

                <main className="flex-1 p-4 sm:p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
