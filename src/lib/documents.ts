import type { DocumentKind } from "./types";

export type DocRequirement = {
  kind: DocumentKind;
  labelKey: string;
  hintKey?: string;
};

export const COMMON_DOCS: DocRequirement[] = [
  { kind: "commercial_registration", labelKey: "doc_commercial_registration" },
  { kind: "poa_or_id", labelKey: "doc_poa_or_id" },
  { kind: "vat_certificate", labelKey: "doc_vat_certificate" },
  { kind: "national_address", labelKey: "doc_national_address" },
  { kind: "iban_letter", labelKey: "doc_iban_letter" },
];

export const BUYER_BASE_DOCS: DocRequirement[] = [
  { kind: "sales_ledger_6mo", labelKey: "doc_sales_ledger_6mo", hintKey: "ob_doc_required_buyer" },
  { kind: "owner_bank_6mo", labelKey: "doc_owner_bank_6mo", hintKey: "ob_doc_required_buyer" },
];

export const BUYER_HIGH_DOCS: DocRequirement[] = [
  { kind: "company_bank_2yr", labelKey: "doc_company_bank_2yr", hintKey: "ob_doc_required_buyer_high" },
  { kind: "vat_returns_1yr", labelKey: "doc_vat_returns_1yr", hintKey: "ob_doc_required_buyer_high" },
];

export const HIGH_VOLUME_THRESHOLD = 50000;

export function requiredDocs(type: "merchant" | "buyer", volume: number | null): DocRequirement[] {
  if (type === "merchant") return COMMON_DOCS;
  const docs = [...COMMON_DOCS, ...BUYER_BASE_DOCS];
  if ((volume ?? 0) > HIGH_VOLUME_THRESHOLD) docs.push(...BUYER_HIGH_DOCS);
  return docs;
}