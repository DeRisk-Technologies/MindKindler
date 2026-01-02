// src/services/upload-service.ts

import { db, storage } from "@/lib/firebase";
import { collection, doc, setDoc, addDoc, getDocs, query, where, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export const UploadService = {
    async uploadFile(tenantId: string, file: File, metadata: any): Promise<string> {
        // 1. Calculate Hash (Dedupe check)
        const hash = await this.calculateHash(file);
        
        // 2. Check Dedupe (Simple query)
        // In production, this might be a cloud function to check cross-tenant or secure hashes
        const dupCheck = query(
            collection(db, `tenants/${tenantId}/documents`), 
            where('hash', '==', hash),
            where('status', '!=', 'error')
        );
        const dupSnap = await getDocs(dupCheck);
        if (!dupSnap.empty) {
            throw new Error(`Duplicate file detected (ID: ${dupSnap.docs[0].id})`);
        }

        // 3. Compress if Image (Mobile Optimization)
        let fileToUpload = file;
        if (file.type.startsWith('image/')) {
            fileToUpload = await this.compressImage(file);
        }

        // 4. Upload to Storage
        const storageRef = ref(storage, `tenants/${tenantId}/uploads/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(storageRef, fileToUpload);
        const url = await getDownloadURL(snapshot.ref);

        // 5. Create Document Record
        const docRef = doc(collection(db, `tenants/${tenantId}/documents`));
        await setDoc(docRef, {
            id: docRef.id,
            tenantId,
            fileName: file.name,
            fileUrl: url,
            storagePath: snapshot.ref.fullPath,
            hash,
            mimeType: file.type,
            sizeBytes: file.size,
            uploadedBy: metadata.uploadedBy,
            uploadedAt: serverTimestamp(),
            status: 'uploading', // Triggers processing function
            category: metadata.category,
            studentId: metadata.studentId || null,
            metadata: { ...metadata, compressed: file !== fileToUpload }
        });

        return docRef.id;
    },

    async uploadBulkJob(tenantId: string, manifest: any[], userId: string): Promise<string> {
        // Create Job Container
        const jobRef = await addDoc(collection(db, `tenants/${tenantId}/assistant_upload_jobs`), {
            status: 'uploading',
            totalFiles: manifest.length,
            processedFiles: 0,
            createdBy: userId,
            createdAt: serverTimestamp()
        });

        // In real impl, we'd loop uploadFile here or delegate to a worker.
        // For prototype, we'll assume the UI calls uploadFile per item and links jobId.
        return jobRef.id;
    },

    async calculateHash(file: File): Promise<string> {
        const buffer = await file.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    },

    async compressImage(file: File): Promise<File> {
        // Simple canvas resize mock for prototype
        // In production, use 'browser-image-compression'
        return file; 
    }
};
