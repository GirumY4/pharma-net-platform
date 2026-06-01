import mongoose, { Types, type ClientSession } from "mongoose";
import { createNotification } from "../notifications/notifications.controller.js";
import User from "../users/user.model.js";
import BillingSubmission, {
  type BillingPaymentMethod,
  type BillingPlanCode,
  type BillingSubmissionStatus,
  type IBillingSubmission,
} from "./billing.model.js";

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

export const BILLING_PLANS: BillingPlan[] = [
  {
    code: "single_pharmacy",
    name: "Single Pharmacy",
    amount: 2500,
    currency: "ETB",
    billingPeriod: "monthly",
    description:
      "For independent pharmacies that need verified access to core inventory workflows.",
    features: [
      "Up to 5,000 SKUs",
      "Basic inventory tracking",
      "Sales reporting",
      "Expiry alerts",
      "Email support",
    ],
    highlighted: false,
    requiresQuote: false,
    available: true,
  },
  {
    code: "professional",
    name: "Professional",
    amount: 5000,
    currency: "ETB",
    billingPeriod: "monthly",
    description:
      "For growing pharmacies that need advanced controls and priority support.",
    features: [
      "Unlimited SKUs",
      "FEFO batch management",
      "Advanced analytics",
      "Multi-user access (up to 5)",
      "Priority email & phone support",
      "API access",
    ],
    highlighted: true,
    requiresQuote: false,
    available: true,
  },
  {
    code: "enterprise_chain",
    name: "Enterprise Chain",
    amount: null,
    currency: "ETB",
    billingPeriod: "monthly",
    description:
      "For pharmacy groups that need custom invoicing and multi-location support.",
    features: [
      "Multi-location management",
      "Custom integrations",
      "Dedicated account manager",
      "Invoice-based verification",
    ],
    highlighted: false,
    requiresQuote: true,
    available: false,
  },
];

export interface CreateBillingSubmissionPayload {
  planCode: BillingPlanCode;
  amount?: number;
  paymentMethod: BillingPaymentMethod;
  transactionReference: string;
  payerName?: string;
  payerPhone?: string;
  note?: string;
}

export interface ReviewBillingSubmissionPayload {
  decision: "approved" | "rejected";
  rejectionReason?: string;
}

const isValidObjectId = (id: string): boolean =>
  mongoose.Types.ObjectId.isValid(id);

const addMonths = (date: Date, months: number) => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};

const normalizeReference = (reference: string) =>
  reference.trim().replace(/\s+/g, "-").toUpperCase();

export const getPlanByCode = (code: BillingPlanCode) =>
  BILLING_PLANS.find((plan) => plan.code === code);

const assertPlan = (code: string): BillingPlan => {
  const plan = getPlanByCode(code as BillingPlanCode);
  if (!plan) {
    const error = new Error("VALIDATION_ERROR: Unknown billing plan.") as any;
    error.statusCode = 400;
    error.code = "UNKNOWN_BILLING_PLAN";
    throw error;
  }
  return plan;
};

const assertPlanAvailable = (plan: BillingPlan) => {
  if (!plan.available) {
    const error = new Error(
      "PLAN_UNAVAILABLE: Enterprise Chain billing is not available yet.",
    ) as any;
    error.statusCode = 403;
    error.code = "PLAN_UNAVAILABLE";
    throw error;
  }
};

const resolveSubmissionAmount = (
  plan: BillingPlan,
  requestedAmount?: number,
) => {
  if (plan.amount !== null) return plan.amount;

  if (typeof requestedAmount !== "number" || requestedAmount <= 0) {
    const error = new Error(
      "VALIDATION_ERROR: A positive amount is required for custom enterprise billing.",
    ) as any;
    error.statusCode = 400;
    error.code = "INVALID_CUSTOM_AMOUNT";
    throw error;
  }

  return requestedAmount;
};

const notifyAdminsOfBillingSubmission = async (
  submission: IBillingSubmission,
  session: ClientSession,
) => {
  const admins = await User.find({
    role: "admin",
    isActive: true,
    isDeleted: false,
  })
    .select("_id")
    .session(session);

  await Promise.all(
    admins.map((admin) =>
      createNotification(
        {
          recipient: admin._id,
          title: "Billing payment awaiting approval",
          message: `${submission.planName} payment reference ${submission.transactionReference} is ready for review.`,
          type: "system_update",
          link: "/admin/billing",
        },
        session,
      ),
    ),
  );
};

