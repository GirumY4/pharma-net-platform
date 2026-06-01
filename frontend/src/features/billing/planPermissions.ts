import type { AuthUser, IUser } from "../../types";
import type { BillingPlan, BillingPlanCode } from "./types";

type SubscriptionUser = Pick<
  IUser | AuthUser,
  "role" | "subscriptionStatus" | "subscriptionCurrentPeriodEnd"
>;

export const isPurchasablePlanCode = (
  value: string | null | undefined,
): value is Exclude<BillingPlanCode, "enterprise_chain"> =>
  value === "single_pharmacy" || value === "professional";

export const isPlanAvailable = (plan: BillingPlan): boolean =>
  plan.available !== false && plan.code !== "enterprise_chain";

export const hasActivePharmacySubscription = (
  user: SubscriptionUser | null | undefined,
): boolean => {
  if (!user || user.role !== "pharmacy_manager") return false;

  const periodEnd = user.subscriptionCurrentPeriodEnd
    ? new Date(user.subscriptionCurrentPeriodEnd)
    : null;

  return (
    user.subscriptionStatus === "active" &&
    periodEnd instanceof Date &&
    !Number.isNaN(periodEnd.getTime()) &&
    periodEnd.getTime() > Date.now()
  );
};
