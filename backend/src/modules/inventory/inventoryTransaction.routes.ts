// src/modules/inventory/inventoryTransaction.routes.ts
import { Router } from 'express';
import { createTransaction, getTransactions } from './inventoryTransaction.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { authorizeRoles } from '../../middlewares/rbac.middleware.js';

const router = Router();

router.use(protect);
router.use(authorizeRoles(['admin', 'warehouse_manager'])); // Pharmacies cannot access this

router.route('/')
    .get(getTransactions)
    .post(createTransaction);

export default router;