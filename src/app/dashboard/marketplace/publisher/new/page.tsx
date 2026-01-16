"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createMarketplaceItem } from '@/app/actions/marketplace-publisher';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, CheckCircle, AlertTriangle } from 'lucide-react';

export default function NewProductPage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '49.99',
        currency: 'GBP',
        category: 'module',
        capabilitiesJSON: JSON.stringify({
            featureFlags: [{ key: "enable_new_feature", label: "New Feature" }]
        }, null, 2)
    });

    const handleSubmit = async () => {
        if (!user) return;
        setLoading(true);
        
        try {
            // Get ID token for server validation
            const token = await user.getIdToken();
            
            const result = await createMarketplaceItem({
                title: formData.title,
                description: formData.description,
                price: parseFloat(formData.price),
                currency: formData.currency,
                category: formData.category,
                capabilitiesJSON: formData.capabilitiesJSON
            }, token);

            if (result.success) {
                setSuccess(true);
            } else {
                alert("Error: " + result.error);
            }
        } catch (e) {
            console.error(e);
            alert("Failed to create product");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <CheckCircle className="w-16 h-16 text-green-500" />
                <h1 className="text-2xl font-bold">Product Published!</h1>
                <p className="text-gray-500">It is now live in the Marketplace and synced with Stripe.</p>
                <Button onClick={() => setSuccess(false)}>Create Another</Button>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto py-12 px-4">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Publisher Studio</h1>
                <p className="text-gray-500">Create new Marketplace Items and sync them to Stripe automatically.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Product Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Product Title</label>
                            <Input 
                                value={formData.title}
                                onChange={(e) => setFormData({...formData, title: e.target.value})}
                                placeholder="e.g. Advanced Anxiety Pack"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Category</label>
                            <Input 
                                value={formData.category}
                                onChange={(e) => setFormData({...formData, category: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Description</label>
                        <Textarea 
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                            placeholder="What does this pack do?"
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Price</label>
                            <Input 
                                type="number"
                                value={formData.price}
                                onChange={(e) => setFormData({...formData, price: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Currency</label>
                            <Input 
                                value={formData.currency}
                                onChange={(e) => setFormData({...formData, currency: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Configuration (JSON)</label>
                        <div className="text-xs text-amber-600 mb-1 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Defines what features this pack unlocks.
                        </div>
                        <Textarea 
                            className="font-mono text-xs min-h-[200px]"
                            value={formData.capabilitiesJSON}
                            onChange={(e) => setFormData({...formData, capabilitiesJSON: e.target.value})}
                        />
                    </div>

                    <Button onClick={handleSubmit} disabled={loading} className="w-full">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Publish & Sync to Stripe
                    </Button>

                </CardContent>
            </Card>
        </div>
    );
}
