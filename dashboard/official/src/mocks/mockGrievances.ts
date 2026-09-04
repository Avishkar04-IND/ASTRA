export type GrievanceStatus = 'open' | 'investigating' | 'resolved' | 'closed';

export interface Grievance {
  id: string;
  citizenName: string;
  department: string;
  subject: string;
  submittedAt: string;
  status: GrievanceStatus;
  priority: 'high' | 'medium' | 'low';
}

export const mockGrievances: Grievance[] = [
  {
    id: "GRV-2024-101",
    citizenName: "Ramesh Kumar",
    department: "Social Welfare",
    subject: "Pension disbursement delayed by 2 months",
    submittedAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    status: "open",
    priority: "high"
  },
  {
    id: "GRV-2024-102",
    citizenName: "Vikram Singh",
    department: "Municipal Corporation",
    subject: "Streetlight not working in Sector 4",
    submittedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    status: "investigating",
    priority: "medium"
  },
  {
    id: "GRV-2024-103",
    citizenName: "Anita Rao",
    department: "Revenue",
    subject: "Error in issued Income Certificate",
    submittedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    status: "open",
    priority: "high"
  },
  {
    id: "GRV-2024-104",
    citizenName: "Rajesh Gupta",
    department: "Transport",
    subject: "Unable to book slot for driving test",
    submittedAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    status: "resolved",
    priority: "medium"
  }
];
