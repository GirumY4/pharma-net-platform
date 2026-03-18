// src/modules/inventory/medicine.routes.ts
import { Router } from 'express';
import { createMedicine, getMedicines } from './medicine.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { authorizeRoles } from '../../middlewares/rbac.middleware.js';

const router = Router();

// Apply protect middleware to all routes in this file
router.use(protect);

router.route('/')
    .get(getMedicines) // All authenticated users can view inventory
    .post(authorizeRoles(['admin', 'warehouse_manager']), createMedicine);

export default router;