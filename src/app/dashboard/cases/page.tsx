import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MoreHorizontal, PlusCircle, Search } from "lucide-react";

const cases = [
  {
    id: "CASE-001",
    student: "Leo Martinez",
    assignedTo: "Dr. Evelyn Reed",
    status: "Open",
    priority: "High",
    dateOpened: "2023-06-23",
  },
  {
    id: "CASE-002",
    student: "Sophia Chen",
    assignedTo: "Dr. Ben Carter",
    status: "In Review",
    priority: "Medium",
    dateOpened: "2023-06-21",
  },
  {
    id: "CASE-003",
    student: "Amelia Williams",
    assignedTo: "Dr. Evelyn Reed",
    status: "Closed",
    priority: "Low",
    dateOpened: "2023-06-18",
  },
  {
    id: "CASE-004",
    student: "Noah Johnson",
    assignedTo: "Dr. Evelyn Reed",
    status: "Open",
    priority: "High",
    dateOpened: "2023-06-15",
  },
  {
    id: "CASE-005",
    student: "Liam Brown",
    assignedTo: "Dr. Chloe Davis",
    status: "Pending",
    priority: "Medium",
    dateOpened: "2023-06-12",
  },
  {
    id: "CASE-006",
    student: "Olivia Miller",
    assignedTo: "Dr. Ben Carter",
    status: "Closed",
    priority: "Low",
    dateOpened: "2023-06-10",
  },
];

const getPriorityBadgeVariant = (priority: string) => {
  switch (priority.toLowerCase()) {
    case "high":
      return "destructive";
    case "medium":
      return "secondary";
    case "low":
    default:
      return "outline";
  }
};

const getStatusBadgeVariant = (status: string) => {
  switch (status.toLowerCase()) {
    case "open":
      return "default";
    case "in review":
      return "outline";
    case "pending":
      return "secondary";
    case "closed":
      return "secondary";
    default:
      return "outline";
  }
};

export default function CasesPage() {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <CardTitle>Case Management</CardTitle>
            <CardDescription>
              View, manage, and track all student cases.
            </CardDescription>
          </div>
          <div className="flex flex-shrink-0 items-center gap-2">
            <div className="relative w-full md:w-auto">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search cases..."
                className="w-full bg-background pl-8 md:w-[200px] lg:w-[300px]"
              />
            </div>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> New Case
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Case ID</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Date Opened</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cases.map((caseItem) => (
              <TableRow key={caseItem.id}>
                <TableCell className="font-medium">{caseItem.id}</TableCell>
                <TableCell>{caseItem.student}</TableCell>
                <TableCell>{caseItem.assignedTo}</TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(caseItem.status)}>
                    {caseItem.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={getPriorityBadgeVariant(caseItem.priority)}>
                    {caseItem.priority}
                  </Badge>
                </TableCell>
                <TableCell>{caseItem.dateOpened}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Toggle menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem>View Details</DropdownMenuItem>
                      <DropdownMenuItem>Edit</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
