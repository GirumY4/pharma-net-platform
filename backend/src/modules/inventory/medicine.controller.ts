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
 * PATCH /api/medicines/:id
 * Update medicine metadata – tenant-scoped
 */
export const updateMedicine = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const id = req.params.id as string;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      const err: any = new Error("VALIDATION_ERROR: Invalid medicine id.");
      err.statusCode = 400;
      err.code = "INVALID_OBJECT_ID";
      throw err;
    }

    // Tenant isolation
    let pharmacyId: string;
    if (req.user?.role === "pharmacy_manager") {
      pharmacyId = req.user.pharmacyId!;
    } else if (req.user?.role === "admin") {
      pharmacyId = req.body.pharmacyId || (req.query.pharmacyId as string);
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

    const medicine = await Medicine.findOne({
      _id: id,
      pharmacyId,
      isDeleted: false,
    }).session(session);

    if (!medicine) {
      const err: any = new Error(
        "MEDICINE_NOT_FOUND: Medicine not found in your catalog.",
      );
      err.statusCode = 404;
      err.code = "MEDICINE_NOT_FOUND";
      throw err;
    }

    const previousState = medicine.toObject();

    // Allowed update fields
    const {
      name,
      sku,
      genericName,
      category,
      description,
      unitPrice,
      unitOfMeasure,
      reorderThreshold,
    } = req.body;

    // If SKU is being changed, check uniqueness per pharmacy
    if (sku && sku !== medicine.sku) {
      const existing = await Medicine.findOne({
        sku,
        pharmacyId,
        _id: { $ne: id },
        isDeleted: false,
      }).session(session);
      if (existing) {
        const err: any = new Error(
          `SKU_EXISTS: Medicine with SKU ${sku} already exists in this pharmacy's catalog.`,
        );
        err.statusCode = 409;
        err.code = "SKU_EXISTS";
        throw err;
      }
    }

    // Apply updates only for provided fields
    if (name !== undefined) medicine.name = name;
    if (sku !== undefined) medicine.sku = sku;
    if (genericName !== undefined) medicine.genericName = genericName;
    if (category !== undefined) medicine.category = category;
    if (description !== undefined) medicine.description = description;
    if (unitPrice !== undefined) medicine.unitPrice = unitPrice;
    if (unitOfMeasure !== undefined) medicine.unitOfMeasure = unitOfMeasure;
    if (reorderThreshold !== undefined)
      medicine.reorderThreshold = reorderThreshold;

    await medicine.save({ session });

    await logAction(
      req,
      "UPDATE",
      "Medicine",
      medicine._id.toString(),
      previousState,
      medicine.toObject(),
      session,
    );

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: "Medicine updated successfully.",
      data: medicine,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

/**
 * DELETE /api/medicines/:id
 * Soft-delete a medicine – tenant-scoped
 */
export const deleteMedicine = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const id = req.params.id as string;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      const err: any = new Error("VALIDATION_ERROR: Invalid medicine id.");
      err.statusCode = 400;
      err.code = "INVALID_OBJECT_ID";
      throw err;
    }

    // Tenant isolation
    let pharmacyId: string;
    if (req.user?.role === "pharmacy_manager") {
      pharmacyId = req.user.pharmacyId!;
    } else if (req.user?.role === "admin") {
      pharmacyId = req.body.pharmacyId || (req.query.pharmacyId as string);
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

    const medicine = await Medicine.findOne({
      _id: id,
      pharmacyId,
      isDeleted: false,
    }).session(session);

    if (!medicine) {
      const err: any = new Error(
        "MEDICINE_NOT_FOUND: Medicine not found in your catalog.",
      );
      err.statusCode = 404;
      err.code = "MEDICINE_NOT_FOUND";
      throw err;
    }

    const previousState = medicine.toObject();

    // Soft delete
    medicine.isDeleted = true;
    medicine.deletedAt = new Date();
    await medicine.save({ session });

    await logAction(
      req,
      "DELETE",
      "Medicine",
      medicine._id.toString(),
      previousState,
      medicine.toObject(),
      session,
    );

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: "Medicine deleted successfully.",
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
const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const asPositiveNumber = (value: unknown): number | undefined => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) && numericValue >= 0
    ? numericValue
    : undefined;
};

const asCoordinate = (value: unknown): number | undefined => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : undefined;
};

const marketplaceProjection = {
  _id: 0,
  medicineId: "$_id",
  name: 1,
  genericName: 1,
  category: 1,
  description: 1,
  unitPrice: 1,
  unitOfMeasure: 1,
  totalStock: 1,
  pharmacyId: "$pharmacy._id",
  pharmacyName: "$pharmacy.name",
  pharmacyPhone: "$pharmacy.phoneNumber",
  pharmacyAddress: "$pharmacy.address",
  pharmacyCity: "$pharmacy.city",
  pharmacyLocation: "$pharmacy.location",
  distanceKm: 1,
};

