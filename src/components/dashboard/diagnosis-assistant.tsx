"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { generateDifferentialDiagnosis, DifferentialDiagnosisOutput } from "@/ai/flows/differential-diagnosis";
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
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Stethoscope, AlertTriangle, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const formSchema = z.object({
  caseDescription: z.string().min(20, {
    message: "Case description must be at least 20 characters.",
  }),
  age: z.number().min(1, {
    message: "Age must be at least 1.",
  }).max(100, {
    message: "Age must be less than 100.",
  }),
});

export function DiagnosisAssistant() {
  const { toast } = useToast();
  const [result, setResult] = useState<DifferentialDiagnosisOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      caseDescription: "",
      age: 6,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);
    try {
      const diagnosisResult = await generateDifferentialDiagnosis(values);
      setResult(diagnosisResult);
      toast({
        title: "Analysis Complete",
        description: "Differential diagnosis suggestions generated.",
      });
    } catch (error) {
      console.error("Error generating diagnosis:", error);
      toast({
        title: "Error",
        description: "Failed to generate suggestions. Please try again.",
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
          <CardTitle>Case Details</CardTitle>
          <CardDescription>
            Provide details about the student's symptoms and behavior.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="age"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Student Age</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={e => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="caseDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Case Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe observations, reported difficulties, and assessment scores..."
                        className="min-h-[200px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Include specific behaviors, duration of symptoms, and context.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Stethoscope className="mr-2 h-4 w-4" />
                )}
                Analyze Case
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Analysis Results</CardTitle>
            <CardDescription>
              AI-generated suggestions for consideration.
            </CardDescription>
          </CardHeader>
          <CardContent>
             {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Analyzing patterns...</p>
              </div>
            ) : result ? (
              <div className="space-y-6">
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Disclaimer</AlertTitle>
                  <AlertDescription>
                    {result.disclaimer}
                  </AlertDescription>
                </Alert>

                <Accordion type="single" collapsible className="w-full">
                  {result.suggestions.map((suggestion, index) => (
                    <AccordionItem value={`item-${index}`} key={index}>
                      <AccordionTrigger>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold">{suggestion.diagnosis}</span>
                          <Badge variant={
                            suggestion.confidence === 'high' ? 'default' : 
                            suggestion.confidence === 'medium' ? 'secondary' : 'outline'
                          }>
                            {suggestion.confidence} confidence
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4 pt-2">
                        <div>
                          <h4 className="text-sm font-semibold mb-1">Reasoning</h4>
                          <p className="text-sm text-muted-foreground">{suggestion.reasoning}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold mb-1">Recommended Assessments</h4>
                          <ul className="list-disc pl-4 text-sm text-muted-foreground">
                            {suggestion.recommendedAssessments.map((assessment, i) => (
                              <li key={i}>{assessment}</li>
                            ))}
                          </ul>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground border-2 border-dashed rounded-lg">
                <FileText className="h-12 w-12 mb-2 opacity-20" />
                <p>Submit case details to view differential diagnosis suggestions.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
