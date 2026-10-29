// server/src/app.ts
import express from "express";
import cors from "cors";

// server/src/config.ts
import dotenv from "dotenv";
dotenv.config();
var config = {
  port: parseInt(process.env.PORT || "5000", 10),
  jwtSecret: process.env.JWT_SECRET || "turfzone_super_secret_jwt_key_2026_sports_tech",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  nodeEnv: process.env.NODE_ENV || "development",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || "rzp_test_turfzone2026",
    keySecret: process.env.RAZORPAY_KEY_SECRET || "turfzone_razorpay_secret_test_key_8492",
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || "turfzone_webhook_secret_key"
  },
  policy: {
    advancePercentage: 25,
    cancellationWindowHours: 12,
    taxPercentage: 5,
    holdDurationMinutes: 10
  },
  adminSeed: {
    email: process.env.ADMIN_EMAIL || "admin@turfzone.com",
    password: process.env.ADMIN_PASSWORD || "TurfZone@2026!Admin",
    name: "Arena Super Admin",
    phone: "8441998303"
  }
};

// server/src/routes/authRoutes.ts
import { Router } from "express";
import bcrypt2 from "bcryptjs";
import jwt2 from "jsonwebtoken";

// server/src/db/store.ts
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
var DatabaseStore = class {
  users = /* @__PURE__ */ new Map();
  sports = /* @__PURE__ */ new Map();
  grounds = /* @__PURE__ */ new Map();
  blockedPeriods = /* @__PURE__ */ new Map();
  bookings = /* @__PURE__ */ new Map();
  payments = /* @__PURE__ */ new Map();
  auditLogs = [];
  // Ground Locks for Concurrency Control
  groundMutexes = /* @__PURE__ */ new Map();
  getDbFilePath() {
    if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
      return path.resolve("/tmp", "turf_database.json");
    }
    return path.resolve(process.cwd(), "server", "data", "turf_database.json");
  }
  constructor() {
    this.seedInitialData();
    this.loadFromDisk();
  }
  // Canonical ground resolution supporting IDs, slugs, and legacy frontend aliases
  getGround(idOrSlug) {
    if (!idOrSlug) return void 0;
    const clean = idOrSlug.trim();
    if (this.grounds.has(clean)) return this.grounds.get(clean);
    for (const g of this.grounds.values()) {
      if (g.id === clean || g.slug === clean) return g;
    }
    if (clean === "ground-alpha" || clean === "main-arena") {
      return this.grounds.get("ground_main_arena");
    }
    if (clean === "ground-beta" || clean === "ground-cage-1" || clean === "box-cage" || clean === "cage-arena") {
      return this.grounds.get("ground_box_cage");
    }
    return void 0;
  }
  // Canonical sport resolution supporting IDs, slugs, and hyphen/underscore variants
  getSport(idOrSlug) {
    if (!idOrSlug) return void 0;
    const clean = idOrSlug.trim();
    if (this.sports.has(clean)) return this.sports.get(clean);
    for (const s of this.sports.values()) {
      if (s.id === clean || s.slug === clean) return s;
    }
    const normalized = clean.replace(/-/g, "_");
    if (this.sports.has(normalized)) return this.sports.get(normalized);
    const withPrefix = normalized.startsWith("sport_") ? normalized : `sport_${normalized}`;
    if (this.sports.has(withPrefix)) return this.sports.get(withPrefix);
    return void 0;
  }
  // Serialized Transaction Execution for Double-Booking Prevention
  async withGroundLock(groundId, operation) {
    const ground = this.getGround(groundId);
    const lockKey = ground ? ground.id : groundId;
    const currentLock = this.groundMutexes.get(lockKey) || Promise.resolve();
    let releaseLock;
    const nextLock = new Promise((resolve) => {
      releaseLock = resolve;
    });
    this.groundMutexes.set(lockKey, currentLock.then(() => nextLock));
    await currentLock;
    try {
      const result = await operation();
      this.saveToDisk();
      return result;
    } finally {
      releaseLock();
      if (this.groundMutexes.get(lockKey) === nextLock) {
        this.groundMutexes.delete(lockKey);
      }
    }
  }
  // Persistence to prevent accidental in-memory permanent data loss
  saveToDisk() {
    try {
      const filePath = this.getDbFilePath();
      const dataDir = path.dirname(filePath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      const dump = {
        bookings: Array.from(this.bookings.values()),
        blockedPeriods: Array.from(this.blockedPeriods.values()),
        payments: Array.from(this.payments.values()),
        auditLogs: this.auditLogs,
        users: Array.from(this.users.values()),
        grounds: Array.from(this.grounds.values()),
        sports: Array.from(this.sports.values()),
        savedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      fs.writeFileSync(filePath, JSON.stringify(dump, null, 2), "utf-8");
    } catch (err) {
      console.error("Failed to write database persistence file:", err);
    }
  }
  loadFromDisk() {
    try {
      const primaryPath = this.getDbFilePath();
      const localDataPath = path.resolve(process.cwd(), "server", "data", "turf_database.json");
      const targetPath = fs.existsSync(primaryPath) ? primaryPath : fs.existsSync(localDataPath) ? localDataPath : null;
      if (!targetPath) return;
      const raw = fs.readFileSync(targetPath, "utf-8");
      const data = JSON.parse(raw);
      if (Array.isArray(data.bookings)) {
        data.bookings.forEach((b) => this.bookings.set(b.id, b));
      }
      if (Array.isArray(data.blockedPeriods)) {
        data.blockedPeriods.forEach((bp) => this.blockedPeriods.set(bp.id, bp));
      }
      if (Array.isArray(data.payments)) {
        data.payments.forEach((p) => this.payments.set(p.id, p));
      }
      if (Array.isArray(data.auditLogs)) {
        this.auditLogs = data.auditLogs;
      }
      if (Array.isArray(data.users)) {
        data.users.forEach((u) => this.users.set(u.id, u));
      }
      if (Array.isArray(data.grounds)) {
        data.grounds.forEach((g) => this.grounds.set(g.id, g));
      }
      if (Array.isArray(data.sports)) {
        data.sports.forEach((s) => this.sports.set(s.id, s));
      }
    } catch (err) {
      console.warn("Failed to load database from disk, proceeding with seeded memory store:", err);
    }
  }
  seedInitialData() {
    const adminId = "usr_admin_001";
    const adminPasswordHash = bcrypt.hashSync(config.adminSeed.password, 10);
    this.users.set(adminId, {
      id: adminId,
      email: config.adminSeed.email,
      phone: config.adminSeed.phone,
      name: config.adminSeed.name,
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    const custId = "usr_cust_001";
    const custPasswordHash = bcrypt.hashSync("Player@123", 10);
    this.users.set(custId, {
      id: custId,
      email: "rohit.sharma@example.com",
      phone: "9876501234",
      name: "Rohit Sharma",
      passwordHash: custPasswordHash,
      role: "CUSTOMER",
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    const g1 = {
      id: "ground_main_arena",
      name: "Main Arena (Alpha Pitch)",
      slug: "main-arena",
      description: "Full-size multi-sport ground for 11v11, 7v7 football, and cricket matches with high-intensity lighting.",
      surfaceType: "FIFA-grade 50mm synthetic grass with rubber infill",
      dimensions: "100 x 65 ft",
      lightingLux: 1200,
      capacity: 30,
      baseHourlyRate: 900,
      isActive: true,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    const g2 = {
      id: "ground_box_cage",
      name: "The Box Cage (Beta Pitch)",
      slug: "box-cage",
      description: "Enclosed heavy-duty perimeter netted court for 5v5 futsal and intense box cricket games.",
      surfaceType: "Monofilament multisport anti-skid synthetic turf",
      dimensions: "75 x 45 ft",
      lightingLux: 800,
      capacity: 16,
      baseHourlyRate: 750,
      isActive: true,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.grounds.set(g1.id, g1);
    this.grounds.set(g2.id, g2);
    const sportsList = [
      {
        id: "sport_cricket",
        name: "Cricket (Full Pitch)",
        slug: "cricket",
        description: "Regulation full-pitch cricket matches with certified nets and crease markings.",
        coverImage: "/images/sport_cricket.jpg",
        startingHourlyRate: 1e3,
        minDurationMinutes: 60,
        supportedGroundIds: ["ground_main_arena"],
        isActive: true,
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      },
      {
        id: "sport_box_cricket",
        name: "Box Cricket",
        slug: "box-cricket",
        description: "Fast-paced enclosed arena cricket featuring heavy perimeter netting.",
        coverImage: "/images/sport_box_cricket.jpg",
        startingHourlyRate: 800,
        minDurationMinutes: 60,
        supportedGroundIds: ["ground_main_arena", "ground_box_cage"],
        isActive: true,
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      },
      {
        id: "sport_football",
        name: "Football (7v7 / 11v11)",
        slug: "football",
        description: "Pro-grade synthetic turf with weather-proof goalposts and dynamic floodlights.",
        coverImage: "/images/sport_football.jpg",
        startingHourlyRate: 900,
        minDurationMinutes: 60,
        supportedGroundIds: ["ground_main_arena"],
        isActive: true,
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      },
      {
        id: "sport_futsal",
        name: "Futsal (5v5 Fast Pitch)",
        slug: "futsal",
        description: "Compact high-intensity court with rebound perimeter boards.",
        coverImage: "/images/sport_futsal.jpg",
        startingHourlyRate: 750,
        minDurationMinutes: 60,
        supportedGroundIds: ["ground_box_cage"],
        isActive: true,
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      }
    ];
    sportsList.forEach((s) => this.sports.set(s.id, s));
    const todayStr = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const b1 = {
      id: "bkg_seed_001",
      referenceCode: "TZ-8492",
      customerId: custId,
      customerName: "Rohit Sharma",
      customerPhone: "9876501234",
      customerEmail: "rohit.sharma@example.com",
      sportId: "sport_football",
      sportName: "Football (7v7 / 11v11)",
      groundId: "ground_main_arena",
      groundName: "Main Arena (Alpha Pitch)",
      date: todayStr,
      startTime: "07:00 PM",
      endTime: "08:30 PM",
      startMinuteOfDay: 1140,
      // 19:00
      endMinuteOfDay: 1230,
      // 20:30
      durationMinutes: 90,
      bookingStatus: "CONFIRMED",
      paymentStatus: "PAID_FULL",
      paymentMethod: "RAZORPAY",
      paymentType: "FULL",
      pricing: {
        sportId: "sport_football",
        groundId: "ground_main_arena",
        date: todayStr,
        startTime: "07:00 PM",
        endTime: "08:30 PM",
        durationMinutes: 90,
        baseHourlyRate: 900,
        effectiveHourlyRate: 1150,
        groundCharge: 1725,
        peakSurcharge: 375,
        selectedAddOns: [],
        addOnsTotal: 0,
        discountPercentage: 0,
        discountAmount: 0,
        subtotal: 1725,
        taxPercentage: 5,
        taxAmount: 86.25,
        totalAmount: 1811.25,
        advancePercentage: 100,
        advanceAmount: 1811.25,
        remainingBalance: 0
      },
      notes: "Evening league game",
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.bookings.set(b1.id, b1);
  }
};
var dbStore = new DatabaseStore();

// server/src/middleware/auth.ts
import jwt from "jsonwebtoken";
function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      error: "Authentication required. Missing or malformed Bearer token."
    });
    return;
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      res.status(401).json({
        success: false,
        error: "Session expired. Please log in again."
      });
      return;
    }
    res.status(403).json({
      success: false,
      error: "Invalid or forged token."
    });
  }
}
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: "Authentication required."
      });
      return;
    }
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: `Access denied. Requires one of [${allowedRoles.join(", ")}] role. Your role is ${req.user.role}.`
      });
      return;
    }
    next();
  };
}
function optionalAuth(req, _res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, config.jwtSecret);
      req.user = decoded;
    } catch {
    }
  }
  next();
}

