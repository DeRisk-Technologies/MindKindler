# Required Environment Variables for MindKindler (CareOS)

## Firebase Configuration (Client)
# Used in src/lib/firebase.ts
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=mindkindler-84fcf.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=mindkindler-84fcf
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=mindkindler-84fcf.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=1:574...

## Google Cloud / Genkit (Server/Functions)
# Used in functions/src/index.ts and src/ai/config.ts
GCLOUD_PROJECT=mindkindler-84fcf
GCLOUD_LOCATION=europe-west3
VERTEX_AI_PROJECT_ID=mindkindler-84fcf # Ensure Vertex AI API is enabled

## Genkit Model Configuration
# Used in src/ai/genkit.ts
GOOGLE_GENAI_API_KEY=... # Optional if using Vertex AI default credentials

## Stripe Integration (Optional for Pilot)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

## Misc
NODE_ENV=production
