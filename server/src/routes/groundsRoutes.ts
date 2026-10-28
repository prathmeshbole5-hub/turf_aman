import { Router } from 'express';
import { dbStore, type GroundEntity } from '../db/store';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// GET all grounds (can filter by ?sportId=...)
router.get('/', (req, res) => {
  const { sportId } = req.query;
  const allGrounds = Array.from(dbStore.grounds.values()).filter((g) => g.isActive);

  if (sportId && typeof sportId === 'string') {
    const sport = dbStore.sports.get(sportId);
    if (sport) {
      const compatible = allGrounds.filter((g) => sport.supportedGroundIds.includes(g.id));
      res.json({ success: true, count: compatible.length, grounds: compatible });
      return;
    }
  }

  res.json({ success: true, count: allGrounds.length, grounds: allGrounds });
});

// GET single ground
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const ground = dbStore.grounds.get(id);

  if (!ground) {
    res.status(404).json({ success: false, error: 'Ground not found.' });
    return;
  }

  res.json({ success: true, ground });
});

// PUT update ground (Admin Only)
router.put('/:id', authenticateToken, requireRole('ADMIN'), (req, res) => {
  const { id } = req.params;
  const ground = dbStore.grounds.get(id);

  if (!ground) {
    res.status(404).json({ success: false, error: 'Ground not found.' });
    return;
  }

  const { name, description, surfaceType, dimensions, lightingLux, capacity, baseHourlyRate, isActive } = req.body;

  if (name !== undefined) ground.name = name;
  if (description !== undefined) ground.description = description;
  if (surfaceType !== undefined) ground.surfaceType = surfaceType;
  if (dimensions !== undefined) ground.dimensions = dimensions;
  if (lightingLux !== undefined) ground.lightingLux = Number(lightingLux);
  if (capacity !== undefined) ground.capacity = Number(capacity);
  if (baseHourlyRate !== undefined) ground.baseHourlyRate = Number(baseHourlyRate);
  if (isActive !== undefined) ground.isActive = Boolean(isActive);

  ground.updatedAt = new Date().toISOString();

  res.json({ success: true, message: 'Ground updated successfully.', ground });
});

export default router;
