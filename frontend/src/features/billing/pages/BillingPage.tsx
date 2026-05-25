import {
  AccountBalanceOutlined,
  CheckCircleOutlined,
  ErrorOutlined,
  HourglassTopOutlined,
  PaymentsOutlined,
  ReceiptLongOutlined,
  WorkspacePremiumOutlined,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { useSearchParams } from "react-router-dom";
import SEO from "../../../components/SEO";
import { handleApiError } from "../../../utils/errorMapper";
import {
  fetchBillingPlans,
  fetchMyBilling,
  submitBillingPayment,
} from "../services/billingApi";
import { isPlanAvailable, isPurchasablePlanCode } from "../planPermissions";
import type {
  BillingPaymentMethod,
  BillingPlan,
  BillingPlanCode,
  BillingSubmission,
  SubscriptionStatus,
} from "../types";

const formatMoney = (amount: number | null, currency = "ETB") =>
  amount === null
    ? "Custom invoice"
    : `${currency} ${amount.toLocaleString("en-US")}`;

const formatDate = (value?: string) =>
  value
    ? new Date(value).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "Not set";

const statusLabels: Record<SubscriptionStatus, string> = {
  none: "Not started",
  trialing: "Trial",
  pending_review: "Pending review",
  active: "Active",
  past_due: "Past due",
  suspended: "Suspended",
};

const statusTone = (status: SubscriptionStatus) => {
  if (status === "active") return "success" as const;
  if (status === "pending_review" || status === "trialing") {
    return "warning" as const;
  }
  if (status === "past_due" || status === "suspended") {
    return "error" as const;
  }
  return "default" as const;
};

const submissionStatusIcon = (submission: BillingSubmission) => {
  if (submission.status === "approved") {
    return <CheckCircleOutlined color="success" fontSize="small" />;
  }
  if (submission.status === "rejected") {
    return <ErrorOutlined color="error" fontSize="small" />;
  }
  return <HourglassTopOutlined color="warning" fontSize="small" />;
};

export const BillingPage = () => {
  const [searchParams] = useSearchParams();
  const requestedPlan = searchParams.get("plan");

  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [selectedPlanCode, setSelectedPlanCode] = useState<BillingPlanCode>(
    isPurchasablePlanCode(requestedPlan) ? requestedPlan : "professional",
  );
  const [subscriptionStatus, setSubscriptionStatus] =
    useState<SubscriptionStatus>("none");
  const [currentPeriodEnd, setCurrentPeriodEnd] = useState<string | undefined>();
  const [submissions, setSubmissions] = useState<BillingSubmission[]>([]);
  const [paymentMethod, setPaymentMethod] =
    useState<BillingPaymentMethod>("bank_transfer");
  const [transactionReference, setTransactionReference] = useState("");
  const [payerName, setPayerName] = useState("");
  const [payerPhone, setPayerPhone] = useState("");
  const [customAmount, setCustomAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selectedPlan = useMemo(
    () => plans.find((plan) => plan.code === selectedPlanCode),
    [plans, selectedPlanCode],
  );
  const selectedPlanUnavailable =
    !selectedPlan || !isPlanAvailable(selectedPlan);

  const latestSubmission = submissions[0];

  const loadBilling = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [planData, summary] = await Promise.all([
        fetchBillingPlans(),
        fetchMyBilling(),
      ]);
      setPlans(planData);
      setSubscriptionStatus(summary.subscriptionStatus);
      setCurrentPeriodEnd(summary.pharmacy.subscriptionCurrentPeriodEnd);
      setSubmissions(summary.submissions);

      if (!isPurchasablePlanCode(requestedPlan)) {
        const currentPlan = summary.pharmacy.subscriptionPlan;
        setSelectedPlanCode(
          isPurchasablePlanCode(currentPlan) ? currentPlan : "professional",
        );
      }
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  }, [requestedPlan]);

  useEffect(() => {
    loadBilling();
  }, [loadBilling]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!transactionReference.trim()) {
      setError("Enter the bank, mobile money, or receipt reference.");
      return;
    }

    if (selectedPlanUnavailable) {
      setError("This billing plan is not available for purchase yet.");
      return;
    }

    const enterpriseAmount = Number(customAmount);
    if (selectedPlan?.requiresQuote && (!customAmount || enterpriseAmount <= 0)) {
      setError("Enter the invoice amount for the enterprise plan.");
      return;
    }

    setSubmitting(true);
    try {
      await submitBillingPayment({
        planCode: selectedPlanCode,
        paymentMethod,
        transactionReference,
        ...(selectedPlan?.requiresQuote ? { amount: enterpriseAmount } : {}),
        ...(payerName.trim() ? { payerName: payerName.trim() } : {}),
        ...(payerPhone.trim() ? { payerPhone: payerPhone.trim() } : {}),
        ...(note.trim() ? { note: note.trim() } : {}),
      });
      setSuccess("Payment submitted. An admin can now verify and activate it.");
      setTransactionReference("");
      setPayerName("");
      setPayerPhone("");
      setCustomAmount("");
      setNote("");
      await loadBilling();
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "grid", placeItems: "center", minHeight: 420 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1220, mx: "auto" }}>
      <SEO title="Subscription Billing" noIndex={true} />

      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        sx={{ justifyContent: "space-between", alignItems: { md: "center" } }}
      >
        <Box>
          <Typography variant="h4" sx={{ color: "primary.main", mb: 0.75 }}>
            Subscription Billing
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Submit payment references for admin verification and monthly access.
          </Typography>
        </Box>
        <Chip
          icon={<WorkspacePremiumOutlined />}
          color={statusTone(subscriptionStatus)}
          label={`${statusLabels[subscriptionStatus]} · renews ${formatDate(
            currentPeriodEnd,
          )}`}
          sx={{ alignSelf: { xs: "flex-start", md: "center" } }}
        />
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mt: 3 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mt: 3 }}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2.5, md: 3 },
              border: "1px solid rgba(23,35,31,0.1)",
              borderRadius: 2,
            }}
          >
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
              <PaymentsOutlined color="primary" />
              <Box>
                <Typography variant="h6">Submit verified payment</Typography>
                <Typography variant="body2" color="text.secondary">
                  The reference is checked by an admin before the subscription is
                  activated.
                </Typography>
              </Box>
            </Stack>

            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
              <TextField
                select
                fullWidth
                label="Plan"
                value={selectedPlanCode}
                onChange={(event) =>
                  setSelectedPlanCode(event.target.value as BillingPlanCode)
                }
                disabled={submitting}
                sx={{ mb: 2 }}
              >
                {plans.map((plan) => {
                  const planUnavailable = !isPlanAvailable(plan);
                  return (
                    <MenuItem
                      key={plan.code}
                      value={plan.code}
                      disabled={planUnavailable}
                    >
                      {plan.name} · {formatMoney(plan.amount, plan.currency)}
                      {planUnavailable ? " (unavailable)" : ""}
                    </MenuItem>
                  );
                })}
              </TextField>

              {selectedPlan && (
                <Box
                  sx={{
                    mb: 2,
                    p: 2,
                    borderRadius: 1,
                    bgcolor: alpha("#0F5E4D", 0.06),
                    border: "1px solid rgba(15,94,77,0.14)",
                  }}
                >
                  <Typography variant="subtitle2">
                    {selectedPlan.name}:{" "}
                    {formatMoney(selectedPlan.amount, selectedPlan.currency)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedPlan.description}
                  </Typography>
                  {selectedPlanUnavailable && (
                    <Typography
                      variant="caption"
                      color="error.main"
                      sx={{ display: "block", mt: 1 }}
                    >
                      This premium version is disabled until Enterprise Chain is
                      implemented.
                    </Typography>
                  )}
                </Box>
              )}

              {selectedPlan?.requiresQuote && !selectedPlanUnavailable && (
                <TextField
                  label="Invoice amount"
                  type="number"
                  fullWidth
                  value={customAmount}
                  onChange={(event) => setCustomAmount(event.target.value)}
                  disabled={submitting}
                  required
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">ETB</InputAdornment>
                      ),
                    },
                  }}
                  sx={{ mb: 2 }}
                />
              )}

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    select
                    fullWidth
                    label="Payment method"
                    value={paymentMethod}
                    onChange={(event) =>
                      setPaymentMethod(
                        event.target.value as BillingPaymentMethod,
                      )
                    }
                    disabled={submitting}
                  >
                    <MenuItem value="bank_transfer">Bank transfer</MenuItem>
                    <MenuItem value="mobile_money">Mobile money</MenuItem>
                    <MenuItem value="cash">Cash receipt</MenuItem>
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Payment reference"
                    fullWidth
                    value={transactionReference}
                    onChange={(event) =>
                      setTransactionReference(event.target.value)
                    }
                    required
                    disabled={submitting}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <ReceiptLongOutlined fontSize="small" />
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                </Grid>
              </Grid>

              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Payer name"
                    fullWidth
                    value={payerName}
                    onChange={(event) => setPayerName(event.target.value)}
                    disabled={submitting}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Payer phone"
                    fullWidth
                    value={payerPhone}
                    onChange={(event) => setPayerPhone(event.target.value)}
                    disabled={submitting}
                  />
                </Grid>
              </Grid>

              <TextField
                label="Admin note"
                fullWidth
                multiline
                minRows={3}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                disabled={submitting}
                sx={{ mt: 2 }}
              />

              <Button
                type="submit"
                variant="contained"
                disabled={submitting || selectedPlanUnavailable}
                startIcon={
                  submitting ? (
                    <CircularProgress color="inherit" size={18} />
                  ) : (
                    <AccountBalanceOutlined />
                  )
                }
                sx={{ mt: 3 }}
              >
                {submitting ? "Submitting" : "Submit for admin approval"}
              </Button>
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, lg: 5 }}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2.5, md: 3 },
              border: "1px solid rgba(23,35,31,0.1)",
              borderRadius: 2,
            }}
          >
            <Typography variant="h6" sx={{ mb: 2 }}>
              Verification history
            </Typography>
            {!latestSubmission ? (
              <Typography variant="body2" color="text.secondary">
                No subscription payments have been submitted yet.
              </Typography>
            ) : (
              <Stack spacing={2}>
                {submissions.map((submission) => (
                  <Box key={submission._id}>
                    <Stack
                      direction="row"
                      spacing={1.25}
                      sx={{ alignItems: "flex-start" }}
                    >
                      {submissionStatusIcon(submission)}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Stack
                          direction="row"
                          spacing={1}
                          sx={{
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <Typography variant="subtitle2">
                            {submission.planName}
                          </Typography>
                          <Chip
                            size="small"
                            label={submission.status.replace("_", " ")}
                            color={
                              submission.status === "approved"
                                ? "success"
                                : submission.status === "rejected"
                                  ? "error"
                                  : "warning"
                            }
                          />
                        </Stack>
                        <Typography variant="body2" color="text.secondary">
                          {formatMoney(
                            submission.amount,
                            submission.currency,
                          )}{" "}
                          · {submission.transactionReference}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Submitted {formatDate(submission.createdAt)}
                        </Typography>
                        {submission.coverageEndsAt && (
                          <Typography
                            variant="caption"
                            color="success.main"
                            sx={{ display: "block", mt: 0.5 }}
                          >
                            Active until {formatDate(submission.coverageEndsAt)}
                          </Typography>
                        )}
                        {submission.rejectionReason && (
                          <Typography
                            variant="caption"
                            color="error.main"
                            sx={{ display: "block", mt: 0.5 }}
                          >
                            {submission.rejectionReason}
                          </Typography>
                        )}
                      </Box>
                    </Stack>
                    <Divider sx={{ mt: 2 }} />
                  </Box>
                ))}
              </Stack>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default BillingPage;
