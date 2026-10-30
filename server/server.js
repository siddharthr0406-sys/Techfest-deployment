/**
 * Tech-Fest 2026 Portal - Express Backend API
 * Compatible with local development & Render cloud deployment
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'techfest_fallback_secret_key_2026_xyz';
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

// Middleware
app.use(express.json());

// Flexible CORS setup to handle local dev, Netlify deployment, and testing tools
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin) return callback(null, true);
    
    // Allow localhost, client origin, and any Netlify preview/production domains
    if (
      origin === CLIENT_ORIGIN ||
      origin.includes('localhost') ||
      origin.includes('127.0.0.1') ||
      origin.endsWith('.netlify.app') ||
      origin.endsWith('.onrender.com')
    ) {
      return callback(null, true);
    }
    return callback(null, true); // Permissive fallback for lab testing
  },
  credentials: true
}));

// State tracking for database connection
let dbConnected = false;
let dbStatusMessage = 'Connecting...';

// In-memory fallback stores (ensures app operates even before Atlas DB connection is completed)
const memoryStore = {
  users: [],
  events: [],
  registrations: []
};

// ==========================================
// MONGOOSE SCHEMAS & MODELS
// ==========================================
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  college: { type: String, default: 'Tech Institute' },
  role: { type: String, enum: ['student', 'admin', 'organizer'], default: 'student' },
  createdAt: { type: Date, default: Date.now }
});

const EventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: { type: String, required: true },
  date: { type: String, required: true },
  venue: { type: String, required: true },
  capacity: { type: Number, default: 100 },
  registeredCount: { type: Number, default: 0 },
  description: { type: String, required: true },
  prize: { type: String, default: 'Trophy & Certificate' },
  rules: { type: [String], default: [] },
  organizer: { type: String, default: 'Techfest Committee' },
  createdAt: { type: Date, default: Date.now }
});

const RegistrationSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  userEmail: { type: String, required: true },
  eventId: { type: String, required: true },
  eventTitle: { type: String, required: true },
  teamName: { type: String, default: '' },
  ticketCode: { type: String, required: true, unique: true },
  registeredAt: { type: Date, default: Date.now }
});

let User, Event, Registration;
try {
  User = mongoose.model('User', UserSchema);
  Event = mongoose.model('Event', EventSchema);
  Registration = mongoose.model('Registration', RegistrationSchema);
} catch (e) {
  User = mongoose.models.User;
  Event = mongoose.models.Event;
  Registration = mongoose.models.Registration;
}

// Initial default seed events for Techfest 2026
const DEFAULT_EVENTS = [
  {
    title: 'Hack-X: 24-Hour AI & Web3 Hackathon',
    category: 'Hackathon',
    date: 'Nov 14, 2026 • 10:00 AM',
    venue: 'Innovation Hub, Hall A',
    capacity: 150,
    registeredCount: 42,
    description: 'Build ground-breaking full-stack, AI, or Web3 applications in a high-octane 24-hour sprint. Mentors from top tech companies and cloud sponsors on site.',
    prize: '₹75,000 Cash + Cloud Credits + Incubation',
    rules: [
      'Teams of 2 to 4 members',
      'All code must be written during the hackathon',
      'Open-source frameworks and libraries permitted'
    ],
    organizer: 'Computer Science Department'
  },
  {
    title: 'RoboWars 2026: Combat Robotics',
    category: 'Robotics',
    date: 'Nov 15, 2026 • 02:00 PM',
    venue: 'Open Arena 3',
    capacity: 80,
    registeredCount: 28,
    description: 'Custom-built heavyweight and featherweight combat bots clash in an enclosed steel battle arena. Ultimate mechanical durability and tactical driving.',
    prize: '₹50,000 Cash + Hardware Kits',
    rules: [
      'Max weight 15kg for featherweight, 30kg for heavyweight',
      'Failsafe remote control cutoffs mandatory',
      'Standard double elimination bracket'
    ],
    organizer: 'Robotics Club'
  },
  {
    title: 'CodeSprint: Competitive Algorithmic Arena',
    category: 'Coding',
    date: 'Nov 14, 2026 • 03:00 PM',
    venue: 'Computer Center Lab 4',
    capacity: 120,
    registeredCount: 65,
    description: 'Solve complex algorithmic challenges, dynamic programming puzzles, and graph problems in 90 minutes. Speed, accuracy, and test-case coverage determine the leader.',
    prize: '₹30,000 Cash + Swag & Badges',
    rules: [
      'Individual participation only',
      'Languages supported: C++, Java, Python, JS',
      'Plagiarism checks enabled with zero tolerance'
    ],
    organizer: 'Coding & Algorithms Guild'
  },
  {
    title: 'CyberDefend: CTF Cybersecurity Challenge',
    category: 'Cybersecurity',
    date: 'Nov 15, 2026 • 11:00 AM',
    venue: 'Systems Security Lab',
    capacity: 90,
    registeredCount: 37,
    description: 'Jeopardy-style Capture The Flag challenge featuring Web Exploitation, Reverse Engineering, Cryptography, and Forensics challenges.',
    prize: '₹40,000 Cash + Security Certifications',
    rules: [
      'Teams of up to 3 members',
      'Attacking competition infrastructure is strictly prohibited',
      'First blood bonus points awarded'
    ],
    organizer: 'Cyber Security Club'
  },
  {
    title: 'GameForge: Esports Valorant & BGMI Cup',
    category: 'Gaming',
    date: 'Nov 16, 2026 • 10:00 AM',
    venue: 'Auditorium E-Lounge',
    capacity: 64,
    registeredCount: 50,
    description: 'Inter-college competitive esports tournament streamed live with professional casters. High-refresh gaming monitors and low-latency LAN setup provided.',
    prize: '₹35,000 Cash + Gaming Gear',
    rules: [
      '5v5 for PC, 4-man squads for mobile',
      'Official game rulebooks and referee decisions final',
      'Fair play anti-cheat strictly enforced'
    ],
    organizer: 'Student Activity Council'
  },
  {
    title: 'FutureTech Keynote & Project Expo',
    category: 'Exhibition',
    date: 'Nov 16, 2026 • 04:00 PM',
    venue: 'Main Auditorium',
    capacity: 300,
    registeredCount: 110,
    description: 'Showcase student engineering prototypes, IoT projects, and startup pitches to angel investors, faculty, and industry judges.',
    prize: '₹60,000 Seed Grant + Mentorship',
    rules: [
      'Working hardware or software prototype required',
      'Poster board and 5-minute presentation deck',
      'Q&A session with industry jury'
    ],
    organizer: 'Research & Innovation Cell'
  }
];

// Seed initial memory store
memoryStore.events = DEFAULT_EVENTS.map((e, idx) => ({
  _id: 'mem_evt_' + (idx + 1),
  ...e,
  createdAt: new Date()
}));

// Initialize MongoDB Atlas connection
const MONGO_URI = process.env.MONGO_URI;

if (MONGO_URI && !MONGO_URI.includes('YOUR_USERNAME') && !MONGO_URI.includes('your_connection_string')) {
  mongoose.connect(MONGO_URI, {
    serverSelectionTimeoutMS: 5000
  })
    .then(async () => {
      dbConnected = true;
      dbStatusMessage = 'Connected to MongoDB Atlas';
      console.log('✅ MongoDB Atlas connected successfully.');

      // Check if events exist in DB, if not seed them
      try {
        const count = await Event.countDocuments();
        if (count === 0) {
          await Event.insertMany(DEFAULT_EVENTS);
          console.log('🌱 Seeded default Techfest 2026 events to MongoDB Atlas.');
        }
      } catch (err) {
        console.warn('⚠️ Seeding check error:', err.message);
      }
    })
    .catch((err) => {
      dbConnected = false;
      dbStatusMessage = `Atlas connection standby (${err.message}). Using memory fallback.`;
      console.warn('⚠️ MongoDB connection standby:', err.message);
      console.info('💡 Tip: Make sure your current IP or 0.0.0.0/0 is whitelisted in MongoDB Atlas Network Access.');
    });
} else {
  dbStatusMessage = 'Running with local memory store. Set MONGO_URI in .env to connect MongoDB Atlas.';
  console.log('ℹ️ Running in memory store mode. Set MONGO_URI in server/.env or Render config.');
}

// ==========================================
// AUTHENTICATION MIDDLEWARE
// ==========================================
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization token required' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired authentication token' });
  }
};

// ==========================================
// API ROUTES
// ==========================================

/**
 * 1. Health Check Route (Required by Guide & Deployment Verification)
 * Slide 8 & 19: GET /api/health -> { "status": "ok" }
 */
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'Tech-Fest-2026-portal-api',
    environment: process.env.NODE_ENV || 'development',
    uptime: `${Math.floor(process.uptime())}s`,
    timestamp: new Date().toISOString(),
    database: {
      connected: dbConnected,
      message: dbStatusMessage
    }
  });
});

