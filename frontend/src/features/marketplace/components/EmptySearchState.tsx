// frontend/src/features/marketplace/components/EmptySearchState.tsx
import { LocalPharmacy, SearchOff, TipsAndUpdates } from "@mui/icons-material";
import { Box, Button, Stack, Typography } from "@mui/material";

interface EmptySearchStateProps {
  query: string;
  onReset?: () => void;
  onBrowseAll?: () => void;
}

export const EmptySearchState = ({
  query,
  onReset,
  onBrowseAll,
}: EmptySearchStateProps) => {
  const hasQuery = query.trim().length > 0;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        py: { xs: 6, md: 10 },
        px: 3,
        textAlign: "center",
        bgcolor: "rgba(255, 255, 255, 0.6)",
        borderRadius: 4,
        border: "1px dashed rgba(23, 35, 31, 0.15)",
        maxWidth: 600,
        mx: "auto",
      }}
    >
      {/* Icon */}
      <Box
        sx={{
          mb: 3,
          color: "primary.main",
          bgcolor: "rgba(15, 139, 108, 0.08)",
          p: 2.5,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {hasQuery ? (
          <SearchOff fontSize="large" />
        ) : (
          <LocalPharmacy fontSize="large" />
        )}
      </Box>

      {/* Title */}
      <Typography variant="h6" color="#1E293B" sx={{ fontWeight: 700, mb: 1 }}>
        {hasQuery ? "No medicines found" : "Start your search"}
      </Typography>

      {/* Description */}
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ maxWidth: 400, mb: 3 }}
      >
        {hasQuery
          ? `We couldn't find any medicines matching "${query}". Try checking your spelling, using a generic name, or browsing by category.`
          : "Search for medicines by name, generic name, or category to discover availability across all pharmacies in Ethiopia."}
      </Typography>

      {/* Helpful Tips (only when query exists) */}
      {hasQuery && (
        <Box
          sx={{
            mb: 3,
            p: 2,
            bgcolor: "rgba(221, 170, 74, 0.08)",
            borderRadius: 2,
            border: "1px solid rgba(221, 170, 74, 0.2)",
            textAlign: "left",
            width: "100%",
          }}
        >
          <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1 }}>
            <TipsAndUpdates fontSize="small" sx={{ color: "#8A5F16" }} />
            <Typography
              variant="caption"
              sx={{ fontWeight: 700, color: "#8A5F16" }}
            >
              Search Tips
            </Typography>
          </Stack>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", mb: 0.5 }}
          >
            • Try the generic name (e.g., "Paracetamol" instead of brand)
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", mb: 0.5 }}
          >
            • Check spelling or use partial matches (e.g., "amox" for
            Amoxicillin)
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block" }}
          >
            • Browse categories: Antibiotic, Analgesic, Antimalarial, Vitamin
          </Typography>
        </Box>
      )}

      {/* Action Buttons */}
<Stack
         direction="row"
         spacing={2}
         sx={{ flexWrap: "wrap", justifyContent: "center" }}
       >
        {hasQuery && onReset && (
          <Button
            variant="outlined"
            size="small"
            onClick={onReset}
            sx={{
              borderColor: "rgba(15, 139, 108, 0.5)",
              color: "#0F8B6C",
              fontWeight: 600,
              "&:hover": {
                borderColor: "#0F8B6C",
                bgcolor: "rgba(15, 139, 108, 0.04)",
              },
            }}
          >
            Clear Search
          </Button>
        )}
        {onBrowseAll && (
          <Button
            variant="contained"
            size="small"
            onClick={onBrowseAll}
            sx={{
              background: "linear-gradient(135deg, #0F8B6C 0%, #0A6B59 100%)",
              "&:hover": {
                background: "linear-gradient(135deg, #0A6B59 0%, #064E3B 100%)",
              },
              fontWeight: 700,
            }}
          >
            Browse All Medicines
          </Button>
        )}
      </Stack>
    </Box>
  );
};
