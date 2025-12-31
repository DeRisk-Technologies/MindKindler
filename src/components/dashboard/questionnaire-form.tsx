"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import {
  implementDigitalQuestionnaires,
  ImplementDigitalQuestionnairesOutput,
} from "@/ai/flows/implement-digital-questionnaires";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

const questions = [
  "How often do you have trouble wrapping up the final details of a project, once the challenging parts have been done?",
  "How often do you have difficulty getting things in order when you have to do a task that requires organization?",
  "How often do you have problems remembering appointments or obligations?",
  "When you have a task that requires a lot of thought, how often do you avoid or delay getting started?",
  "How often do you fidget or squirm with your hands or feet when you have to sit down for a long time?",
  "How often do you feel overly active and compelled to do things, like you were driven by a motor?",
];
const options = ["Never", "Rarely", "Sometimes", "Often", "Very Often"];

const formSchema = z.object({
  answers: z.array(z.string()).length(questions.length, "Please answer all questions."),
});

const scoringCriteria = `
  For each question, score Never=0, Rarely=1, Sometimes=2, Often=3, Very Often=4.
  Sum the scores for all questions.
  - Total score 0-5: Low risk
  - Total score 6-14: Medium risk
  - Total score 15-24: High risk
  Generate a brief report summarizing the score and risk level.
`;

export function QuestionnaireForm() {
  const { toast } = useToast();
  const [result, setResult] = useState<ImplementDigitalQuestionnairesOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      answers: [],
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);

    const questionnaireData = values.answers
      .map((answer, index) => `Q${index + 1}: ${answer}`)
      .join("\n");

    try {
      const response = await implementDigitalQuestionnaires({
        questionnaireData,
        scoringCriteria,
      });
      setResult(response);
    } catch (error) {
      console.error("Error scoring questionnaire:", error);
      toast({
        title: "Error",
        description: "Failed to score the questionnaire. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      {!result ? (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {questions.map((question, qIndex) => (
              <FormField
                key={qIndex}
                control={form.control}
                name={`answers.${qIndex}`}
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>{`${qIndex + 1}. ${question}`}</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        {options.map((option, oIndex) => (
                          <FormItem
                            key={oIndex}
                            className="flex items-center space-x-3 space-y-0"
                          >
                            <FormControl>
                              <RadioGroupItem value={option} />
                            </FormControl>
                            <FormLabel className="font-normal">
                              {option}
                            </FormLabel>
                          </FormItem>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
            <Button type="submit" disabled={isLoading}>
              {isLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Submit for Scoring
            </Button>
          </form>
        </Form>
      ) : (
        <div className="space-y-6">
          <Card className="bg-secondary/50">
            <CardHeader>
              <CardTitle>Assessment Result</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold">Overall Score</h3>
                <p className="text-4xl font-bold text-primary">
                  {result.score}
                </p>
              </div>
              <div>
                <h3 className="font-semibold">Risk Level</h3>
                <p
                  className={`text-2xl font-bold ${
                    result.riskLevel === "high"
                      ? "text-destructive"
                      : result.riskLevel === "medium"
                      ? "text-amber-600"
                      : "text-green-600"
                  }`}
                >
                  {result.riskLevel.charAt(0).toUpperCase() +
                    result.riskLevel.slice(1)}
                </p>
              </div>
              <div>
                <h3 className="font-semibold">Summary Report</h3>
                <p className="text-muted-foreground">{result.report}</p>
              </div>
            </CardContent>
          </Card>
          <Button onClick={() => { setResult(null); form.reset(); }}>
            Start New Assessment
          </Button>
        </div>
      )}
    </>
  );
}