/**
 * Root Route
 */
app.get('/', (req, res) => {
  res.json({
    name: 'Techfest 2026 Portal API',
    version: '1.0.0',
    documentation: '/api/health',
    endpoints: [
      'GET  /api/health',
      'POST /api/auth/register',
      'POST /api/auth/login',
      'GET  /api/auth/me',
      'GET  /api/events',
      'GET  /api/events/:id',
      'POST /api/events',
      'POST /api/registrations',
      'GET  /api/registrations/my',
      'DELETE /api/registrations/:id'
    ]
  });
});

// ==========================================
// AUTHENTICATION ROUTES
// ==========================================

/**
 * POST /api/auth/register
 * Register a new student/user
 */
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, college } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Please provide name, email, and password.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    if (dbConnected) {
      const existing = await User.findOne({ email: normalizedEmail });
      if (existing) {
        return res.status(400).json({ error: 'An account with this email already exists.' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = await User.create({
        name,
        email: normalizedEmail,
        password: hashedPassword,
        college: college || 'Tech Institute',
        role: 'student'
      });

      const token = jwt.sign(
        { id: newUser._id.toString(), email: newUser.email, name: newUser.name, role: newUser.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.status(201).json({
        message: 'Account registered successfully!',
        token,
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          college: newUser.college,
          role: newUser.role
        }
      });
    } else {
      // Memory fallback
      const existing = memoryStore.users.find(u => u.email === normalizedEmail);
      if (existing) {
        return res.status(400).json({ error: 'An account with this email already exists.' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = {
        _id: 'mem_usr_' + Date.now(),
        name,
        email: normalizedEmail,
        password: hashedPassword,
        college: college || 'Tech Institute',
        role: 'student',
        createdAt: new Date()
      };
      memoryStore.users.push(newUser);

      const token = jwt.sign(
        { id: newUser._id, email: newUser.email, name: newUser.name, role: newUser.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.status(201).json({
        message: 'Account registered successfully (local store)!',
        token,
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          college: newUser.college,
          role: newUser.role
        }
      });
    }
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Failed to register account: ' + err.message });
  }
});

/**
 * POST /api/auth/login
 * User login with JWT generation
 */
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    let user;
    if (dbConnected) {
      user = await User.findOne({ email: normalizedEmail });
    } else {
      user = memoryStore.users.find(u => u.email === normalizedEmail);
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials. User not found.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials. Password incorrect.' });
    }

    const token = jwt.sign(
      { id: user._id.toString(), email: user.email, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      message: 'Login successful!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        college: user.college,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed: ' + err.message });
  }
});

/**
 * GET /api/auth/me
 * Profile route - Protected
 */
app.get('/api/auth/me', authenticate, async (req, res) => {
  try {
    let user;
    if (dbConnected) {
      user = await User.findById(req.user.id).select('-password');
    } else {
      const memUser = memoryStore.users.find(u => u._id === req.user.id);
      if (memUser) {
        user = { ...memUser };
        delete user.password;
      }
    }

    if (!user) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user profile.' });
  }
});

// ==========================================
// EVENT MANAGEMENT ROUTES (CRUD)
// ==========================================

/**
 * GET /api/events
 * Fetch all events with optional category & search filter
 */
app.get('/api/events', async (req, res) => {
  try {
    const { category, search } = req.query;

    let eventsList = [];
    if (dbConnected) {
      let query = {};
      if (category && category !== 'All') {
        query.category = category;
      }
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }
      eventsList = await Event.find(query).sort({ createdAt: -1 });
    } else {
      eventsList = memoryStore.events.filter(evt => {
        const matchesCategory = !category || category === 'All' || evt.category === category;
        const matchesSearch = !search ||
          evt.title.toLowerCase().includes(search.toLowerCase()) ||
          evt.description.toLowerCase().includes(search.toLowerCase());
        return matchesCategory && matchesSearch;
      });
    }

    res.json({ count: eventsList.length, events: eventsList });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve events: ' + err.message });
  }
});

/**
 * GET /api/events/:id
 * Get single event by ID
 */
app.get('/api/events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let event;

    if (dbConnected) {
      event = await Event.findById(id);
    } else {
      event = memoryStore.events.find(e => e._id.toString() === id.toString());
    }

    if (!event) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    res.json({ event });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching event details: ' + err.message });
  }
});

