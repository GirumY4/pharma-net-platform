import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/useAuth";
import { hasActivePharmacySubscription } from "../features/billing/planPermissions";

export const SubscriptionRoute = () => {
  const { role, user } = useAuth();
  const location = useLocation();

  if (role === "pharmacy_manager" && !hasActivePharmacySubscription(user)) {
    return (
      <Navigate
        to="/billing"
        state={{ from: location }}
        replace
      />
    );
  }

  return <Outlet />;
};
