import api from "./api";

const NOTIFICATIONS_URL = "/notifications";

export type NotificationType =
  | "order_update"
  | "inventory_alert"
  | "system_update"
  | "payment_success";

export interface AppNotification {
  _id: string;
  recipient: string;
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export const fetchNotifications = async (): Promise<AppNotification[]> => {
  const response = await api.get(NOTIFICATIONS_URL);
  return response.data.data;
};

export const markNotificationAsRead = async (
  id: string,
): Promise<AppNotification> => {
  const response = await api.patch(`${NOTIFICATIONS_URL}/${id}/read`);
  return response.data.data;
};

export const markAllNotificationsAsRead = async () => {
  const response = await api.patch(`${NOTIFICATIONS_URL}/read-all`);
  return response.data.data;
};

export const deleteNotification = async (id: string) => {
  const response = await api.delete(`${NOTIFICATIONS_URL}/${id}`);
  return response.data.data;
};
