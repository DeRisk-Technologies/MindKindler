import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { TrainingData } from "@/types/schema";

/**
 * Saves anonymized session data for future model fine-tuning or RAG.
 * 
 * @param data - The training data to save.
 */
export async function saveTrainingData(data: Omit<TrainingData, 'id'>) {
  try {
    const docRef = await addDoc(collection(db, "trainingData"), {
      ...data,
      createdAt: serverTimestamp(),
    });
    console.log("Training data saved with ID: ", docRef.id);
    return docRef.id;
  } catch (e) {
    console.error("Error adding training data: ", e);
    throw e;
  }
}

/**
 * Anonymizes a report text by removing potential PII (basic implementation).
 * In a real-world scenario, use a dedicated NLP model for this.
 */
export function anonymizeReport(text: string): string {
  // Simple regex to remove names (capitalized words not at start of sentence - very basic)
  // This is a placeholder. Real anonymization requires robust entity recognition.
  return text.replace(/\b[A-Z][a-z]*\b/g, "[ANONYMIZED]");
}
