import type { JwtPayload, UserRole } from "../types";

export const decodeJwtPayload = (token: string): JwtPayload | null => {
  try {
    const payloadBase64 = token.split(".")[1];
    const payloadJson = atob(
      payloadBase64.replace(/-/g, "+").replace(/_/g, "/"),
    );
    return JSON.parse(payloadJson) as JwtPayload;
  } catch {
    return null;
  }
};

export const getRoleFromToken = (token: string): UserRole | null => {
  const payload = decodeJwtPayload(token);
  return payload?.role || null;
};

export const getPharmacyIdFromToken = (token: string): string | null => {
  const payload = decodeJwtPayload(token);
  return payload?.pharmacyId || null;
};
