// src/features/reports/components/DetailedLogsTable.tsx
import { InfoOutlined, Visibility } from "@mui/icons-material";
import {
  Box,
  Chip,
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
                    <IconButton size="small" sx={{ color: "text.secondary" }}>
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
    </Paper>
  );
};