/**
 * POST /api/events
 * Create new event (Admin or authorized)
 */
app.post('/api/events', authenticate, async (req, res) => {
  try {
    const { title, category, date, venue, capacity, description, prize, rules, organizer } = req.body;

    if (!title || !category || !date || !venue || !description) {
      return res.status(400).json({ error: 'Please provide title, category, date, venue, and description.' });
    }

    const eventData = {
      title,
      category,
      date,
      venue,
      capacity: Number(capacity) || 100,
      registeredCount: 0,
      description,
      prize: prize || 'Certificates & Swag',
      rules: Array.isArray(rules) ? rules : (rules ? rules.split('\n') : []),
      organizer: organizer || req.user.name
    };

    let createdEvent;
    if (dbConnected) {
      createdEvent = await Event.create(eventData);
    } else {
      createdEvent = {
        _id: 'mem_evt_' + Date.now(),
        ...eventData,
        createdAt: new Date()
      };
      memoryStore.events.unshift(createdEvent);
    }

    res.status(201).json({
      message: 'Event created successfully!',
      event: createdEvent
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create event: ' + err.message });
  }
});

/**
 * DELETE /api/events/:id
 * Delete an event
 */
app.delete('/api/events/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    if (dbConnected) {
      await Event.findByIdAndDelete(id);
    } else {
      memoryStore.events = memoryStore.events.filter(e => e._id.toString() !== id.toString());
    }
    res.json({ message: 'Event removed successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete event.' });
  }
});

