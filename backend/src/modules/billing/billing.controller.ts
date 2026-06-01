import type { NextFunction, Request, Response } from "express";
import mongoose, { type ClientSession } from "mongoose";
import { logAction } from "../../utils/auditLogger.js";
import {
  BILLING_PLANS,
  createBillingSubmission,
  getBillingSubmissions,
  getMyBillingSummary,
  reviewBillingSubmission,
  type CreateBillingSubmissionPayload,
  type ReviewBillingSubmissionPayload,
} from "./billing.service.js";
import type {
  BillingPlanCode,
  BillingSubmissionStatus,
} from "./billing.model.js";
import BillingSubmission from "./billing.model.js";

const sanitizeForResponse = (doc: any): Record<string, unknown> => {
  const obj = typeof doc?.toObject === "function" ? doc.toObject() : { ...doc };
  delete obj.__v;
  delete obj.passwordHash;
  return obj;
};

const isBillingStatus = (value: unknown): value is BillingSubmissionStatus =>
  value === "pending_review" || value === "approved" || value === "rejected";

const isBillingPlanCode = (value: unknown): value is BillingPlanCode =>
  value === "single_pharmacy" ||
  value === "professional" ||
  value === "enterprise_chain";

export const getBillingPlans = (
  _req: Request,
  res: Response,
): void => {
  res.status(200).json({
    success: true,
    message: "Billing plans retrieved successfully.",
    data: BILLING_PLANS,
  });
};

export const submitBillingPayment = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const session: ClientSession = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user?.userId;
    const pharmacyId = req.user?.pharmacyId;

    if (!userId || !pharmacyId || req.user?.role !== "pharmacy_manager") {
      const error = new Error(
        "FORBIDDEN: Only pharmacy managers can submit subscription payments.",
      ) as any;
      error.statusCode = 403;
      error.code = "INSUFFICIENT_ROLE";
      throw error;
    }

    const payload = req.body as CreateBillingSubmissionPayload;
    const submission = await createBillingSubmission(
      payload,
      { userId, pharmacyId },
      session,
    );

    await logAction(
      req,
      "CREATE",
      "BillingSubmission",
      submission._id.toString(),
      null,
      sanitizeForResponse(submission),
      session,
    );

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message:
        "Subscription payment submitted for admin verification.",
      data: sanitizeForResponse(submission),
    });
  } catch (error: any) {
    await session.abortTransaction().catch(() => {});
    session.endSession();

    if (!error.statusCode) error.statusCode = 500;
    if (!error.code) error.code = "INTERNAL_ERROR";
    next(error);
  }
};

export const getMyBilling = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const pharmacyId = req.user?.pharmacyId;

    if (!pharmacyId || req.user?.role !== "pharmacy_manager") {
      const error = new Error(
        "FORBIDDEN: Only pharmacy managers can view subscription billing.",
      ) as any;
      error.statusCode = 403;
      error.code = "INSUFFICIENT_ROLE";
      throw error;
    }

    const summary = await getMyBillingSummary(pharmacyId);

    res.status(200).json({
      success: true,
      message: "Billing summary retrieved successfully.",
      data: {
        ...summary,
        pharmacy: sanitizeForResponse(summary.pharmacy),
        submissions: summary.submissions.map((submission) =>
          sanitizeForResponse(submission),
        ),
      },
    });
  } catch (error: any) {
    if (!error.statusCode) error.statusCode = 500;
    if (!error.code) error.code = "INTERNAL_ERROR";
    next(error);
  }
};

export const listBillingSubmissions = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, parseInt(req.query.limit as string, 10) || 20);
    const status = isBillingStatus(req.query.status)
      ? req.query.status
      : undefined;
    const planCode = isBillingPlanCode(req.query.planCode)
      ? req.query.planCode
      : undefined;

    const { total, submissions, totalPages } = await getBillingSubmissions({
      page,
      limit,
      ...(status ? { status } : {}),
      ...(planCode ? { planCode } : {}),
    });

    res.status(200).json({
      success: true,
      message: "Billing submissions retrieved successfully.",
      data: submissions.map((submission) => sanitizeForResponse(submission)),
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    });
  } catch (error: any) {
    if (!error.statusCode) error.statusCode = 500;
    if (!error.code) error.code = "INTERNAL_ERROR";
    next(error);
  }
};

export const reviewBillingPayment = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const session: ClientSession = await mongoose.startSession();
  session.startTransaction();

  try {
    const reviewerId = req.user?.userId;
    if (!reviewerId || req.user?.role !== "admin") {
      const error = new Error(
        "FORBIDDEN: Only admins can review billing submissions.",
      ) as any;
      error.statusCode = 403;
      error.code = "INSUFFICIENT_ROLE";
      throw error;
    }

    const rawSubmissionId = req.params.id;
    const submissionId =
      typeof rawSubmissionId === "string" ? rawSubmissionId : "";
    if (!submissionId || !mongoose.Types.ObjectId.isValid(submissionId)) {
      const error = new Error(
        "VALIDATION_ERROR: Invalid billing submission id.",
      ) as any;
      error.statusCode = 400;
      error.code = "INVALID_BILLING_SUBMISSION_ID";
      throw error;
    }

    const before = await BillingSubmission.findById(submissionId).session(
      session,
    );
    const payload = req.body as ReviewBillingSubmissionPayload;
    const submission = await reviewBillingSubmission(
      submissionId,
      payload,
      reviewerId,
      session,
    );

    await logAction(
      req,
      payload.decision === "approved" ? "APPROVE" : "REJECT",
      "BillingSubmission",
      submission._id.toString(),
      before ? sanitizeForResponse(before) : null,
      sanitizeForResponse(submission),
      session,
    );

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message:
        payload.decision === "approved"
          ? "Subscription payment approved."
          : "Subscription payment rejected.",
      data: sanitizeForResponse(submission),
    });
  } catch (error: any) {
    await session.abortTransaction().catch(() => {});
    session.endSession();

    if (!error.statusCode) error.statusCode = 500;
    if (!error.code) error.code = "INTERNAL_ERROR";
    next(error);
  }
};
