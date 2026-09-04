export type ApplicationStatus = 'pending' | 'in_review' | 'approved' | 'rejected';

export interface Application {
  id: string;
  citizenName: string;
  department: string;
  service: string;
  submittedAt: string;
  status: ApplicationStatus;
  documentsVerified: boolean;
  fieldsProvided: string[];
}

export const mockApplications: Application[] = [
  {
    id: "APP-2024-001",
    citizenName: "Ramesh Kumar",
    department: "Social Welfare",
    service: "Senior Citizen Pension",
    submittedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    status: "pending",
    documentsVerified: true,
    fieldsProvided: ["full_name", "dob", "aadhaar_number", "address"]
  },
  {
    id: "APP-2024-002",
    citizenName: "Priya Sharma",
    department: "Revenue",
    service: "Income Certificate",
    submittedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    status: "in_review",
    documentsVerified: true,
    fieldsProvided: ["full_name", "aadhaar_number", "annual_income"]
  },
  {
    id: "APP-2024-003",
    citizenName: "Amit Patel",
    department: "Higher Education",
    service: "Scholarship Scheme",
    submittedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    status: "approved",
    documentsVerified: true,
    fieldsProvided: ["full_name", "college_name", "marks_percentage", "aadhaar_number"]
  },
  {
    id: "APP-2024-004",
    citizenName: "Sneha Desai",
    department: "Transport",
    service: "Driving License Renewal",
    submittedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    status: "pending",
    documentsVerified: false,
    fieldsProvided: ["full_name", "dob", "mobile"]
  }
];
