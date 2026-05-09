import {
  Box,
  Chip,
  Collapse,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import type { IBatch } from "../types";

interface BatchExpansionRowProps {
  batches: IBatch[];
  medicineName: string;
  open: boolean;
}

export const BatchExpansionRow = ({
  batches,
  medicineName,
  open,
}: BatchExpansionRowProps) => {
  if (!batches || batches.length === 0) return null;

  const getExpiryStatus = (expiryDate: string) => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil(
      (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysUntilExpiry < 0)
      return { label: "Expired", color: "#6B7280", bg: "#F3F4F6" };
    if (daysUntilExpiry <= 30)
      return { label: "Critical", color: "#DC2626", bg: "#FEE2E2" };
    if (daysUntilExpiry <= 90)
      return { label: "Warning", color: "#D97706", bg: "#FEF3C7" };
    return { label: "Valid", color: "#059669", bg: "#D1FAE5" };
  };

  return (
    <TableRow sx={{ "& > td": { borderBottom: "none" } }}>
      <TableCell colSpan={8} sx={{ py: 0, px: 0 }}>
        <Collapse in={open} timeout="auto" unmountOnExit>
          <Box
            sx={{ m: 2, p: 3, bgcolor: "rgba(247, 250, 249, 0.6)", borderRadius: 2 }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 700, color: "#1E293B" }}
              >
                Batches for {medicineName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {batches.length} batch{batches.length !== 1 ? "es" : ""} • FEFO
                order
              </Typography>
            </Box>

            <Table
              size="small"
              sx={{ "& .MuiTableCell-root": { py: 1.5, px: 2 } }}
            >
              <TableHead>
                <TableRow sx={{ bgcolor: "rgba(0,0,0,0.02)" }}>
                  <TableCell sx={{ fontWeight: 700, color: "text.secondary" }}>
                    Batch #
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "text.secondary" }}>
                    GTIN
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "text.secondary" }}>
                    Quantity
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "text.secondary" }}>
                    Expiry
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "text.secondary" }}>
                    Status
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "text.secondary" }}>
                    Location
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {batches
                  .sort(
                    (a, b) =>
                      new Date(a.expiryDate).getTime() -
                      new Date(b.expiryDate).getTime(),
                  )
                  .map((batch) => {
                    const expiryStatus = getExpiryStatus(batch.expiryDate);
                    return (
                      <TableRow key={batch._id} hover>
                        <TableCell
                          sx={{ fontWeight: 600, fontFamily: "monospace" }}
                        >
                          {batch.batchNumber}
                        </TableCell>
                        <TableCell
                          sx={{ fontFamily: "monospace", fontSize: "0.85rem" }}
                        >
                          {batch.gtin || "—"}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>
                          {batch.quantity}
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 600,
                              color:
                                expiryStatus.label === "Expired"
                                  ? "#6B7280"
                                  : expiryStatus.label === "Critical"
                                    ? "#DC2626"
                                    : expiryStatus.label === "Warning"
                                      ? "#D97706"
                                      : "#059669",
                            }}
                          >
                            {new Date(batch.expiryDate).toLocaleDateString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={expiryStatus.label}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: "0.65rem",
                              fontWeight: 700,
                              bgcolor: expiryStatus.bg,
                              color: expiryStatus.color,
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ fontSize: "0.85rem" }}>
                          {batch.shelfLocation || "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </Box>
        </Collapse>
      </TableCell>
    </TableRow>
  );
};
