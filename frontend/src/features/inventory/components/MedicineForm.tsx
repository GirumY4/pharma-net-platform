// src/features/inventory/components/MedicineForm.tsx
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { handleApiError } from "../../../utils/errorMapper";
import type { IMedicine, MedicineFormValues } from "../types";

interface MedicineFormProps {
  onSubmit: (data: MedicineFormValues, medicineId?: string) => Promise<void>;
  onCancel: () => void;
  initialData?: IMedicine | null;
  loading: boolean;
}

const UNIT_OPTIONS: MedicineFormValues["unitOfMeasure"][] = [
  "tablet",
  "capsule",
  "vial",
  "bottle",
  "sachet",
  "unit",
];

export const MedicineForm = ({
  onSubmit,
  onCancel,
  initialData,
  loading,
}: MedicineFormProps) => {
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MedicineFormValues>({
    defaultValues: {
      name: "",
      sku: "",
      genericName: "",
      category: "",
      description: "",
      unitPrice: 0,
      unitOfMeasure: "tablet",
      reorderThreshold: 50,
      initialBatch: {
        batchNumber: "",
        gtin: "",
        quantity: 0,
        expiryDate: "",
        manufactureDate: "",
        supplierName: "",
        shelfLocation: "",
      },
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name,
        sku: initialData.sku,
        genericName: initialData.genericName,
        category: initialData.category,
        description: initialData.description,
        unitPrice: initialData.unitPrice,
        unitOfMeasure: initialData.unitOfMeasure,
        reorderThreshold: initialData.reorderThreshold,
      });
    } else {
      reset();
    }
    setError(null);
  }, [initialData, reset]);

  const onFormSubmit = async (data: MedicineFormValues) => {
    setError(null);
    try {
      await onSubmit(data, initialData?._id);
      reset(); // Reset form on success
    } catch (err) {
      const message = handleApiError(err);
      setError(message);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onFormSubmit)} sx={{ p: { xs: 2, sm: 3 } }}>
      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3, borderRadius: 2 }}
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      {/* Basic Details Section */}
      <Typography
        variant="subtitle1"
        sx={{ fontWeight: 700, color: "text.primary", mb: 2 }}
      >
        Basic Details
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
          gap: 2,
          mb: 3,
        }}
      >
        <Controller
          name="name"
          control={control}
          rules={{ required: "Medicine name is required" }}
          render={({ field }) => (
            <TextField
              {...field}
              label="Medicine Name *"
              fullWidth
              error={!!errors.name}
              helperText={errors.name?.message}
              size="small"
            />
          )}
        />
        <Controller
          name="sku"
          control={control}
          rules={{
            required: "SKU is required",
            pattern: {
              value: /^[A-Z0-9\-]+$/,
              message: "SKU must be uppercase alphanumeric",
            },
          }}
          render={({ field }) => (
            <TextField
              {...field}
              label="SKU *"
              fullWidth
              error={!!errors.sku}
              helperText={errors.sku?.message}
              size="small"
              slotProps={{
                htmlInput: { style: { textTransform: "uppercase" } },
              }}
            />
          )}
        />
        <Controller
          name="genericName"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Generic Name (INN)"
              fullWidth
              size="small"
            />
          )}
        />
        <Controller
          name="category"
          control={control}
          rules={{ required: "Category is required" }}
          render={({ field }) => (
            <TextField
              {...field}
              label="Category *"
              fullWidth
              error={!!errors.category}
              helperText={errors.category?.message}
              size="small"
            />
          )}
        />
      </Box>

      <Controller
        name="description"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label="Description"
            fullWidth
            multiline
            rows={2}
            size="small"
            sx={{ mb: 3 }}
          />
        )}
      />

      <Divider sx={{ my: 3 }} />

      {/* Pricing & Stock Section */}
      <Typography
        variant="subtitle1"
        sx={{ fontWeight: 700, color: "text.primary", mb: 2 }}
      >
        Pricing & Stock
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
          gap: 2,
          mb: 3,
        }}
      >
        <Controller
          name="unitPrice"
          control={control}
          rules={{
            required: "Price is required",
            min: { value: 0, message: "Price cannot be negative" },
          }}
          render={({ field }) => (
            <TextField
              {...field}
              label="Unit Price (ETB) *"
              type="number"
              fullWidth
              error={!!errors.unitPrice}
              helperText={errors.unitPrice?.message}
              size="small"
              slotProps={{ htmlInput: { step: "0.01", min: 0 } }}
            />
          )}
        />
        <Controller
          name="reorderThreshold"
          control={control}
          rules={{
            required: "Reorder threshold is required",
            min: { value: 0, message: "Cannot be negative" },
          }}
          render={({ field }) => (
            <TextField
              {...field}
              label="Reorder Threshold *"
              type="number"
              fullWidth
              error={!!errors.reorderThreshold}
              helperText={errors.reorderThreshold?.message}
              size="small"
              slotProps={{ htmlInput: { min: 0 } }}
            />
          )}
        />
        <Controller
          name="unitOfMeasure"
          control={control}
          rules={{ required: "Unit of measure is required" }}
          render={({ field }) => (
            <FormControl
              fullWidth
              size="small"
              error={!!errors.unitOfMeasure}
            >
              <InputLabel>Unit of Measure *</InputLabel>
              <Select {...field} label="Unit of Measure *">
                {UNIT_OPTIONS.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        />
      </Box>

      {/* Initial Batch Section (only for new medicines) */}
      {!initialData && (
        <>
          <Divider sx={{ my: 3 }} />
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 700, color: "text.primary", mb: 2 }}
          >
            Initial Batch (Optional)
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 2,
              mb: 3,
            }}
          >
            <Controller
              name="initialBatch.batchNumber"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Batch Number"
                  fullWidth
                  size="small"
                />
              )}
            />
            <Controller
              name="initialBatch.gtin"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="GTIN Barcode"
                  fullWidth
                  size="small"
                />
              )}
            />
            <Controller
              name="initialBatch.quantity"
              control={control}
              rules={{
                min: { value: 0, message: "Quantity cannot be negative" },
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Initial Quantity"
                  type="number"
                  fullWidth
                  size="small"
                  slotProps={{ htmlInput: { min: 0 } }}
                />
              )}
            />
            <Controller
              name="initialBatch.expiryDate"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Expiry Date"
                  type="date"
                  fullWidth
                  size="small"
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              )}
            />
            <Controller
              name="initialBatch.supplierName"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Supplier Name"
                  fullWidth
                  size="small"
                />
              )}
            />
            <Controller
              name="initialBatch.shelfLocation"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Shelf Location"
                  fullWidth
                  size="small"
                />
              )}
            />
          </Box>
        </>
      )}

      <Box
        sx={{ mt: 4, display: "flex", gap: 2, justifyContent: "flex-end" }}
      >
        <Button
          variant="outlined"
          onClick={onCancel}
          disabled={loading || isSubmitting}
          sx={{ borderColor: "rgba(23, 35, 31, 0.1)" }}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={loading || isSubmitting}
          startIcon={
            loading || isSubmitting ? <CircularProgress size={16} color="inherit" /> : null
          }
          sx={{
            minWidth: 120,
          }}
        >
          {loading || isSubmitting
            ? "Saving..."
            : initialData
              ? "Update"
              : "Add Medicine"}
        </Button>
      </Box>
    </Box>
  );
};
