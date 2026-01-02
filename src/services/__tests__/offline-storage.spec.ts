// src/services/__tests__/offline-storage.spec.ts

import { offlineStorage } from "../offline-storage";

// Mock localforage
jest.mock("localforage", () => ({
    config: jest.fn(),
    setItem: jest.fn().mockResolvedValue(true),
    getItem: jest.fn().mockResolvedValue({ timestamp: 12345, data: "test-data" })
}));

describe('Offline Storage', () => {
    test('setItem wraps data with timestamp', async () => {
        const spy = require("localforage").setItem;
        await offlineStorage.setItem("key", "val");
        expect(spy).toHaveBeenCalledWith("key", expect.objectContaining({ data: "val" }));
    });

    test('getItem unwraps data', async () => {
        const val = await offlineStorage.getItem("key");
        expect(val).toBe("test-data");
    });
});
