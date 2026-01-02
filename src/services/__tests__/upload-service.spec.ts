// src/services/__tests__/upload-service.spec.ts

import { UploadService } from "../upload-service";

// Mock Firebase
jest.mock("@/lib/firebase", () => ({
    db: {},
    storage: {}
}));

jest.mock("firebase/storage", () => ({
    ref: jest.fn(),
    uploadBytes: jest.fn().mockResolvedValue({ ref: { fullPath: 'path/to/file' } }),
    getDownloadURL: jest.fn().mockResolvedValue('https://mock-url.com')
}));

const mockSetDoc = jest.fn();
const mockGetDocs = jest.fn();

jest.mock("firebase/firestore", () => ({
    collection: jest.fn(),
    doc: jest.fn().mockReturnValue({ id: 'doc_123' }),
    setDoc: (ref: any, data: any) => mockSetDoc(ref, data),
    addDoc: jest.fn().mockResolvedValue({ id: 'job_123' }),
    getDocs: () => mockGetDocs(),
    query: jest.fn(),
    where: jest.fn(),
    serverTimestamp: () => 'MOCK_TIME'
}));

describe("UploadService", () => {
    
    beforeEach(() => {
        jest.clearAllMocks();
        mockGetDocs.mockResolvedValue({ empty: true }); // Default no dupes
    });

    test("uploadFile creates document record with status uploading", async () => {
        const file = new File(["content"], "test.pdf", { type: "application/pdf" });
        
        // Mock Crypto for Hash
        Object.defineProperty(global, 'crypto', {
            value: {
                subtle: {
                    digest: jest.fn().mockResolvedValue(new ArrayBuffer(32))
                }
            }
        });

        const docId = await UploadService.uploadFile('tenant-1', file, { uploadedBy: 'user-1', category: 'report' });
        
        expect(docId).toBe('doc_123');
        expect(mockSetDoc).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({
                status: 'uploading',
                fileName: 'test.pdf',
                category: 'report'
            })
        );
    });

    test("uploadFile throws on duplicate hash", async () => {
        const file = new File(["content"], "test.pdf", { type: "application/pdf" });
        
        mockGetDocs.mockResolvedValue({ 
            empty: false, 
            docs: [{ id: 'existing_doc' }] 
        });

        await expect(UploadService.uploadFile('tenant-1', file, {}))
            .rejects.toThrow("Duplicate file detected");
    });
});
