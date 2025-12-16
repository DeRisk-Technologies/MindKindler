import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export async function seedDatabase() {
    console.log("Starting seed...");

    try {
        // Students
        const student1 = await addDoc(collection(db, "students"), {
            firstName: "John",
            lastName: "Doe",
            dateOfBirth: "2013-05-15",
            gender: "male",
            schoolId: "sch_1",
            districtId: "dst_1",
            diagnosisCategory: ["ADHD", "Dyslexia"],
            createdAt: serverTimestamp()
        });

        // Schools
        await addDoc(collection(db, "schools"), {
            name: "Springfield Elementary",
            district: "District 9",
            level: "Primary",
            address: "123 School Ln",
            createdAt: serverTimestamp()
        });

        // Users (Parent)
        await addDoc(collection(db, "users"), {
            uid: "p1",
            email: "parent@example.com",
            role: "parent",
            displayName: "Jane Doe",
            createdAt: serverTimestamp()
        });
        
        console.log("Seed complete.");
    } catch (error) {
        console.error("Error seeding database:", error);
        throw error;
    }
}
