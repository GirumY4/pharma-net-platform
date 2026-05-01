// src/modules/payments/payments.service.ts
import mongoose, { Types, type ClientSession } from "mongoose";
import Order from "../orders/orders.model.js";
import Payment, { type IPayment } from "./payments.model.js";

export interface CreatePaymentPayload {
  orderId: string;
  amount: number;
  paymentMethod: "bank_transfer" | "cash" | "mobile_money";
  transactionId?: string;
  note?: string;
}

/**
 * Validate ObjectId string format
 */
const isValidObjectId = (id: string): boolean =>
  mongoose.Types.ObjectId.isValid(id);

/**
 * Floating-point tolerance for monetary comparisons
 */
const FLOAT_TOLERANCE = 0.001;

/**
 * Record a payment against an order within the pharmacy tenant's boundary.
 * - Validates order belongs to manager's pharmacy and is not rejected
 * - Aggregates existing completed payments to calculate remaining balance
 * - Prevents overpayment beyond order total
 * - Atomically updates order.paymentStatus based on new payment
 * - Creates immutable Payment record with full attribution
 */
export const processPaymentRecord = async (
  payload: CreatePaymentPayload,
  userContext: { managerId: string; pharmacyId: string },
  session: ClientSession,
): Promise<{
  payment: IPayment;
  order: InstanceType<typeof Order>;
  totalPaid: number;
  remainingBalance: number;
}> => {
  const { orderId, amount, paymentMethod, transactionId, note } = payload;
  const { managerId, pharmacyId } = userContext;

  // Validate ObjectId format
  if (!isValidObjectId(orderId)) {
    const error = new Error("VALIDATION_ERROR: Invalid orderId format.") as any;
    error.statusCode = 400;
    error.code = "INVALID_OBJECT_ID";
    throw error;
  }

  // Validate conditional field: transactionId required for bank_transfer
  if (paymentMethod === "bank_transfer" && !transactionId?.trim()) {
    const error = new Error(
      "VALIDATION_ERROR: transactionId is required for bank_transfer payments.",
    ) as any;
    error.statusCode = 400;
    error.code = "MISSING_TRANSACTION_ID";
    throw error;
  }

  // 1. Validate Order and Tenant Boundaries
  const order = await Order.findOne({
    _id: orderId,
    pharmacyId,
    isDeleted: false,
  }).session(session);

  if (!order) {
    const error = new Error(
      "ORDER_NOT_FOUND: Order not found or access denied.",
    ) as any;
    error.statusCode = 404;
    error.code = "ORDER_NOT_FOUND";
    throw error;
  }

  if (order.status === "rejected") {
    const error = new Error(
      "VALIDATION_ERROR: Cannot record payments for rejected orders.",
    ) as any;
    error.statusCode = 400;
    error.code = "ORDER_REJECTED";
    throw error;
  }

  if (order.paymentStatus === "paid") {
    const error = new Error(
      "ORDER_ALREADY_PAID: This order has already been fully paid.",
    ) as any;
    error.statusCode = 409;
    error.code = "ORDER_ALREADY_PAID";
    throw error;
  }

  // 2. Aggregate existing completed payments
  const existingPayments = await Payment.find({
    orderId,
    status: "completed",
  }).session(session);

  const totalPaidSoFar = existingPayments.reduce((sum, p) => sum + p.amount, 0);
  const remainingBalance = order.totalAmount - totalPaidSoFar;

  // 3. Overpayment validation with floating-point tolerance
  if (amount > remainingBalance + FLOAT_TOLERANCE) {
    const error = new Error(
      `OVERPAYMENT: Amount ${amount.toFixed(2)} exceeds remaining balance of ${remainingBalance.toFixed(2)}.`,
    ) as any;
    error.statusCode = 400;
    error.code = "OVERPAYMENT";
    throw error;
  }

  // 4. Create Payment Record (immutable once created)
  const [payment] = await Payment.create(
    [
      {
        orderId: order._id as Types.ObjectId,
        pharmacyId: new Types.ObjectId(pharmacyId),
        customerId: order.customerId,
        amount,
        paymentMethod,
        ...(transactionId?.trim()
          ? { transactionId: transactionId.trim() }
          : {}),
        ...(note?.trim() ? { note: note.trim() } : {}),
        recordedBy: new Types.ObjectId(managerId),
        status: "completed",
      },
    ],
    { session },
  );

  if (!payment) {
    const error = new Error(
      "PAYMENT_CREATION_FAILED: Failed to create payment document.",
    ) as any;
    error.statusCode = 500;
    error.code = "PAYMENT_CREATION_FAILED";
    throw error;
  }

  // 5. Calculate new payment status
  const newTotalPaid = totalPaidSoFar + amount;
  let newPaymentStatus: "unpaid" | "partially_paid" | "paid" = "partially_paid";

  if (newTotalPaid >= order.totalAmount - FLOAT_TOLERANCE) {
    newPaymentStatus = "paid";
  } else if (newTotalPaid <= FLOAT_TOLERANCE) {
    newPaymentStatus = "unpaid";
  }

  // 6. Update Order payment status atomically
  order.paymentStatus = newPaymentStatus;
  await order.save({ session });

  return {
    payment,
    order,
    totalPaid: newTotalPaid,
    remainingBalance: order.totalAmount - newTotalPaid,
  };
};
