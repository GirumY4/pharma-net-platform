import api from "../../../services/api";
import type { SuccessResponse } from "../../../types";
import type {
  BillingPlan,
  BillingPlanCode,
  BillingSubmission,
  BillingSubmissionStatus,
  MyBillingSummary,
  ReviewBillingPayload,
  SubmitBillingPayload,
} from "../types";

export interface BillingSubmissionFilters {
  page?: number;
  limit?: number;
  status?: BillingSubmissionStatus;
  planCode?: BillingPlanCode;
}

export const fetchBillingPlans = async (): Promise<BillingPlan[]> => {
  const response =
    await api.get<SuccessResponse<BillingPlan[]>>("/billing/plans");
  return response.data.data;
};

export const fetchMyBilling = async (): Promise<MyBillingSummary> => {
  const response =
    await api.get<SuccessResponse<MyBillingSummary>>("/billing/me");
  return response.data.data;
};

export const submitBillingPayment = async (
  payload: SubmitBillingPayload,
): Promise<BillingSubmission> => {
  const response = await api.post<SuccessResponse<BillingSubmission>>(
    "/billing/submissions",
    payload,
  );
  return response.data.data;
};

export const fetchBillingSubmissions = async (
  filters: BillingSubmissionFilters = {},
) => {
  const params: Record<string, string | number> = {};
  if (filters.page) params.page = filters.page;
  if (filters.limit) params.limit = filters.limit;
  if (filters.status) params.status = filters.status;
  if (filters.planCode) params.planCode = filters.planCode;

  const response = await api.get<SuccessResponse<BillingSubmission[]>>(
    "/billing/submissions",
    { params },
  );
  return response.data;
};

export const reviewBillingPayment = async (
  submissionId: string,
  payload: ReviewBillingPayload,
): Promise<BillingSubmission> => {
  const response = await api.patch<SuccessResponse<BillingSubmission>>(
    `/billing/submissions/${submissionId}/review`,
    payload,
  );
  return response.data.data;
};
