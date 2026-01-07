// src/components/ui/dynamic-form-field.tsx

import React, { useState } from 'react';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Eye, EyeOff } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { SchemaExtensionField } from "@/marketplace/types";

interface Props {
    field: SchemaExtensionField;
    control: any;
    baseName?: string; // Prefix for nested forms e.g. "extensions"
}

export function DynamicFormField({ field, control, baseName = "extensions" }: Props) {
    const name = `${baseName}.${field.fieldName}`;
    const [revealed, setRevealed] = useState(false);

    return (
        <FormField
            control={control}
            name={name}
            render={({ field: formField }) => (
                <FormItem className="flex flex-col">
                    <FormLabel>{field.label} {field.required && <span className="text-red-500">*</span>}</FormLabel>
                    
                    <FormControl>
                        {/* 1. String Input (Text) */}
                        {field.type === 'string' && (
                            <div className="relative">
                                <Input 
                                    {...formField} 
                                    type={field.encrypt && !revealed ? "password" : "text"} 
                                    placeholder={field.description} 
                                />
                                {field.encrypt && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                        onClick={() => setRevealed(!revealed)}
                                    >
                                        {revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                )}
                            </div>
                        )}

                        {/* 2. Number Input */}
                        {field.type === 'number' && (
                            <Input {...formField} type="number" onChange={e => formField.onChange(Number(e.target.value))} />
                        )}

                        {/* 3. Boolean (Checkbox) */}
                        {field.type === 'boolean' && (
                            <div className="flex items-center space-x-2 pt-2">
                                <Checkbox 
                                    checked={formField.value} 
                                    onCheckedChange={formField.onChange} 
                                />
                                <span className="text-sm text-muted-foreground">{field.description || "Yes / No"}</span>
                            </div>
                        )}

                        {/* 4. Enum (Select) */}
                        {field.type === 'enum' && (
                            <Select onValueChange={formField.onChange} defaultValue={formField.value}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {field.options?.map(opt => (
                                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}

                        {/* 5. Date Picker */}
                        {field.type === 'date' && (
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full pl-3 text-left font-normal",
                                            !formField.value && "text-muted-foreground"
                                        )}
                                    >
                                        {formField.value ? (
                                            format(new Date(formField.value), "PPP")
                                        ) : (
                                            <span>Pick a date</span>
                                        )}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={formField.value ? new Date(formField.value) : undefined}
                                        onSelect={formField.onChange}
                                        disabled={(date) =>
                                            date > new Date() || date < new Date("1900-01-01")
                                        }
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        )}
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
    );
}
