import { Client, Appointment } from "@/types/crm";

// Mock Data
export const INITIAL_CLIENTS: Client[] = [
  {
    id: "1",
    name: "Georg Gleeson",
    pronouns: "They/Them",
    born: new Date("1992-05-15"),
    suburbs: ["Brunswick"], // Fixed: changed suburb to suburbs
    email: "georg@example.com",
    phone: "0400 123 456"
  },
  {
    id: "2",
    name: "Alex Smith",
    pronouns: "She/Her",
    born: new Date("1985-11-20"),
    suburbs: ["Fitzroy", "Northcote"], // Fixed: changed suburb to suburbs
    email: "alex@example.com",
    phone: "0411 987 654"
  }
];

export const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: "APP-0001",
    clientId: "1",
    date: new Date("2024-03-10T10:00:00"),
    tag: "Kinesiology",
    status: "Completed",
    notes: "Focused on structural alignment.",
    goal: "Reduce lower back pain",
    issue: "Soreness after lifting",
    acupoints: "GV20, BL23"
  },
  {
    id: "APP-0002",
    clientId: "1",
    date: new Date("2024-04-12T14:30:00"),
    tag: "Community Kinesiology",
    status: "Completed",
    notes: "Emotional release session.",
    goal: "Stress management",
    issue: "Work anxiety",
    acupoints: "HT7, PC6"
  }
];