// ==========================================
// REGISTRATION / BOOKING ROUTES
// ==========================================

/**
 * POST /api/registrations
 * Register user for an event & issue ticket pass
 */
app.post('/api/registrations', authenticate, async (req, res) => {
  try {
    const { eventId, teamName } = req.body;
    if (!eventId) {
      return res.status(400).json({ error: 'Event ID is required to register.' });
    }

    // Check if event exists
    let event;
    if (dbConnected) {
      event = await Event.findById(eventId);
    } else {
      event = memoryStore.events.find(e => e._id.toString() === eventId.toString());
    }

    if (!event) {
      return res.status(404).json({ error: 'Selected event not found.' });
    }

    // Check capacity
    if (event.registeredCount >= event.capacity) {
      return res.status(400).json({ error: 'Registration is full for this event!' });
    }

    // Check duplicate registration
    let alreadyRegistered = false;
    if (dbConnected) {
      const reg = await Registration.findOne({ userId: req.user.id, eventId });
      if (reg) alreadyRegistered = true;
    } else {
      alreadyRegistered = memoryStore.registrations.some(
        r => r.userId === req.user.id && r.eventId.toString() === eventId.toString()
      );
    }

    if (alreadyRegistered) {
      return res.status(400).json({ error: 'You have already registered for this event!' });
    }

    // Generate unique Pass Code: TF26-XXXXX
    const ticketCode = `TF26-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const regData = {
      userId: req.user.id,
      userName: req.user.name,
      userEmail: req.user.email,
      eventId: event._id.toString(),
      eventTitle: event.title,
      teamName: teamName || 'Individual Participant',
      ticketCode,
      registeredAt: new Date()
    };

    let newRegistration;
    if (dbConnected) {
      newRegistration = await Registration.create(regData);
      event.registeredCount += 1;
      await event.save();
    } else {
      newRegistration = {
        _id: 'mem_reg_' + Date.now(),
        ...regData
      };
      memoryStore.registrations.push(newRegistration);
      event.registeredCount += 1;
    }

    res.status(201).json({
      message: 'Registration confirmed! Event pass generated.',
      registration: newRegistration
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Failed to complete registration: ' + err.message });
  }
});

/**
 * GET /api/registrations/my
 * Get current user's registered events
 */
app.get('/api/registrations/my', authenticate, async (req, res) => {
  try {
    let list = [];
    if (dbConnected) {
      list = await Registration.find({ userId: req.user.id }).sort({ registeredAt: -1 });
    } else {
      list = memoryStore.registrations
        .filter(r => r.userId === req.user.id)
        .sort((a, b) => new Date(b.registeredAt) - new Date(a.registeredAt));
    }

    res.json({ count: list.length, registrations: list });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch registrations.' });
  }
});

/**
 * DELETE /api/registrations/:id
 * Cancel registration
 */
app.delete('/api/registrations/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    let reg;

    if (dbConnected) {
      reg = await Registration.findOne({ _id: id, userId: req.user.id });
      if (!reg) {
        return res.status(404).json({ error: 'Registration record not found.' });
      }
      await Registration.findByIdAndDelete(id);
      // Decrement registeredCount
      await Event.findByIdAndUpdate(reg.eventId, { $inc: { registeredCount: -1 } });
    } else {
      const idx = memoryStore.registrations.findIndex(r => r._id === id && r.userId === req.user.id);
      if (idx === -1) {
        return res.status(404).json({ error: 'Registration record not found.' });
      }
      const removed = memoryStore.registrations.splice(idx, 1)[0];
      const evt = memoryStore.events.find(e => e._id.toString() === removed.eventId.toString());
      if (evt && evt.registeredCount > 0) {
        evt.registeredCount -= 1;
      }
    }

    res.json({ message: 'Registration cancelled successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to cancel registration.' });
  }
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🚀 Techfest 2026 Portal API Server running`);
  console.log(`📍 Port: ${PORT}`);
  console.log(`🌐 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`🔐 Allowed Origin: ${CLIENT_ORIGIN}`);
  console.log(`===============================================`);
});
