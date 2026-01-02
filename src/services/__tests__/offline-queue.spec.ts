// src/services/__tests__/offline-queue.spec.ts

const mockSetItem = jest.fn();
const mockKeys = jest.fn();
const mockGetItem = jest.fn();
const mockRemoveItem = jest.fn();

jest.mock("localforage", () => ({
    createInstance: () => ({
        setItem: mockSetItem,
        keys: mockKeys,
        getItem: mockGetItem,
        removeItem: mockRemoveItem
    })
}));

import { offlineQueue } from "../offline-queue";

// Mock Telemetry
jest.mock("../telemetry-service", () => ({
    trackEvent: jest.fn()
}));

// Mock Navigator
Object.defineProperty(global, 'navigator', {
    value: { onLine: true },
    writable: true
});

describe('Offline Queue', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Reset navigator online
        Object.defineProperty(global, 'navigator', { value: { onLine: true }, writable: true });
    });

    test('enqueue saves item to localforage', async () => {
        // We capture the id returned to check the call
        const id = await offlineQueue.enqueue('createCase', { id: 1 });
        expect(mockSetItem).toHaveBeenCalledWith(id, expect.objectContaining({ type: 'createCase' }));
    });

    test('processQueue processes items when online', async () => {
        // Setup mock data
        mockKeys.mockResolvedValue(['mutation-1']);
        mockGetItem.mockResolvedValue({ id: 'mutation-1', type: 'createCase', payload: { tenantId: 't1' }, retryCount: 0 });
        
        await offlineQueue.processQueue();

        // Should try to process and then remove
        expect(mockRemoveItem).toHaveBeenCalledWith('mutation-1');
    });

    test('processQueue skips when offline', async () => {
        Object.defineProperty(global, 'navigator', { value: { onLine: false }, writable: true });
        await offlineQueue.processQueue();
        expect(mockKeys).not.toHaveBeenCalled();
    });
});
