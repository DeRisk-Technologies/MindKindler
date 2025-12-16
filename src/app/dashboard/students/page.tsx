import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { PlusCircle, Search } from "lucide-react";

const students = [
  {
    name: "Leo Martinez",
    age: 8,
    grade: "3rd Grade",
    school: "Sunnyvale Elementary",
    caseStatus: "Active",
    avatarId: "student-1",
  },
  {
    name: "Sophia Chen",
    age: 10,
    grade: "5th Grade",
    school: "Oakwood Middle",
    caseStatus: "In Review",
    avatarId: "student-2",
  },
  {
    name: "Amelia Williams",
    age: 7,
    grade: "2nd Grade",
    school: "Sunnyvale Elementary",
    caseStatus: "Closed",
    avatarId: "student-3",
  },
  {
    name: "Noah Johnson",
    age: 14,
    grade: "9th Grade",
    school: "Northwood High",
    caseStatus: "Active",
    avatarId: "student-4",
  },
  {
    name: "Isabella Rodriguez",
    age: 9,
    grade: "4th Grade",
    school: "Oakwood Middle",
    caseStatus: "No Case",
    avatarId: "student-5",
  },
  {
    name: "Mason Garcia",
    age: 16,
    grade: "11th Grade",
    school: "Northwood High",
    caseStatus: "No Case",
    avatarId: "student-6",
  },
];

export default function StudentsPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Students</h1>
          <p className="text-muted-foreground">
            Manage student records and view case histories.
          </p>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          <div className="relative w-full md:w-auto">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search students..."
              className="w-full bg-background pl-8 md:w-[200px] lg:w-[300px]"
            />
          </div>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Student
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {students.map((student, index) => {
          const avatar = PlaceHolderImages.find(
            (img) => img.id === student.avatarId
          );
          return (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    {avatar && (
                      <AvatarImage
                        src={avatar.imageUrl}
                        alt={student.name}
                        data-ai-hint={avatar.imageHint}
                      />
                    )}
                    <AvatarFallback>
                      {student.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-xl">{student.name}</CardTitle>
                    <CardDescription>
                      {student.age} years old • {student.grade}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {student.school}
                </p>
                <p className="text-sm">
                  Case Status:{" "}
                  <span
                    className={
                      student.caseStatus === "Active"
                        ? "font-semibold text-destructive"
                        : student.caseStatus === "In Review"
                        ? "font-semibold text-amber-600"
                        : ""
                    }
                  >
                    {student.caseStatus}
                  </span>
                </p>
              </CardContent>
              <CardFooter>
                <Button className="w-full">View Profile</Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
