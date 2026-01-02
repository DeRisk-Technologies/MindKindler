import { Suspense } from 'react';
import AssessmentBuilderPageContent from './content';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

function BuilderLoadingSkeleton() {
    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8 pb-20">
            <div className="flex items-center gap-4 mb-6">
                <Skeleton className="h-10 w-10" />
                <div>
                    <Skeleton className="h-8 w-48 mb-2" />
                    <Skeleton className="h-4 w-64" />
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>
                        <Skeleton className="h-6 w-40" />
                    </CardTitle>
                    <CardDescription>
                        <Skeleton className="h-4 w-56" />
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-20 w-full" />
                    </div>
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle>
                        <Skeleton className="h-6 w-32" />
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center h-24 border-2 border-dashed rounded-lg">
                        <p className="text-muted-foreground">Loading questions...</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}


export default function AssessmentBuilderPage() {
    return (
        <Suspense fallback={<BuilderLoadingSkeleton />}>
            <AssessmentBuilderPageContent />
        </Suspense>
    );
}