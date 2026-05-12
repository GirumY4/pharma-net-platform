import { useState } from "react";
import { Delete, Edit, InfoOutlined, KeyboardArrowDown, KeyboardArrowUp } from "@mui/icons-material";
import {
  Box,
  Chip,
  IconButton,
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
import type { IMedicine } from "../types";
import { BatchExpansionRow } from "./BatchExpansionRow";
import { StatusChip } from "./StatusChip";

interface InventoryTableProps {
  medicines: IMedicine[] | null;
  loading: boolean;
  error: string | null;
  onEdit: (medicine: IMedicine) => void;
  onDelete: (medicineId: string) => void;
}

const getStockStatus = (
  medicine: IMedicine,
): "healthy" | "low" | "critical" | "out" => {
  if (medicine.totalStock === 0) return "out";
  if (medicine.totalStock < medicine.reorderThreshold * 0.5) return "critical";
  if (medicine.totalStock < medicine.reorderThreshold) return "low";
  return "healthy";
};

const MedicineRow = ({
  medicine,
  onEdit,
  onDelete,
}: {
  medicine: IMedicine;
  onEdit: (medicine: IMedicine) => void;
  onDelete: (medicineId: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  const stockStatus = getStockStatus(medicine);

  return (
    <>
      <TableRow hover sx={{ "& > td": { borderBottom: "unset" } }}>
        <TableCell
          sx={{
            fontWeight: 600,
            fontFamily: "monospace",
            color: "#0F5E4D",
          }}
        >
          {medicine.sku}
        </TableCell>
        <TableCell>
          <Box>
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 600, color: "#1E293B" }}
            >
              {medicine.name}
            </Typography>
            {medicine.genericName && (
              <Typography variant="caption" color="text.secondary">
                {medicine.genericName}
              </Typography>
            )}
          </Box>
        </TableCell>
        <TableCell>
          <Chip
            label={medicine.category}
            size="small"
            sx={{
              height: 24,
              fontSize: "0.7rem",
              fontWeight: 600,
              bgcolor: "rgba(15, 139, 108, 0.08)",
              color: "#0F5E4D",
            }}
          />
        </TableCell>
        <TableCell align="right">
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            {medicine.totalStock.toLocaleString()}
          </Typography>
        </TableCell>
        <TableCell align="right">
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            ETB {medicine.unitPrice.toFixed(2)}
          </Typography>
        </TableCell>
        <TableCell>
          <StatusChip
            status={stockStatus}
            stockCount={medicine.totalStock}
            reorderThreshold={medicine.reorderThreshold}
          />
        </TableCell>
        <TableCell align="right">
          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 0.5 }}>
            <Tooltip title="Edit medicine">
              <span>
                <IconButton
                  size="small"
                  onClick={() => onEdit(medicine)}
                  sx={{
                    color: "text.secondary",
                    "&:hover": { color: "primary.main" },
                  }}
                >
                  <Edit fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Delete medicine">
              <span>
                <IconButton
                  size="small"
                  onClick={() => onDelete(medicine._id)}
                  sx={{
                    color: "text.secondary",
                    "&:hover": { color: "error.main" },
                  }}
                >
                  <Delete fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        </TableCell>
        <TableCell>
          {medicine.batches && medicine.batches.length > 0 && (
            <IconButton
              size="small"
              onClick={() => setOpen(!open)}
              sx={{ color: "text.secondary" }}
            >
              {open ? (
                <KeyboardArrowUp fontSize="small" />
              ) : (
                <KeyboardArrowDown fontSize="small" />
              )}
            </IconButton>
          )}
        </TableCell>
      </TableRow>
      <BatchExpansionRow
        batches={medicine.batches}
        medicineName={medicine.name}
        open={open}
      />
    </>
  );
};

export const InventoryTable = ({
  medicines,
  loading,
  error,
  onEdit,
  onDelete,
}: InventoryTableProps) => {
  if (loading) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 0,
          borderRadius: 4,
          border: "1px solid rgba(0,0,0,0.06)",
          overflowX: "auto",
        }}
      >
        <Box
          sx={{
            p: 3,
            borderBottom: "1px solid rgba(0,0,0,0.06)",
            bgcolor: "#FAFAFA",
          }}
        >
          <Skeleton variant="text" width={150} height={24} sx={{ mb: 1 }} />
          <Skeleton variant="text" width={250} height={18} />
        </Box>
        <TableContainer>
          <Table sx={{ minWidth: 800 }}>
            <TableHead>
              <TableRow>
                {[
                  "SKU",
                  "Name",
                  "Category",
                  "Stock",
                  "Price",
                  "Status",
                  "Actions",
                ].map((header) => (
                  <TableCell
                    key={header}
                    sx={{ fontWeight: 700, color: "text.secondary" }}
                  >
                    <Skeleton variant="text" width={80} height={20} />
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {[...Array(5)].map((_, row) => (
                <TableRow key={row}>
                  {[...Array(7)].map((_, cell) => (
                    <TableCell key={cell}>
                      <Skeleton variant="text" width={60} height={18} />
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

  if (error) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 4,
          borderRadius: 4,
          border: "1px solid rgba(0,0,0,0.06)",
          textAlign: "center",
        }}
      >
        <Typography color="error.main" sx={{ fontWeight: 600, mb: 1 }}>
          Unable to load inventory
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {error}
        </Typography>
      </Paper>
    );
  }

  if (!medicines || medicines.length === 0) {
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
          No medicines in catalog
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ maxWidth: 320, mx: "auto" }}
        >
          Start by adding your first medicine to begin managing inventory.
        </Typography>
      </Paper>
    );
  }

  return (
    <TableContainer
      component={Paper}
      sx={{
        borderRadius: 4,
        border: "1px solid rgba(0,0,0,0.06)",
        overflowX: "auto",
        boxShadow: "0 10px 40px rgba(0,0,0,0.03)",
      }}
    >
      <Table sx={{ minWidth: 800 }}>
        <TableHead sx={{ bgcolor: "rgba(0,0,0,0.02)" }}>
          <TableRow>
            <TableCell
              sx={{ fontWeight: 700, color: "text.secondary", width: 100 }}
            >
              SKU
            </TableCell>
            <TableCell sx={{ fontWeight: 700, color: "text.secondary" }}>
              Name
            </TableCell>
            <TableCell
              sx={{ fontWeight: 700, color: "text.secondary", width: 120 }}
            >
              Category
            </TableCell>
            <TableCell
              sx={{ fontWeight: 700, color: "text.secondary", width: 100 }}
              align="right"
            >
              Stock
            </TableCell>
            <TableCell
              sx={{ fontWeight: 700, color: "text.secondary", width: 100 }}
              align="right"
            >
              Price
            </TableCell>
            <TableCell
              sx={{ fontWeight: 700, color: "text.secondary", width: 120 }}
            >
              Status
            </TableCell>
            <TableCell
              sx={{ fontWeight: 700, color: "text.secondary", width: 100 }}
              align="right"
            >
              Actions
            </TableCell>
            <TableCell sx={{ width: 40 }} /> {/* Expansion toggle spacer */}
          </TableRow>
        </TableHead>
        <TableBody>
          {medicines.map((medicine) => (
            <MedicineRow
              key={medicine._id}
              medicine={medicine}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
