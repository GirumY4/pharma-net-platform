import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  IconButton,
  Avatar,
  Skeleton,
  Pagination,
  Stack,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from "@mui/material";
import { useState, useEffect, useCallback } from "react";
import { fetchUsers, deactivateUser } from "../services/adminApi";
import { EditUserDialog } from "../components/EditUserDialog";
import { handleApiError } from "../../../utils/errorMapper";
import { useAuth } from "../../../contexts/useAuth";
import { Edit, Block } from "@mui/icons-material";
import type { IUser } from "../../../types";

export const UserManagementPage = () => {
  useAuth();

  // State
  const [users, setUsers] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });

  // Filters
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("active");

  // Dialogs
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<IUser | null>(null);
  const [deactivateUserOpen, setDeactivateUserOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Fetch Data
  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params: { page: number; role?: string; isActive?: boolean } = {
        page: pagination.page,
      };
      if (roleFilter !== "all") params.role = roleFilter;
      if (statusFilter === "active") params.isActive = true;
      else if (statusFilter === "inactive") params.isActive = false;

      const result = await fetchUsers(params);
      setUsers(result.data);
      setPagination((prev) => ({
        ...prev,
        totalPages: result.pagination.totalPages,
      }));
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  }, [pagination.page, roleFilter, statusFilter]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Handlers
  const handleEditClick = (user: IUser) => {
    setSelectedUser(user);
    setEditDialogOpen(true);
  };

  const handleDeactivateConfirm = async () => {
    if (!selectedUser) return;
    setProcessing(true);
    try {
      await deactivateUser(selectedUser._id);
      loadUsers();
      setDeactivateUserOpen(false);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setProcessing(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "error";
      case "pharmacy_manager":
        return "primary";
      default:
        return "info";
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography
          variant="h4"
          sx={{ fontWeight: 800, color: "primary.main" }}
        >
          User Management
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Admin Console / Users
        </Typography>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3, display: "flex", gap: 2, flexWrap: "wrap" }}>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Role</InputLabel>
          <Select
            value={roleFilter}
            label="Role"
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
          >
            <MenuItem value="all">All Roles</MenuItem>
            <MenuItem value="admin">Admin</MenuItem>
            <MenuItem value="pharmacy_manager">Pharmacy Manager</MenuItem>
            <MenuItem value="public_user">Public User</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
          >
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
            <MenuItem value="all">All Status</MenuItem>
          </Select>
        </FormControl>
      </Paper>

      {/* Error Display */}
      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      {/* Data Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ bgcolor: "background.default" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>User</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>City</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              // Skeleton Loading
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton variant="circular" width={32} height={32} />
                  </TableCell>
                  <TableCell>
                    <Skeleton width={100} />
                  </TableCell>
                  <TableCell>
                    <Skeleton width={80} />
                  </TableCell>
                  <TableCell>
                    <Skeleton width={60} />
                  </TableCell>
                  <TableCell align="right">
                    <Skeleton width={40} />
                  </TableCell>
                </TableRow>
              ))
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  No users found matching filters.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user._id} hover>
                  <TableCell>
                    <Stack
                      direction="row"
                      spacing={1.5}
                      sx={{ alignItems: "center" }}
                    >
                      <Avatar
                        sx={{
                          bgcolor: user.isActive ? "primary.main" : "grey.400",
                          width: 32,
                          height: 32,
                        }}
                      >
                        {user.name.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 700 }}
                        >
                          {user.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {user.email}
                        </Typography>
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.role.replace("_", " ")}
                      size="small"
                      color={
                        getRoleColor(user.role) as "error" | "primary" | "info"
                      }
                    />
                  </TableCell>
                  <TableCell>{user.city || "—"}</TableCell>
                  <TableCell>
                    <Chip
                      label={user.isActive ? "Active" : "Inactive"}
                      size="small"
                      variant="outlined"
                      color={user.isActive ? "success" : "default"}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => handleEditClick(user)}
                    >
                      <Edit fontSize="small" color="action" />
                    </IconButton>
                    {user.isActive && (
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedUser(user);
                          setDeactivateUserOpen(true);
                        }}
                      >
                        <Block fontSize="small" color="warning" />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
          <Pagination
            count={pagination.totalPages}
            page={pagination.page}
            onChange={(_, val) => setPagination((p) => ({ ...p, page: val }))}
            color="primary"
          />
        </Box>
      )}

      {/* Modals */}
      <EditUserDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        user={selectedUser}
        onSaveSuccess={loadUsers}
      />

      <Dialog
        open={deactivateUserOpen}
        onClose={() => setDeactivateUserOpen(false)}
      >
        <DialogTitle>Deactivate User?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to deactivate{" "}
            <strong>{selectedUser?.name}</strong>? This will prevent them from
            logging in and effectively delete the tenant if they are a Pharmacy
            Manager.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeactivateUserOpen(false)}
            disabled={processing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeactivateConfirm}
            color="error"
            variant="contained"
            disabled={processing}
          >
            {processing ? <CircularProgress size={20} /> : "Deactivate"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
