import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  FileText,
  BrainCircuit,
  BarChart,
  MessageSquare,
  TabletSmartphone,
  BookOpen,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { PlaceHolderImages } from "@/lib/placeholder-images";

const heroImage = PlaceHolderImages.find((img) => img.id === "hero-1");

export default function Home() {
  const features = [
    {
      icon: <Users className="h-8 w-8 text-primary" />,
      title: "Holistic Case Management",
      description:
        "Seamlessly manage student cases from initial assessment to ongoing intervention and progress tracking.",
    },
    {
      icon: <BrainCircuit className="h-8 w-8 text-primary" />,
      title: "AI-Assisted Reporting",
      description:
        "Generate comprehensive draft reports in minutes, summarizing strengths, challenges, and interventions.",
    },
    {
      icon: <BarChart className="h-8 w-8 text-primary" />,
      title: "Insightful Dashboards",
      description:
        "Visualize student progress and classroom trends with role-based, interactive charts and graphs.",
    },
    {
      icon: <MessageSquare className="h-8 w-8 text-primary" />,
      title: "Collaborative Messaging",
      description:
        "Foster communication between teachers, psychologists, and parents with secure, in-app messaging.",
    },
    {
      icon: <TabletSmartphone className="h-8 w-8 text-primary" />,
      title: "Mobile & Offline Ready",
      description:
        "Access critical information and capture notes anytime, anywhere, even without an internet connection.",
    },
    {
      icon: <BookOpen className="h-8 w-8 text-primary" />,
      title: "Resource Library",
      description:
        "Access a rich library of training materials and evidence-based strategies for professional development.",
    },
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
              Kindling Potential, One Child at a Time
            </h1>
            <p className="max-w-[600px] text-lg text-muted-foreground md:text-xl">
              MindKindler is a comprehensive, AI-enabled platform designed to
              support the educational and psychological development of every
              child.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/signup">Get Started for Free</Link>
              </Button>
              <Button size="lg" variant="secondary" asChild>
                <Link href="#features">Learn More</Link>
              </Button>
            </div>
          </div>
          <div className="relative h-64 w-full overflow-hidden rounded-xl shadow-2xl md:h-96">
            {heroImage && (
              <Image
                src={heroImage.imageUrl}
                alt={heroImage.description}
                fill
                className="object-cover"
                data-ai-hint={heroImage.imageHint}
              />
            )}
          </div>
        </section>

        <section id="features" className="w-full bg-secondary/50 py-12 md:py-24">
          <div className="container mx-auto px-4 md:px-6">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                A Unified Platform for Growth
              </h2>
              <p className="mt-4 text-muted-foreground md:text-lg">
                MindKindler connects the entire support ecosystem to provide
                seamless, evidence-based care.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => (
                <Card key={index} className="flex flex-col">
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
          <Card className="bg-primary/10">
            <CardContent className="grid items-center gap-8 p-8 md:grid-cols-3">
              <div className="md:col-span-2">
                <h3 className="text-2xl font-bold">
                  Cut Report Writing Time by Hours
                </h3>
                <p className="mt-2 text-muted-foreground">
                  Our AI-assisted report generation, powered by Gemini, helps
                  educational psychologists draft comprehensive reports
                  significantly faster. This frees up valuable time to focus on
                  what matters most: supporting children.
                </p>
                <p className="mt-2 text-xs text-muted-foreground/80">
                  Inspired by insights from{" "}
                  <a
                    href="https://lightner-ai.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    lightner-ai.com
                  </a>
                </p>
              </div>
              <div className="flex justify-center">
                <FileText className="h-24 w-24 text-primary/80" />
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      <footer className="border-t bg-secondary/50">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 py-8 md:flex-row md:px-6">
          <Logo />
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} MindKindler. All rights reserved.
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
