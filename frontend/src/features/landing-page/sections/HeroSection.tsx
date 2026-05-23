// src/features/landing-page/sections/HeroSection.tsx
import { Search } from "@mui/icons-material";
import {
  Box,
  Button,
  Chip,
  Container,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMarketplaceSearch } from "../../marketplace/hooks/useMarketplaceSearch";
import type { MarketplaceFilters } from "../../marketplace/types";

const DEFAULT_FILTERS: MarketplaceFilters = {
  page: 1,
  limit: 12,
};

const QUICK_CATEGORIES = [
  "Antibiotic",
  "Analgesic",
  "Antimalarial",
  "Vitamin",
  "Insulin",
];

interface HeroSectionProps {
  title?: string;
  subtitle?: string;
}

export const HeroSection = ({
  title = "Multi-Tenant Pharmacy\nInventory & Compliance SaaS",
  subtitle = "Ethiopia's most advanced pharmaceutical operations and inventory management platform. Track batches under FEFO, maintain ALCOA+ compliance logs, and publish stock availability for in-store patient discovery.",
}: HeroSectionProps) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const { search } = useMarketplaceSearch(DEFAULT_FILTERS);

  const handleSearch = useCallback(() => {
    if (searchQuery.trim()) {
      search({ ...DEFAULT_FILTERS, name: searchQuery.trim() });
      navigate("/marketplace");
    }
  }, [searchQuery, search, navigate]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleCategoryClick = (category: string) => {
    setSearchQuery(`category:${category}`);
    search({ ...DEFAULT_FILTERS, category });
    navigate("/marketplace");
  };

  return (
    <Box
      sx={{
        py: { xs: 8, md: 14 },
        px: { xs: 2, md: 4 },
        textAlign: "center",
        background: `linear-gradient(135deg, ${alpha("#0F5E4D", 0.08)} 0%, ${alpha("#DDAA4A", 0.08)} 100%)`,
        borderBottom: `1px solid ${alpha("#17231F", 0.08)}`,
      }}
    >
      <Container maxWidth="lg">
        <Typography
          variant="h1"
          color="#0F5E4D"
          sx={{
            fontWeight: 800,
            letterSpacing: "-0.5px",
            mb: 3,
            lineHeight: 1.05,
            fontSize: { xs: "2.5rem", sm: "3.5rem", md: "4.5rem" },
            whiteSpace: "pre-line",
          }}
        >
          {title}
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{
            mb: 5,
            fontSize: { xs: "1.1rem", md: "1.25rem" },
            maxWidth: 700,
            mx: "auto",
            lineHeight: 1.7,
          }}
        >
          {subtitle}
        </Typography>

        {/* Central Live Search Interface */}
        <Paper
          elevation={0}
          sx={{
            maxWidth: 720,
            mx: "auto",
            p: { xs: 2, sm: 3 },
            borderRadius: 4,
            bgcolor: alpha("#FFFFFF", 0.92),
            backdropFilter: "blur(20px)",
            border: `1px solid ${alpha("#17231F", 0.1)}`,
            boxShadow: `0 24px 64px ${alpha("#0F5E4D", 0.12)}`,
          }}
        >
          <Stack
            direction="row"
            spacing={2}
            sx={{
              alignItems: "center",
              border: `1px solid ${alpha("#17231F", 0.12)}`,
              borderRadius: 3,
              px: 2.5,
              py: 1.5,
              transition: "box-shadow 160ms ease, border-color 160ms ease",
              "&:focus-within": {
                boxShadow: `0 12px 40px ${alpha("#0F5E4D", 0.15)}`,
                borderColor: "primary.main",
              },
            }}
          >
            <Search
              sx={{ color: "text.secondary", fontSize: 24, flexShrink: 0 }}
            />
            <TextField
              fullWidth
              variant="standard"
              placeholder="Search medicines, generic names, categories, or pharmacies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              slotProps={{
                input: {
                  disableUnderline: true,
                  sx: { fontSize: "1.1rem", fontWeight: 500 },
                },
              }}
            />
            <Button
              variant="contained"
              onClick={handleSearch}
              sx={{
                bgcolor: "#0F5E4D",
                color: "#FFFFFF",
                fontWeight: 700,
                borderRadius: 2.5,
                px: 3,
                py: 1.25,
                minWidth: 120,
                "&:hover": {
                  bgcolor: "#0A6B59",
                },
              }}
            >
              Search
            </Button>
          </Stack>
        </Paper>

        {/* Quick Action Chips */}
        <Stack
          direction="row"
          spacing={1.5}
          sx={{
            justifyContent: "center",
            flexWrap: "wrap",
            mt: 4,
          }}
        >
          {QUICK_CATEGORIES.map((cat) => (
            <Chip
              key={cat}
              label={cat}
              onClick={() => handleCategoryClick(cat)}
              sx={{
                bgcolor: alpha("#FFFFFF", 0.8),
                border: `1px solid ${alpha("#17231F", 0.12)}`,
                fontWeight: 600,
                py: 2,
                "&:hover": {
                  bgcolor: alpha("#0F5E4D", 0.12),
                  borderColor: "primary.main",
                },
              }}
            />
          ))}
        </Stack>
      </Container>
    </Box>
  );
};

export default HeroSection;
