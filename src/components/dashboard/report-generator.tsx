"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { generateDraftReport } from "@/ai/flows/generate-draft-report";
import { Loader2, Sparkles, Wand2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Separator } from "../ui/separator";

const formSchema = z.object({
  assessmentData: z.string().min(10, {
    message: "Assessment data must be at least 10 characters.",
  }),
  notes: z.string().min(10, {
    message: "Notes must be at least 10 characters.",
  }),
});

export function ReportGenerator() {
  const { toast } = useToast();
  const [report, setReport] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      assessmentData: "",
      notes: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setReport("");
    try {
      const result = await generateDraftReport(values);
      setReport(result.report);
      toast({
        title: "Report Generated",
        description: "The draft report has been successfully created.",
      });
    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        title: "Error",
        description: "Failed to generate the report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Report Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="assessmentData"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assessment Data</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter assessment data in JSON format or as a summary. E.g., { 'WISC-V': { 'FSIQ': 95 }, 'WIAT-III': { 'Reading': 88 } }"
                        className="min-h-[150px] font-code"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Provide structured data from standardized tests.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Clinical Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter observational notes, parent/teacher feedback, and other qualitative information..."
                        className="min-h-[150px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Include any relevant context or observations.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Wand2 className="mr-2 h-4 w-4" />
                )}
                Generate Draft Report
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Generated Draft Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-full min-h-[400px] items-center justify-center">
              <div className="text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">
                  Generating report...
                </p>
              </div>
            </div>
          ) : report ? (
            <div className="prose prose-sm max-w-none dark:prose-invert">
              {report.split("\n\n").map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
              <Separator className="my-6" />
              <div className="flex gap-2">
                <Button>Save to Case File</Button>
                <Button variant="outline">Export as PDF</Button>
              </div>
            </div>
          ) : (
            <div className="flex h-full min-h-[400px] items-center justify-center rounded-lg border-2 border-dashed bg-secondary/50">
              <div className="text-center text-muted-foreground">
                <p>Your generated report will appear here.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
