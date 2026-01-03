// src/services/student360-service.ts
import { 
  StudentRecord, 
  ParentRecord, 
  VerificationTask, 
  ProvenanceMetadata,
  ProvenanceField
} from '@/types/schema';
import { db } from '@/lib/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs, 
  runTransaction,
  serverTimestamp,
  addDoc
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';

export class Student360Service {
  private static STUDENT_COLLECTION = 'students';
  private static PARENT_COLLECTION = 'family_members'; // Subcollection
  private static TASK_COLLECTION = 'verification_tasks'; // Subcollection

  /**
   * Securely fetch student data via Cloud Function to ensure redaction.
   */
  static async getStudent(studentId: string, reason?: string): Promise<StudentRecord> {
      const functions = getFunctions();
      const getStudent360 = httpsCallable(functions, 'getStudent360');
      
      try {
          const result = await getStudent360({ studentId, reason });
          return result.data as StudentRecord;
      } catch (error) {
          console.error("Failed to fetch secure student record:", error);
          throw error;
      }
  }

  /**
   * Create a Student and associated Parents in a single atomic transaction.
   */
  static async createStudentWithParents(
    tenantId: string,
    studentData: Omit<StudentRecord, 'id' | 'meta' | 'tenantId'>,
    parentsData: Omit<ParentRecord, 'id' | 'tenantId'>[],
    createdBy: string
  ): Promise<string> {
    const studentId = crypto.randomUUID();
    const studentRef = doc(db, this.STUDENT_COLLECTION, studentId);
    
    // Calculate initial scores
    const trustScore = this.calculateTrustScore(studentData);
    
    const now = new Date().toISOString();

    const studentRecord: StudentRecord = {
      ...studentData,
      id: studentId,
      tenantId,
      meta: {
        createdAt: now,
        createdBy,
        updatedAt: now,
        updatedBy: createdBy,
        trustScore,
        completenessScore: 0, // Todo: Implement completeness logic
        privacyLevel: 'standard'
      }
    };

    await runTransaction(db, async (transaction) => {
      // 1. Create Student
      transaction.set(studentRef, studentRecord);

      // 2. Create Parents (as subcollection)
      for (const parent of parentsData) {
        const parentId = crypto.randomUUID();
        const parentRef = doc(db, this.STUDENT_COLLECTION, studentId, this.PARENT_COLLECTION, parentId);
        
        const parentRecord: ParentRecord = {
          ...parent,
          id: parentId,
          tenantId,
        };
        
        transaction.set(parentRef, parentRecord);
      }

      // 3. Generate Initial Verification Tasks
      const tasks = this.generateInitialVerificationTasks(studentId, studentRecord, parentsData);
      for (const task of tasks) {
        const taskRef = doc(collection(db, this.STUDENT_COLLECTION, studentId, this.TASK_COLLECTION));
        transaction.set(taskRef, task);
      }
    });

    return studentId;
  }

  /**
   * Updates a specific field's verification status and logs provenance.
   */
  static async verifyField(
    studentId: string, 
    fieldPath: string, 
    verifierId: string,
    evidenceRef?: string
  ): Promise<void> {
    const studentRef = doc(db, this.STUDENT_COLLECTION, studentId);
    
    await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(studentRef);
      if (!snapshot.exists()) throw new Error("Student not found");
      
      const data = snapshot.data() as StudentRecord;
      
      // Update the specific field's metadata
      // Note: Deep updates in Firestore require dot notation string keys if using update(),
      // but in a transaction we read, modify object, and set back.
      
      // Helper to traverse path and update
      // Logic simplified for brevity; real impl needs to handle nested paths like 'identity.dateOfBirth'
      const parts = fieldPath.split('.');
      let current: any = data;
      for (let i = 0; i < parts.length - 1; i++) {
        current = current[parts[i]];
      }
      
      const field = current[parts[parts.length - 1]];
      if (field && field.metadata) {
        field.metadata.verified = true;
        field.metadata.verifiedBy = verifierId;
        field.metadata.verifiedAt = new Date().toISOString();
        if (evidenceRef) field.metadata.sourceId = evidenceRef; // Or add to a separate evidence list
      }

      // Recalculate trust score
      data.meta.trustScore = this.calculateTrustScore(data);
      data.meta.updatedAt = new Date().toISOString();
      data.meta.updatedBy = verifierId;

      transaction.set(studentRef, data);
    });
  }

  /**
   * Calculate a Trust Score (0-100) based on verified critical fields.
   */
  private static calculateTrustScore(student: Partial<StudentRecord>): number {
    let score = 0;
    let totalWeight = 0;

    const checkField = (field: ProvenanceField<any> | undefined, weight: number) => {
      totalWeight += weight;
      if (field?.metadata?.verified) {
        score += weight;
      } else if (field?.metadata?.confidence && field.metadata.confidence > 0.8) {
        // Give partial credit for high-confidence AI/OCR
        score += weight * 0.5;
      }
    };

    // Identity (High weight)
    checkField(student.identity?.firstName, 10);
    checkField(student.identity?.lastName, 10);
    checkField(student.identity?.dateOfBirth, 20);
    checkField(student.identity?.nationalId, 20);

    // Education (Medium)
    checkField(student.education?.currentSchoolId, 15);

    // Normalize
    if (totalWeight === 0) return 0;
    return Math.round((score / totalWeight) * 100);
  }

  /**
   * Generates a list of tasks for unverified critical fields.
   */
  private static generateInitialVerificationTasks(
    studentId: string, 
    student: StudentRecord,
    parents: Omit<ParentRecord, 'id' | 'tenantId'>[]
  ): VerificationTask[] {
    const tasks: VerificationTask[] = [];
    const now = new Date().toISOString();

    // Check DOB
    if (!student.identity.dateOfBirth.metadata.verified) {
      tasks.push({
        id: crypto.randomUUID(),
        studentId,
        fieldPath: 'identity.dateOfBirth',
        description: 'Verify Date of Birth against Birth Certificate or Passport',
        status: 'pending',
        createdAt: now
      });
    }

    // Check Parents
    if (parents.length === 0) {
      tasks.push({
        id: crypto.randomUUID(),
        studentId,
        fieldPath: 'family.parents',
        description: 'Add at least one parent/guardian contact',
        status: 'pending',
        createdAt: now
      });
    } else {
        // Check if any parent has PR
        const hasPr = parents.some(p => p.hasParentalResponsibility);
        if (!hasPr) {
             tasks.push({
                id: crypto.randomUUID(),
                studentId,
                fieldPath: 'family.parents.pr',
                description: 'Confirm which parent has Parental Responsibility',
                status: 'pending',
                createdAt: now
            });
        }
    }

    return tasks;
  }
}
