export type BillingPlanCode =
  | "single_pharmacy"
  | "professional"
  | "enterprise_chain";

export type BillingPaymentMethod =
  | "bank_transfer"
  | "mobile_money"
  | "cash";

export type BillingSubmissionStatus =
  | "pending_review"
  | "approved"
  | "rejected";

export type SubscriptionStatus =
  | "none"
  | "trialing"
  | "pending_review"
  | "active"
  | "past_due"
  | "suspended";

export interface BillingPlan {
  code: BillingPlanCode;
  name: string;
  amount: number | null;
  currency: "ETB";
  billingPeriod: "monthly";
  description: string;
  features: string[];
  highlighted: boolean;
  requiresQuote: boolean;
  available: boolean;
}

export interface BillingUserSummary {
  _id: string;
  name: string;
  email?: string;
  city?: string;
  phoneNumber?: string;
  subscriptionStatus?: SubscriptionStatus;
  subscriptionCurrentPeriodEnd?: string;
}

export interface BillingSubmission {
  _id: string;
  pharmacyId: string | BillingUserSummary;
  submittedBy: string | BillingUserSummary;
  planCode: BillingPlanCode;
  planName: string;
  billingPeriod: "monthly";
  amount: number;
  currency: "ETB";
  paymentMethod: BillingPaymentMethod;
  transactionReference: string;
  payerName?: string;
  payerPhone?: string;
  note?: string;
  status: BillingSubmissionStatus;
  reviewedBy?: string | BillingUserSummary;
  reviewedAt?: string;
  rejectionReason?: string;
  coverageStartsAt?: string;
  coverageEndsAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MyBillingSummary {
  pharmacy: BillingUserSummary & {
    subscriptionPlan?: BillingPlanCode;
    subscriptionLastBillingSubmissionId?: string;
  };
  subscriptionStatus: SubscriptionStatus;
  submissions: BillingSubmission[];
}

export interface SubmitBillingPayload {
  planCode: BillingPlanCode;
  amount?: number;
  paymentMethod: BillingPaymentMethod;
  transactionReference: string;
  payerName?: string;
  payerPhone?: string;
  note?: string;
}

export interface ReviewBillingPayload {
  decision: "approved" | "rejected";
  rejectionReason?: string;
}
