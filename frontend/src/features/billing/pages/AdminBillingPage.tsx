import {
  CheckCircleOutlined,
  CloseOutlined,
  PaymentsOutlined,
  RefreshOutlined,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Pagination,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import SEO from "../../../components/SEO";
import { handleApiError } from "../../../utils/errorMapper";
import {
  fetchBillingSubmissions,
  reviewBillingPayment,
} from "../services/billingApi";
import type {
  BillingPlanCode,
  BillingSubmission,
  BillingSubmissionStatus,
  BillingUserSummary,
} from "../types";

const formatMoney = (amount: number, currency = "ETB") =>
  `${currency} ${amount.toLocaleString("en-US")}`;

const formatDateTime = (value?: string) =>
  value
    ? new Date(value).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Not set";

const getUserSummary = (value: string | BillingUserSummary) =>
  typeof value === "string" ? { _id: value, name: value } : value;

const statusColor = (status: BillingSubmissionStatus) => {
  if (status === "approved") return "success" as const;
  if (status === "rejected") return "error" as const;
  return "warning" as const;
};

export const AdminBillingPage = () => {
  const [submissions, setSubmissions] = useState<BillingSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<
    BillingSubmissionStatus | "all"
  >("pending_review");
  const [planFilter, setPlanFilter] = useState<BillingPlanCode | "all">("all");
  const [rejectTarget, setRejectTarget] =
    useState<BillingSubmission | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const loadSubmissions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchBillingSubmissions({
        page,
        limit: 10,
        ...(statusFilter !== "all" ? { status: statusFilter } : {}),
        ...(planFilter !== "all" ? { planCode: planFilter } : {}),
      });
      setSubmissions(response.data);
      setTotalPages(response.pagination?.totalPages || 1);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  }, [page, planFilter, statusFilter]);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  const handleApprove = async (submission: BillingSubmission) => {
    setProcessingId(submission._id);
    setError(null);
    setSuccess(null);
    try {
      await reviewBillingPayment(submission._id, { decision: "approved" });
      setSuccess("Subscription payment approved and access updated.");
      await loadSubmissions();
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;

    if (!rejectionReason.trim()) {
      setError("Add a rejection reason so the pharmacy can correct it.");
      return;
    }

    setProcessingId(rejectTarget._id);
    setError(null);
    setSuccess(null);
    try {
      await reviewBillingPayment(rejectTarget._id, {
        decision: "rejected",
        rejectionReason,
      });
      setSuccess("Subscription payment rejected with a reason.");
      setRejectTarget(null);
      setRejectionReason("");
      await loadSubmissions();
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <SEO title="Billing Approvals" noIndex={true} />
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        sx={{ justifyContent: "space-between", alignItems: { md: "center" } }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: "primary.main" }}>
            Billing Approvals
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Verify subscription payments before activating pharmacy access.
          </Typography>
        </Box>
        <Tooltip title="Refresh billing queue">
          <IconButton onClick={loadSubmissions} disabled={loading}>
            <RefreshOutlined />
          </IconButton>
        </Tooltip>
      </Stack>

      <Paper
        sx={{ p: 2, my: 3, display: "flex", gap: 2, flexWrap: "wrap" }}
        elevation={0}
      >
        <FormControl size="small" sx={{ minWidth: 170 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={(event) => {
              setStatusFilter(
                event.target.value as BillingSubmissionStatus | "all",
              );
              setPage(1);
            }}
          >
            <MenuItem value="pending_review">Pending review</MenuItem>
            <MenuItem value="approved">Approved</MenuItem>
            <MenuItem value="rejected">Rejected</MenuItem>
            <MenuItem value="all">All status</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 190 }}>
          <InputLabel>Plan</InputLabel>
          <Select
            value={planFilter}
            label="Plan"
            onChange={(event) => {
              setPlanFilter(event.target.value as BillingPlanCode | "all");
              setPage(1);
            }}
          >
            <MenuItem value="all">All plans</MenuItem>
            <MenuItem value="single_pharmacy">Single Pharmacy</MenuItem>
            <MenuItem value="professional">Professional</MenuItem>
            <MenuItem value="enterprise_chain">Enterprise Chain</MenuItem>
          </Select>
        </FormControl>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <TableContainer component={Paper} elevation={0}>
        <Table>
          <TableHead sx={{ bgcolor: "background.default" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Pharmacy</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Plan</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Payment</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Submitted</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                  <CircularProgress size={26} />
                </TableCell>
              </TableRow>
            ) : submissions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                  No billing submissions found.
                </TableCell>
              </TableRow>
            ) : (
              submissions.map((submission) => {
                const pharmacy = getUserSummary(submission.pharmacyId);
                const isPending = submission.status === "pending_review";
                const isProcessing = processingId === submission._id;
                const isUnavailablePlan =
                  submission.planCode === "enterprise_chain";

                return (
                  <TableRow key={submission._id} hover>
                    <TableCell>
                      <Typography variant="subtitle2">
                        {pharmacy.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {pharmacy.email || pharmacy.city || pharmacy._id}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {submission.planName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {submission.billingPeriod}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatMoney(submission.amount, submission.currency)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {submission.paymentMethod.replace("_", " ")} ·{" "}
                        {submission.transactionReference}
                      </Typography>
                    </TableCell>
                    <TableCell>{formatDateTime(submission.createdAt)}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        color={statusColor(submission.status)}
                        icon={<PaymentsOutlined />}
                        label={submission.status.replace("_", " ")}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Stack
                        direction="row"
                        spacing={1}
                        sx={{ justifyContent: "flex-end" }}
                      >
                        <Tooltip
                          title={
                            isUnavailablePlan
                              ? "Enterprise Chain is disabled for now."
                              : "Approve subscription payment"
                          }
                        >
                          <span>
                            <Button
                              size="small"
                              variant="contained"
                              color="success"
                              startIcon={
                                isProcessing ? (
                                  <CircularProgress color="inherit" size={16} />
                                ) : (
                                  <CheckCircleOutlined />
                                )
                              }
                              disabled={
                                !isPending ||
                                Boolean(processingId) ||
                                isUnavailablePlan
                              }
                              onClick={() => handleApprove(submission)}
                            >
                              Approve
                            </Button>
                          </span>
                        </Tooltip>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          startIcon={<CloseOutlined />}
                          disabled={!isPending || Boolean(processingId)}
                          onClick={() => {
                            setRejectTarget(submission);
                            setRejectionReason("");
                          }}
                        >
                          Reject
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {totalPages > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, value) => setPage(value)}
            color="primary"
          />
        </Box>
      )}

      <Dialog
        open={Boolean(rejectTarget)}
        onClose={() => setRejectTarget(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Reject payment?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Add the reason the reference could not be verified.
          </Typography>
          <TextField
            autoFocus
            label="Rejection reason"
            fullWidth
            multiline
            minRows={3}
            value={rejectionReason}
            onChange={(event) => setRejectionReason(event.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectTarget(null)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleReject}
            disabled={Boolean(processingId)}
          >
            Reject payment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminBillingPage;
