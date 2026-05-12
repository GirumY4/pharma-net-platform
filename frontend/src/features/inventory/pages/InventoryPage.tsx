import { Add, Close, Refresh, Search } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  InputAdornment,
  Pagination,
  Snackbar,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useCallback, useState } from "react";
import { surface, tokens } from "../../../styles/theme";
import { handleApiError } from "../../../utils/errorMapper";
import { InventoryTable } from "../components/InventoryTable";
import { MedicineForm } from "../components/MedicineForm";
import { MedicineFormDrawer } from "../components/MedicineFormDrawer";
import { useInventory } from "../hooks/useInventory";
import {
  createMedicine,
  deleteMedicine,
  updateMedicine,
} from "../services/inventoryApi";
import type { MedicineFormValues } from "../types";

export const InventoryPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilters, setActiveFilters] = useState<{
    lowStock: boolean;
    nearExpiry: boolean;
  }>({
    lowStock: false,
    nearExpiry: false,
  });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<any>(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Inline add section toggle
  const [inlineAddOpen, setInlineAddOpen] = useState(false);

  // Delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [medicineToDelete, setMedicineToDelete] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Snackbar state
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({
    open: false,
    message: "",
    severity: "success",
  });

  const { medicines, loading, error, pagination, refresh, updateFilters } =
    useInventory({ page: 1, limit: 20 });

  const handleSearch = useCallback(
    (value: string) => {
      setSearchTerm(value);
      updateFilters({ name: value || undefined });
    },
    [updateFilters],
  );

  const toggleFilter = useCallback(
    (filter: "lowStock" | "nearExpiry") => {
      const newValue = !activeFilters[filter];
      setActiveFilters((prev) => ({ ...prev, [filter]: newValue }));
      updateFilters({ [filter]: newValue || undefined });
    },
    [activeFilters, updateFilters],
  );

  const handleAddNew = () => {
    setEditingMedicine(null);
    setDrawerOpen(true);
  };

  const handleInlineToggle = () => {
    setInlineAddOpen((prev) => !prev);
  };

  const handleEdit = (medicine: any) => {
    setEditingMedicine(medicine);
    setDrawerOpen(true);
  };

  const confirmDelete = (medicineId: string) => {
    setMedicineToDelete(medicineId);
    setDeleteDialogOpen(true);
  };

  const executeDelete = async () => {
    if (!medicineToDelete) return;
    setDeleteLoading(true);
    try {
      await deleteMedicine(medicineToDelete);
      await refresh();
      setSnackbar({
        open: true,
        message: "Medicine deleted successfully",
        severity: "success",
      });
      setDeleteDialogOpen(false);
      setMedicineToDelete(null);
    } catch (err) {
      const message = handleApiError(err);
      setSnackbar({ open: true, message, severity: "error" });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSubmit = async (
    data: MedicineFormValues,
    medicineId?: string,
  ) => {
    setSubmitLoading(true);
    try {
      if (medicineId) {
        await updateMedicine(medicineId, data);
      } else {
        await createMedicine(data);
      }
      await refresh();
      setSnackbar({
        open: true,
        message: medicineId
          ? "Medicine updated successfully"
          : "Medicine added successfully",
        severity: "success",
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handlePageChange = (_: React.ChangeEvent<unknown>, page: number) => {
    if (pagination) {
      updateFilters({ page });
    }
  };

  return (
    <Box>
      {/* ─────────────── Page Header ─────────────── */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "stretch", sm: "flex-start" },
          gap: { xs: 2, sm: 3 },
          mb: 3,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{
              color: "primary.main",
              fontWeight: 800,
              letterSpacing: "-0.5px",
              fontSize: { xs: "1.5rem", sm: "1.75rem", md: "2.05rem" },
              mb: 0.5,
            }}
          >
            Inventory Management
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{
              fontSize: { xs: "0.88rem", sm: "0.95rem", md: "1.05rem" },
              maxWidth: 640,
              lineHeight: 1.65,
            }}
          >
            Manage your pharmacy's medicine catalog, track stock levels, and
            monitor batch expiry dates to ensure availability and compliance.
          </Typography>
        </Box>

        {/* Refresh button — visible on larger screens */}
        <Tooltip title="Refresh inventory">
          <span>
            <Button
              onClick={refresh}
              disabled={loading}
              size="medium"
              startIcon={
                loading ? (
                  <CircularProgress size={16} />
                ) : (
                  <Refresh />
                )
              }
              variant="outlined"
              sx={{
                alignSelf: { xs: "flex-start", sm: "center" },
                borderColor: surface.border,
                color: "text.secondary",
                fontWeight: 700,
                "&:hover": {
                  bgcolor: (t) => alpha(t.palette.primary.main, 0.05),
                  borderColor: "primary.main",
                  color: "primary.main",
                },
              }}
            >
              Refresh
            </Button>
          </span>
        </Tooltip>
      </Box>

      {/* ────────── Search, Filters & Add ────────── */}
      <Box
        sx={{
          display: "flex",
          gap: { xs: 1.5, sm: 2 },
          alignItems: "center",
          flexWrap: "wrap",
          mb: 3,
        }}
      >
        <TextField
          placeholder="Search by name or SKU…"
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          size="small"
          sx={{ minWidth: { xs: "100%", sm: 260 }, flex: { sm: "0 1 320px" } }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: "text.secondary" }} />
                </InputAdornment>
              ),
            },
          }}
        />

        <Chip
          label="Low Stock"
          onClick={() => toggleFilter("lowStock")}
          color={activeFilters.lowStock ? "primary" : "default"}
          variant={activeFilters.lowStock ? "filled" : "outlined"}
        />
        <Chip
          label="Near Expiry"
          onClick={() => toggleFilter("nearExpiry")}
          color={activeFilters.nearExpiry ? "primary" : "default"}
          variant={activeFilters.nearExpiry ? "filled" : "outlined"}
        />

        <Box sx={{ flexGrow: 1 }} />

        <Button
          variant="contained"
          startIcon={inlineAddOpen ? <Close /> : <Add />}
          onClick={handleInlineToggle}
        >
          {inlineAddOpen ? "Close" : "Add Medicine"}
        </Button>
      </Box>

      {/* ──────── Inline Add Medicine Section ──────── */}
      <Collapse in={inlineAddOpen} timeout={360} unmountOnExit>
        <Box sx={{ display: "flex", justifyContent: "center", mb: 1 }}>
          <Divider
            sx={{
              width: { xs: "60%", sm: "45%", md: "35%" },
              borderColor: (t) => alpha(t.palette.primary.main, 0.18),
            }}
          />
        </Box>

        <Box sx={{ py: { xs: 2, sm: 3 } }}>
          <MedicineForm
            onSubmit={async (data) => {
              await handleSubmit(data);
              setInlineAddOpen(false);
            }}
            onCancel={() => setInlineAddOpen(false)}
            loading={submitLoading}
          />
        </Box>

        <Box sx={{ display: "flex", justifyContent: "center", mt: 1 }}>
          <Divider
            sx={{
              width: { xs: "60%", sm: "45%", md: "35%" },
              borderColor: (t) => alpha(t.palette.primary.main, 0.18),
            }}
          />
        </Box>
      </Collapse>

      {/* spacer when inline is open */}
      {inlineAddOpen && <Box sx={{ mb: 3 }} />}

      {/* ─────────────── Inventory Table ─────────── */}
      <InventoryTable
        medicines={medicines}
        loading={loading}
        error={error}
        onEdit={handleEdit}
        onDelete={confirmDelete}
      />

      {/* ────────────────── Pagination ──────────── */}
      {pagination && pagination.totalPages > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <Pagination
            count={pagination.totalPages}
            page={pagination.page}
            onChange={handlePageChange}
            color="primary"
            showFirstButton
            showLastButton
          />
        </Box>
      )}

      {/* ─────────── Add/Edit Drawer ─────────── */}
      <MedicineFormDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSubmit={handleSubmit}
        initialData={editingMedicine}
        loading={submitLoading}
      />

      {/* ─────── Delete Confirmation Dialog ───── */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => {
          if (!deleteLoading) setDeleteDialogOpen(false);
        }}
        slotProps={{
          paper: {
            sx: {
              borderRadius: 4,
              p: 1,
              border: `1px solid ${surface.border}`,
              boxShadow: tokens.shadow.panel,
            },
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: "text.primary" }}>
          Delete Medicine
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: "text.secondary" }}>
            Are you sure you want to delete this medicine? This action cannot be
            undone and will permanently remove it from the catalog.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            disabled={deleteLoading}
            sx={{ color: "text.secondary" }}
          >
            Cancel
          </Button>
          <Button
            onClick={executeDelete}
            color="error"
            variant="contained"
            disabled={deleteLoading}
            startIcon={
              deleteLoading ? (
                <CircularProgress size={20} color="inherit" />
              ) : undefined
            }
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* ────────────── Notifications ────────── */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};
