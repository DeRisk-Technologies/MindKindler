import { db } from "@/lib/firebase";
import { collection, addDoc, doc, setDoc, writeBatch, Timestamp } from "firebase/firestore";
import { faker } from "@faker-js/faker";

// Helper to generate a random ID
const randomId = () => Math.random().toString(36).substring(2, 15);

// 1. Generate Users (EPPs, Doctors, Teachers, Admins, HR)
const roles = ['EducationalPsychologist', 'Teacher', 'Admin', 'HR', 'ClinicalPsychologist'];
const users = Array.from({ length: 15 }).map((_, i) => {
  const role = i === 0 ? 'Admin' : i === 1 ? 'HR' : roles[Math.floor(Math.random() * roles.length)];
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  
  // FIX: Explicitly handle undefined. Firestore doesn't like 'undefined' values.
  // If it's undefined, we either omit the key or send null.
  // Here we construct the object carefully.
  const user: any = {
    uid: `user_${randomId()}`, 
    email: faker.internet.email({ firstName, lastName }),
    displayName: `${firstName} ${lastName}`,
    role: role.toLowerCase(),
    createdAt: new Date().toISOString(),
  };

  // Only add title if it's defined (e.g. for Dr.)
  if (role === 'EducationalPsychologist') {
    user.title = 'Dr.';
  } else {
    user.title = null; // Or just don't set it. sending null is safer than undefined if you want to clear it
  }

  return user;
});

// 2. Generate Students
const students = Array.from({ length: 30 }).map(() => ({
  id: `student_${randomId()}`,
  firstName: faker.person.firstName(),
  lastName: faker.person.lastName(),
  dateOfBirth: faker.date.birthdate({ min: 5, max: 16, mode: 'age' }).toISOString(),
  gender: faker.person.sex(),
  schoolId: `school_${Math.floor(Math.random() * 5)}`,
  districtId: 'district_Lagos_Central',
  diagnosisCategory: faker.helpers.arrayElements(['Dyslexia', 'ADHD', 'Autism', 'Dyscalculia', 'Processing Disorder'], { min: 0, max: 2 }),
  notes: faker.lorem.sentence(),
}));

// 3. Generate Cases (Linked to Students)
const cases = students.slice(0, 15).map((student) => ({
  id: `case_${randomId()}`,
  studentId: student.id,
  studentName: `${student.firstName} ${student.lastName}`,
  title: `Assessment for ${student.firstName}`,
  status: faker.helpers.arrayElement(['Open', 'In Review', 'Closed']),
  priority: faker.helpers.arrayElement(['High', 'Medium', 'Low']),
  assignedTo: users.find(u => u.role === 'educationalpsychologist')?.uid || 'user_1',
  openedAt: faker.date.recent({ days: 60 }).toISOString(),
  description: faker.lorem.paragraph(),
}));

// 4. Generate Assessments
const assessments = cases.map((c) => ({
  id: `assessment_${randomId()}`,
  caseId: c.id,
  studentId: c.studentId,
  type: faker.helpers.arrayElement(['WISC-V', 'WIAT-III', 'Conners-3', 'Vineland-3']),
  date: faker.date.recent({ days: 30 }).toISOString(),
  score: Math.floor(Math.random() * 60) + 70, // Mock score
  status: 'completed',
  notes: faker.lorem.paragraph(),
}));

// 5. Generate Appointments
const appointments = Array.from({ length: 20 }).map(() => {
  const student = faker.helpers.arrayElement(students);
  return {
    id: `apt_${randomId()}`,
    studentName: `${student.firstName} ${student.lastName}`,
    studentId: student.id,
    type: faker.helpers.arrayElement(['assessment', 'counseling', 'follow-up']),
    date: faker.date.future({ years: 0.1 }).toISOString(), // Store as string for easy serialization, convert to Date in app
    time: `${faker.number.int({ min: 9, max: 16 }).toString().padStart(2, '0')}:00`,
    status: 'upcoming',
    providerId: users.find(u => u.role === 'educationalpsychologist')?.uid || 'user_1',
  };
});

// 6. Generate Reports
const reports = cases.filter(c => c.status === 'Closed' || c.status === 'In Review').map((c) => ({
  id: `report_${randomId()}`,
  caseId: c.id,
  studentId: c.studentId,
  title: `Psycho-Educational Report - ${c.studentName}`,
  generatedContent: faker.lorem.paragraphs(3),
  finalContent: faker.lorem.paragraphs(3),
  createdAt: faker.date.recent({ days: 10 }).toISOString(),
  status: 'Draft',
}));


export async function seedDatabase() {
  const batch = writeBatch(db);

  // Users (using setDoc to define ID)
  users.forEach((user) => {
    const ref = doc(db, "users", user.uid);
    batch.set(ref, user);
  });

  // Students
  students.forEach((data) => {
    const ref = doc(db, "students", data.id);
    batch.set(ref, data);
  });

  // Cases
  cases.forEach((data) => {
    const ref = doc(db, "cases", data.id);
    batch.set(ref, data);
  });

  // Assessments
  assessments.forEach((data) => {
    const ref = doc(db, "assessments", data.id);
    batch.set(ref, data);
  });

   // Appointments
   appointments.forEach((data) => {
    const ref = doc(db, "appointments", data.id);
    batch.set(ref, data);
  });

  // Reports
  reports.forEach((data) => {
    const ref = doc(db, "reports", data.id);
    batch.set(ref, data);
  });

  await batch.commit();
  console.log("Database seeded successfully!");
}
