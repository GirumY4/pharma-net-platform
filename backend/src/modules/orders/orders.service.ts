// src/modules/orders/orders.service.ts
import mongoose, { type ClientSession, Types } from "mongoose";
import Order, { type IOrder, type IOrderItem } from "./orders.model.js";
import Medicine, { type IBatch } from "../inventory/medicine.model.js";
import InventoryTransaction from "../inventory/inventoryTransaction.model.js";

export interface PlaceOrderPayload {
  pharmacyId: string; // Allowed from client: consumer selects target pharmacy
  items: { medicineId: string; quantity: number }[];
  fulfillmentMethod: "pickup" | "delivery";
  deliveryAddress?: string;
}

export interface UpdateOrderStatusPayload {
  status: IOrder["status"];
  rejectionReason?: string;
  note?: string;
}

/**
 * Allowed status transitions per FR-3.4 lifecycle
 */
const ALLOWED_TRANSITIONS: Record<IOrder["status"], IOrder["status"][]> = {
  pending: ["approved", "rejected"],
  approved: ["processing"],
  processing: ["ready"],
  ready: ["delivered"],
  delivered: [],
  rejected: [],
};

/**
 * Validate ObjectId string format
 */
const isValidObjectId = (id: string): boolean =>
  mongoose.Types.ObjectId.isValid(id);

/**
 * Pre-flight stock check and Order Creation (Public User)
 * - Validates target pharmacy exists and is active
 * - Snapshots medicine name/price for historical accuracy
 * - Validates deliveryAddress required when fulfillmentMethod='delivery'
 * - Does NOT deduct stock (deferred to approval)
 */
export const processOrderPlacement = async (
  payload: PlaceOrderPayload,
  customerId: string,
  session: ClientSession,
): Promise<IOrder> => {
  const { pharmacyId, items, fulfillmentMethod, deliveryAddress } = payload;

  // Validate target pharmacy exists and is active
  const pharmacy = await mongoose
    .model("User")
    .findOne({
      _id: pharmacyId,
      role: "pharmacy_manager",
      isActive: true,
      isDeleted: false,
    })
    .session(session);

  if (!pharmacy) {
    const error = new Error(
      "PHARMACY_NOT_FOUND: Target pharmacy does not exist or is inactive.",
    ) as any;
    error.statusCode = 404;
    error.code = "PHARMACY_NOT_FOUND";
    throw error;
  }

  // Validate delivery address requirement
  if (fulfillmentMethod === "delivery" && !deliveryAddress?.trim()) {
    const error = new Error(
      'VALIDATION_ERROR: deliveryAddress is required when fulfillmentMethod is "delivery".',
    ) as any;
    error.statusCode = 400;
    error.code = "MISSING_DELIVERY_ADDRESS";
    throw error;
  }

  let totalAmount = 0;
  const orderItems: IOrderItem[] = [];

  // Pre-flight stock validation: verify each medicine exists at target pharmacy with sufficient stock
  for (const item of items) {
    if (!isValidObjectId(item.medicineId)) {
      const error = new Error(
        `VALIDATION_ERROR: Invalid medicineId format: ${item.medicineId}`,
      ) as any;
      error.statusCode = 400;
      error.code = "INVALID_OBJECT_ID";
      throw error;
    }

    const medicine = await Medicine.findOne({
      _id: item.medicineId,
      pharmacyId, // 🔒 Must belong to target pharmacy tenant
      isDeleted: false,
    }).session(session);

    if (!medicine) {
      const error = new Error(
        `MEDICINE_NOT_FOUND: Medicine ${item.medicineId} not found in pharmacy catalog.`,
      ) as any;
      error.statusCode = 404;
      error.code = "MEDICINE_NOT_FOUND";
      throw error;
    }

    if (medicine.totalStock < item.quantity) {
      const error = new Error(
        `INSUFFICIENT_STOCK: Only ${medicine.totalStock} units of ${medicine.name} available at this pharmacy.`,
      ) as any;
      error.statusCode = 400;
      error.code = "INSUFFICIENT_STOCK";
      throw error;
    }

    const lineTotal = medicine.unitPrice * item.quantity;
    totalAmount += lineTotal;

    // Snapshot critical fields for historical accuracy (FR-3.1)
    orderItems.push({
      medicineId: medicine._id as Types.ObjectId,
      medicineName: medicine.name,
      sku: medicine.sku,
      quantity: item.quantity,
      unitPrice: medicine.unitPrice,
      lineTotal,
    });
  }

  // Create pending order within transaction
  const [order] = await Order.create(
    [
      {
        customerId: new Types.ObjectId(customerId),
        pharmacyId: new Types.ObjectId(pharmacyId),
        items: orderItems,
        totalAmount,
        status: "pending",
        fulfillmentMethod,
        ...(fulfillmentMethod === "delivery" && deliveryAddress
          ? { deliveryAddress: deliveryAddress.trim() }
          : {}),
        statusHistory: [
          {
            status: "pending",
            changedBy: new Types.ObjectId(customerId),
            changedAt: new Date(),
          },
        ],
      },
    ],
    { session },
  );

  if (!order) {
    throw new Error("ORDER_CREATION_FAILED: Failed to create order document.");
  }

  return order;
};

/**
 * Atomic Order Approval and Stock Deduction (Pharmacy Manager)
 * - Validates order belongs to manager's pharmacy tenant
 * - Enforces allowed status transitions
 * - Atomically deducts stock using $inc + $gte guard
 * - Creates immutable GIN InventoryTransaction records per item
 * - Implements FEFO batch selection for regulatory traceability (EFDA)
 */
