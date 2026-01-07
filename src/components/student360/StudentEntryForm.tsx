import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ParentEntryForm } from './ParentEntryForm';
import { Loader2, Save, Shield, Map } from 'lucide-react';
import { useSchemaExtensions } from '@/hooks/use-schema-extensions'; // NEW
import { DynamicFormField } from '@/components/ui/dynamic-form-field'; // NEW

// Default values structure
const defaultValues = {
  identity: {
    firstName: { value: '', metadata: { source: 'manual', verified: false } },
    lastName: { value: '', metadata: { source: 'manual', verified: false } },
    dateOfBirth: { value: '', metadata: { source: 'manual', verified: false } },
    gender: { value: '', metadata: { source: 'manual', verified: false } },
    nationalId: { value: '', metadata: { source: 'manual', verified: false } },
  },
  education: {
    currentSchoolId: { value: '', metadata: { source: 'manual', verified: false } },
    enrollmentDate: { value: '', metadata: { source: 'manual', verified: false } },
  },
  family: {
    parents: []
  },
  extensions: {}, // Dynamic bucket
  health: { 
      allergies: { value: [], metadata: { source: 'manual', verified: false } },
      conditions: { value: [], metadata: { source: 'manual', verified: false } },
      medications: { value: [], metadata: { source: 'manual', verified: false } }
  }
};

export function StudentEntryForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  
  // Phase 7: Inject Country OS Extensions
  const { config: schemaConfig, loading: loadingExtensions } = useSchemaExtensions();

  const form = useForm({
    defaultValues
  });

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
        console.log("Submitting 360 Record:", data);
        
        // Simulating delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        toast({
            title: "Student Record Created",
            description: "Student and parent records have been saved successfully. Verification tasks generated.",
        });

        router.push(`/dashboard/students`);

    } catch (error) {
        console.error(error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to create record. Please try again.",
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">New Student Record</h1>
                <p className="text-muted-foreground text-sm">Create a comprehensive 360° profile including parents and initial provenance.</p>
            </div>
            <div className="flex gap-2">
                <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
                <Button onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Create Record
                </Button>
            </div>
        </div>

        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Student Details */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Shield className="h-4 w-4 text-primary" />
                                    Identity & Demographics
                                </CardTitle>
                                <CardDescription>Core legal identity. All fields are tracked for verification.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="identity.firstName.value"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>First Name</FormLabel>
                                            <FormControl><Input {...field} placeholder="Legal First Name" /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="identity.lastName.value"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Last Name</FormLabel>
                                            <FormControl><Input {...field} placeholder="Legal Surname" /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="identity.dateOfBirth.value"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Date of Birth</FormLabel>
                                            <FormControl><Input {...field} type="date" /></FormControl>
                                            <FormDescription className="text-xs">Requires verification via Birth Cert.</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="identity.gender.value"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Gender</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="Male">Male</SelectItem>
                                                    <SelectItem value="Female">Female</SelectItem>
                                                    <SelectItem value="Non-Binary">Non-Binary</SelectItem>
                                                    <SelectItem value="Prefer Not to Say">Prefer Not to Say</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="identity.nationalId.value"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>National ID / NHS No</FormLabel>
                                            <FormControl><Input {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>

                        {/* ACADEMIC INFO - Including Dynamic Country Fields */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Education Status</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="education.currentSchoolId.value"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Current School</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger><SelectValue placeholder="Select School" /></SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="school-1">Springfield Elementary</SelectItem>
                                                        <SelectItem value="school-2">West High</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="education.enrollmentDate.value"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Enrollment Date</FormLabel>
                                                <FormControl><Input {...field} type="date" /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {/* Dynamic Country OS Fields */}
                                {schemaConfig.studentFields.length > 0 && (
                                    <>
                                        <div className="flex items-center gap-2 my-2 pt-4 border-t">
                                            <Map className="h-4 w-4 text-indigo-600" />
                                            <h3 className="text-sm font-semibold text-indigo-900">Regional Requirements</h3>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-indigo-50/50 p-4 rounded-md border border-indigo-100">
                                            {schemaConfig.studentFields.map((field) => (
                                                <DynamicFormField 
                                                    key={field.fieldName}
                                                    field={field} 
                                                    control={form.control}
                                                    baseName="extensions"
                                                />
                                            ))}
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Parents & Family */}
                    <div className="lg:col-span-1 space-y-6">
                        <ParentEntryForm form={form} />
                        
                        <Card className="bg-blue-50 border-blue-200">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm text-blue-800">Next Steps</CardTitle>
                            </CardHeader>
                            <CardContent className="text-xs text-blue-700 space-y-2">
                                <p>After saving:</p>
                                <ul className="list-disc pl-4 space-y-1">
                                    <li>Upload Birth Certificate to verify DOB.</li>
                                    <li>Send consent request to Primary Parent.</li>
                                    <li>Import school records via OneRoster.</li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </form>
        </Form>
    </div>
  );
}
