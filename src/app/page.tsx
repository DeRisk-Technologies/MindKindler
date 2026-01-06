"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  BrainCircuit,
  BarChart,
  Globe,
  Briefcase,
  Store,
  GraduationCap,
  Upload,
  ShieldCheck,
  FileText,
  Clock,
  MessageSquare,
  Lock,
  Database
} from "lucide-react";
import { Logo } from "@/components/logo";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const defaultHero = PlaceHolderImages.find((img) => img.id === "hero-1");

export default function Home() {
  const [heroImageSrc, setHeroImageSrc] = useState(defaultHero?.imageUrl);
  
  useEffect(() => {
    async function fetchSettings() {
        try {
            const settingsDoc = await getDoc(doc(db, "organization_settings", "global"));
            if (settingsDoc.exists() && settingsDoc.data().landingPage?.heroImageUrl) {
                setHeroImageSrc(settingsDoc.data().landingPage.heroImageUrl);
            }
        } catch (e) {
            console.error("Failed to load landing settings", e);
        }
    }
    fetchSettings();
  }, []);

  const features = [
    {
      icon: <FileText className="h-8 w-8 text-primary" />,
      title: "AI Report Writer",
      description: "Draft clinical reports in minutes with evidence-based AI generation, role-based redaction, and secure sign-off.",
    },
    {
        icon: <Upload className="h-8 w-8 text-primary" />,
        title: "Assistant Upload Portal",
        description: "Streamline data ingestion with AI-powered bulk uploads, mobile scanning, and human-in-the-loop verification.",
    },
    {
      icon: <Globe className="h-8 w-8 text-primary" />,
      title: "Government Intelligence",
      description: "Policy planning, benchmarking, and roll-out simulation for education ministries and local authorities.",
    },
    {
      icon: <Store className="h-8 w-8 text-primary" />,
      title: "Global Marketplace",
      description: "Discover and install verified templates, training packs, and policy rulebooks from expert partners.",
    },
    {
      icon: <BrainCircuit className="h-8 w-8 text-primary" />,
      title: "AI Co-Pilot & Guardian",
      description: "Real-time clinical insights with a compliance engine that ensures every action meets local regulations.",
    },
     {
      icon: <GraduationCap className="h-8 w-8 text-primary" />,
      title: "Training Academy",
      description: "Continuous professional development with tracked certifications and adaptive learning paths.",
    },
    // New Marketing Features
    {
        icon: <Clock className="h-8 w-8 text-primary" />,
        title: "Reclaim Your Time",
        description: "Save 10+ hours per week on administrative tasks. Let AI handle the paperwork while you focus on the child.",
    },
    {
        icon: <MessageSquare className="h-8 w-8 text-primary" />,
        title: "Secure Collaboration",
        description: "Connect with schools, parents, and multi-disciplinary teams through encrypted, compliant channels.",
    },
    {
        icon: <Lock className="h-8 w-8 text-primary" />,
        title: "Clinical Safety First",
        description: "Built by certified Educational Psychologists. Adheres to strict ethical guidelines and data sovereignty laws.",
    },
    {
        icon: <Users className="h-8 w-8 text-primary" />,
        title: "Community Forum",
        description: "Connect with peers, share insights, and access a global network of educational psychologists.",
    },
    {
        icon: <Database className="h-8 w-8 text-primary" />,
        title: "Global Knowledge Vault",
        description: "A centralized repository of best practices, research, and policy documents.",
    }
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="container mx-auto flex h-20 items-center justify-between px-4 md:px-6">
        <Logo />
        <nav className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link href="/login">Log In</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Sign Up</Link>
          </Button>
        </nav>
      </header>

      <main className="flex-1">
        <section className="container mx-auto grid grid-cols-1 items-center gap-8 px-4 py-12 md:grid-cols-2 md:px-6 lg:py-24">
          <div className="space-y-6">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl lg:text-6xl/none">
              Kindling Potential, <span className="text-primary">Globally</span>.
            </h1>
            <p className="max-w-[600px] text-lg text-muted-foreground md:text-xl">
              The AI-enabled Educational Psychology ecosystem connecting governments, schools, and clinicians.
            </p>
             <p className="text-sm text-muted-foreground italic flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-green-600" />
                Guided by experienced, certified Educational Child Psychologists.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/signup">Get Started for Free</Link>
              </Button>
              <Button size="lg" variant="secondary" asChild>
                <Link href="/dashboard/partner-portal/apply">Become a Partner</Link>
              </Button>
            </div>
          </div>
          <div className="relative h-64 w-full overflow-hidden rounded-xl shadow-2xl md:h-96">
            {heroImageSrc && (
              <Image
                src={heroImageSrc}
                alt="MindKindler Platform"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                priority
              />
            )}
          </div>
        </section>

        {/* Use Cases Section */}
        <section className="bg-gray-50 py-12">
            <div className="container mx-auto px-4 md:px-6">
                 <div className="mx-auto mb-10 max-w-2xl text-center">
                    <h2 className="text-2xl font-bold">Why Choose MindKindler?</h2>
                    <p className="text-muted-foreground">Tailored solutions for every stakeholder in the education ecosystem.</p>
                </div>
                <div className="grid gap-6 md:grid-cols-3">
                    <div className="flex flex-col items-center text-center space-y-2 p-4">
                        <div className="p-3 bg-blue-100 rounded-full text-blue-600">
                             <Briefcase className="h-6 w-6" />
                        </div>
                        <h3 className="font-semibold text-lg">For the Independent EPP</h3>
                        <p className="text-sm text-gray-600">
                            "I used to spend my weekends writing reports. Now, MindKindler drafts 80% of it for me, allowing me to take on more cases and increase my impact."
                        </p>
                    </div>
                     <div className="flex flex-col items-center text-center space-y-2 p-4">
                        <div className="p-3 bg-green-100 rounded-full text-green-600">
                             <Building2 className="h-6 w-6" />
                        </div>
                        <h3 className="font-semibold text-lg">For School Districts</h3>
                        <p className="text-sm text-gray-600">
                            "Centralized oversight of all our SEN students. We can finally track intervention success rates and budget allocation in real-time."
                        </p>
                    </div>
                     <div className="flex flex-col items-center text-center space-y-2 p-4">
                        <div className="p-3 bg-purple-100 rounded-full text-purple-600">
                             <Globe className="h-6 w-6" />
                        </div>
                        <h3 className="font-semibold text-lg">For Governments</h3>
                        <p className="text-sm text-gray-600">
                            "Data-driven policy making. MindKindler gives us the macro-view we need to benchmark our regions against global standards."
                        </p>
                    </div>
                </div>
            </div>
        </section>

        <section id="features" className="w-full bg-secondary/50 py-12 md:py-24">
          <div className="container mx-auto px-4 md:px-6">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                The Complete EdPsych OS
              </h2>
              <p className="mt-4 text-muted-foreground md:text-lg">
                From national policy to individual interventions, MindKindler provides the tools to drive better outcomes.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => (
                <Card key={index} className="flex flex-col hover:shadow-lg transition-all">
                  <CardHeader className="flex flex-row items-center gap-4">
                    {feature.icon}
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-12 md:px-6 md:py-24">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
             <Card className="bg-primary/5 border-primary/20">
              <CardContent className="grid items-center gap-8 p-8 md:grid-cols-1">
                <div className="text-center">
                  <Globe className="h-12 w-12 text-primary/80 mx-auto mb-4" />
                  <h3 className="text-xl font-bold">
                    For Governments
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Simulate policy rollouts, track readiness, and benchmark performance globally.
                  </p>
                  <Button variant="link" className="px-0 mt-2" asChild>
                      <Link href="/signup">Request Demo &rarr;</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800">
              <CardContent className="grid items-center gap-8 p-8 md:grid-cols-1">
                <div className="text-center">
                  <ShieldCheck className="h-12 w-12 text-indigo-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold">
                    For Clinicians
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Automate reports, ingest data effortlessly, and focus on student outcomes.
                  </p>
                   <Button variant="link" className="px-0 mt-2 text-indigo-600" asChild>
                      <Link href="/signup">Start Free Trial &rarr;</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800">
              <CardContent className="grid items-center gap-8 p-8 md:grid-cols-1">
                <div className="text-center">
                  <Briefcase className="h-12 w-12 text-orange-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold">
                    For Partners
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Monetize templates, training, and expertise in our global marketplace.
                  </p>
                   <Button variant="link" className="px-0 mt-2 text-orange-600" asChild>
                      <Link href="/dashboard/partner-portal/apply">Apply Now &rarr;</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <footer className="border-t bg-secondary/50">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 py-8 md:flex-row md:px-6">
          <Logo />
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} MindKindler, a product of DeRisk Technologies Group. All rights reserved.
          </p>
          <nav className="flex gap-4">
            <Link
              href="#"
              className="text-sm hover:underline underline-offset-4"
            >
              Terms of Service
            </Link>
            <Link
              href="#"
              className="text-sm hover:underline underline-offset-4"
            >
              Privacy Policy
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

function Building2({ className }: { className?: string }) {
    return <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>;
}
