// src/features/marketplace/index.ts
// Public API exports for the Marketplace feature module

// Pages
export { MarketplacePage } from "./pages/MarketplacePage";

// Components (for advanced usage)
export { EmptySearchState } from "./components/EmptySearchState";
export { MarketplaceHero } from "./components/MarketplaceHero";
export { MedicineCard } from "./components/MedicineCard";
export { SearchResultsGrid } from "./components/SearchResultsGrid";
export { SmartFiltersSidebar } from "./components/SmartFiltersSidebar";

// Hooks
export { useGeolocation } from "./hooks/useGeolocation";
export { useMarketplaceSearch } from "./hooks/useMarketplaceSearch";

// Services
export {
  createMarketplaceOrder,
  fetchMedicinePublicDetails,
  searchMarketplace,
} from "./services/marketplaceApi";

// Types
export type {
  Category,
  CreateMarketplaceOrderPayload,
  MarketplaceApiResponse,
  MarketplaceFilters,
  MarketplaceMedicine,
  MarketplaceOrderSummary,
  UnitOfMeasure,
} from "./types";

// Constants
export { CATEGORIES, UNIT_OPTIONS } from "./types";