export const processOrderApproval = async (
  orderId: string,
  pharmacyId: string,
  managerId: string,
  session: ClientSession,
): Promise<IOrder> => {
  if (!isValidObjectId(orderId)) {
    const error = new Error("VALIDATION_ERROR: Invalid orderId format.") as any;
    error.statusCode = 400;
    error.code = "INVALID_OBJECT_ID";
    throw error;
  }

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

  if (order.status !== "pending") {
    const error = new Error(
      `INVALID_TRANSITION: Cannot approve order in '${order.status}' status.`,
    ) as any;
    error.statusCode = 400;
    error.code = "INVALID_TRANSITION";
    throw error;
  }

  // Process each order item: deduct stock atomically + create GIN ledger entry
  for (const item of order.items) {
    // Atomic stock deduction: only succeeds if totalStock >= requested quantity
    const medicineBefore = await Medicine.findOne({
      _id: item.medicineId,
      pharmacyId,
      totalStock: { $gte: item.quantity },
      isDeleted: false,
    }).session(session);

    if (!medicineBefore) {
      const error = new Error(
        `INSUFFICIENT_STOCK: Stock for ${item.medicineName} changed since order placement. Approval aborted.`,
      ) as any;
      error.statusCode = 409;
      error.code = "INSUFFICIENT_STOCK";
      throw error;
    }

    // Perform atomic $inc update
    const medicineAfter = await Medicine.findOneAndUpdate(
      { _id: item.medicineId, pharmacyId },
      { $inc: { totalStock: -item.quantity } },
      { new: true, session }, // new: true returns AFTER state
    );

    if (!medicineAfter) {
      throw new Error("Failed to update medicine stock during approval.");
    }

    // FEFO batch selection: deduct from earliest-expiring batch first (EFDA traceability)
    const batches = medicineAfter.batches
      .filter((b: IBatch) => b.quantity > 0)
      .sort(
        (a: IBatch, b: IBatch) =>
          a.expiryDate.getTime() - b.expiryDate.getTime(),
      );

    let remainingQty = item.quantity;
    for (const batch of batches) {
      if (remainingQty <= 0) break;
      const deductQty = Math.min(batch.quantity, remainingQty);
      batch.quantity -= deductQty;
      remainingQty -= deductQty;

      // Create immutable GIN ledger entry for this batch deduction
      await InventoryTransaction.create(
        [
          {
            pharmacyId,
            transactionType: "GIN",
            medicineId: item.medicineId,
            batchNumber: batch.batchNumber, // 🔒 Full batch traceability
            quantityChanged: -deductQty,
            stockBefore: medicineBefore.totalStock,
            stockAfter: medicineAfter.totalStock,
            reason: "Consumer Order Fulfillment (FEFO)",
            referenceNumber: order._id.toString(),
            expiryDate: batch.expiryDate,
            createdBy: new Types.ObjectId(managerId),
          },
        ],
        { session },
      );
    }

    // Persist batch quantity updates
    medicineAfter.markModified("batches");
    await medicineAfter.save({ session });
  }

  // Update order status and history
  const oldOrderData = order.toObject();
  order.status = "approved";
  order.approvedBy = new Types.ObjectId(managerId);
  order.approvedAt = new Date();
  order.statusHistory.push({
    status: "approved",
    changedBy: new Types.ObjectId(managerId),
    changedAt: new Date(),
  });

  await order.save({ session });

  return order;
};

/**
 * Generic status update handler for non-approval transitions
 */
export const processOrderStatusUpdate = async (
  orderId: string,
  pharmacyId: string,
  managerId: string,
  payload: UpdateOrderStatusPayload,
  session: ClientSession,
): Promise<IOrder> => {
  const { status, rejectionReason, note } = payload;

  if (!isValidObjectId(orderId)) {
    const error = new Error("VALIDATION_ERROR: Invalid orderId format.") as any;
    error.statusCode = 400;
    error.code = "INVALID_OBJECT_ID";
    throw error;
  }

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

  // Validate allowed transition
  const allowedNext = ALLOWED_TRANSITIONS[order.status];
  if (!allowedNext.includes(status)) {
    const error = new Error(
      `INVALID_TRANSITION: Cannot transition from '${order.status}' to '${status}'. Allowed: ${allowedNext.join(", ")}.`,
    ) as any;
    error.statusCode = 400;
    error.code = "INVALID_TRANSITION";
    throw error;
  }

  // Validate rejection reason requirement
  if (status === "rejected" && !rejectionReason?.trim()) {
    const error = new Error(
      "VALIDATION_ERROR: rejectionReason is required when rejecting an order.",
    ) as any;
    error.statusCode = 400;
    error.code = "REJECTION_REASON_REQUIRED";
    throw error;
  }

  const oldOrderData = order.toObject();

  // Apply status change
  order.status = status;

  if (status === "rejected") {
    order.rejectedBy = new Types.ObjectId(managerId);
    order.rejectedAt = new Date();
    order.rejectionReason = rejectionReason!.trim();
  }

  order.statusHistory.push({
    status,
    changedBy: new Types.ObjectId(managerId),
    changedAt: new Date(),
    ...(note ? { note: note.trim() } : {}),
  });

  await order.save({ session });

  return order;
};
