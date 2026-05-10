import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "ar";

type Dict = Record<string, string>;

const en: Dict = {
  brand: "Yaqeen BNPL",
  tagline: "Buy Now, Pay Later — built for B2B trade.",
  nav_login: "Sign in",
  nav_signup: "Get started",
  nav_logout: "Sign out",
  nav_dashboard: "Dashboard",
  hero_title: "Unlock cash flow for serious B2B businesses.",
  hero_sub: "Verified merchants. Approved buyers. Frictionless installment payments backed by KSA-grade compliance.",
  cta_become_merchant: "Apply as a merchant",
  cta_become_buyer: "Apply as a buyer",
  for_merchants: "For Merchants",
  for_buyers: "For Buyers",
  for_merchants_desc: "Get paid upfront. We handle the credit risk while your buyers pay in installments.",
  for_buyers_desc: "Extend your purchasing power with installment plans of 1–5 months on verified suppliers.",
  feature_1: "KYC verified",
  feature_2: "Credit-assessed limits",
  feature_3: "Legal contracts & guarantees",
  feature_4: "Ida'at-ready settlement",

  signup_title: "Create your business account",
  signup_sub: "Phase 1 — onboarding. Documents reviewed by our credit and legal teams.",
  login_title: "Welcome back",
  field_email: "Business email",
  field_password: "Password",
  field_full_name: "Full name",
  field_phone: "Manager phone",
  field_company: "Company name",
  field_role: "Account type",
  role_merchant: "Merchant (seller)",
  role_buyer: "Buyer (purchaser)",
  submit_signup: "Create account",
  submit_login: "Sign in",
  no_account: "No account yet?",
  have_account: "Already have an account?",

  dash_welcome: "Welcome back",
  dash_status: "Application status",
  dash_role: "Role",
  dash_start_onboarding: "Start onboarding",
  dash_continue_onboarding: "Continue onboarding",
  dash_view_application: "View application",

  status_draft: "Draft",
  status_submitted: "Submitted",
  status_credit_review: "Credit review",
  status_legal_review: "Legal review",
  status_contract_pending: "Contract pending",
  status_onboarded: "Onboarded",
  status_rejected: "Rejected",

  ob_title_merchant: "Merchant onboarding",
  ob_title_buyer: "Buyer onboarding",
  ob_step_company: "Company info",
  ob_step_documents: "Documents",
  ob_step_review: "Review & submit",
  ob_field_company_name: "Legal company name",
  ob_field_manager_email: "Manager email",
  ob_field_manager_phone: "Manager phone",
  ob_field_volume: "Expected monthly invoice volume (SAR)",
  ob_volume_help: "Buyers above SAR 50,000/month are required to provide additional documents.",
  ob_save_continue: "Save & continue",
  ob_back: "Back",
  ob_submit: "Submit application",
  ob_submitted: "Application submitted. You'll hear from us shortly.",
  ob_upload: "Upload",
  ob_uploaded: "Uploaded",
  ob_replace: "Replace",
  ob_remove: "Remove",
  ob_required: "Required",
  ob_doc_required_buyer_high: "Required for buyers over SAR 50,000",
  ob_doc_required_buyer: "Required for buyers",

  doc_commercial_registration: "Commercial registration",
  doc_poa_or_id: "POA or owner ID",
  doc_vat_certificate: "VAT / tax certificate",
  doc_national_address: "National address",
  doc_iban_letter: "IBAN letter",
  doc_sales_ledger_6mo: "Sales ledger — last 6 months",
  doc_owner_bank_6mo: "Owner bank statement — 6 months",
  doc_company_bank_2yr: "Company bank statement — 2 years",
  doc_vat_returns_1yr: "VAT returns — last year",

  review_title: "Review your application",
  review_sub: "Once submitted, your file is locked and routed to the right team.",
  review_target_merchant: "Goes to the Legal team for contract drafting.",
  review_target_buyer: "Goes to the Credit team for limit assessment.",

  // Reviewer panels
  credit_queue_title: "Credit team queue",
  legal_queue_title: "Legal team queue",
  queue_empty: "Nothing waiting — great work.",
  table_company: "Company",
  table_type: "Type",
  table_volume: "Expected volume",
  table_status: "Status",
  table_submitted: "Submitted",
  table_actions: "",
  action_review: "Review",
  case_back: "Back to queue",
  case_documents: "Documents on file",
  case_assign_limit: "Assign credit limit (SAR)",
  case_approve_limit: "Approve & route to Legal",
  case_reject: "Reject application",
  case_contract_signed: "Contract signed",
  case_guarantee_approved: "Guarantee approved",
  case_finalize: "Finalize & onboard",
  case_notes: "Internal notes",
  case_no_docs: "No documents uploaded.",
  case_assigned_limit: "Assigned limit",
  case_currency: "SAR",
  toast_saved: "Saved",
  toast_submitted: "Submitted for review",
  toast_approved: "Approved",
  toast_rejected: "Rejected",
  toast_onboarded: "Onboarded successfully",
  toast_error: "Something went wrong",
};

