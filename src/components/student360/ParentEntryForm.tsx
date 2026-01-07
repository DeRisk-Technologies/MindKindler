import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Plus, UserPlus } from 'lucide-react';
import { ParentRecord } from '@/types/schema';

// This component uses react-hook-form context from the parent StudentEntryForm
export function ParentEntryForm({ form }: { form: any }) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "family.parents",
  });

  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const addParent = () => {
    append({
        firstName: '',
        lastName: '',
        email: '', // Initialize explicitly to empty string
        phone: '', // Initialize explicitly
        relationshipType: 'Mother',
        hasParentalResponsibility: false,
        isPrimaryContact: fields.length === 0, // First one is primary by default
        isEmergencyContact: true,
        communicationPreferences: { email: true, sms: true, phone: true }
    });
    setExpandedIndex(fields.length); // Open the new one
  };

  return (
    <Card className="border-l-4 border-l-purple-500">
        <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    Parents & Guardians
                </CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={addParent}>
                    <Plus className="h-4 w-4 mr-1" /> Add Parent
                </Button>
            </div>
        </CardHeader>
        <CardContent className="space-y-4">
            {fields.map((field, index) => (
                <div key={field.id} className="border rounded-md bg-white">
                    <div 
                        className="flex items-center justify-between p-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => toggleExpand(index)}
                    >
                        <div className="flex items-center gap-3">
                             <div className="h-6 w-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-bold">
                                {index + 1}
                             </div>
                             <div>
                                <span className="font-medium text-sm">
                                    {form.watch(`family.parents.${index}.firstName`) || 'New Parent'} {form.watch(`family.parents.${index}.lastName`)}
                                </span>
                                <span className="text-xs text-gray-500 ml-2">
                                    {form.watch(`family.parents.${index}.relationshipType`)}
                                </span>
                             </div>
                        </div>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={(e) => { e.stopPropagation(); remove(index); }}
                            className="text-red-500 hover:text-red-700 h-8 w-8 p-0"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                    
                    {expandedIndex === index && (
                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                             <FormField
                                control={form.control}
                                name={`family.parents.${index}.firstName`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs">First Name</FormLabel>
                                        <FormControl><Input {...field} value={field.value ?? ''} placeholder="Jane" /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name={`family.parents.${index}.lastName`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs">Last Name</FormLabel>
                                        <FormControl><Input {...field} value={field.value ?? ''} placeholder="Doe" /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name={`family.parents.${index}.relationshipType`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs">Relationship</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="Mother">Mother</SelectItem>
                                                <SelectItem value="Father">Father</SelectItem>
                                                <SelectItem value="Step-Parent">Step-Parent</SelectItem>
                                                <SelectItem value="Guardian">Legal Guardian</SelectItem>
                                                <SelectItem value="Foster Carer">Foster Carer</SelectItem>
                                                <SelectItem value="Grandparent">Grandparent</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            
                            <div className="col-span-2 grid grid-cols-2 gap-4 mt-2 p-3 bg-gray-50 rounded border border-gray-100">
                                <FormField
                                    control={form.control}
                                    name={`family.parents.${index}.hasParentalResponsibility`}
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                            <FormControl>
                                                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                            </FormControl>
                                            <div className="space-y-1 leading-none">
                                                <FormLabel className="text-xs font-semibold">Parental Responsibility</FormLabel>
                                                <p className="text-[10px] text-gray-500">Legal authority to make decisions</p>
                                            </div>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name={`family.parents.${index}.isPrimaryContact`}
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                            <FormControl>
                                                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                            </FormControl>
                                            <div className="space-y-1 leading-none">
                                                <FormLabel className="text-xs font-semibold">Primary Contact</FormLabel>
                                            </div>
                                        </FormItem>
                                    )}
                                />
                            </div>
                            
                            <FormField
                                control={form.control}
                                name={`family.parents.${index}.email`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs">Email</FormLabel>
                                        <FormControl><Input {...field} value={field.value ?? ''} type="email" /></FormControl>
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name={`family.parents.${index}.phone`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs">Phone</FormLabel>
                                        <FormControl><Input {...field} value={field.value ?? ''} type="tel" /></FormControl>
                                    </FormItem>
                                )}
                            />
                        </div>
                    )}
                </div>
            ))}
            
            {fields.length === 0 && (
                <div className="text-center py-6 border border-dashed rounded bg-gray-50 text-gray-400 text-sm">
                    No parents added yet. Click "Add Parent" to begin.
                </div>
            )}
        </CardContent>
    </Card>
  );
}
