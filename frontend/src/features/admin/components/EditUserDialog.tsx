import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
} from "@mui/material";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import type { IUser, UserRole } from "../../../types";
import { handleApiError } from "../../../utils/errorMapper";
import { updateUser } from "../services/adminApi";

interface EditUserDialogProps {
  open: boolean;
  onClose: () => void;
  user: IUser | null;
  onSaveSuccess: () => void;
}

export const EditUserDialog = ({
  open,
  onClose,
  user,
  onSaveSuccess,
}: EditUserDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, reset, setValue } = useForm({
    defaultValues: {
      name: "",
      role: "public_user" as UserRole,
      isActive: true,
    },
  });

  // Initialize form when dialog opens
  useEffect(() => {
    if (open && user) {
      reset({
        name: user.name,
        role: user.role,
        isActive: user.isActive,
      });
    }
  }, [open, user, reset]);

  const onSubmit = async (data: {
    name: string;
    role: UserRole;
    isActive: boolean;
  }) => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      await updateUser(user._id, data);
      onSaveSuccess();
      onClose();
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Edit User</DialogTitle>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)} id="edit-user-form">
          <TextField
            autoFocus
            margin="dense"
            label="Full Name"
            fullWidth
            variant="outlined"
            {...register("name", { required: true })}
            sx={{ mb: 2 }}
          />

          <FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
            <InputLabel>Role</InputLabel>
            <Select
              label="Role"
              defaultValue={user?.role || ("public_user" as UserRole)}
              {...register("role" as const)}
            >
              <MenuItem value="admin">System Administrator</MenuItem>
              <MenuItem value="pharmacy_manager">Pharmacy Manager</MenuItem>
              <MenuItem value="public_user">Public User</MenuItem>
            </Select>
          </FormControl>

          <FormControlLabel
            control={
              <Switch
                defaultChecked={user?.isActive}
                onChange={(e) => setValue("isActive", e.target.checked)}
              />
            }
            label="Account Active"
          />

          {error && (
            <FormHelperText error sx={{ mt: 1 }}>
              {error}
            </FormHelperText>
          )}
        </form>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          type="submit"
          form="edit-user-form"
          variant="contained"
          disabled={loading}
        >
          {loading ? <CircularProgress size={20} /> : "Save Changes"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
