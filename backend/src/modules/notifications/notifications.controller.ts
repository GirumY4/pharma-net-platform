import type { NextFunction, Request, Response } from "express";
import mongoose, { type ClientSession } from "mongoose";
import { Notification } from "./notification.model.js";

const getAuthenticatedUserId = (req: Request): string => {
  const userId = req.user?.userId;

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    const error = new Error(
      "UNAUTHORIZED: Missing authenticated user context.",
    ) as any;
    error.statusCode = 401;
    error.code = "MISSING_USER_CONTEXT";
    throw error;
  }

  return userId;
};

export const getMyNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(req);
    const notifications = await Notification.find({ recipient: userId })
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      message: "Notifications retrieved successfully.",
      data: notifications,
    });
  } catch (error: any) {
    if (!error.statusCode) error.statusCode = 500;
    if (!error.code) error.code = "INTERNAL_ERROR";
    next(error);
  }
};

export const markAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = getAuthenticatedUserId(req);

    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipient: userId } as any,
      { isRead: true },
      { new: true },
    );

    if (!notification) {
      const error = new Error("NOT_FOUND: Notification not found.") as any;
      error.statusCode = 404;
      error.code = "NOT_FOUND";
      throw error;
    }

    res.status(200).json({
      success: true,
      message: "Notification marked as read.",
      data: notification,
    });
  } catch (error: any) {
    if (!error.statusCode) error.statusCode = 500;
    if (!error.code) error.code = "INTERNAL_ERROR";
    next(error);
  }
};

export const markAllAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(req);
    await Notification.updateMany(
      { recipient: userId, isRead: false },
      { isRead: true },
    );

    res.status(200).json({
      success: true,
      message: "All notifications marked as read.",
      data: null,
    });
  } catch (error: any) {
    if (!error.statusCode) error.statusCode = 500;
    if (!error.code) error.code = "INTERNAL_ERROR";
    next(error);
  }
};

export const deleteNotification = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = getAuthenticatedUserId(req);

    const result = await Notification.deleteOne({
      _id: id,
      recipient: userId,
    } as any);

    if (result.deletedCount === 0) {
      const error = new Error("NOT_FOUND: Notification not found.") as any;
      error.statusCode = 404;
      error.code = "NOT_FOUND";
      throw error;
    }

    res.status(200).json({
      success: true,
      message: "Notification deleted.",
      data: null,
    });
  } catch (error: any) {
    if (!error.statusCode) error.statusCode = 500;
    if (!error.code) error.code = "INTERNAL_ERROR";
    next(error);
  }
};

// Helper for other modules to create notifications
export const createNotification = async (
  data: {
    recipient: string | any;
    title: string;
    message: string;
    type: string;
    link?: string;
  },
  session?: ClientSession,
) => {
  if (!mongoose.Types.ObjectId.isValid(data.recipient)) {
    const error = new Error("VALIDATION_ERROR: Invalid notification recipient.") as any;
    error.statusCode = 400;
    error.code = "INVALID_NOTIFICATION_RECIPIENT";
    throw error;
  }

  const notification = new Notification(data);
  await notification.save(session ? { session } : {});
  return notification;
};