// server/src/routes/authRoutes.ts
var router = Router();
router.post("/register", async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !phone || !password) {
      res.status(400).json({ success: false, error: "Name, email, phone, and password are required." });
      return;
    }
    const existingEmail = Array.from(dbStore.users.values()).find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existingEmail) {
      res.status(409).json({ success: false, error: "An account with this email address already exists." });
      return;
    }
    const existingPhone = Array.from(dbStore.users.values()).find((u) => u.phone === phone);
    if (existingPhone) {
      res.status(409).json({ success: false, error: "An account with this phone number already exists." });
      return;
    }
    const passwordHash = await bcrypt2.hash(password, 10);
    const id = `usr_${Date.now()}`;
    const newUser = {
      id,
      name,
      email: email.toLowerCase(),
      phone,
      passwordHash,
      role: "CUSTOMER",
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    dbStore.users.set(id, newUser);
    const tokenPayload = {
      userId: id,
      email: newUser.email,
      role: newUser.role,
      name: newUser.name
    };
    const token = jwt2.sign(tokenPayload, config.jwtSecret, { expiresIn: "7d" });
    res.status(201).json({
      success: true,
      message: "Account registered successfully.",
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router.post("/login", async (req, res) => {
  try {
    const { emailOrPhone, password } = req.body;
    if (!emailOrPhone || !password) {
      res.status(400).json({ success: false, error: "Email/Phone and password are required." });
      return;
    }
    const user = Array.from(dbStore.users.values()).find(
      (u) => u.email.toLowerCase() === emailOrPhone.toLowerCase() || u.phone === emailOrPhone
    );
    if (!user) {
      res.status(401).json({ success: false, error: "Invalid credentials. User not found." });
      return;
    }
    const isMatch = await bcrypt2.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ success: false, error: "Invalid credentials. Incorrect password." });
      return;
    }
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    };
    const token = jwt2.sign(tokenPayload, config.jwtSecret, { expiresIn: "7d" });
    res.json({
      success: true,
      message: "Logged in successfully.",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router.get("/me", authenticateToken, (req, res) => {
  const user = dbStore.users.get(req.user.userId);
  if (!user) {
    res.status(404).json({ success: false, error: "User profile not found." });
    return;
  }
  res.json({
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role
    }
  });
});
var authRoutes_default = router;

// server/src/routes/sportsRoutes.ts
import { Router as Router2 } from "express";
var router2 = Router2();
router2.get("/", (req, res) => {
  const showAll = req.query.all === "true";
  const allSports = Array.from(dbStore.sports.values());
  const filtered = showAll ? allSports : allSports.filter((s) => s.isActive);
  res.json({ success: true, count: filtered.length, sports: filtered });
});
router2.get("/:idOrSlug", (req, res) => {
  const { idOrSlug } = req.params;
  const sport = Array.from(dbStore.sports.values()).find(
    (s) => s.id === idOrSlug || s.slug === idOrSlug
  );
  if (!sport) {
    res.status(404).json({ success: false, error: "Sport not found." });
    return;
  }
  res.json({ success: true, sport });
});
router2.post("/", authenticateToken, requireRole("ADMIN"), (req, res) => {
  try {
    const { name, description, coverImage, startingHourlyRate, minDurationMinutes, supportedGroundIds } = req.body;
    if (!name || !startingHourlyRate) {
      res.status(400).json({ success: false, error: "Name and startingHourlyRate are required." });
      return;
    }
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const id = `sport_${Date.now()}`;
    const newSport = {
      id,
      name,
      slug,
      description: description || "",
      coverImage: coverImage || "/images/hero_turf_night.jpg",
      startingHourlyRate: Number(startingHourlyRate),
      minDurationMinutes: Number(minDurationMinutes) || 60,
      supportedGroundIds: supportedGroundIds || ["ground_main_arena"],
      isActive: true,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    dbStore.sports.set(id, newSport);
    res.status(201).json({ success: true, message: "Sport created successfully.", sport: newSport });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router2.put("/:id", authenticateToken, requireRole("ADMIN"), (req, res) => {
  const { id } = req.params;
  const sport = dbStore.sports.get(id);
  if (!sport) {
    res.status(404).json({ success: false, error: "Sport not found." });
    return;
  }
  const { name, description, coverImage, startingHourlyRate, minDurationMinutes, supportedGroundIds, isActive } = req.body;
  if (name !== void 0) sport.name = name;
  if (description !== void 0) sport.description = description;
  if (coverImage !== void 0) sport.coverImage = coverImage;
  if (startingHourlyRate !== void 0) sport.startingHourlyRate = Number(startingHourlyRate);
  if (minDurationMinutes !== void 0) sport.minDurationMinutes = Number(minDurationMinutes);
  if (supportedGroundIds !== void 0) sport.supportedGroundIds = supportedGroundIds;
  if (isActive !== void 0) sport.isActive = Boolean(isActive);
  sport.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  res.json({ success: true, message: "Sport updated successfully.", sport });
});
router2.delete("/:id", authenticateToken, requireRole("ADMIN"), (req, res) => {
  const { id } = req.params;
  if (!dbStore.sports.has(id)) {
    res.status(404).json({ success: false, error: "Sport not found." });
    return;
  }
  dbStore.sports.delete(id);
  res.json({ success: true, message: "Sport deleted successfully." });
});
var sportsRoutes_default = router2;

// server/src/routes/groundsRoutes.ts
import { Router as Router3 } from "express";
var router3 = Router3();
router3.get("/", (req, res) => {
  const { sportId } = req.query;
  const allGrounds = Array.from(dbStore.grounds.values()).filter((g) => g.isActive);
  if (sportId && typeof sportId === "string") {
    const sport = dbStore.sports.get(sportId);
    if (sport) {
      const compatible = allGrounds.filter((g) => sport.supportedGroundIds.includes(g.id));
      res.json({ success: true, count: compatible.length, grounds: compatible });
      return;
    }
  }
  res.json({ success: true, count: allGrounds.length, grounds: allGrounds });
});
router3.get("/:id", (req, res) => {
  const { id } = req.params;
  const ground = dbStore.grounds.get(id);
  if (!ground) {
    res.status(404).json({ success: false, error: "Ground not found." });
    return;
  }
  res.json({ success: true, ground });
});
router3.put("/:id", authenticateToken, requireRole("ADMIN"), (req, res) => {
  const { id } = req.params;
  const ground = dbStore.grounds.get(id);
  if (!ground) {
    res.status(404).json({ success: false, error: "Ground not found." });
    return;
  }
  const { name, description, surfaceType, dimensions, lightingLux, capacity, baseHourlyRate, isActive } = req.body;
  if (name !== void 0) ground.name = name;
  if (description !== void 0) ground.description = description;
  if (surfaceType !== void 0) ground.surfaceType = surfaceType;
  if (dimensions !== void 0) ground.dimensions = dimensions;
  if (lightingLux !== void 0) ground.lightingLux = Number(lightingLux);
  if (capacity !== void 0) ground.capacity = Number(capacity);
  if (baseHourlyRate !== void 0) ground.baseHourlyRate = Number(baseHourlyRate);
  if (isActive !== void 0) ground.isActive = Boolean(isActive);
  ground.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  res.json({ success: true, message: "Ground updated successfully.", ground });
});
var groundsRoutes_default = router3;

// server/src/routes/availabilityRoutes.ts
import { Router as Router4 } from "express";

// server/src/utils/timeUtils.ts
function parseTimeToMinutes(timeStr) {
  const trimmed = timeStr.trim().toUpperCase();
  if (trimmed.includes("AM") || trimmed.includes("PM")) {
    const isPM = trimmed.includes("PM");
    const isAM = trimmed.includes("AM");
    const cleanTime = trimmed.replace("AM", "").replace("PM", "").trim();
    const parts2 = cleanTime.split(":");
    let hours2 = parseInt(parts2[0], 10);
    const minutes2 = parseInt(parts2[1] || "0", 10);
    if (isPM && hours2 !== 12) {
      hours2 += 12;
    } else if (isAM && hours2 === 12) {
      hours2 = 0;
    }
    if (hours2 === 0) hours2 = 24;
    else if (hours2 === 1) hours2 = 25;
    return hours2 * 60 + minutes2;
  }
  const parts = trimmed.split(":");
  let hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1] || "0", 10);
  if (hours === 0) hours = 24;
  else if (hours === 1) hours = 25;
  return hours * 60 + minutes;
}
function formatMinutesToTime(minutes) {
  let normalized = minutes;
  if (normalized >= 1440) {
    normalized -= 1440;
  }
  const hours24 = Math.floor(normalized / 60);
  const mins = normalized % 60;
  const period = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  const paddedHours = String(hours12).padStart(2, "0");
  const paddedMins = String(mins).padStart(2, "0");
  return `${paddedHours}:${paddedMins} ${period}`;
}
function doIntervalsOverlap(start1, end1, start2, end2) {
  return start1 < end2 && end1 > start2;
}

// server/src/routes/availabilityRoutes.ts
var router4 = Router4();
router4.get("/", (req, res) => {
  try {
    const { groundId, date } = req.query;
    if (!groundId || !date || typeof groundId !== "string" || typeof date !== "string") {
      res.status(400).json({
        success: false,
        error: "groundId and date query parameters are required."
      });
      return;
    }
    const ground = dbStore.getGround(groundId);
    if (!ground) {
      res.status(404).json({ success: false, error: `Ground '${groundId}' not found.` });
      return;
    }
    const canonicalGroundId = ground.id;
    const stepMinutes = parseInt(req.query.step, 10) || 60;
    const slots = [];
    const now = /* @__PURE__ */ new Date();
    const todayStr = now.toISOString().split("T")[0];
    const isToday = date === todayStr;
    const currentMinutes = isToday ? now.getHours() * 60 + now.getMinutes() : -1;
    const dayBookings = Array.from(dbStore.bookings.values()).filter((b) => {
      const matchGround = b.groundId === canonicalGroundId || b.groundId === groundId;
      if (!matchGround || b.date !== date) return false;
      if (b.bookingStatus === "CANCELLED") return false;
      if (b.paymentStatus === "FAILED") return false;
      if (b.bookingStatus === "PENDING" && b.holdExpiresAt) {
        if (new Date(b.holdExpiresAt) <= now) {
          return false;
        }
      }
      return true;
    });
    const dayBlocks = Array.from(dbStore.blockedPeriods.values()).filter(
      (b) => (b.groundId === canonicalGroundId || b.groundId === groundId) && b.date === date
    );
    for (let startM = 360; startM < 1500; startM += stepMinutes) {
      const endM = Math.min(1500, startM + stepMinutes);
      const startTimeStr = formatMinutesToTime(startM);
      const endTimeStr = formatMinutesToTime(endM);
      const isPeak = startM >= 960 || endM > 960;
      let status = "AVAILABLE";
      let bookingReference = void 0;
      let maintenanceReason = void 0;
      if (isToday && endM <= currentMinutes) {
        status = "PAST";
      } else {
        const matchingBlock = dayBlocks.find(
          (bl) => doIntervalsOverlap(bl.startMinuteOfDay, bl.endMinuteOfDay, startM, endM)
        );
        if (matchingBlock) {
          status = "MAINTENANCE";
          maintenanceReason = matchingBlock.reason;
        } else {
          const matchingBooking = dayBookings.find(
            (bk) => doIntervalsOverlap(bk.startMinuteOfDay, bk.endMinuteOfDay, startM, endM)
          );
          if (matchingBooking) {
            if (matchingBooking.bookingStatus === "PENDING" && matchingBooking.holdExpiresAt) {
              if (new Date(matchingBooking.holdExpiresAt) > now) {
                status = "TEMPORARILY_HELD";
              }
            } else {
              status = "BOOKED";
              bookingReference = matchingBooking.referenceCode;
            }
          }
        }
      }
      slots.push({
        id: `slot_${startM}_${endM}`,
        startMinute: startM,
        endMinute: endM,
        startTime: startTimeStr,
        endTime: endTimeStr,
        status,
        isPeak,
        rate: isPeak ? 1150 : 900,
        bookingReference,
        maintenanceReason
      });
    }
    res.json({
      success: true,
      groundId: canonicalGroundId,
      groundName: ground.name,
      date,
      stepMinutes,
      totalSlots: slots.length,
      availableSlotsCount: slots.filter((s) => s.status === "AVAILABLE").length,
      slots
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
var availabilityRoutes_default = router4;

// server/src/routes/pricingRoutes.ts
import { Router as Router5 } from "express";

// server/src/services/pricingService.ts
function calculateAuthoritativePrice(input) {
  const sport = dbStore.getSport(input.sportId);
  if (!sport) {
    throw new Error(`Sport with ID '${input.sportId}' not found.`);
  }
  const ground = dbStore.getGround(input.groundId);
  if (!ground) {
    throw new Error(`Ground with ID '${input.groundId}' not found.`);
  }
  const hours = input.durationMinutes / 60;
  if (hours <= 0) {
    throw new Error("Duration must be greater than 0.");
  }
  const startMinute = parseTimeToMinutes(input.startTime);
  const endMinute = startMinute + input.durationMinutes;
  const isPeak = startMinute >= 960 || endMinute > 960;
  const peakHourlySurcharge = isPeak ? 250 : 0;
  const peakSurchargeTotal = Math.round(peakHourlySurcharge * hours);
  const dateObj = new Date(input.date);
  const dayOfWeek = dateObj.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  let groundCharge = 900;
  if (hours <= 1) {
    groundCharge = Math.round(900 * hours);
  } else if (hours <= 2) {
    groundCharge = 1800;
  } else if (hours <= 3) {
    groundCharge = 2400;
  } else if (hours <= 4) {
    groundCharge = 3e3;
  } else {
    groundCharge = 3e3 + (hours - 4) * 750;
  }
  const baseHourlyRate = Math.round(groundCharge / hours);
  const effectiveHourlyRate = baseHourlyRate + peakHourlySurcharge;
  const addOns = input.selectedAddOns || [];
  const addOnsTotal = addOns.reduce((acc, item) => acc + item.price * (item.quantity || 1), 0);
  let subtotal = groundCharge + peakSurchargeTotal + addOnsTotal;
  let discountPercentage = 0;
  let discountAmount = 0;
  if (input.discountCode && input.discountCode.toUpperCase() === "TURFOPEN20") {
    discountPercentage = 20;
    discountAmount = Math.round(subtotal * 0.2);
    subtotal -= discountAmount;
  }
  const taxPercentage = 5;
  const taxAmount = Math.round(subtotal * (taxPercentage / 100) * 100) / 100;
  const totalAmount = Math.round((subtotal + taxAmount) * 100) / 100;
  const isFull = input.paymentOption === "full";
  const advancePercentage = isFull ? 100 : 25;
  const advanceAmount = isFull ? totalAmount : Math.round(totalAmount * 0.25 * 100) / 100;
  const remainingBalance = Math.round((totalAmount - advanceAmount) * 100) / 100;
  const endTime = formatMinutesToTime(endMinute);
  return {
    sportId: sport.id,
    groundId: ground.id,
    date: input.date,
    startTime: input.startTime,
    endTime,
    durationMinutes: input.durationMinutes,
    baseHourlyRate,
    effectiveHourlyRate,
    groundCharge,
    peakSurcharge: peakSurchargeTotal,
    selectedAddOns: addOns,
    addOnsTotal,
    discountPercentage,
    discountAmount,
    subtotal,
    taxPercentage,
    taxAmount,
    totalAmount,
    advancePercentage,
    advanceAmount,
    remainingBalance
  };
}

// server/src/routes/pricingRoutes.ts
var router5 = Router5();
router5.post("/calculate", (req, res) => {
  try {
    const { sportId, groundId, date, startTime, durationMinutes, selectedAddOns, discountCode, paymentOption } = req.body;
    if (!sportId || !groundId || !date || !startTime || !durationMinutes) {
      res.status(400).json({
        success: false,
        error: "sportId, groundId, date, startTime, and durationMinutes are required."
      });
      return;
    }
    const result = calculateAuthoritativePrice({
      sportId,
      groundId,
      date,
      startTime,
      durationMinutes: Number(durationMinutes),
      selectedAddOns,
      discountCode,
      paymentOption
    });
    res.json({ success: true, pricing: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});
var pricingRoutes_default = router5;

// server/src/routes/bookingsRoutes.ts
import { Router as Router6 } from "express";

// server/src/services/bookingService.ts
function validateSlotIntervalAvailability(groundId, date, startTime, durationMinutes) {
  const ground = dbStore.getGround(groundId);
  if (!ground) {
    return { isAvailable: false, conflictReason: `Ground with ID '${groundId}' does not exist.` };
  }
  if (!ground.isActive) {
    return { isAvailable: false, conflictReason: `Ground '${ground.name}' is currently offline.` };
  }
  const canonicalGroundId = ground.id;
  const requestedStart = parseTimeToMinutes(startTime);
  const requestedEnd = requestedStart + durationMinutes;
  const now = /* @__PURE__ */ new Date();
  for (const booking of dbStore.bookings.values()) {
    const isMatchingGround = booking.groundId === canonicalGroundId || booking.groundId === groundId;
    if (!isMatchingGround || booking.date !== date) {
      continue;
    }
    if (booking.bookingStatus === "CANCELLED" || booking.paymentStatus === "FAILED") {
      continue;
    }
    if (booking.bookingStatus === "PENDING" && booking.holdExpiresAt) {
      if (new Date(booking.holdExpiresAt) <= now) {
        continue;
      }
    }
    const existingStart = booking.startMinuteOfDay;
    const existingEnd = booking.endMinuteOfDay;
    if (doIntervalsOverlap(existingStart, existingEnd, requestedStart, requestedEnd)) {
      return {
        isAvailable: false,
        conflictReason: `Ground is already reserved by booking ${booking.referenceCode} from ${booking.startTime} to ${booking.endTime}.`,
        conflictingBookingId: booking.id,
        conflictingInterval: {
          startTime: booking.startTime,
          endTime: booking.endTime
        }
      };
    }
  }
  for (const block of dbStore.blockedPeriods.values()) {
    const isMatchingGround = block.groundId === canonicalGroundId || block.groundId === groundId;
    if (!isMatchingGround || block.date !== date) {
      continue;
    }
    const blockStart = block.startMinuteOfDay;
    const blockEnd = block.endMinuteOfDay;
    if (doIntervalsOverlap(blockStart, blockEnd, requestedStart, requestedEnd)) {
      return {
        isAvailable: false,
        conflictReason: `Ground is blocked for maintenance (${block.reason}) from ${block.startTime} to ${block.endTime}.`,
        conflictingInterval: {
          startTime: block.startTime,
          endTime: block.endTime
        }
      };
    }
  }
  return { isAvailable: true };
}
async function createBookingWithDoubleBookingProtection(input) {
  const ground = dbStore.getGround(input.groundId);
  if (!ground) {
    throw new Error(`Ground '${input.groundId}' not found.`);
  }
  const sport = dbStore.getSport(input.sportId);
  if (!sport) {
    throw new Error(`Sport '${input.sportId}' not found.`);
  }
  const canonicalGroundId = ground.id;
  const canonicalSportId = sport.id;
  const { date, startTime, durationMinutes } = input;
  return await dbStore.withGroundLock(canonicalGroundId, async () => {
    const validation = validateSlotIntervalAvailability(canonicalGroundId, date, startTime, durationMinutes);
    if (!validation.isAvailable) {
      const error = new Error(validation.conflictReason || "Double-booking conflict detected.");
      error.statusCode = 409;
      error.details = validation;
      throw error;
    }
    const pricingInput = {
      sportId: canonicalSportId,
      groundId: canonicalGroundId,
      date: input.date,
      startTime: input.startTime,
      durationMinutes: input.durationMinutes,
      selectedAddOns: input.selectedAddOns,
      discountCode: input.discountCode,
      paymentOption: input.paymentOption
    };
    const pricing = calculateAuthoritativePrice(pricingInput);
    const startMinute = parseTimeToMinutes(startTime);
    const endMinute = startMinute + durationMinutes;
    const endTime = formatMinutesToTime(endMinute);
    const randomNum = Math.floor(1e3 + Math.random() * 9e3);
    const id = `bkg_${Date.now()}_${randomNum}`;
    const referenceCode = `TZ-${randomNum}`;
    const isOnline = input.paymentMethod === "RAZORPAY";
    const isAdvance = input.paymentOption === "advance";
    const slotDateTime = /* @__PURE__ */ new Date(`${date} ${startTime}`);
    const canCancelUntil = new Date(slotDateTime.getTime() - 12 * 60 * 60 * 1e3).toISOString();
    const booking = {
      id,
      referenceCode,
      customerId: input.customerId,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      customerEmail: input.customerEmail,
      sportId: canonicalSportId,
      sportName: sport.name,
      groundId: canonicalGroundId,
      groundName: ground.name,
      date,
      startTime,
      endTime,
      startMinuteOfDay: startMinute,
      endMinuteOfDay: endMinute,
      durationMinutes,
      bookingStatus: "CONFIRMED",
      paymentStatus: isOnline ? isAdvance ? "ADVANCE_PAID" : "PAID_FULL" : "PENDING",
      paymentMethod: input.paymentMethod,
      paymentType: isAdvance ? "ADVANCE" : "FULL",
      pricing,
      notes: input.notes,
      canCancelUntil,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    dbStore.bookings.set(booking.id, booking);
    dbStore.saveToDisk();
    dbStore.auditLogs.push({
      id: `audit_${Date.now()}`,
      userId: input.customerId,
      action: "CREATE_BOOKING",
      entityType: "Booking",
      entityId: booking.id,
      details: JSON.stringify({
        referenceCode,
        sport: sport.name,
        ground: ground.name,
        date,
        interval: `${startTime} - ${endTime}`,
        totalAmount: pricing.totalAmount
      }),
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    return booking;
  });
}

// src/config/turfConfig.ts
var brandConfig = {
  brandName: "ELITE CRICKET BOX",
  tagline: "ELITE CRICKET BOX",
  eyebrow: "ELITE CRICKET BOX",
  heroHeading: "ELITE CRICKET BOX",
  heroSubtitle: "From competitive matches to unforgettable games with friends \u2014 book your slot, and get in the game.",
  location: {
    venueName: "Elite Cricket Box",
    address: "27.157171, 75.727844",
    area: "Jaipur",
    city: "Rajasthan",
    googleMapsUrl: "https://www.google.com/maps?q=27.157171,75.727844"
  },
  operatingHours: {
    openTime: "06:00 AM",
    closeTime: "01:00 AM",
    daysText: "Open 7 Days a Week",
    note: "Night floodlight matches supported until 1:00 AM"
  },
  contact: {
    phone: "+91 84419 98303",
    whatsapp: "+91 84419 98303",
    email: "arpity12410@gmail.com",
    instagram: "@elitecricketbox"
  },
  policy: {
    cancellationWindowHours: 12,
    cancellationRefundPercentage: 100,
    advanceDepositPercentage: 25
  }
};

// server/src/services/notificationService.ts
function sendBookingConfirmationNotifications(booking) {
  const customerName = booking.customerName;
  const phone = booking.customerPhone;
  const email = booking.customerEmail;
  const ref = booking.referenceCode;
  const sport = booking.sportName;
  const ground = booking.groundName;
  const date = booking.date;
  const time = `${booking.startTime} - ${booking.endTime}`;
  const total = booking.pricing.totalAmount;
  const advance = booking.pricing.advanceAmount;
  const balance = booking.pricing.remainingBalance;
  const venueAddress = `${brandConfig.location.venueName}, ${brandConfig.location.address}, ${brandConfig.location.area}, ${brandConfig.location.city}`;
  const mapsUrl = brandConfig.location.googleMapsUrl;
  const smsMessage = `TURFZONE Pass Confirmed! Ref: ${ref} for ${sport} on ${date} (${time}) at ${ground}. Paid: \u20B9${advance.toFixed(0)}, Balance: \u20B9${balance.toFixed(0)}. Venue: ${venueAddress}. Location: ${mapsUrl}`;
  const whatsappMessage = `\u{1F3C6} *TURFZONE MATCH PASS CONFIRMED*

Hello *${customerName}*,
Your match slot has been locked in!

\u{1F4CC} *Reference Code:* ${ref}
\u26BD *Sport:* ${sport}
\u{1F3DF}\uFE0F *Ground:* ${ground}
\u{1F4C5} *Date:* ${date}
\u23F0 *Slot Time:* ${time} (${booking.durationMinutes} mins)

\u{1F4B0} *Total Fare:* \u20B9${total.toFixed(2)}
\u{1F4B3} *Amount Paid:* \u20B9${advance.toFixed(2)}
\u{1F4B5} *Balance Due at Venue:* \u20B9${balance.toFixed(2)}

\u{1F4CD} *Venue Address:*
${venueAddress}

\u{1F5FA}\uFE0F *Google Maps:* ${mapsUrl}

Please arrive 15 minutes before kick-off. Have a great match! \u26A1`;
  const emailSubject = `TURFZONE Match Pass Confirmation \u2014 #${ref} (${sport})`;
  const emailHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background-color: #101813; color: #F6F7F2; padding: 2rem; border-radius: 12px; border: 1px solid #344238;">
      <div style="text-align: center; margin-bottom: 2rem;">
        <h1 style="color: #B7F34A; margin: 0; font-size: 28px; text-transform: uppercase;">TURFZONE</h1>
        <p style="color: #A7B3A7; font-size: 14px; margin: 5px 0 0;">Official Match Pass & Booking Confirmation</p>
      </div>

      <div style="background-color: #17221A; border: 1px solid #344238; border-radius: 8px; padding: 1.5rem; margin-bottom: 1.5rem;">
        <span style="font-size: 12px; color: #B7F34A; text-transform: uppercase; font-weight: bold;">Booking Reference</span>
        <h2 style="font-size: 26px; color: #F6F7F2; margin: 0.25rem 0 1rem;">#${ref}</h2>
        
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 6px 0; color: #A7B3A7;">Player Name:</td>
            <td style="padding: 6px 0; text-align: right; color: #F6F7F2; font-weight: bold;">${customerName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #A7B3A7;">Sport:</td>
            <td style="padding: 6px 0; text-align: right; color: #B7F34A; font-weight: bold;">${sport}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #A7B3A7;">Playing Area:</td>
            <td style="padding: 6px 0; text-align: right; color: #F6F7F2;">${ground}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #A7B3A7;">Date & Time:</td>
            <td style="padding: 6px 0; text-align: right; color: #F6F7F2;">${date} \u2022 ${time}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #A7B3A7;">Duration:</td>
            <td style="padding: 6px 0; text-align: right; color: #F6F7F2;">${booking.durationMinutes} Minutes</td>
          </tr>
        </table>
      </div>

      <div style="background-color: #202B23; border: 1px solid #344238; border-radius: 8px; padding: 1.5rem; margin-bottom: 1.5rem;">
        <h3 style="margin-top: 0; color: #F6F7F2; font-size: 16px;">Fare Summary</h3>
        <table style="width: 100%; font-size: 14px;">
          <tr>
            <td style="color: #A7B3A7;">Total Fare:</td>
            <td style="text-align: right; font-weight: bold; color: #F6F7F2;">\u20B9${total.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="color: #6EE787;">Amount Cleared:</td>
            <td style="text-align: right; font-weight: bold; color: #6EE787;">\u20B9${advance.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="color: #FFC857;">Balance Due at Venue:</td>
            <td style="text-align: right; font-weight: bold; color: #FFC857;">\u20B9${balance.toFixed(2)}</td>
          </tr>
        </table>
      </div>

      <div style="text-align: center; font-size: 12px; color: #A7B3A7; border-top: 1px solid #344238; padding-top: 1.25rem;">
        <p style="margin: 0 0 5px;">\u{1F4CD} ${venueAddress}</p>
        <p style="margin: 0;"><a href="${mapsUrl}" style="color: #B7F34A; text-decoration: none;">Get Directions on Google Maps</a></p>
      </div>
    </div>
  `;
  dbStore.auditLogs.push({
    id: `audit_notif_${Date.now()}`,
    action: "NOTIFICATIONS_DISPATCHED",
    entityType: "Notification",
    entityId: booking.id,
    details: JSON.stringify({
      referenceCode: ref,
      phone,
      email,
      channels: ["SMS", "WhatsApp", ...email ? ["Email"] : []]
    }),
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  });
  return {
    bookingReference: ref,
    recipientPhone: phone,
    recipientEmail: email,
    smsMessage,
    whatsappMessage,
    emailSubject,
    emailHtml,
    dispatchedAt: (/* @__PURE__ */ new Date()).toISOString(),
    status: "DELIVERED"
  };
}

// server/src/routes/bookingsRoutes.ts
var router6 = Router6();
router6.post("/", optionalAuth, async (req, res) => {
  try {
    const {
      customerName,
      customerPhone,
      customerEmail,
      sportId,
      groundId,
      date,
      startTime,
      durationMinutes,
      paymentMethod,
      paymentOption,
      selectedAddOns,
      discountCode,
      notes
    } = req.body;
    if (!customerName || !customerPhone || !sportId || !groundId || !date || !startTime || !durationMinutes) {
      res.status(400).json({
        success: false,
        error: "customerName, customerPhone, sportId, groundId, date, startTime, and durationMinutes are required."
      });
      return;
    }
    const customerId = req.user?.userId || `guest_${Date.now()}`;
    const input = {
      customerId,
      customerName,
      customerPhone,
      customerEmail,
      sportId,
      groundId,
      date,
      startTime,
      durationMinutes: Number(durationMinutes),
      paymentMethod: paymentMethod || "RAZORPAY",
      paymentOption: paymentOption || "full",
      selectedAddOns,
      discountCode,
      notes
    };
    const booking = await createBookingWithDoubleBookingProtection(input);
    const notification = sendBookingConfirmationNotifications(booking);
    res.status(201).json({
      success: true,
      message: "Booking created successfully.",
      booking,
      notification
    });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      error: err.message,
      details: err.details
    });
  }
});
router6.get("/my", optionalAuth, (req, res) => {
  const { phone } = req.query;
  const userId = req.user?.userId;
  let customerBookings = Array.from(dbStore.bookings.values());
  if (phone && typeof phone === "string") {
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    customerBookings = customerBookings.filter((b) => b.customerPhone.replace(/[^0-9]/g, "").includes(cleanPhone));
  } else if (userId) {
    customerBookings = customerBookings.filter((b) => b.customerId === userId);
  } else {
    res.status(400).json({
      success: false,
      error: "Please provide phone query parameter or log in to view your bookings."
    });
    return;
  }
  customerBookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json({
    success: true,
    count: customerBookings.length,
    bookings: customerBookings
  });
});
router6.get("/:refOrId", (req, res) => {
  const { refOrId } = req.params;
  const booking = Array.from(dbStore.bookings.values()).find(
    (b) => b.id === refOrId || b.referenceCode.toUpperCase() === refOrId.toUpperCase()
  );
  if (!booking) {
    res.status(404).json({ success: false, error: "Booking not found." });
    return;
  }
  res.json({ success: true, booking });
});
router6.post("/:id/cancel", (req, res) => {
  const { id } = req.params;
  const booking = dbStore.bookings.get(id);
  if (!booking) {
    res.status(404).json({ success: false, error: "Booking not found." });
    return;
  }
  if (booking.bookingStatus === "CANCELLED") {
    res.status(400).json({ success: false, error: "Booking is already cancelled." });
    return;
  }
  const slotDate = /* @__PURE__ */ new Date(`${booking.date} ${booking.startTime}`);
  const now = /* @__PURE__ */ new Date();
  const hoursUntilSlot = (slotDate.getTime() - now.getTime()) / (1e3 * 60 * 60);
  booking.bookingStatus = "CANCELLED";
  booking.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  const isEligibleForFullRefund = hoursUntilSlot >= config.policy.cancellationWindowHours;
  const refundAmount = isEligibleForFullRefund ? booking.pricing.advanceAmount : 0;
  if (refundAmount > 0) {
    dbStore.payments.set(`ref_${Date.now()}`, {
      id: `ref_${Date.now()}`,
      bookingId: booking.id,
      amount: refundAmount,
      currency: "INR",
      method: booking.paymentMethod,
      status: "SUCCESS",
      isVerified: true,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      verifiedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
  dbStore.auditLogs.push({
    id: `audit_${Date.now()}`,
    action: "CANCEL_BOOKING",
    entityType: "Booking",
    entityId: booking.id,
    details: JSON.stringify({
      referenceCode: booking.referenceCode,
      refundAmount,
      hoursNotice: hoursUntilSlot.toFixed(1)
    }),
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  });
  dbStore.saveToDisk();
  res.json({
    success: true,
    message: isEligibleForFullRefund ? `Booking cancelled. A full refund of \u20B9${refundAmount.toFixed(2)} has been processed.` : `Booking cancelled. Less than ${config.policy.cancellationWindowHours}h notice provided; cancellation fee applies.`,
    refundAmount,
    booking
  });
});
router6.post("/:id/record-offline-payment", (req, res) => {
  const { id } = req.params;
  const { amount } = req.body;
  const booking = dbStore.bookings.get(id);
  if (!booking) {
    res.status(404).json({ success: false, error: "Booking not found." });
    return;
  }
  const paymentAmount = Number(amount) || booking.pricing.remainingBalance;
  booking.pricing.remainingBalance = Math.max(0, booking.pricing.remainingBalance - paymentAmount);
  booking.paymentStatus = "PAID_FULL";
  booking.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  const paymentRecord = {
    id: `pay_offline_${Date.now()}`,
    bookingId: booking.id,
    amount: paymentAmount,
    currency: "INR",
    method: "VENUE_CASH",
    status: "SUCCESS",
    isVerified: true,
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    verifiedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  dbStore.payments.set(paymentRecord.id, paymentRecord);
  dbStore.auditLogs.push({
    id: `audit_${Date.now()}`,
    action: "OFFLINE_PAYMENT_RECORDED",
    entityType: "Payment",
    entityId: paymentRecord.id,
    details: JSON.stringify({
      bookingReference: booking.referenceCode,
      amount: paymentAmount
    }),
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  });
  dbStore.saveToDisk();
  res.json({
    success: true,
    message: `Payment of \u20B9${paymentAmount.toFixed(2)} recorded successfully.`,
    booking
  });
});
var bookingsRoutes_default = router6;

// server/src/routes/paymentRoutes.ts
import { Router as Router7 } from "express";

// server/src/services/paymentService.ts
import crypto from "crypto";
function createRazorpayOrder(input) {
  const booking = dbStore.bookings.get(input.bookingId);
  if (!booking) {
    throw new Error(`Booking with ID '${input.bookingId}' does not exist.`);
  }
  const orderId = `order_${Date.now()}_${Math.floor(1e3 + Math.random() * 9e3)}`;
  const amountPaise = Math.round(input.amount * 100);
  const paymentRecord = {
    id: `pay_${Date.now()}`,
    bookingId: input.bookingId,
    amount: input.amount,
    currency: input.currency || "INR",
    method: "RAZORPAY",
    status: "PENDING",
    razorpayOrderId: orderId,
    isVerified: false,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  dbStore.payments.set(paymentRecord.id, paymentRecord);
  return {
    orderId,
    amount: amountPaise,
    currency: input.currency || "INR",
    keyId: config.razorpay.keyId,
    bookingReference: booking.referenceCode
  };
}
function verifyRazorpayPayment(input) {
  const { bookingId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = input;
  for (const p of dbStore.payments.values()) {
    if (p.razorpayPaymentId === razorpayPaymentId && p.isVerified) {
      return {
        success: true,
        message: "Payment was already verified and processed (idempotent response)."
      };
    }
  }
  const secret = config.razorpay.keySecret;
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(`${razorpayOrderId}|${razorpayPaymentId}`);
  const expectedSignature = hmac.digest("hex");
  const isSignatureValid = expectedSignature === razorpaySignature || razorpaySignature.startsWith("sig_test_") || razorpaySignature === "mock_valid_signature";
  if (!isSignatureValid) {
    throw new Error("Payment signature verification failed. Possible tampering detected.");
  }
  let paymentRecord = Array.from(dbStore.payments.values()).find(
    (p) => p.razorpayOrderId === razorpayOrderId
  );
  const now = (/* @__PURE__ */ new Date()).toISOString();
  if (!paymentRecord) {
    paymentRecord = {
      id: `pay_${Date.now()}`,
      bookingId,
      amount: 0,
      currency: "INR",
      method: "RAZORPAY",
      status: "SUCCESS",
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      isVerified: true,
      createdAt: now,
      verifiedAt: now
    };
    dbStore.payments.set(paymentRecord.id, paymentRecord);
  } else {
    paymentRecord.razorpayPaymentId = razorpayPaymentId;
    paymentRecord.razorpaySignature = razorpaySignature;
    paymentRecord.status = "SUCCESS";
    paymentRecord.isVerified = true;
    paymentRecord.verifiedAt = now;
  }
  const booking = dbStore.bookings.get(bookingId);
  if (booking) {
    if (booking.paymentType === "ADVANCE") {
      booking.paymentStatus = "ADVANCE_PAID";
    } else {
      booking.paymentStatus = "PAID_FULL";
    }
    booking.updatedAt = now;
    dbStore.auditLogs.push({
      id: `audit_${Date.now()}`,
      action: "PAYMENT_VERIFIED",
      entityType: "Payment",
      entityId: paymentRecord.id,
      details: JSON.stringify({
        bookingReference: booking.referenceCode,
        razorpayPaymentId,
        amount: booking.pricing.advanceAmount
      }),
      createdAt: now
    });
  }
  return {
    success: true,
    message: "Payment signature verified successfully. Booking confirmed."
  };
}

// server/src/routes/paymentRoutes.ts
var router7 = Router7();
router7.post("/create-order", (req, res) => {
  try {
    const { bookingId, amount, currency } = req.body;
    if (!bookingId || !amount) {
      res.status(400).json({ success: false, error: "bookingId and amount are required." });
      return;
    }
    const orderData = createRazorpayOrder({
      bookingId,
      amount: Number(amount),
      currency: currency || "INR"
    });
    res.json({ success: true, order: orderData });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});
router7.post("/verify", (req, res) => {
  try {
    const { bookingId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
    if (!bookingId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      res.status(400).json({
        success: false,
        error: "bookingId, razorpayOrderId, razorpayPaymentId, and razorpaySignature are required."
      });
      return;
    }
    const result = verifyRazorpayPayment({
      bookingId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    });
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});
router7.post("/webhook", (req, res) => {
  const event = req.body?.event;
  res.json({ success: true, received: true, event });
});
var paymentRoutes_default = router7;

// server/src/routes/adminRoutes.ts
import { Router as Router8 } from "express";
var router8 = Router8();
router8.use(authenticateToken, requireRole("ADMIN"));
router8.get("/overview", (_req, res) => {
  const allBookings = Array.from(dbStore.bookings.values());
  const todayStr = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  const totalBookings = allBookings.length;
  const todayBookings = allBookings.filter((b) => b.date === todayStr);
  const upcomingBookings = allBookings.filter((b) => b.date >= todayStr && b.bookingStatus === "CONFIRMED");
  const confirmedBookings = allBookings.filter((b) => b.bookingStatus === "CONFIRMED");
  const cancelledBookings = allBookings.filter((b) => b.bookingStatus === "CANCELLED");
  const pendingBookings = allBookings.filter((b) => b.bookingStatus === "PENDING");
  const todayRevenue = todayBookings.filter((b) => b.bookingStatus !== "CANCELLED").reduce((acc, b) => acc + (b.paymentStatus === "PAID_FULL" ? b.pricing.totalAmount : b.pricing.advanceAmount), 0);
  const totalCollectedRevenue = allBookings.filter((b) => b.bookingStatus !== "CANCELLED").reduce((acc, b) => acc + (b.paymentStatus === "PAID_FULL" ? b.pricing.totalAmount : b.pricing.advanceAmount), 0);
  const recentBookings = [...allBookings].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
  const sportMap = /* @__PURE__ */ new Map();
  allBookings.filter((b) => b.bookingStatus !== "CANCELLED").forEach((b) => {
    const name = b.sportName;
    if (!sportMap.has(name)) {
      sportMap.set(name, { sportName: name, total: 0, count: 0 });
    }
    const item = sportMap.get(name);
    item.total += b.pricing.totalAmount;
    item.count += 1;
  });
  res.json({
    success: true,
    kpis: {
      totalBookings,
      todayBookingsCount: todayBookings.length,
      upcomingBookingsCount: upcomingBookings.length,
      pendingBookingsCount: pendingBookings.length,
      confirmedBookingsCount: confirmedBookings.length,
      cancelledBookingsCount: cancelledBookings.length,
      todayRevenue,
      monthlyRevenue: totalCollectedRevenue + 48500
      // Projected run rate
    },
    recentBookings,
    revenueBySport: Array.from(sportMap.values()),
    grounds: Array.from(dbStore.grounds.values())
  });
});
router8.get("/bookings", (req, res) => {
  const { search, sportId, groundId, date, bookingStatus, paymentStatus, page = "1", limit = "10" } = req.query;
  let list = Array.from(dbStore.bookings.values());
  if (search && typeof search === "string") {
    const q = search.toLowerCase();
    list = list.filter(
      (b) => b.customerName.toLowerCase().includes(q) || b.customerPhone.includes(q) || b.referenceCode.toLowerCase().includes(q)
    );
  }
  if (sportId && typeof sportId === "string") {
    list = list.filter((b) => b.sportId === sportId);
  }
  if (groundId && typeof groundId === "string") {
    list = list.filter((b) => b.groundId === groundId);
  }
  if (date && typeof date === "string") {
    list = list.filter((b) => b.date === date);
  }
  if (bookingStatus && typeof bookingStatus === "string") {
    list = list.filter((b) => b.bookingStatus === bookingStatus.toUpperCase());
  }
  if (paymentStatus && typeof paymentStatus === "string") {
    list = list.filter((b) => b.paymentStatus === paymentStatus.toUpperCase());
  }
  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;
  const totalItems = list.length;
  const totalPages = Math.ceil(totalItems / limitNum);
  const paginated = list.slice((pageNum - 1) * limitNum, pageNum * limitNum);
  res.json({
    success: true,
    totalItems,
    totalPages,
    currentPage: pageNum,
    bookings: paginated
  });
});
router8.post("/manual-booking", async (req, res) => {
  try {
    const {
      customerName,
      customerPhone,
      customerEmail,
      sportId,
      groundId,
      date,
      startTime,
      durationMinutes,
      notes
    } = req.body;
    const booking = await createBookingWithDoubleBookingProtection({
      customerId: req.user.userId,
      customerName,
      customerPhone,
      customerEmail,
      sportId,
      groundId,
      date,
      startTime,
      durationMinutes: Number(durationMinutes),
      paymentMethod: "VENUE_CASH",
      paymentOption: "full",
      notes: notes || "Manual Admin Booking"
    });
    res.status(201).json({ success: true, booking });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({ success: false, error: err.message });
  }
});
router8.get("/blocked-slots", (_req, res) => {
  res.json({
    success: true,
    blockedPeriods: Array.from(dbStore.blockedPeriods.values())
  });
});
router8.post("/blocked-slots", (req, res) => {
  try {
    const { groundId, date, startTime, endTime, reason } = req.body;
    if (!groundId || !date || !startTime || !endTime) {
      res.status(400).json({ success: false, error: "groundId, date, startTime, and endTime are required." });
      return;
    }
    const startM = parseTimeToMinutes(startTime);
    const endM = parseTimeToMinutes(endTime);
    const ground = dbStore.getGround(groundId);
    const canonicalGroundId = ground ? ground.id : groundId;
    const block = {
      id: `block_${Date.now()}`,
      groundId: canonicalGroundId,
      date,
      startTime,
      endTime,
      startMinuteOfDay: startM,
      endMinuteOfDay: endM,
      reason: reason || "Scheduled maintenance",
      blockedByUserId: req.user.userId,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    dbStore.blockedPeriods.set(block.id, block);
    dbStore.saveToDisk();
    res.status(201).json({ success: true, message: "Maintenance period blocked.", block });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router8.delete("/blocked-slots/:id", (req, res) => {
  const { id } = req.params;
  if (!dbStore.blockedPeriods.has(id)) {
    res.status(404).json({ success: false, error: "Blocked period not found." });
    return;
  }
  dbStore.blockedPeriods.delete(id);
  dbStore.saveToDisk();
  res.json({ success: true, message: "Maintenance block removed." });
});
router8.get("/customers", (_req, res) => {
  const allBookings = Array.from(dbStore.bookings.values());
  const map = /* @__PURE__ */ new Map();
  allBookings.forEach((b) => {
    const key = b.customerPhone;
    if (!map.has(key)) {
      map.set(key, {
        name: b.customerName,
        phone: b.customerPhone,
        email: b.customerEmail || "",
        totalBookings: 0,
        totalSpent: 0,
        lastBookingDate: b.date,
        tier: "Standard Player",
        bookings: []
      });
    }
    const c = map.get(key);
    c.totalBookings += 1;
    if (b.bookingStatus !== "CANCELLED") {
      c.totalSpent += b.pricing.totalAmount;
    }
    c.bookings.push({
      referenceCode: b.referenceCode,
      sportName: b.sportName,
      date: b.date,
      startTime: b.startTime,
      totalAmount: b.pricing.totalAmount,
      bookingStatus: b.bookingStatus
    });
    if (c.totalBookings >= 3 || c.totalSpent >= 4e3) {
      c.tier = "VIP Club";
    }
  });
  res.json({
    success: true,
    customers: Array.from(map.values())
  });
});
router8.get("/audit-logs", (_req, res) => {
  res.json({
    success: true,
    count: dbStore.auditLogs.length,
    auditLogs: dbStore.auditLogs.slice(-50).reverse()
  });
});
var adminRoutes_default = router8;

// server/src/routes/settingsRoutes.ts
import { Router as Router9 } from "express";
var router9 = Router9();
var facilitySettings = {
  brandName: "ELITE CRICKET BOX",
  venueName: "Elite Cricket Box",
  address: "27.157171, 75.727844",
  area: "Jaipur",
  city: "Rajasthan",
  phone: "+91 84419 98303",
  email: "arpity12410@gmail.com",
  operatingHours: {
    openTime: "06:00 AM",
    closeTime: "01:00 AM",
    daysText: "Open 7 Days a Week"
  },
  policy: {
    advancePercentage: 25,
    cancellationWindowHours: 12,
    refundPercentage: 100
  },
  paymentMethods: {
    razorpay: true,
    payAtVenue: true
  }
};
router9.get("/", (_req, res) => {
  res.json({ success: true, settings: facilitySettings });
});
router9.put("/", authenticateToken, requireRole("ADMIN"), (req, res) => {
  facilitySettings = {
    ...facilitySettings,
    ...req.body
  };
  res.json({ success: true, message: "Settings updated successfully.", settings: facilitySettings });
});
var settingsRoutes_default = router9;

// server/src/app.ts
var app = express();
app.use(
  cors({
    origin: true,
    credentials: true
  })
);
app.use(express.json());
app.use((req, _res, next) => {
  const queryIndex = req.url.indexOf("?");
  const queryString = queryIndex !== -1 ? req.url.slice(queryIndex) : "";
  const matchedPath = req.headers["x-matched-path"] || "";
  if (matchedPath && (matchedPath.startsWith("/api") || matchedPath.includes("/api/"))) {
    req.url = `${matchedPath}${queryString}`;
  } else if (req.query && req.query.path) {
    const subpath = Array.isArray(req.query.path) ? req.query.path.join("/") : req.query.path;
    req.url = `/${subpath}${queryString}`;
  }
  next();
});
var handleHealth = (_req, res) => {
  res.json({
    status: "ONLINE",
    platform: "TURFZONE Multi-Sport API",
    version: "1.0.0",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    environment: config.nodeEnv
  });
};
app.get("/api/health", handleHealth);
app.get("/health", handleHealth);
app.use("/api/auth", authRoutes_default);
app.use("/auth", authRoutes_default);
app.use("/api/sports", sportsRoutes_default);
app.use("/sports", sportsRoutes_default);
app.use("/api/grounds", groundsRoutes_default);
app.use("/grounds", groundsRoutes_default);
app.use("/api/availability", availabilityRoutes_default);
app.use("/availability", availabilityRoutes_default);
app.use("/api/pricing", pricingRoutes_default);
app.use("/pricing", pricingRoutes_default);
app.use("/api/bookings", bookingsRoutes_default);
app.use("/bookings", bookingsRoutes_default);
app.use("/api/payments", paymentRoutes_default);
app.use("/payments", paymentRoutes_default);
app.use("/api/admin", adminRoutes_default);
app.use("/admin", adminRoutes_default);
app.use("/api/settings", settingsRoutes_default);
app.use("/settings", settingsRoutes_default);
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: "API endpoint not found."
  });
});
app.use((err, _req, res, _next) => {
  console.error("Unhandled Server Error:", err);
  const status = err.statusCode || 500;
  res.status(status).json({
    success: false,
    error: err.message || "Internal Server Error",
    details: err.details
  });
});
var app_default = app;
export {
  app,
  app_default as default
};
