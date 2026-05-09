import { Add, Refresh, Search } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
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
import { useCallback, useState } from "react";
import { handleApiError } from "../../../utils/errorMapper";
import { InventoryTable } from "../components/InventoryTable";
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
      {/* Page Header */}
      <Box sx={{ mb: 3 }}>
        <Box>
          <Typography
            variant="h4"
            color="#0F5E4D"
            sx={{ fontWeight: 800, letterSpacing: "-0.5px", mb: 1 }}
          >
            Inventory Management
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ fontSize: "1.1rem", maxWidth: 800 }}
          >
            Manage your pharmacy's medicine catalog, track stock levels across
            all branches, and monitor batch expiry dates to ensure continuous
            availability and regulatory compliance.
          </Typography>
        </Box>
      </Box>

      {/* Divider */}
      <Divider
        sx={{
          mb: 3,
          maxWidth: 200,
          borderWidth: 2,
          borderColor: "primary.main",
          borderRadius: 2,
        }}
      />

      {/* Search & Filters & Add Button */}
      <Box
        sx={{
          display: "flex",
          gap: 2,
          alignItems: "center",
          flexWrap: "wrap",
          mb: 4,
          justifyContent: "space-between",
        }}
      >
        <Box
          sx={{
            display: "flex",
            gap: 2,
            alignItems: "center",
            flexWrap: "wrap",
            flex: 1,
          }}
        >
          <TextField
            placeholder="Search by name or SKU..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            size="small"
            sx={{ minWidth: 280 }}
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
            sx={{ fontWeight: 600 }}
          />
          <Chip
            label="Near Expiry"
            onClick={() => toggleFilter("nearExpiry")}
            color={activeFilters.nearExpiry ? "primary" : "default"}
            variant={activeFilters.nearExpiry ? "filled" : "outlined"}
            sx={{ fontWeight: 600 }}
          />
        </Box>

        <Box
          sx={{
            display: "flex",
            gap: 2,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <Tooltip title="Refresh inventory">
            <span>
              <Button
                onClick={refresh}
                disabled={loading}
                size="medium"
                startIcon={<Refresh />}
                sx={{
                  display: { xs: "none", sm: "inline-flex" },
                  border: "1px solid rgba(255,255,255,0.78)",
                  bgcolor: "rgba(255,255,255,0.66)",
                  boxShadow: "0 8px 22px rgba(18, 32, 28, 0.06)",
                  color: "text.secondary",
                  textTransform: "none",
                  fontWeight: 600,
                  "&:hover": {
                    bgcolor: "rgba(255,255,255,0.92)",
                    color: "primary.main",
                  },
                }}
              >
                Refresh
              </Button>
            </span>
          </Tooltip>

          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleAddNew}
            sx={{
              background: "linear-gradient(135deg, #0F8B6C 0%, #0A6B59 100%)",
              fontWeight: 600,
              textTransform: "none",
              px: 3,
              boxShadow: "0 4px 12px rgba(10, 107, 89, 0.2)",
              "&:hover": {
                background: "linear-gradient(135deg, #0A6B59 0%, #064E3B 100%)",
                boxShadow: "0 6px 16px rgba(10, 107, 89, 0.3)",
              },
            }}
          >
            Add New Medicine
          </Button>
        </Box>
      </Box>

      {/* Inventory Table */}
      <InventoryTable
        medicines={medicines}
        loading={loading}
        error={error}
        onEdit={handleEdit}
        onDelete={confirmDelete}
      />

      {/* Pagination */}
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

      {/* Add/Edit Drawer */}
      <MedicineFormDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSubmit={handleSubmit}
        initialData={editingMedicine}
        loading={submitLoading}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => {
          if (!deleteLoading) setDeleteDialogOpen(false);
        }}
        slotProps={{
          paper: { sx: { borderRadius: 3, p: 1 } },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: "#1E293B" }}>
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
            sx={{ color: "text.secondary", fontWeight: 600 }}
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
            sx={{ fontWeight: 600, borderRadius: 2 }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notifications */}
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
          sx={{ width: "100%", borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};
