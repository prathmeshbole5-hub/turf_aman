import { Router } from 'express';
import { dbStore, type SportEntity } from '../db/store';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// GET all sports (supports query ?all=true for admin to view inactive)
router.get('/', (req, res) => {
  const showAll = req.query.all === 'true';
  const allSports = Array.from(dbStore.sports.values());
  const filtered = showAll ? allSports : allSports.filter((s) => s.isActive);
  res.json({ success: true, count: filtered.length, sports: filtered });
});

// GET single sport by ID or slug
router.get('/:idOrSlug', (req, res) => {
  const { idOrSlug } = req.params;
  const sport = Array.from(dbStore.sports.values()).find(
    (s) => s.id === idOrSlug || s.slug === idOrSlug
  );

  if (!sport) {
    res.status(404).json({ success: false, error: 'Sport not found.' });
    return;
  }

  res.json({ success: true, sport });
});

// POST new sport (Admin Only)
router.post('/', authenticateToken, requireRole('ADMIN'), (req, res) => {
  try {
    const { name, description, coverImage, startingHourlyRate, minDurationMinutes, supportedGroundIds } = req.body;

    if (!name || !startingHourlyRate) {
      res.status(400).json({ success: false, error: 'Name and startingHourlyRate are required.' });
      return;
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const id = `sport_${Date.now()}`;

    const newSport: SportEntity = {
      id,
      name,
      slug,
      description: description || '',
      coverImage: coverImage || '/images/hero_turf_night.jpg',
      startingHourlyRate: Number(startingHourlyRate),
      minDurationMinutes: Number(minDurationMinutes) || 60,
      supportedGroundIds: supportedGroundIds || ['ground_main_arena'],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    dbStore.sports.set(id, newSport);

    res.status(201).json({ success: true, message: 'Sport created successfully.', sport: newSport });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT update sport (Admin Only)
router.put('/:id', authenticateToken, requireRole('ADMIN'), (req, res) => {
  const { id } = req.params;
  const sport = dbStore.sports.get(id);

  if (!sport) {
    res.status(404).json({ success: false, error: 'Sport not found.' });
    return;
  }

  const { name, description, coverImage, startingHourlyRate, minDurationMinutes, supportedGroundIds, isActive } = req.body;

  if (name !== undefined) sport.name = name;
  if (description !== undefined) sport.description = description;
  if (coverImage !== undefined) sport.coverImage = coverImage;
  if (startingHourlyRate !== undefined) sport.startingHourlyRate = Number(startingHourlyRate);
  if (minDurationMinutes !== undefined) sport.minDurationMinutes = Number(minDurationMinutes);
  if (supportedGroundIds !== undefined) sport.supportedGroundIds = supportedGroundIds;
  if (isActive !== undefined) sport.isActive = Boolean(isActive);

  sport.updatedAt = new Date().toISOString();

  res.json({ success: true, message: 'Sport updated successfully.', sport });
});

// DELETE sport (Admin Only)
router.delete('/:id', authenticateToken, requireRole('ADMIN'), (req, res) => {
  const { id } = req.params;
  if (!dbStore.sports.has(id)) {
    res.status(404).json({ success: false, error: 'Sport not found.' });
    return;
  }

  dbStore.sports.delete(id);
  res.json({ success: true, message: 'Sport deleted successfully.' });
});

export default router;
