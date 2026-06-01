import api from "../../../services/api";
import type { SuccessResponse } from "../../../types";

export interface ContactMessagePayload {
  name: string;
  email: string;
  phone?: string;
  message: string;
}

export const sendContactMessage = async (
  payload: ContactMessagePayload,
): Promise<string> => {
  const response = await api.post<SuccessResponse<{ deliveredTo: string }>>(
    "/support/contact",
    payload,
  );

  return response.data.message || "Message sent successfully.";
};
