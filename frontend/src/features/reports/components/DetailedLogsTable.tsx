// src/features/reports/components/DetailedLogsTable.tsx
import { InfoOutlined, Visibility } from "@mui/icons-material";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Pagination,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import { useState } from "react";

import type { TransactionLog } from "../types";

interface DetailedLogsTableProps {
  transactions: TransactionLog[] | null;
  loading: boolean;
  title?: string;
  onViewAll?: () => void;
}

export const DetailedLogsTable = ({
  transactions,
  loading,
  title = "Recent Inventory Transactions",
  onViewAll,
}: DetailedLogsTableProps) => {
  const [page, setPage] = useState(1);
  const [selectedTxn, setSelectedTxn] = useState<TransactionLog | null>(null);
  const rowsPerPage = 5;

  if (loading) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 0,
          borderRadius: 4,
          border: "1px solid rgba(0,0,0,0.06)",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            p: 3,
            borderBottom: "1px solid rgba(0,0,0,0.06)",
            bgcolor: "#FAFAFA",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box>
            <Skeleton variant="text" width={180} height={24} sx={{ mb: 1 }} />
            <Skeleton variant="text" width={220} height={18} />
          </Box>
          {onViewAll && (
            <Skeleton
              variant="rectangular"
              width={80}
              height={32}
              sx={{ borderRadius: 2 }}
            />
          )}
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                {[
                  "Type",
                  "Medicine",
                  "Batch",
                  "Qty Change",
                  "Date",
                  "Actions",
                ].map((header) => (
                  <TableCell
                    key={header}
                    sx={{ fontWeight: 700, color: "text.secondary" }}
                  >
                    <Skeleton variant="text" width={60} height={20} />
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {[...Array(rowsPerPage)].map((_, row) => (
                <TableRow key={row}>
                  {[...Array(6)].map((_, cell) => (
                    <TableCell key={cell}>
                      <Skeleton variant="text" width={50} height={18} />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 6,
          borderRadius: 4,
          border: "1px dashed rgba(23, 35, 31, 0.1)",
          textAlign: "center",
        }}
      >
        <Box
          sx={{
            mb: 2,
            color: "primary.main",
            bgcolor: "rgba(15, 139, 108, 0.08)",
            p: 2,
            borderRadius: "50%",
            display: "inline-flex",
          }}
        >
          <InfoOutlined fontSize="large" />
        </Box>
        <Typography
          variant="h6"
          color="#1E293B"
          sx={{ fontWeight: 700, mb: 1 }}
        >
          No recent transactions
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ maxWidth: 320, mx: "auto" }}
        >
          Inventory transactions will appear here once stock adjustments are
          recorded.
        </Typography>
      </Paper>
    );
  }

  const paginatedTransactions = transactions.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage,
  );
  const totalPages = Math.ceil(transactions.length / rowsPerPage);

  return (
    <Paper
      elevation={0}
      sx={{
        p: 0,
        borderRadius: 4,
        border: "1px solid rgba(0,0,0,0.06)",
        overflow: "hidden",
        boxShadow: "0 10px 40px rgba(0,0,0,0.03)",
      }}
    >
      <Box
        sx={{
          p: 3,
          borderBottom: "1px solid rgba(0,0,0,0.06)",
          bgcolor: "#FAFAFA",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box>
          <Typography variant="h6" color="#1E293B" sx={{ fontWeight: 800 }}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Latest stock movements (GRN/GIN) for audit review.
          </Typography>
        </Box>
        {onViewAll && (
          <Tooltip title="View all transactions">
            <IconButton
              size="small"
              onClick={onViewAll}
              sx={{
                color: "text.secondary",
                "&:hover": { color: "primary.main" },
              }}
            >
              <Visibility fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      <TableContainer>
        <Table>
          <TableHead sx={{ bgcolor: "rgba(0,0,0,0.02)" }}>
            <TableRow>
              <TableCell
                sx={{ fontWeight: 700, color: "text.secondary", width: 100 }}
              >
                Type
              </TableCell>
              <TableCell sx={{ fontWeight: 700, color: "text.secondary" }}>
                Medicine
              </TableCell>
              <TableCell
                sx={{ fontWeight: 700, color: "text.secondary", width: 120 }}
              >
                Batch
              </TableCell>
              <TableCell
                sx={{ fontWeight: 700, color: "text.secondary", width: 100 }}
                align="right"
              >
                Qty Change
              </TableCell>
              <TableCell
                sx={{ fontWeight: 700, color: "text.secondary", width: 120 }}
              >
                Date
              </TableCell>
              <TableCell
                sx={{ fontWeight: 700, color: "text.secondary", width: 80 }}
                align="right"
              >
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedTransactions.map((txn) => (
              <TableRow
                key={txn._id}
                hover
                sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
              >
                <TableCell>
                  <Chip
                    label={txn.transactionType}
                    size="small"
                    sx={{
                      fontWeight: 700,
                      fontSize: "0.7rem",
                      height: 24,
                      bgcolor:
                        txn.transactionType === "GRN"
                          ? "rgba(5, 150, 105, 0.12)"
                          : "rgba(217, 119, 6, 0.12)",
                      color:
                        txn.transactionType === "GRN" ? "#059669" : "#D97706",
                      border: `1px solid ${txn.transactionType === "GRN" ? "rgba(5, 150, 105, 0.3)" : "rgba(217, 119, 6, 0.3)"}`,
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 600, color: "#1E293B" }}
                  >
                    {txn.medicineName}
                  </Typography>
                  {txn.reason && (
                    <Typography variant="caption" color="text.secondary">
                      {txn.reason}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Typography
                    variant="body2"
                    sx={{ fontFamily: "monospace", fontSize: "0.85rem" }}
                  >
                    {txn.batchNumber}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 700,
                      color: txn.quantityChanged > 0 ? "#059669" : "#D97706",
                    }}
                  >
                    {txn.quantityChanged > 0 ? "+" : ""}
                    {txn.quantityChanged}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {new Date(txn.createdAt).toLocaleDateString()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(txn.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="View details">
                    <IconButton
                      size="small"
                      onClick={() => setSelectedTxn(txn)}
                      sx={{
                        color: "text.secondary",
                        "&:hover": { color: "primary.main" },
                      }}
                    >
                      <Visibility fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {totalPages > 1 && (
        <Box
          sx={{
            p: 2,
            display: "flex",
            justifyContent: "center",
            borderTop: "1px solid rgba(0,0,0,0.06)",
          }}
        >
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, newPage) => setPage(newPage)}
            size="small"
            color="primary"
          />
        </Box>
      )}

      <Dialog
        open={Boolean(selectedTxn)}
        onClose={() => setSelectedTxn(null)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: 3,
              p: 0.5,
              boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
            },
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, pb: 1.5, color: "#1E293B" }}>
          Transaction Details
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: "rgba(0,0,0,0.06)", py: 2.5 }}>
          {selectedTxn && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontWeight: 700, textTransform: "uppercase" }}
                >
                  Medicine
                </Typography>
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 700, color: "primary.main" }}
                >
                  {selectedTxn.medicineName}
                </Typography>
              </Box>

              <Box sx={{ display: "flex", gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontWeight: 700, textTransform: "uppercase" }}
                  >
                    Type
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip
                      label={selectedTxn.transactionType}
                      size="small"
                      sx={{
                        fontWeight: 700,
                        fontSize: "0.75rem",
                        bgcolor:
                          selectedTxn.transactionType === "GRN"
                            ? "rgba(5, 150, 105, 0.12)"
                            : "rgba(217, 119, 6, 0.12)",
                        color:
                          selectedTxn.transactionType === "GRN"
                            ? "#059669"
                            : "#D97706",
                        border: `1px solid ${selectedTxn.transactionType === "GRN" ? "rgba(5, 150, 105, 0.3)" : "rgba(217, 119, 6, 0.3)"}`,
                      }}
                    />
                  </Box>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontWeight: 700, textTransform: "uppercase" }}
                  >
                    Batch Number
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ fontFamily: "monospace", fontWeight: 650, mt: 0.5 }}
                  >
                    {selectedTxn.batchNumber}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: "flex", gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontWeight: 700, textTransform: "uppercase" }}
                  >
                    Quantity Changed
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 800,
                      color:
                        selectedTxn.quantityChanged > 0 ? "#059669" : "#D97706",
                      mt: 0.5,
                    }}
                  >
                    {selectedTxn.quantityChanged > 0 ? "+" : ""}
                    {selectedTxn.quantityChanged} units
                  </Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontWeight: 700, textTransform: "uppercase" }}
                  >
                    Date & Time
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 500 }}>
                    {new Date(selectedTxn.createdAt).toLocaleString([], {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </Typography>
                </Box>
              </Box>

              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontWeight: 700, textTransform: "uppercase" }}
                >
                  Reason / Remarks
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    mt: 0.5,
                    color: selectedTxn.reason
                      ? "text.primary"
                      : "text.secondary",
                    fontStyle: selectedTxn.reason ? "normal" : "italic",
                  }}
                >
                  {selectedTxn.reason ||
                    "No remarks provided for this transaction."}
                </Typography>
              </Box>

              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontWeight: 700, textTransform: "uppercase" }}
                >
                  Transaction ID
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: "monospace",
                    fontSize: "0.8rem",
                    color: "text.secondary",
                    mt: 0.5,
                  }}
                >
                  {selectedTxn._id}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() => setSelectedTxn(null)}
            variant="contained"
            disableElevation
            sx={{
              borderRadius: 2,
              fontWeight: 700,
              textTransform: "none",
              px: 3,
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};
