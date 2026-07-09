import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth.middleware.js';
import { getSettingsController, putSettingsController } from './settings.controller.js';

const router = Router();

router.get('/', authenticate, getSettingsController);
router.put('/', authenticate, requireRole('Admin', 'Super Admin'), putSettingsController);

export default router;