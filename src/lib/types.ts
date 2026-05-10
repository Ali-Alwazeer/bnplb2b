export type DocumentKind =
  | "commercial_registration"
  | "poa_or_id"
  | "vat_certificate"
  | "national_address"
  | "iban_letter"
  | "sales_ledger_6mo"
  | "owner_bank_6mo"
  | "company_bank_2yr"
  | "vat_returns_1yr";

export type ApplicationType = "merchant" | "buyer";

export type ApplicationStatus =
  | "draft"
  | "submitted"
  | "credit_review"
  | "legal_review"
  | "contract_pending"
  | "onboarded"
  | "rejected";

export type Application = {
  id: string;
  user_id: string;
  type: ApplicationType;
  status: ApplicationStatus;
  company_name: string | null;
  manager_email: string | null;
  manager_phone: string | null;
  expected_monthly_volume: number | null;
  assigned_limit: number | null;
  contract_signed: boolean;
  guarantee_approved: boolean;
  review_notes: string | null;
  submitted_at: string | null;
  decided_at: string | null;
  created_at: string;
  updated_at: string;
};

export type DocumentRow = {
  id: string;
  application_id: string;
  kind: DocumentKind;
  file_path: string;
  file_name: string | null;
  uploaded_at: string;
};