const ar: Dict = {
  brand: "يقين BNPL",
  tagline: "اشترِ الآن، وادفع لاحقاً — مصمَّم لقطاع B2B.",
  nav_login: "تسجيل الدخول",
  nav_signup: "ابدأ الآن",
  nav_logout: "تسجيل الخروج",
  nav_dashboard: "لوحة التحكم",
  hero_title: "أطلق التدفق النقدي لأعمال B2B الجادة.",
  hero_sub: "تجار موثّقون. مشترون معتمدون. مدفوعات تقسيط سلسة بمعايير الامتثال السعودية.",
  cta_become_merchant: "تقدّم كتاجر",
  cta_become_buyer: "تقدّم كمشترٍ",
  for_merchants: "للتجار",
  for_buyers: "للمشترين",
  for_merchants_desc: "احصل على المدفوعات مقدماً، ونحن نتحمل مخاطر الائتمان بينما يدفع المشتري بالتقسيط.",
  for_buyers_desc: "وسّع قدرتك الشرائية بخطط تقسيط من ١ إلى ٥ أشهر مع موردين موثّقين.",
  feature_1: "تحقّق KYC كامل",
  feature_2: "حدود ائتمانية مدروسة",
  feature_3: "عقود وضمانات قانونية",
  feature_4: "تسوية متوافقة مع إدعاء",

  signup_title: "أنشئ حساب أعمالك",
  signup_sub: "المرحلة الأولى — التسجيل. تتم مراجعة المستندات من فريق الائتمان والقانون.",
  login_title: "أهلاً بعودتك",
  field_email: "البريد الإلكتروني",
  field_password: "كلمة المرور",
  field_full_name: "الاسم الكامل",
  field_phone: "جوال المدير",
  field_company: "اسم الشركة",
  field_role: "نوع الحساب",
  role_merchant: "تاجر (بائع)",
  role_buyer: "مشترٍ",
  submit_signup: "إنشاء الحساب",
  submit_login: "تسجيل الدخول",
  no_account: "ليس لديك حساب؟",
  have_account: "لديك حساب بالفعل؟",

  dash_welcome: "أهلاً بعودتك",
  dash_status: "حالة الطلب",
  dash_role: "الدور",
  dash_start_onboarding: "ابدأ التسجيل",
  dash_continue_onboarding: "متابعة التسجيل",
  dash_view_application: "عرض الطلب",

  status_draft: "مسودة",
  status_submitted: "مُرسل",
  status_credit_review: "مراجعة ائتمانية",
  status_legal_review: "مراجعة قانونية",
  status_contract_pending: "بانتظار العقد",
  status_onboarded: "مُفعّل",
  status_rejected: "مرفوض",

  ob_title_merchant: "تسجيل التاجر",
  ob_title_buyer: "تسجيل المشتري",
  ob_step_company: "بيانات الشركة",
  ob_step_documents: "المستندات",
  ob_step_review: "المراجعة والإرسال",
  ob_field_company_name: "الاسم القانوني للشركة",
  ob_field_manager_email: "بريد المدير",
  ob_field_manager_phone: "جوال المدير",
  ob_field_volume: "الحجم الشهري المتوقع للفواتير (ر.س)",
  ob_volume_help: "المشترون الذين يتجاوزون ٥٠٬٠٠٠ ر.س شهرياً مطالَبون بمستندات إضافية.",
  ob_save_continue: "حفظ ومتابعة",
  ob_back: "رجوع",
  ob_submit: "إرسال الطلب",
  ob_submitted: "تم إرسال طلبك وسنتواصل معك قريباً.",
  ob_upload: "رفع",
  ob_uploaded: "تم الرفع",
  ob_replace: "استبدال",
  ob_remove: "حذف",
  ob_required: "مطلوب",
  ob_doc_required_buyer_high: "مطلوب للمشترين فوق ٥٠٬٠٠٠ ر.س",
  ob_doc_required_buyer: "مطلوب للمشترين",

  doc_commercial_registration: "السجل التجاري",
  doc_poa_or_id: "وكالة أو هوية المالك",
  doc_vat_certificate: "شهادة الضريبة / VAT",
  doc_national_address: "العنوان الوطني",
  doc_iban_letter: "خطاب الآيبان",
  doc_sales_ledger_6mo: "دفتر المبيعات — آخر ٦ أشهر",
  doc_owner_bank_6mo: "كشف حساب المالك — ٦ أشهر",
  doc_company_bank_2yr: "كشف حساب الشركة — سنتان",
  doc_vat_returns_1yr: "إقرارات الضريبة — السنة الأخيرة",

  review_title: "راجع طلبك",
  review_sub: "بعد الإرسال يُغلق الملف ويُحوَّل للفريق المختص.",
  review_target_merchant: "يُحوَّل للفريق القانوني لإعداد العقد.",
  review_target_buyer: "يُحوَّل لفريق الائتمان لتحديد الحد.",

  credit_queue_title: "قائمة فريق الائتمان",
  legal_queue_title: "قائمة الفريق القانوني",
  queue_empty: "لا توجد طلبات قيد الانتظار.",
  table_company: "الشركة",
  table_type: "النوع",
  table_volume: "الحجم المتوقع",
  table_status: "الحالة",
  table_submitted: "تاريخ الإرسال",
  table_actions: "",
  action_review: "مراجعة",
  case_back: "رجوع للقائمة",
  case_documents: "المستندات المرفقة",
  case_assign_limit: "تحديد الحد الائتماني (ر.س)",
  case_approve_limit: "اعتماد وتحويل للقانوني",
  case_reject: "رفض الطلب",
  case_contract_signed: "تم توقيع العقد",
  case_guarantee_approved: "تم اعتماد الضمان",
  case_finalize: "إنهاء وتفعيل",
  case_notes: "ملاحظات داخلية",
  case_no_docs: "لم تُرفع أي مستندات.",
  case_assigned_limit: "الحد المعتمد",
  case_currency: "ر.س",
  toast_saved: "تم الحفظ",
  toast_submitted: "تم الإرسال للمراجعة",
  toast_approved: "تم الاعتماد",
  toast_rejected: "تم الرفض",
  toast_onboarded: "تم التفعيل بنجاح",
  toast_error: "حدث خطأ ما",
};

const dictionaries: Record<Lang, Dict> = { en, ar };

type I18nCtx = {
  lang: Lang;
  dir: "ltr" | "rtl";
  t: (key: string) => string;
  setLang: (l: Lang) => void;
};

const Ctx = createContext<I18nCtx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window === "undefined") return "en";
    return (localStorage.getItem("yaqeen.lang") as Lang) || "en";
  });
  const dir = lang === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang, dir]);

  const setLang = (l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") localStorage.setItem("yaqeen.lang", l);
  };

  const t = (key: string) => dictionaries[lang][key] ?? dictionaries.en[key] ?? key;

  return <Ctx.Provider value={{ lang, dir, t, setLang }}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}