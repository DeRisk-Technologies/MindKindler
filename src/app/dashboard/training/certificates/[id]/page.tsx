"use client";

import { useFirestoreDocument } from "@/hooks/use-firestore";
import { Certificate } from "@/types/schema";
import { Button } from "@/components/ui/button";
import { Printer, Download, ArrowLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

export default function CertificateViewPage() {
    const { id } = useParams() as { id: string };
    const router = useRouter();
    const { data: cert, loading } = useFirestoreDocument<Certificate>("certificates", id);

    if (loading || !cert) return <div>Loading...</div>;

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            <div className="flex justify-between items-center print:hidden">
                <Button variant="ghost" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4"/> Back</Button>
                <Button onClick={handlePrint}><Printer className="mr-2 h-4 w-4"/> Print Certificate</Button>
            </div>

            <div className="border-8 border-double border-slate-800 p-12 text-center bg-white shadow-lg space-y-8">
                <h1 className="text-4xl font-serif font-bold text-slate-900 uppercase tracking-widest">Certificate of Completion</h1>
                
                <p className="text-lg text-slate-600">This certifies that</p>
                <h2 className="text-3xl font-bold text-indigo-700 underline decoration-dotted underline-offset-8">User {cert.userId.substring(0,8)}...</h2>
                
                <p className="text-lg text-slate-600">has successfully completed the training module</p>
                <h3 className="text-2xl font-semibold italic">"{cert.title.replace('Certificate of Completion: ', '')}"</h3>
                
                <div className="flex justify-center gap-12 pt-8">
                    <div className="text-left">
                        <p className="text-xs uppercase text-slate-400 font-bold">Issued Date</p>
                        <p className="font-mono">{new Date(cert.issuedAt).toLocaleDateString()}</p>
                    </div>
                    <div className="text-left">
                        <p className="text-xs uppercase text-slate-400 font-bold">CPD Hours</p>
                        <p className="font-mono">{cert.hoursAwarded} Hour(s)</p>
                    </div>
                    <div className="text-left">
                        <p className="text-xs uppercase text-slate-400 font-bold">Verification Code</p>
                        <p className="font-mono">{cert.verificationCode}</p>
                    </div>
                </div>

                <div className="pt-12 mt-12 border-t flex justify-between items-end">
                    <div className="text-left">
                        <p className="font-bold text-lg font-serif">MindKindler Platform</p>
                        <p className="text-xs text-slate-500">Authorized Training Provider</p>
                    </div>
                    <div className="h-16 w-16 bg-slate-900 rounded-full flex items-center justify-center text-white font-bold text-xs">
                        SEAL
                    </div>
                </div>
            </div>
        </div>
    );
}
