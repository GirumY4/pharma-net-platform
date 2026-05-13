// src/features/admin/services/adminApi.ts
import api from "../../../services/api";
import type { IUser } from "../../../types";

export interface UserFilters {
  role?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
  includeDeleted?: boolean;
}

// GET /api/users
export const fetchUsers = async (filters: UserFilters) => {
  const params: Record<string, any> = {};
  if (filters.role) params.role = filters.role;
  if (filters.isActive !== undefined) params.isActive = filters.isActive;
  if (filters.page) params.page = filters.page;
  if (filters.limit) params.limit = filters.limit;
  if (filters.includeDeleted) params.includeDeleted = filters.includeDeleted;

  const response = await api.get("/users", { params });
  return response.data.data;
};

// PATCH /api/users/:id
export const updateUser = async (userId: string, payload: Partial<IUser>) => {
  const response = await api.patch(`/users/${userId}`, payload);
  return response.data.data;
};

// DELETE /api/users/:id (Soft Delete)
export const deactivateUser = async (userId: string) => {
  const response = await api.delete(`/users/${userId}`);
  return response.data;
};