const buildMarketplacePipeline = (
  query: Request["query"],
  options: { medicineId?: string } = {},
) => {
  const { name, genericName, category, city, maxPrice, minStock, lat, lng } =
    query;
  const baseQuery: any = { isDeleted: false, totalStock: { $gt: 0 } };

  if (options.medicineId) {
    baseQuery._id = new mongoose.Types.ObjectId(options.medicineId);
  }

  if (name) {
    const regex = { $regex: escapeRegExp(String(name)), $options: "i" };
    baseQuery.$or = [
      { name: regex },
      { genericName: regex },
      { category: regex },
    ];
  }

  if (genericName) {
    baseQuery.genericName = {
      $regex: escapeRegExp(String(genericName)),
      $options: "i",
    };
  }

  if (category) {
    baseQuery.category = {
      $regex: `^${escapeRegExp(String(category))}$`,
      $options: "i",
    };
  }

  const parsedMaxPrice = asPositiveNumber(maxPrice);
  if (parsedMaxPrice !== undefined) {
    baseQuery.unitPrice = {
      ...(baseQuery.unitPrice || {}),
      $lte: parsedMaxPrice,
    };
  }

  const parsedMinStock = asPositiveNumber(minStock);
  if (parsedMinStock !== undefined) {
    baseQuery.totalStock = { ...baseQuery.totalStock, $gte: parsedMinStock };
  }

  const pipeline: any[] = [
    { $match: baseQuery },
    {
      $lookup: {
        from: "users",
        localField: "pharmacyId",
        foreignField: "_id",
        as: "pharmacy",
      },
    },
    { $unwind: "$pharmacy" },
    {
      $match: {
        "pharmacy.role": "pharmacy_manager",
        "pharmacy.isActive": true,
        "pharmacy.isDeleted": false,
      },
    },
  ];

  if (city) {
    pipeline.push({
      $match: {
        "pharmacy.city": {
          $regex: escapeRegExp(String(city)),
          $options: "i",
        },
      },
    });
  }

  const userLat = asCoordinate(lat);
  const userLng = asCoordinate(lng);
  if (userLat !== undefined && userLng !== undefined) {
    pipeline.push(
      {
        $addFields: {
          distanceKm: {
            $cond: [
              {
                $and: [
                  { $ne: ["$pharmacy.location", null] },
                  { $ne: ["$pharmacy.location.lat", null] },
                  { $ne: ["$pharmacy.location.lng", null] },
                ],
              },
              {
                $let: {
                  vars: {
                    lat1: { $degreesToRadians: userLat },
                    lng1: { $degreesToRadians: userLng },
                    lat2: { $degreesToRadians: "$pharmacy.location.lat" },
                    lng2: { $degreesToRadians: "$pharmacy.location.lng" },
                  },
                  in: {
                    $multiply: [
                      6371,
                      {
                        $acos: {
                          $min: [
                            1,
                            {
                              $max: [
                                -1,
                                {
                                  $add: [
                                    {
                                      $multiply: [
                                        { $sin: "$$lat1" },
                                        { $sin: "$$lat2" },
                                      ],
                                    },
                                    {
                                      $multiply: [
                                        { $cos: "$$lat1" },
                                        { $cos: "$$lat2" },
                                        {
                                          $cos: {
                                            $subtract: ["$$lng2", "$$lng1"],
                                          },
                                        },
                                      ],
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
              },
              null,
            ],
          },
        },
      },
      {
        $addFields: {
          distanceSortKey: { $ifNull: ["$distanceKm", 999999] },
        },
      },
      { $sort: { distanceSortKey: 1, unitPrice: 1, name: 1 } },
    );
  } else {
    pipeline.push({ $sort: { name: 1, unitPrice: 1 } });
  }

  return pipeline;
};

export const getMarketplaceMedicines = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const pageNum = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limitNum = Math.min(
      100,
      Math.max(1, parseInt(req.query.limit as string, 10) || 20),
    );
    const pipeline = buildMarketplacePipeline(req.query);

    pipeline.push({
      $facet: {
        metadata: [{ $count: "total" }],
        data: [
          { $skip: (pageNum - 1) * limitNum },
          { $limit: limitNum },
          { $project: marketplaceProjection },
        ],
      },
    });

    const [result] = await Medicine.aggregate(pipeline);
    const { data = [], metadata = [] } = result || {
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

export const getMarketplaceMedicineById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = String(req.params.id || "");
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      const error = new Error("VALIDATION_ERROR: Invalid medicine id.") as any;
      error.statusCode = 400;
      error.code = "INVALID_OBJECT_ID";
      throw error;
    }

    const [medicine] = await Medicine.aggregate([
      ...buildMarketplacePipeline(req.query, { medicineId: id }),
      { $limit: 1 },
      { $project: marketplaceProjection },
    ]);

    if (!medicine) {
      const error = new Error(
        "MEDICINE_NOT_FOUND: Marketplace medicine not found.",
      ) as any;
      error.statusCode = 404;
      error.code = "MEDICINE_NOT_FOUND";
      throw error;
    }

    res.status(200).json({
      success: true,
      data: medicine,
    });
  } catch (error) {
    next(error);
  }
};