export const createBillingSubmission = async (
  payload: CreateBillingSubmissionPayload,
  userContext: { userId: string; pharmacyId: string },
  session: ClientSession,
): Promise<IBillingSubmission> => {
  const { userId, pharmacyId } = userContext;

  if (!isValidObjectId(userId) || !isValidObjectId(pharmacyId)) {
    const error = new Error(
      "VALIDATION_ERROR: Invalid authenticated billing context.",
    ) as any;
    error.statusCode = 400;
    error.code = "INVALID_BILLING_CONTEXT";
    throw error;
  }

  const plan = assertPlan(payload.planCode);
  assertPlanAvailable(plan);
  const amount = resolveSubmissionAmount(plan, payload.amount);
  const transactionReference = normalizeReference(
    payload.transactionReference || "",
  );

  if (transactionReference.length < 3) {
    const error = new Error(
      "VALIDATION_ERROR: A valid payment or receipt reference is required.",
    ) as any;
    error.statusCode = 400;
    error.code = "MISSING_PAYMENT_REFERENCE";
    throw error;
  }

  if (
    !["bank_transfer", "mobile_money", "cash"].includes(payload.paymentMethod)
  ) {
    const error = new Error(
      "VALIDATION_ERROR: paymentMethod must be bank_transfer, mobile_money, or cash.",
    ) as any;
    error.statusCode = 400;
    error.code = "INVALID_PAYMENT_METHOD";
    throw error;
  }

  const existingReference = await BillingSubmission.findOne({
    paymentMethod: payload.paymentMethod,
    transactionReference,
  }).session(session);

  if (existingReference) {
    const error = new Error(
      "DUPLICATE_PAYMENT_REFERENCE: This payment reference has already been submitted.",
    ) as any;
    error.statusCode = 409;
    error.code = "DUPLICATE_PAYMENT_REFERENCE";
    throw error;
  }

  const [submission] = await BillingSubmission.create(
    [
      {
        pharmacyId: new Types.ObjectId(pharmacyId),
        submittedBy: new Types.ObjectId(userId),
        planCode: plan.code,
        planName: plan.name,
        billingPeriod: plan.billingPeriod,
        amount,
        currency: plan.currency,
        paymentMethod: payload.paymentMethod,
        transactionReference,
        ...(payload.payerName?.trim()
          ? { payerName: payload.payerName.trim() }
          : {}),
        ...(payload.payerPhone?.trim()
          ? { payerPhone: payload.payerPhone.trim() }
          : {}),
        ...(payload.note?.trim() ? { note: payload.note.trim() } : {}),
      },
    ],
    { session },
  );

  if (!submission) {
    const error = new Error(
      "BILLING_SUBMISSION_FAILED: Failed to create billing submission.",
    ) as any;
    error.statusCode = 500;
    error.code = "BILLING_SUBMISSION_FAILED";
    throw error;
  }

  const pharmacy = await User.findById(pharmacyId).session(session);
  if (!pharmacy || pharmacy.role !== "pharmacy_manager") {
    const error = new Error(
      "PHARMACY_NOT_FOUND: Pharmacy manager account not found.",
    ) as any;
    error.statusCode = 404;
    error.code = "PHARMACY_NOT_FOUND";
    throw error;
  }

  const currentPeriodEnd = pharmacy.subscriptionCurrentPeriodEnd;
  const isCovered =
    pharmacy.subscriptionStatus === "active" &&
    currentPeriodEnd instanceof Date &&
    currentPeriodEnd.getTime() > Date.now();

  pharmacy.subscriptionLastBillingSubmissionId =
    submission._id as Types.ObjectId;
  if (!isCovered) {
    pharmacy.subscriptionPlan = plan.code;
    pharmacy.subscriptionStatus = "pending_review";
  }
  await pharmacy.save({ session });

  await notifyAdminsOfBillingSubmission(submission, session);

  return submission;
};

