// src/components/layout/SaaSLayout.tsx
import {
  AdminPanelSettings as AdminIcon,
  ChevronRight as ChevronIcon,
  Close as CloseIcon,
  Dashboard as DashboardIcon,
  DeleteOutlined as DeleteIcon,
  Inventory2Outlined as InventoryIcon,
  Logout,
  Menu as MenuIcon,
  NotificationsNone as NotificationsIcon,
  LocalShippingOutlined as OrdersIcon,
  Refresh as RefreshIcon,
  AssessmentOutlined as ReportsIcon,
  Settings as SettingsIcon,
} from "@mui/icons-material";
import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Button,
  Chip,
  CssBaseline,
  Divider,
  Drawer,
  Fade,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useCallback, useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/useAuth";
import { API_BASE_URL } from "../../services/api";
import {
  type AppNotification,
  deleteNotification,
  fetchNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../../services/notificationApi";
import type { IUser } from "../../types";

const TOP_BAR_HEIGHT = 72;

const isUnauthorizedNotificationError = (err: unknown) =>
  typeof err === "object" &&
  err !== null &&
  (("status" in err && err.status === 401) ||
    ("code" in err && err.code === "UNAUTHORIZED"));

import { Logo } from "../Logo";

export const SaaSLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(
    null,
  );
  const [notificationsAnchor, setNotificationsAnchor] =
    useState<null | HTMLElement>(null);

  // Notification State
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const data = await fetchNotifications();
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.isRead).length);
    } catch (err: unknown) {
      if (!isUnauthorizedNotificationError(err)) {
        console.error("Failed to load notifications", err);
      }
    }
  }, [user]);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => {
      void loadNotifications();
    }, 0);
    const interval = window.setInterval(() => {
      void loadNotifications();
    }, 30000); // Poll every 30s
    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(interval);
    };
  }, [loadNotifications]);

  const handleNotificationClick = async (id: string, link?: string) => {
    try {
      await markNotificationAsRead(id);
      await loadNotifications();
      if (link) {
        setNotificationsAnchor(null);
        navigate(link);
      }
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      loadNotifications();
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  };

  const handleDeleteNotif = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteNotification(id);
      loadNotifications();
    } catch (err) {
      console.error("Failed to delete notification", err);
    }
  };

  const handleLogout = () => {
    setUserMenuAnchor(null);
    logout();
    navigate("/login");
  };

  const managerNavItems = [
    { text: "Dashboard", icon: <DashboardIcon />, path: "/dashboard" },
    { text: "Inventory", icon: <InventoryIcon />, path: "/inventory" },
    { text: "Orders", icon: <OrdersIcon />, path: "/orders" },
    { text: "Reports", icon: <ReportsIcon />, path: "/reports" },
  ];

  const adminNavItems = [
    ...(user?.role === "admin"
      ? [
          {
            text: "User Management",
            icon: <AdminIcon />,
            path: "/admin/users",
          },
        ]
      : []),
  ];

  const navItems =
    user?.role === "pharmacy_manager" ? managerNavItems : adminNavItems;

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        bgcolor: "#F7FAF9",
        background:
          "linear-gradient(135deg, #F7FAF9 0%, #EEF7F3 48%, #FBF8F0 100%)",
      }}
    >
      <CssBaseline />

      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: "100%",
          height: TOP_BAR_HEIGHT,
          bgcolor: "rgba(255, 255, 255, 0.82)",
          backdropFilter: "blur(22px)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.78)",
          boxShadow: "0 14px 38px rgba(18, 32, 28, 0.08)",
          color: "text.primary",
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar sx={{ height: "100%", px: { xs: 2, md: 4 } }}>
          <Logo />

          <Stack
            direction="row"
            spacing={0.75}
            sx={{ display: { xs: "none", md: "flex" }, ml: 5 }}
          >
            {navItems.map((item) => {
              const isActive = location.pathname.startsWith(item.path);
              return (
                <Button
                  key={item.text}
                  onClick={() => navigate(item.path)}
                  startIcon={item.icon}
                  variant={isActive ? "contained" : "text"}
                  disableElevation
                  sx={{
                    minHeight: 40,
                    px: 2.25,
                    borderRadius: 2,
                    fontWeight: 700,
                    ...(isActive
                      ? {
                          bgcolor: "primary.main",
                          color: "white",
                          "&:hover": {
                            bgcolor: "primary.dark",
                          },
                        }
                      : {
                          color: "text.secondary",
                          "&:hover": {
                            bgcolor: "rgba(15, 139, 108, 0.08)",
                            color: "primary.main",
                          },
                        }),
                  }}
                >
                  {item.text}
                </Button>
              );
            })}
          </Stack>

          <Box sx={{ flexGrow: 1 }} />

          <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
            <IconButton
              size="medium"
              onClick={(event) => {
                setNotificationsAnchor(event.currentTarget);
                loadNotifications();
              }}
              sx={{
                border: "1px solid rgba(255,255,255,0.78)",
                bgcolor: "rgba(255,255,255,0.66)",
                boxShadow: "0 8px 22px rgba(18, 32, 28, 0.06)",
                "&:hover": {
                  bgcolor: "rgba(255,255,255,0.92)",
                  color: "primary.main",
                },
              }}
            >
              <Badge
                badgeContent={unreadCount}
                color="error"
                overlap="circular"
              >
                <NotificationsIcon />
              </Badge>
            </IconButton>

            <IconButton
              size="medium"
              onClick={() => navigate("/settings")}
              sx={{
                display: { xs: "none", sm: "inline-flex" },
                border: "1px solid rgba(255,255,255,0.78)",
                bgcolor: "rgba(255,255,255,0.66)",
                boxShadow: "0 8px 22px rgba(18, 32, 28, 0.06)",
                "&:hover": {
                  bgcolor: "rgba(255,255,255,0.92)",
                  color: "primary.main",
                },
              }}
            >
              <SettingsIcon />
            </IconButton>

            <Divider
              orientation="vertical"
              flexItem
              sx={{ mx: 0.5, borderColor: "rgba(23, 35, 31, 0.1)" }}
            />

            <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
              <Box
                sx={{
                  textAlign: "right",
                  display: { xs: "none", md: "block" },
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{
                    color: "text.primary",
                    fontWeight: 750,
                    lineHeight: 1.2,
                  }}
                >
                  {user?.name}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.secondary",
                    fontWeight: 800,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  {user?.role.replace("_", " ")}
                </Typography>
              </Box>
              <IconButton
                onClick={(event) => setUserMenuAnchor(event.currentTarget)}
                size="small"
                sx={(theme) => ({
                  p: 0.5,
                  border: "1px solid rgba(255,255,255,0.84)",
                  boxShadow: `0 0 0 4px ${alpha(
                    theme.palette.primary.main,
                    0.08,
                  )}`,
                })}
              >
                <Avatar
                  src={
                    user?.profilePictureUrl
                      ? `${API_BASE_URL.replace(/\/api\/?$/, "")}${user.profilePictureUrl}`
                      : undefined
                  }
                  sx={{
                    bgcolor: "primary.main",
                    width: 36,
                    height: 36,
                    fontWeight: 800,
                  }}
                >
                  {user?.name?.charAt(0).toUpperCase()}
                </Avatar>
              </IconButton>
            </Stack>

            <IconButton
              color="inherit"
              edge="end"
              onClick={() => setMobileNavOpen(true)}
              sx={{ display: { md: "none" }, ml: 0.5 }}
            >
              <MenuIcon />
            </IconButton>
          </Stack>

          <Menu
            anchorEl={userMenuAnchor}
            open={Boolean(userMenuAnchor)}
            onClose={() => setUserMenuAnchor(null)}
            slotProps={{
              paper: {
                elevation: 0,
                sx: {
                  mt: 1.5,
                  minWidth: 220,
                  borderRadius: 2,
                  border: "1px solid rgba(255,255,255,0.78)",
                  backgroundColor: "rgba(255,255,255,0.9)",
                  backdropFilter: "blur(22px)",
                  boxShadow: "0 18px 54px rgba(18, 32, 28, 0.14)",
                },
              },
            }}
            transformOrigin={{ horizontal: "right", vertical: "top" }}
            anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
          >
            <Box
              sx={{
                px: 2,
                py: 1.5,
                borderBottom: "1px solid rgba(23,35,31,0.08)",
                mb: 1,
              }}
            >
              <Typography variant="subtitle2">{user?.name}</Typography>
              <Typography variant="caption" color="text.secondary">
                {(user as IUser)?.email || ""}
              </Typography>
            </Box>
            <MenuItem
              onClick={() => {
                setUserMenuAnchor(null);
                navigate("/settings");
              }}
              sx={{ py: 1.5, mx: 1, borderRadius: 1.5 }}
            >
              <ListItemIcon>
                <SettingsIcon fontSize="small" />
              </ListItemIcon>
              Profile Settings
            </MenuItem>
            <MenuItem
              onClick={handleLogout}
              sx={{ color: "error.main", py: 1.5, mx: 1, borderRadius: 1.5 }}
            >
              <ListItemIcon>
                <Logout fontSize="small" color="error" />
              </ListItemIcon>
              Sign out
            </MenuItem>
          </Menu>

          <Menu
            anchorEl={notificationsAnchor}
            open={Boolean(notificationsAnchor)}
            onClose={() => setNotificationsAnchor(null)}
            slotProps={{
              paper: {
                elevation: 0,
                sx: {
                  mt: 1.5,
                  width: 380,
                  maxHeight: 500,
                  borderRadius: 3,
                  border: "1px solid rgba(255,255,255,0.78)",
                  backgroundColor: "rgba(255,255,255,0.95)",
                  backdropFilter: "blur(22px)",
                  boxShadow: "0 18px 54px rgba(18, 32, 28, 0.14)",
                  display: "flex",
                  flexDirection: "column",
                },
              },
            }}
            transformOrigin={{ horizontal: "right", vertical: "top" }}
            anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
          >
            <Box
              sx={{
                p: 2,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "1px solid rgba(23,35,31,0.08)",
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                Notifications
                {unreadCount > 0 && (
                  <Chip
                    label={`${unreadCount} New`}
                    size="small"
                    color="error"
                    sx={{
                      ml: 1.5,
                      height: 20,
                      fontSize: "0.65rem",
                      fontWeight: 800,
                    }}
                  />
                )}
              </Typography>
              <Stack direction="row" spacing={1}>
                <IconButton
                  size="medium"
                  onClick={loadNotifications}
                  title="Refresh"
                  sx={{
                    display: { xs: "none", sm: "inline-flex" },
                    border: "1px solid rgba(255,255,255,0.78)",
                    borderRadius: 2.5,
                    bgcolor: "rgba(255,255,255,0.66)",
                    boxShadow: "0 8px 22px rgba(18, 32, 28, 0.06)",
                    "&:hover": {
                      bgcolor: "rgba(255,255,255,0.92)",
                      color: "primary.main",
                    },
                  }}
                >
                  <RefreshIcon fontSize="small" />
                </IconButton>
                <Button
                  size="small"
                  onClick={handleMarkAllRead}
                  disabled={unreadCount === 0}
                  sx={{ fontSize: "0.75rem", fontWeight: 700 }}
                >
                  Mark all read
                </Button>
              </Stack>
            </Box>

            <List sx={{ p: 0, overflowY: "auto", flexGrow: 1 }}>
              {notifications.length === 0 ? (
                <Box
                  sx={{ p: 4, textAlign: "center", color: "text.secondary" }}
                >
                  <NotificationsIcon
                    sx={{ fontSize: 40, opacity: 0.2, mb: 1.5 }}
                  />
                  <Typography variant="body2">No notifications yet.</Typography>
                </Box>
              ) : (
                notifications.map((notif) => (
                  <ListItem
                    key={notif._id}
                    disablePadding
                    divider
                    sx={{
                      bgcolor: notif.isRead
                        ? "transparent"
                        : "rgba(15, 139, 108, 0.04)",
                      transition: "background-color 0.2s ease",
                      "&:hover": { bgcolor: "rgba(0,0,0,0.02)" },
                    }}
                  >
                    <ListItemButton
                      onClick={() =>
                        handleNotificationClick(notif._id, notif.link)
                      }
                      sx={{ py: 2, px: 2.5 }}
                    >
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            bgcolor: notif.isRead
                              ? "grey.200"
                              : "primary.light",
                            color: notif.isRead ? "grey.500" : "primary.main",
                          }}
                        >
                          {notif.type === "order_update" ? (
                            <OrdersIcon />
                          ) : (
                            <NotificationsIcon />
                          )}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={notif.title}
                        secondary={
                          <>
                            <Typography
                              component="span"
                              variant="body2"
                              color="text.primary"
                              sx={{
                                display: "block",
                                mb: 0.5,
                                fontWeight: notif.isRead ? 400 : 600,
                              }}
                            >
                              {notif.message}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {new Date(notif.createdAt).toLocaleDateString()}{" "}
                              at{" "}
                              {new Date(notif.createdAt).toLocaleTimeString(
                                [],
                                { hour: "2-digit", minute: "2-digit" },
                              )}
                            </Typography>
                          </>
                        }
                      />
                      <IconButton
                        size="small"
                        onClick={(e) => handleDeleteNotif(notif._id, e)}
                        sx={{
                          ml: 1,
                          opacity: 0,
                          ".MuiListItem-root:hover &": { opacity: 0.4 },
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </ListItemButton>
                  </ListItem>
                ))
              )}
            </List>

            {notifications.length > 0 && (
              <Box
                sx={{
                  p: 1,
                  textAlign: "center",
                  borderTop: "1px solid rgba(23,35,31,0.05)",
                }}
              >
                <Button
                  fullWidth
                  size="small"
                  sx={{ color: "text.secondary", fontWeight: 600 }}
                >
                  View all activity
                </Button>
              </Box>
            )}
          </Menu>
        </Toolbar>
      </AppBar>

      <Drawer
        anchor="right"
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        sx={{
          display: { md: "none" },
          "& .MuiDrawer-paper": {
            width: 320,
            background:
              "linear-gradient(165deg, #042A2C 0%, #063C35 40%, #0F5E4D 75%, #1A2521 100%)",
            color: "white",
            borderLeft: "none",
            boxShadow: "-12px 0 40px rgba(0,0,0,0.4)",
            display: "flex",
            flexDirection: "column",
          },
        }}
      >
        {/* Mobile Drawer Header */}
        <Stack
          direction="row"
          sx={{
            p: 3,
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(0,0,0,0.12)",
          }}
        >
          <Logo onDark />
          <IconButton
            onClick={() => setMobileNavOpen(false)}
            sx={{
              color: "white",
              bgcolor: "rgba(255,255,255,0.05)",
              "&:hover": {
                bgcolor: "rgba(255,255,255,0.12)",
                transform: "rotate(90deg)",
              },
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            <CloseIcon />
          </IconButton>
        </Stack>

        {/* Navigation List */}
        <Box sx={{ flexGrow: 1, py: 3, overflowY: "auto", px: 2 }}>
          <Typography
            variant="overline"
            sx={{
              px: 2,
              mb: 2,
              display: "block",
              color: "rgba(255,255,255,0.4)",
              fontWeight: 700,
              letterSpacing: "0.15em",
            }}
          >
            Main Menu
          </Typography>
          <List disablePadding>
            {navItems.map((item) => {
              const isActive = location.pathname.startsWith(item.path);
              return (
                <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
                  <ListItemButton
                    onClick={() => {
                      navigate(item.path);
                      setMobileNavOpen(false);
                    }}
                    sx={{
                      borderRadius: 2,
                      py: 1.5,
                      px: 2,
                      bgcolor: isActive
                        ? "rgba(16, 185, 129, 0.15)"
                        : "transparent",
                      color: isActive ? "white" : "rgba(255,255,255,0.65)",
                      border: isActive
                        ? "1px solid rgba(16, 185, 129, 0.3)"
                        : "1px solid transparent",
                      position: "relative",
                      "&::after": isActive
                        ? {
                            content: '""',
                            position: "absolute",
                            left: 0,
                            top: "20%",
                            bottom: "20%",
                            width: 4,
                            bgcolor: "#DDAA4A",
                            borderRadius: "0 4px 4px 0",
                          }
                        : {},
                      transition: "all 0.2s ease",
                      "&:hover": {
                        bgcolor: "rgba(255,255,255,0.06)",
                        color: "white",
                        "& .MuiListItemIcon-root": {
                          color: "#DDAA4A",
                        },
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        color: isActive ? "#DDAA4A" : "inherit",
                        minWidth: 42,
                        transition: "color 0.2s ease",
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.text}
                      slotProps={{
                        primary: {
                          sx: {
                            fontWeight: isActive ? 800 : 500,
                            fontSize: "1rem",
                            letterSpacing: "0.01em",
                          },
                        },
                      }}
                    />
                    {isActive && (
                      <ChevronIcon sx={{ fontSize: 18, opacity: 0.6 }} />
                    )}
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>

          <Divider sx={{ my: 3, borderColor: "rgba(255,255,255,0.08)" }} />

          <Typography
            variant="overline"
            sx={{
              px: 2,
              mb: 2,
              display: "block",
              color: "rgba(255,255,255,0.4)",
              fontWeight: 700,
              letterSpacing: "0.15em",
            }}
          >
            System
          </Typography>
          <ListItem disablePadding sx={{ mb: 1 }}>
            <ListItemButton
              onClick={() => {
                navigate("/settings");
                setMobileNavOpen(false);
              }}
              sx={{
                borderRadius: 2,
                py: 1.5,
                px: 2,
                color: "rgba(255,255,255,0.65)",
                "&:hover": {
                  bgcolor: "rgba(255,255,255,0.06)",
                  color: "white",
                },
              }}
            >
              <ListItemIcon sx={{ color: "inherit", minWidth: 42 }}>
                <SettingsIcon />
              </ListItemIcon>
              <ListItemText primary="Account Settings" />
            </ListItemButton>
          </ListItem>
        </Box>

        {/* Mobile Drawer Footer with User Profile */}
        <Box
          sx={{
            p: 2.5,
            bgcolor: "rgba(0,0,0,0.2)",
            borderTop: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <Stack spacing={2.5}>
            <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
              <Avatar
                src={
                  user?.profilePictureUrl
                    ? `${API_BASE_URL.replace(/\/api\/?$/, "")}${user.profilePictureUrl}`
                    : undefined
                }
                sx={{
                  width: 48,
                  height: 48,
                  bgcolor: "primary.main",
                  border: "2px solid rgba(255,255,255,0.1)",
                  fontWeight: 800,
                }}
              >
                {user?.name?.charAt(0).toUpperCase()}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="subtitle1"
                  sx={{
                    color: "white",
                    fontWeight: 700,
                    lineHeight: 1.2,
                    mb: 0.25,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    maxWidth: 180,
                  }}
                >
                  {user?.name}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: "rgba(255,255,255,0.5)",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  {user?.role.replace("_", " ")}
                </Typography>
              </Box>
            </Stack>

            <Button
              fullWidth
              variant="outlined"
              color="error"
              onClick={handleLogout}
              startIcon={<Logout />}
              sx={{
                py: 1.25,
                borderRadius: 2,
                borderColor: "rgba(244, 67, 54, 0.4)",
                color: "#ff8a80",
                "&:hover": {
                  bgcolor: "rgba(244, 67, 54, 0.08)",
                  borderColor: "#f44336",
                },
              }}
            >
              Sign Out
            </Button>

            <Typography
              variant="caption"
              align="center"
              sx={{
                display: "block",
                color: "rgba(255,255,255,0.3)",
                fontSize: "0.7rem",
                fontWeight: 500,
              }}
            >
              ALYAH PHARMA NET v1.2.0
            </Typography>
          </Stack>
        </Box>
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2.5, md: 5 },
          width: "100%",
          mt: `${TOP_BAR_HEIGHT}px`,
        }}
      >
        <Fade in timeout={360}>
          <Box>
            <Outlet />
          </Box>
        </Fade>
      </Box>
    </Box>
  );
};
