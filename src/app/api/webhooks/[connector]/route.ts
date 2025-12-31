import { NextRequest, NextResponse } from "next/server";
// import { runSync } from "@/integrations/framework/syncEngine"; 

export async function POST(req: NextRequest, { params }: { params: Promise<{ connector: string }> }) {
    const { connector } = await params;
    console.log(`[Webhook] Received event for ${connector}`);
    
    // Trigger Sync
    // In real app: Validate signature, parse payload
    // await runSync(params.connector, ['students'], 'incremental');

    return NextResponse.json({ status: "received" });
}
