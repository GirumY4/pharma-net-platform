// src/modules/users/users.routes.ts
import { Router } from 'express';
import { getMe, getUsers, deleteUser } from './users.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { authorizeRoles } from '../../middlewares/rbac.middleware.js';

const router = Router();

// Route accessible to any authenticated user
router.get('/me', protect, getMe);

// Routes accessible ONLY to admins
router.route('/')
    .get(protect, authorizeRoles(['admin']), getUsers);

router.route('/:id')
    .delete(protect, authorizeRoles(['admin']), deleteUser);
    // You can add PATCH here later based on the API docs

export default router;