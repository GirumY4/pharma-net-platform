// src/components/layout/SaaSLayout.tsx
import {
  Dashboard as DashboardIcon,
  Inventory2Outlined as InventoryIcon,
  Logout,
  Menu as MenuIcon,
  NotificationsNone as NotificationsIcon,
  LocalShippingOutlined as OrdersIcon,
  AssessmentOutlined as ReportsIcon,
  Settings as SettingsIcon,
} from "@mui/icons-material";
import {
  AppBar,
  Avatar,
  Box,
  Button,
  CssBaseline,
  Divider,
  Drawer,
  Fade,
  IconButton,
  List,
  ListItem,
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
import { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/useAuth";
import type { IUser } from "../../types";

const TOP_BAR_HEIGHT = 72;

const Logo = ({ onDark = false }: { onDark?: boolean }) => (
  <Stack
    direction="row"
    spacing={1.5}
    sx={{ minWidth: 0, alignItems: "center" }}
  >
    <Box
      aria-label="Pharma-Net logo"
      sx={{
        width: 38,
        height: 38,
        flex: "0 0 auto",
        borderRadius: 2,
        display: "grid",
        placeItems: "center",
        background:
          "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(214,250,232,0.92) 100%)",
        boxShadow: onDark
          ? "0 12px 30px rgba(0, 0, 0, 0.18)"
          : "0 10px 26px rgba(18, 32, 28, 0.12)",
        border: "1px solid rgba(255,255,255,0.5)",
      }}
    >
      <svg
        width={23}
        height={23}
        viewBox="0 0 28 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M14 4.5v19M4.5 14h19"
          stroke="#0F8B6C"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M7.5 7.5h13v13h-13z"
          stroke="#DDAA4A"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    </Box>
    <Box sx={{ minWidth: 0 }}>
      <Typography
        variant="h6"
        sx={{
          color: onDark ? "common.white" : "text.primary",
          fontWeight: 800,
          letterSpacing: 0,
          lineHeight: 1,
        }}
      >
        Pharma-Net
      </Typography>
      <Typography
        variant="caption"
        sx={{
          color: onDark ? "rgba(255,255,255,0.66)" : "text.secondary",
          display: { xs: "none", sm: "block" },
          fontWeight: 800,
          letterSpacing: "0.08em",
          lineHeight: 1.2,
          textTransform: "uppercase",
        }}
      >
        Operations
      </Typography>
    </Box>
  </Stack>
);

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

  const handleLogout = () => {
    setUserMenuAnchor(null);
    logout();
    navigate("/login");
  };

  const navItems = [
    { text: "Dashboard", icon: <DashboardIcon />, path: "/dashboard" },
    { text: "Inventory", icon: <InventoryIcon />, path: "/inventory" },
    { text: "Orders", icon: <OrdersIcon />, path: "/orders" },
    { text: "Reports", icon: <ReportsIcon />, path: "/reports" },
  ];

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
              onClick={(event) => setNotificationsAnchor(event.currentTarget)}
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
              <NotificationsIcon />
            </IconButton>

            <IconButton
              size="medium"
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
                  width: 320,
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
            <Box sx={{ p: 2.5, textAlign: "center", color: "text.secondary" }}>
              <Typography variant="subtitle2" color="text.primary">
                Notification center
              </Typography>
              <Typography variant="body2">
                No new operational alerts.
              </Typography>
            </Box>
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
            width: 292,
            bgcolor: "#042A2C",
            color: "white",
            borderLeft: "none",
          },
        }}
      >
        <Stack
          direction="row"
          sx={{ p: 2, justifyContent: "space-between", alignItems: "center" }}
        >
          <Logo onDark />
          <IconButton
            onClick={() => setMobileNavOpen(false)}
            sx={{ color: "white" }}
          >
            <MenuIcon />
          </IconButton>
        </Stack>
        <Divider sx={{ borderColor: "rgba(255,255,255,0.12)" }} />
        <List sx={{ px: 2, py: 2 }}>
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
                    py: 1.25,
                    bgcolor: isActive
                      ? "rgba(255, 255, 255, 0.12)"
                      : "transparent",
                    color: isActive ? "common.white" : "rgba(255,255,255,0.72)",
                    backdropFilter: isActive ? "blur(10px)" : "none",
                    border: isActive
                      ? "1px solid rgba(255,255,255,0.16)"
                      : "1px solid transparent",
                    borderLeft: isActive
                      ? "3px solid #DDAA4A"
                      : "1px solid transparent",
                    transition:
                      "background-color 160ms ease, color 160ms ease, border-color 160ms ease",
                    "&:hover": {
                      bgcolor: "rgba(255,255,255,0.08)",
                      color: "white",
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: isActive ? "#DDAA4A" : "inherit",
                      minWidth: 44,
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    slotProps={{
                      primary: {
                        sx: {
                          fontWeight: isActive ? 800 : 600,
                          fontSize: "0.95rem",
                        },
                      },
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
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
