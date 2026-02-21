import { Deadline, User } from "@/types";

export const mockUser: User = {
  name: "Surya",
  email: "surya@university.edu",
};

export const mockDeadlines: Deadline[] = [
  {
    id: "dl-001",
    subject: "Data Structures & Algorithms",
    title: "Binary Tree Assignment",
    description:
      "Implement AVL tree rotations and traversal algorithms. Include time complexity analysis for each operation. Submit as a Jupyter notebook with test cases.",
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    priority: "high",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "dl-002",
    subject: "Operating Systems",
    title: "Process Scheduling Simulation",
    description:
      "Build a simulator for Round Robin, SJF, and Priority scheduling algorithms. Compare their performance with Gantt charts and turnaround time analysis.",
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    priority: "medium",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "dl-003",
    subject: "Computer Networks",
    title: "TCP/IP Protocol Analysis Report",
    description:
      "Capture and analyze network packets using Wireshark. Document the TCP handshake process and identify at least 5 different protocols in the capture.",
    dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    priority: "high",
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "dl-004",
    subject: "Database Management Systems",
    title: "ER Diagram & Normalization",
    description:
      "Design an ER diagram for a university management system. Normalize the schema up to BCNF and write SQL queries for common operations.",
    dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    priority: "low",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "dl-005",
    subject: "Software Engineering",
    title: "Agile Sprint Retrospective",
    description:
      "Write a comprehensive retrospective report for Sprint 3. Include velocity charts, burndown analysis, and improvement proposals for the next sprint.",
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    priority: "medium",
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "dl-006",
    subject: "Discrete Mathematics",
    title: "Graph Theory Problem Set",
    description:
      "Solve problems on Eulerian and Hamiltonian paths, graph coloring, and planar graphs. Prove at least two theorems from the problem set.",
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    priority: "low",
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
];
