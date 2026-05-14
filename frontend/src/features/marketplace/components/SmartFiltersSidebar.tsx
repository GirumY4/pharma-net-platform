// src/features/marketplace/components/SmartFiltersSidebar.tsx
import { Close, ExpandLess, ExpandMore, FilterList } from "@mui/icons-material";
import {
  Box,
  Button,
  Collapse,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Slider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { CATEGORIES } from "../types";

interface SmartFiltersSidebarProps {
  open: boolean;
  onClose: () => void;
  filters: {
    category?: string;
    city?: string;
    maxPrice?: number;
    minStock?: number;
  };
  onFilterChange: (filters: {
    category?: string;
    city?: string;
    maxPrice?: number;
    minStock?: number;
  }) => void;
  onReset: () => void;
}

export const SmartFiltersSidebar = ({
  open,
  onClose,
  filters,
  onFilterChange,
  onReset,
}: SmartFiltersSidebarProps) => {
  const [expandedSection, setExpandedSection] = useState<string | null>(
    "category",
  );

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <Collapse in={open} orientation="horizontal" sx={{ width: "100%" }}>
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          borderRadius: 3,
          border: "1px solid rgba(0,0,0,0.06)",
          bgcolor: "rgba(255, 255, 255, 0.7)",
          backdropFilter: "blur(24px)",
          boxShadow: "0 10px 40px rgba(0,0,0,0.03)",
          mb: 3,
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <FilterList sx={{ color: "primary.main" }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Smart Filters
            </Typography>
          </Stack>
          <IconButton
            size="small"
            onClick={onClose}
            sx={{ color: "text.secondary" }}
          >
            <Close fontSize="small" />
          </IconButton>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Category Filter */}
        <Box sx={{ mb: 3 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              cursor: "pointer",
              py: 0.5,
            }}
            onClick={() => toggleSection("category")}
          >
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Category
            </Typography>
            {expandedSection === "category" ? (
              <ExpandLess fontSize="small" />
            ) : (
              <ExpandMore fontSize="small" />
            )}
          </Box>
          <Collapse in={expandedSection === "category"}>
            <FormControl fullWidth size="small" sx={{ mt: 1 }}>
              <InputLabel>Medical Category</InputLabel>
              <Select
                value={filters.category || ""}
                label="Medical Category"
                onChange={(e) =>
                  onFilterChange({ category: e.target.value || undefined })
                }
              >
                <MenuItem value="">All Categories</MenuItem>
                {CATEGORIES.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {cat}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Collapse>
        </Box>

        {/* City Filter */}
        <Box sx={{ mb: 3 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              cursor: "pointer",
              py: 0.5,
            }}
            onClick={() => toggleSection("city")}
          >
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              City
            </Typography>
            {expandedSection === "city" ? (
              <ExpandLess fontSize="small" />
            ) : (
              <ExpandMore fontSize="small" />
            )}
          </Box>
          <Collapse in={expandedSection === "city"}>
            <TextField
              fullWidth
              size="small"
              label="Pharmacy City"
              value={filters.city || ""}
              onChange={(e) =>
                onFilterChange({ city: e.target.value || undefined })
              }
              sx={{ mt: 1 }}
            />
          </Collapse>
        </Box>

        {/* Price Range Filter */}
        <Box sx={{ mb: 3 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              cursor: "pointer",
              py: 0.5,
            }}
            onClick={() => toggleSection("price")}
          >
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Max Price
            </Typography>
            {expandedSection === "price" ? (
              <ExpandLess fontSize="small" />
            ) : (
              <ExpandMore fontSize="small" />
            )}
          </Box>
          <Collapse in={expandedSection === "price"}>
            <Box sx={{ px: 1, pt: 1 }}>
              <Slider
                value={filters.maxPrice || 500}
                onChange={(_, value) =>
                  onFilterChange({ maxPrice: value as number })
                }
                min={0}
                max={500}
                step={10}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `ETB ${value}`}
                sx={{ color: "#0F8B6C", mb: 1 }}
              />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", textAlign: "right" }}
              >
                Up to ETB {filters.maxPrice || 500}
              </Typography>
            </Box>
          </Collapse>
        </Box>

        {/* Stock Filter */}
        <Box sx={{ mb: 3 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              cursor: "pointer",
              py: 0.5,
            }}
            onClick={() => toggleSection("stock")}
          >
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Minimum Stock
            </Typography>
            {expandedSection === "stock" ? (
              <ExpandLess fontSize="small" />
            ) : (
              <ExpandMore fontSize="small" />
            )}
          </Box>
          <Collapse in={expandedSection === "stock"}>
            <Box sx={{ px: 1, pt: 1 }}>
              <Slider
                value={filters.minStock || 0}
                onChange={(_, value) =>
                  onFilterChange({ minStock: value as number })
                }
                min={0}
                max={500}
                step={10}
                valueLabelDisplay="auto"
                sx={{ color: "#0F8B6C", mb: 1 }}
              />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", textAlign: "right" }}
              >
                At least {filters.minStock || 0} units
              </Typography>
            </Box>
          </Collapse>
        </Box>

        {/* Reset Button */}
        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Button
            size="small"
            variant="text"
            onClick={onReset}
            sx={{ color: "text.secondary" }}
          >
            Reset Filters
          </Button>
        </Box>
      </Paper>
    </Collapse>
  );
};
