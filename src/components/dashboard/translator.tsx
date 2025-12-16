"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { translateContent, TranslateContentOutput } from "@/ai/flows/translate-content";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Languages, ArrowRightLeft, Copy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const formSchema = z.object({
  text: z.string().min(1, {
    message: "Please enter text to translate.",
  }),
  targetLanguage: z.enum(["Hausa", "Yoruba", "Igbo"], {
    required_error: "Please select a target language.",
  }),
});

export function Translator() {
  const { toast } = useToast();
  const [result, setResult] = useState<TranslateContentOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      text: "",
      targetLanguage: "Hausa",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);
    try {
      const translationResult = await translateContent(values);
      setResult(translationResult);
      toast({
        title: "Translation Complete",
        description: "Text successfully translated.",
      });
    } catch (error) {
      console.error("Error translating text:", error);
      toast({
        title: "Error",
        description: "Failed to translate text. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const copyToClipboard = () => {
    if (result?.translatedText) {
      navigator.clipboard.writeText(result.translatedText);
      toast({
        title: "Copied",
        description: "Translated text copied to clipboard.",
      });
    }
  };

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Source Text</CardTitle>
          <CardDescription>
            Enter the report content or note you wish to translate.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="targetLanguage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Language</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a language" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Hausa">Hausa</SelectItem>
                        <SelectItem value="Yoruba">Yoruba</SelectItem>
                        <SelectItem value="Igbo">Igbo</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Paste text here..."
                        className="min-h-[200px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRightLeft className="mr-2 h-4 w-4" />
                )}
                Translate
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Translation</CardTitle>
          <CardDescription>
            AI-translated content in the selected local language.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Translating content...</p>
            </div>
          ) : result ? (
            <div className="space-y-4">
              <div className="rounded-md border bg-muted p-4 min-h-[200px] whitespace-pre-wrap">
                {result.translatedText}
              </div>
              <Button variant="outline" size="sm" onClick={copyToClipboard} className="w-full">
                <Copy className="mr-2 h-4 w-4" />
                Copy to Clipboard
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground border-2 border-dashed rounded-lg">
              <Languages className="h-12 w-12 mb-2 opacity-20" />
              <p>Translation result will appear here.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
