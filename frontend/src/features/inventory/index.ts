// src/features/inventory/index.ts
// Public API exports for the Inventory feature module

// Pages
export { InventoryPage } from "./pages/InventoryPage";

// Components (for advanced usage)
export { BatchExpansionRow } from "./components/BatchExpansionRow";
export { InventoryTable } from "./components/InventoryTable";
export { MedicineFormDrawer } from "./components/MedicineFormDrawer";
export { StatusChip } from "./components/StatusChip";

// Hooks
export { useInventory } from "./hooks/useInventory";

// Services
export {
  createMedicine,
  deleteMedicine,
  fetchInventory,
  fetchMedicineById,
  updateMedicine,
} from "./services/inventoryApi";

// Types
export type {
  IBatch,
  IMedicine,
  InventoryFilters,
  MedicineFormValues,
  StockStatus,
} from "./types";

// Constants
export { STOCK_STATUS_CONFIG } from "./constants";
