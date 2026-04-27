// src/modules/inventory/medicine.controller.ts
import type { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import Medicine from "./medicine.model.js";
import { logAction } from "../../utils/auditLogger.js";

/**
 * POST /api/medicines
 * Create a new medicine – tenant-scoped
 */
export const createMedicine = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Tenant context: pharmacyId comes ONLY from JWT for managers, from body for admin
    let pharmacyId: string;
    if (req.user?.role === "pharmacy_manager") {
      pharmacyId = req.user.pharmacyId!;
    } else if (req.user?.role === "admin") {
      pharmacyId = req.body.pharmacyId;
      if (!pharmacyId) {
        const err: any = new Error(
          "VALIDATION_ERROR: pharmacyId is required for admin",
        );
        err.statusCode = 400;
        throw err;
      }
    } else {
      const err: any = new Error("FORBIDDEN");
      err.statusCode = 403;
      throw err;
    }

    const {
      name,
      sku,
      genericName,
      category,
      description,
      unitPrice,
      unitOfMeasure,
      reorderThreshold = 50,
      initialBatch,
    } = req.body;

    // SKU uniqueness per pharmacy
    const existing = await Medicine.findOne({ sku, pharmacyId }).session(
      session,
    );
    if (existing) {
      const err: any = new Error(
        `SKU_EXISTS: Medicine with SKU ${sku} already exists in this pharmacy's catalog.`,
      );
      err.statusCode = 409;
      throw err;
    }

    const batches = initialBatch ? [initialBatch] : [];
    const totalStock = initialBatch?.quantity || 0;

    const [medicine] = await Medicine.create(
      [
        {
          pharmacyId,
          name,
          sku,
          genericName,
          category,
          description,
          unitPrice,
          unitOfMeasure,
          reorderThreshold,
          totalStock,
          batches,
          createdBy: req.user!.userId,
        },
      ],
      { session },
    );

    if (!medicine) {
      throw new Error(
        "Failed to create medicine: insertion returned no document or medicine is undefined",
      );
    }

    await logAction(
      req,
      "CREATE",
      "Medicine",
      medicine._id.toString(),
      null,
      medicine.toObject(),
      session,
    );

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: "Medicine added successfully.",
      data: medicine,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

/**
 * GET /api/medicines
 * Tenant-scoped list (Pharmacy Manager / Admin)
 */
export const getMedicines = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const {
      name,
      sku,
      category,
      lowStock,
      nearExpiry,
      page = "1",
      limit = "20",
    } = req.query;

    const query: any = { isDeleted: false };

    // Tenant isolation
    if (req.user?.role === "pharmacy_manager") {
      query.pharmacyId = req.user.pharmacyId;
    } else if (req.user?.role === "admin" && req.query.pharmacyId) {
      query.pharmacyId = req.query.pharmacyId;
    }

    if (name) query.name = { $regex: name as string, $options: "i" };
    if (sku) query.sku = sku as string;
    if (category) query.category = category as string;

    if (lowStock === "true") {
      query.$expr = { $lt: ["$totalStock", "$reorderThreshold"] };
    }

    if (nearExpiry === "true") {
      const ninetyDays = new Date();
      ninetyDays.setDate(ninetyDays.getDate() + 90);
      query.batches = {
        $elemMatch: { expiryDate: { $lte: ninetyDays, $gt: new Date() } },
      };
    }

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, parseInt(limit as string, 10) || 20);

    const total = await Medicine.countDocuments(query);
    const medicines = await Medicine.find(query)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: medicines,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/medicines/marketplace
 * Global marketplace search – public access (no auth required)
 * Uses aggregation pipeline for performance + correct city filtering
 */
export const getMarketplaceMedicines = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const {
      name,
      genericName,
      category,
      city,
      page = "1",
      limit = "20",
    } = req.query;

    // Base query: only active medicines with stock
    const baseQuery: any = { isDeleted: false, totalStock: { $gt: 0 } };

    if (name) baseQuery.name = { $regex: name as string, $options: "i" };
    if (genericName)
      baseQuery.genericName = { $regex: genericName as string, $options: "i" };
    if (category)
      baseQuery.category = { $regex: category as string, $options: "i" };

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, parseInt(limit as string, 10) || 20);

    // Aggregation pipeline to handle pharmacy filtering before pagination
    const pipeline: any[] = [
      { $match: baseQuery },

      // Join with pharmacy (users collection)
      {
        $lookup: {
          from: "users",
          localField: "pharmacyId",
          foreignField: "_id",
          as: "pharmacy",
        },
      },
      { $unwind: "$pharmacy" },

      // Only active pharmacies
      { $match: { "pharmacy.isActive": true } },
    ];

    // City filter (applied before pagination)
    if (city) {
      pipeline.push({
        $match: { "pharmacy.city": { $regex: city as string, $options: "i" } },
      });
    }

    // Facet for total count + paginated data in one query
    pipeline.push({
      $facet: {
        metadata: [{ $count: "total" }],
        data: [
          { $skip: (pageNum - 1) * limitNum },
          { $limit: limitNum },
          {
            $project: {
              _id: 0,
              medicineId: "$_id",
              name: 1,
              genericName: 1,
              category: 1,
              unitPrice: 1,
              unitOfMeasure: 1,
              totalStock: 1,
              pharmacyId: "$pharmacy._id",
              pharmacyName: "$pharmacy.name",
              pharmacyPhone: "$pharmacy.phoneNumber",
              pharmacyAddress: "$pharmacy.address",
              pharmacyCity: "$pharmacy.city",
              pharmacyLocation: "$pharmacy.location",
            },
          },
        ],
      },
    });

    const result = await Medicine.aggregate(pipeline);
    const { data = [], metadata = [] } = result[0] || {
      data: [],
      metadata: [],
    };
    const total = metadata[0]?.total || 0;

    res.status(200).json({
      success: true,
      data,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};