export const getBillingSubmissions = async ({
  page,
  limit,
  status,
  planCode,
}: {
  page: number;
  limit: number;
  status?: BillingSubmissionStatus;
  planCode?: BillingPlanCode;
}) => {
  const skip = (page - 1) * limit;
  const query: Record<string, unknown> = {};

  if (status) query.status = status;
  if (planCode) query.planCode = planCode;

  const [total, submissions] = await Promise.all([
    BillingSubmission.countDocuments(query),
    BillingSubmission.find(query)
      .populate(
        "pharmacyId",
        "name email city phoneNumber subscriptionStatus subscriptionCurrentPeriodEnd",
      )
      .populate("submittedBy", "name email")
      .populate("reviewedBy", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
  ]);

  return {
    total,
    submissions,
    totalPages: Math.ceil(total / limit),
  };
};

export const getMyBillingSummary = async (pharmacyId: string) => {
  if (!isValidObjectId(pharmacyId)) {
    const error = new Error("VALIDATION_ERROR: Invalid pharmacy id.") as any;
    error.statusCode = 400;
    error.code = "INVALID_PHARMACY_ID";
    throw error;
  }

  const [pharmacy, submissions] = await Promise.all([
    User.findById(pharmacyId).select(
      "name email subscriptionStatus subscriptionPlan subscriptionCurrentPeriodEnd subscriptionLastBillingSubmissionId",
    ),
    BillingSubmission.find({ pharmacyId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("reviewedBy", "name email"),
  ]);

  if (!pharmacy) {
    const error = new Error("PHARMACY_NOT_FOUND: Pharmacy not found.") as any;
    error.statusCode = 404;
    error.code = "PHARMACY_NOT_FOUND";
    throw error;
  }

  const expiresAt = pharmacy.subscriptionCurrentPeriodEnd;
  const derivedStatus =
    pharmacy.subscriptionStatus === "active" &&
    expiresAt instanceof Date &&
    expiresAt.getTime() < Date.now()
      ? "past_due"
      : pharmacy.subscriptionStatus;

  return {
    pharmacy,
    subscriptionStatus: derivedStatus,
    submissions,
  };
};

export const reviewBillingSubmission = async (
  submissionId: string,
  payload: ReviewBillingSubmissionPayload,
  reviewerId: string,
  session: ClientSession,
): Promise<IBillingSubmission> => {
  if (!isValidObjectId(submissionId) || !isValidObjectId(reviewerId)) {
    const error = new Error("VALIDATION_ERROR: Invalid review context.") as any;
    error.statusCode = 400;
    error.code = "INVALID_REVIEW_CONTEXT";
    throw error;
  }

  if (!["approved", "rejected"].includes(payload.decision)) {
    const error = new Error(
      "VALIDATION_ERROR: decision must be approved or rejected.",
    ) as any;
    error.statusCode = 400;
    error.code = "INVALID_REVIEW_DECISION";
    throw error;
  }

  if (
    payload.decision === "rejected" &&
    !payload.rejectionReason?.trim()
  ) {
    const error = new Error(
      "VALIDATION_ERROR: rejectionReason is required when rejecting a payment.",
    ) as any;
    error.statusCode = 400;
    error.code = "MISSING_REJECTION_REASON";
    throw error;
  }

  const submission = await BillingSubmission.findById(submissionId).session(
    session,
  );
  if (!submission) {
    const error = new Error(
      "BILLING_SUBMISSION_NOT_FOUND: Billing submission not found.",
    ) as any;
    error.statusCode = 404;
    error.code = "BILLING_SUBMISSION_NOT_FOUND";
    throw error;
  }

  if (submission.status !== "pending_review") {
    const error = new Error(
      "BILLING_SUBMISSION_REVIEWED: This billing submission has already been reviewed.",
    ) as any;
    error.statusCode = 409;
    error.code = "BILLING_SUBMISSION_REVIEWED";
    throw error;
  }

  const pharmacy = await User.findById(submission.pharmacyId).session(session);
  if (!pharmacy) {
    const error = new Error(
      "PHARMACY_NOT_FOUND: Pharmacy account not found.",
    ) as any;
    error.statusCode = 404;
    error.code = "PHARMACY_NOT_FOUND";
    throw error;
  }

  submission.status = payload.decision;
  submission.reviewedBy = new Types.ObjectId(reviewerId);
  submission.reviewedAt = new Date();

  if (payload.decision === "approved") {
    const plan = assertPlan(submission.planCode);
    assertPlanAvailable(plan);

    const currentPeriodEnd = pharmacy.subscriptionCurrentPeriodEnd;
    const now = new Date();
    const coverageStartsAt =
      pharmacy.subscriptionStatus === "active" &&
      currentPeriodEnd instanceof Date &&
      currentPeriodEnd.getTime() > now.getTime()
        ? currentPeriodEnd
        : now;
    const coverageEndsAt = addMonths(coverageStartsAt, 1);

    submission.coverageStartsAt = coverageStartsAt;
    submission.coverageEndsAt = coverageEndsAt;
    submission.rejectionReason = undefined;

    pharmacy.subscriptionStatus = "active";
    pharmacy.subscriptionPlan = submission.planCode;
    pharmacy.subscriptionCurrentPeriodEnd = coverageEndsAt;
    pharmacy.subscriptionLastBillingSubmissionId =
      submission._id as Types.ObjectId;
  } else {
    submission.rejectionReason = payload.rejectionReason?.trim();

    const isLatestSubmission =
      pharmacy.subscriptionLastBillingSubmissionId?.toString() ===
      submission._id.toString();
    const currentPeriodEnd = pharmacy.subscriptionCurrentPeriodEnd;
    const isStillCovered =
      pharmacy.subscriptionStatus === "active" &&
      currentPeriodEnd instanceof Date &&
      currentPeriodEnd.getTime() > Date.now();

    if (isLatestSubmission && !isStillCovered) {
      pharmacy.subscriptionStatus = "past_due";
    }
  }

  await submission.save({ session });
  await pharmacy.save({ session });

  await createNotification(
    {
      recipient: submission.submittedBy,
      title:
        payload.decision === "approved"
          ? "Subscription payment approved"
          : "Subscription payment needs attention",
      message:
        payload.decision === "approved"
          ? `${submission.planName} is active until ${submission.coverageEndsAt?.toLocaleDateString("en-US")}.`
          : `Your ${submission.planName} payment was rejected. ${submission.rejectionReason}`,
      type:
        payload.decision === "approved" ? "payment_success" : "system_update",
      link: "/billing",
    },
    session,
  );

  return submission;
};
