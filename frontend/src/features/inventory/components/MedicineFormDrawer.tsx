import { Close } from "@mui/icons-material";
import { Box, Drawer, IconButton, Typography } from "@mui/material";
import type { IMedicine, MedicineFormValues } from "../types";
import { MedicineForm } from "./MedicineForm";

interface MedicineFormDrawerProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: MedicineFormValues, medicineId?: string) => Promise<void>;
  initialData?: IMedicine | null;
  loading: boolean;
}

export const MedicineFormDrawer = ({
  open,
  onClose,
  onSubmit,
  initialData,
  loading,
}: MedicineFormDrawerProps) => {
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        "& .MuiDrawer-paper": {
          width: { xs: "100%", sm: 480 },
          maxWidth: "100vw",
          borderRadius: "16px 0 0 16px",
          borderLeft: "none",
          bgcolor: "#FFFFFF",
          boxShadow: "-8px 0 40px rgba(0,0,0,0.08)",
        },
      }}
    >
      <Box
        sx={{
          p: 3,
          borderBottom: "1px solid rgba(0,0,0,0.06)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 800, color: "#1E293B" }}>
          {initialData ? "Edit Medicine" : "Add New Medicine"}
        </Typography>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{ color: "text.secondary" }}
        >
          <Close />
        </IconButton>
      </Box>

      <Box sx={{ overflowY: "auto", flexGrow: 1 }}>
        <MedicineForm
          initialData={initialData}
          onSubmit={async (data, id) => {
            await onSubmit(data, id);
            onClose();
          }}
          onCancel={onClose}
          loading={loading}
        />
      </Box>
    </Drawer>
  );
};
