"use server";

import { adminAuth, adminDb } from '@/lib/firebase-admin';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-01-27.acacia',
});

export interface CreateItemPayload {
    title: string;
    description: string;
    price: number;
    currency: string;
    category: string;
    capabilitiesJSON: string; // The raw JSON config
}

export async function createMarketplaceItem(payload: CreateItemPayload, idToken: string) {
    // 1. Verify Auth (Must be SuperAdmin or Partner)
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    // In production, check decodedToken.role === 'admin' or similar
    
    try {
        console.log(`[Publisher] Creating Item: ${payload.title} for ${payload.price} ${payload.currency}`);

        // 2. Create Stripe Product & Price
        const product = await stripe.products.create({
            name: payload.title,
            description: payload.description,
        });

        const price = await stripe.prices.create({
            product: product.id,
            unit_amount: Math.round(payload.price * 100), // Convert to cents
            currency: payload.currency.toLowerCase(),
            recurring: { interval: 'month' }, // Defaulting to subscription for OS modules
        });

        // 3. Store in Firestore (Regional or Global? Ideally Global for Marketplace)
        // We'll write to the 'mindkindler-uk' shard for this pilot context, or global if architected that way.
        // Assuming Regional for now based on your setup.
        const itemId = product.id; // Use Stripe Product ID as Doc ID for easy mapping
        
        await adminDb.collection('marketplace_items').doc(itemId).set({
            id: itemId,
            title: payload.title,
            description: payload.description,
            price: payload.price,
            stripePriceId: price.id, // AUTO-GENERATED
            stripeProductId: product.id,
            currency: payload.currency,
            version: "1.0.0",
            publisher: "MindKindler Core", // Or dynamic based on user
            regionTags: ["UK"],
            capabilities: JSON.parse(payload.capabilitiesJSON),
            releaseDate: new Date().toISOString()
        });

        return { success: true, itemId };

    } catch (error: any) {
        console.error("Publisher Error:", error);
        return { success: false, error: error.message };
    }
}
