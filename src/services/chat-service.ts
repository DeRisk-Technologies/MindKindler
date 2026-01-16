import { 
    collection, 
    query, 
    where, 
    orderBy, 
    limit, 
    onSnapshot, 
    addDoc, 
    updateDoc, 
    serverTimestamp, 
    doc, 
    getDoc,
    Timestamp,
    setDoc
} from "firebase/firestore";
import { getRegionalDb } from "@/lib/firebase";
import { ChatChannel, ChatMessage, ChatParticipant } from "@/types/chat";

/**
 * Service for handling Secure Regional Chat.
 * Ensures all data reads/writes happen on the correct Regional Shard (e.g., mindkindler-uk).
 */
export class ChatService {
    private region: string;
    private tenantId: string;
    private db;

    constructor(region: string, tenantId: string) {
        this.region = region;
        this.tenantId = tenantId;
        this.db = getRegionalDb(region);
    }

    /**
     * Subscribes to the list of chat channels for a user.
     * Orders by most recently updated.
     */
    subscribeToChannels(userId: string, callback: (channels: ChatChannel[]) => void) {
        const channelsRef = collection(this.db, "chat_channels");
        const q = query(
            channelsRef,
            where("tenantId", "==", this.tenantId),
            where("participantIds", "array-contains", userId),
            orderBy("updatedAt", "desc")
        );

        return onSnapshot(q, (snapshot) => {
            const channels = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as ChatChannel));
            callback(channels);
        });
    }

    /**
     * Subscribes to messages within a specific channel.
     */
    subscribeToMessages(channelId: string, callback: (messages: ChatMessage[]) => void) {
        const messagesRef = collection(this.db, "chat_channels", channelId, "messages");
        const q = query(
            messagesRef,
            orderBy("createdAt", "asc")
        );

        return onSnapshot(q, (snapshot) => {
            const messages = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as ChatMessage));
            callback(messages);
        });
    }

    /**
     * Creates a new Direct Message channel or returns existing one if found.
     */
    async getOrCreateDirectMessage(currentUserId: string, otherUserId: string, participantsMap: Record<string, ChatParticipant>): Promise<string> {
        // 1. Check if DM already exists
        // Note: Firestore doesn't support array-contains-any for exact match of [A, B].
        // We will query for channels involving current user and filter client-side or use a composite ID.
        // For simplicity/scalability, we'll try a composite ID strategy: `dm_${sortedIds}`
        
        const sortedIds = [currentUserId, otherUserId].sort().join("_");
        const channelId = `dm_${sortedIds}`;
        const channelRef = doc(this.db, "chat_channels", channelId);
        
        const channelSnap = await getDoc(channelRef);

        if (channelSnap.exists()) {
            return channelSnap.id;
        }

        // 2. Create new DM Channel
        const newChannel: Omit<ChatChannel, 'id'> = {
            tenantId: this.tenantId,
            type: 'direct_message',
            participantIds: [currentUserId, otherUserId],
            participants: participantsMap,
            lastMessage: null,
            createdAt: serverTimestamp() as Timestamp,
            updatedAt: serverTimestamp() as Timestamp
        };

        await setDoc(channelRef, newChannel);
        return channelId;
    }

    /**
     * Creates a Case Room (Group Chat linked to a Case).
     */
    async createCaseRoom(caseId: string, caseName: string, studentId: string, participantsMap: Record<string, ChatParticipant>): Promise<string> {
        const channelsRef = collection(this.db, "chat_channels");
        const participantIds = Object.keys(participantsMap);

        const newChannel: Omit<ChatChannel, 'id'> = {
            tenantId: this.tenantId,
            type: 'case_room',
            caseId,
            studentId,
            displayName: `Case: ${caseName}`,
            participantIds,
            participants: participantsMap,
            lastMessage: null,
            createdAt: serverTimestamp() as Timestamp,
            updatedAt: serverTimestamp() as Timestamp
        };

        const docRef = await addDoc(channelsRef, newChannel);
        return docRef.id;
    }

    /**
     * Sends a message to a channel.
     */
    async sendMessage(channelId: string, senderId: string, content: string): Promise<string> {
        const messagesRef = collection(this.db, "chat_channels", channelId, "messages");
        const channelRef = doc(this.db, "chat_channels", channelId);

        const newMessage: Omit<ChatMessage, 'id'> = {
            channelId,
            senderId,
            content,
            createdAt: serverTimestamp() as Timestamp,
            readBy: { [senderId]: serverTimestamp() as Timestamp },
            guardian: {
                status: 'pending', // Trigger Cloud Function
                scanTimestamp: serverTimestamp() as Timestamp
            }
        };

        // 1. Add Message
        const msgDoc = await addDoc(messagesRef, newMessage);

        // 2. Update Channel "Last Message"
        await updateDoc(channelRef, {
            lastMessage: {
                content: content.substring(0, 50) + (content.length > 50 ? "..." : ""),
                senderId,
                createdAt: serverTimestamp(),
                isRedacted: false
            },
            updatedAt: serverTimestamp()
        });

        return msgDoc.id;
    }

    /**
     * Marks a message as read by the current user.
     */
    async markAsRead(channelId: string, messageId: string, userId: string) {
        const messageRef = doc(this.db, "chat_channels", channelId, "messages", messageId);
        await updateDoc(messageRef, {
            [`readBy.${userId}`]: serverTimestamp()
        });
    }
}
