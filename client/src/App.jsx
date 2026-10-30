import React, { useState, useEffect } from 'react';
import {
  Calendar,
  MapPin,
  Users,
  Trophy,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  Search,
  Ticket,
  LogOut,
  LogIn,
  UserPlus,
  Shield,
  Activity,
  Server,
  Globe,
  Database,
  Cpu,
  Trash2,
  Info
} from 'lucide-react';
import './App.css';

// Automatically adapt to local environment or Render production deployment
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function App() {
  // Navigation & Tabs
  const [activeTab, setActiveTab] = useState('events'); // 'events' | 'my-passes' | 'architecture'
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Data State
  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiHealth, setApiHealth] = useState({ status: 'checking', uptime: '0s' });

  // User & Auth State
  const [token, setToken] = useState(() => localStorage.getItem('tf_token') || '');
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('tf_user');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  });

  // Modals
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [eventDetailModal, setEventDetailModal] = useState(null);
  const [healthModalOpen, setHealthModalOpen] = useState(false);

  // Form States
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '', college: '' });
  const [teamNameInput, setTeamNameInput] = useState('');
  const [statusNotice, setStatusNotice] = useState(null); // { type: 'success' | 'error', text: '' }

  // 1. Initial Health Check (Checks /api/health as specified in slide 8 & 19)
  const checkHealth = async () => {
    try {
      const res = await fetch(`${API_URL}/api/health`);
      if (res.ok) {
        const data = await res.json();
        setApiHealth(data);
      } else {
        setApiHealth({ status: 'error', message: 'API returned non-200' });
      }
    } catch (err) {
      setApiHealth({ status: 'offline', message: err.message });
    }
  };

  // 2. Fetch Events (Supports search & category)
  const fetchEvents = async () => {
    setLoading(true);
    try {
      let url = `${API_URL}/api/events?category=${encodeURIComponent(selectedCategory)}`;
      if (searchQuery.trim()) {
        url += `&search=${encodeURIComponent(searchQuery.trim())}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      }
    } catch (err) {
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  // 3. Fetch User's Registrations
  const fetchMyRegistrations = async () => {
    if (!token) {
      setRegistrations([]);
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/registrations/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRegistrations(data.registrations || []);
      }
    } catch (err) {
      console.error('Error fetching registrations:', err);
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Heartbeat check every 30s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    if (token) {
      fetchMyRegistrations();
    } else {
      setRegistrations([]);
    }
  }, [token]);

  // Auth Handler
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setStatusNotice(null);

    const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
    const payload = authMode === 'login'
      ? { email: authForm.email, password: authForm.password }
      : authForm;

    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      // Save session
      localStorage.setItem('tf_token', data.token);
      localStorage.setItem('tf_user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      setAuthModalOpen(false);
      setAuthForm({ name: '', email: '', password: '', college: '' });
      setStatusNotice({ type: 'success', text: `Welcome back, ${data.user.name}!` });
      setTimeout(() => setStatusNotice(null), 4000);
    } catch (err) {
      setStatusNotice({ type: 'error', text: err.message });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('tf_token');
    localStorage.removeItem('tf_user');
    setToken('');
    setUser(null);
    setRegistrations([]);
    setStatusNotice({ type: 'success', text: 'You have signed out successfully.' });
    setTimeout(() => setStatusNotice(null), 3000);
  };

  // Event Registration Handler
  const handleRegisterEvent = async (event) => {
    if (!token) {
      setEventDetailModal(null);
      setAuthMode('login');
      setAuthModalOpen(true);
      setStatusNotice({ type: 'error', text: 'Please sign in or create an account to book your pass.' });
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/registrations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          eventId: event._id,
          teamName: teamNameInput.trim() || undefined
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setTeamNameInput('');
      setEventDetailModal(null);
      fetchMyRegistrations();
      fetchEvents();
      setActiveTab('my-passes');
      setStatusNotice({
        type: 'success',
        text: `Success! Registered for "${event.title}". Ticket: ${data.registration.ticketCode}`
      });
      setTimeout(() => setStatusNotice(null), 6000);
    } catch (err) {
      setStatusNotice({ type: 'error', text: err.message });
    }
  };

  // Cancel Registration Handler
  const handleCancelRegistration = async (regId) => {
    if (!window.confirm('Are you sure you want to cancel this event registration?')) return;

    try {
      const res = await fetch(`${API_URL}/api/registrations/${regId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchMyRegistrations();
        fetchEvents();
        setStatusNotice({ type: 'success', text: 'Registration cancelled.' });
        setTimeout(() => setStatusNotice(null), 4000);
      }
    } catch (err) {
      setStatusNotice({ type: 'error', text: 'Failed to cancel registration.' });
    }
  };

  const categories = ['All', 'Hackathon', 'Robotics', 'Coding', 'Cybersecurity', 'Gaming', 'Exhibition'];

  return (
    <div className="app-container">
      {/* Top Navigation Bar */}
      <nav className="navbar">
        <div className="nav-content">
          <div className="brand-logo" onClick={() => setActiveTab('events')}>
            <div className="logo-icon-box">
              <Sparkles size={22} color="#ffffff" />
            </div>
            <div className="brand-text">
              <h1 className="font-display">Techfest '26</h1>
              <span>Full-Stack Portal</span>
            </div>
          </div>

          <div className="nav-center">
            <button
              id="nav-events-btn"
              className={`nav-link-btn ${activeTab === 'events' ? 'active' : ''}`}
              onClick={() => setActiveTab('events')}
            >
              <Calendar size={16} /> Explore Events
            </button>
            <button
              id="nav-passes-btn"
              className={`nav-link-btn ${activeTab === 'my-passes' ? 'active' : ''}`}
              onClick={() => {
                if (!token) {
                  setAuthMode('login');
                  setAuthModalOpen(true);
                } else {
                  setActiveTab('my-passes');
                }
              }}
            >
              <Ticket size={16} /> My Passes
              {registrations.length > 0 && <span className="count-pill">{registrations.length}</span>}
            </button>
            <button
              id="nav-arch-btn"
              className={`nav-link-btn ${activeTab === 'architecture' ? 'active' : ''}`}
              onClick={() => setActiveTab('architecture')}
            >
              <Cpu size={16} /> Architecture
            </button>
          </div>

          <div className="nav-actions">
            {/* Live Health Badge (Maps to Slide 8 & 19 /api/health) */}
            <div
              id="api-health-badge"
              className={`api-status-badge ${apiHealth.status === 'ok' ? '' : 'error'}`}
              onClick={() => setHealthModalOpen(true)}
              title="Click to view backend health report"
            >
              <span className={`status-dot ${apiHealth.status === 'ok' ? '' : 'error'}`} />
              <span>{apiHealth.status === 'ok' ? 'API: Live (ok)' : 'API: Standby'}</span>
            </div>

            {user ? (
              <div className="user-pill">
                <div className="user-avatar-mini">{user.name.charAt(0).toUpperCase()}</div>
                <span className="user-pill-name">{user.name.split(' ')[0]}</span>
                <button
                  id="logout-btn"
                  onClick={handleLogout}
                  className="btn-outline-danger"
                  style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                >
                  <LogOut size={13} />
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  id="login-btn"
                  className="btn-secondary"
                  onClick={() => {
                    setAuthMode('login');
                    setAuthModalOpen(true);
                  }}
                >
                  <LogIn size={15} /> Sign In
                </button>
                <button
                  id="register-btn"
                  className="btn-primary"
                  onClick={() => {
                    setAuthMode('register');
                    setAuthModalOpen(true);
                  }}
                >
                  <UserPlus size={15} /> Register
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="main-wrapper">
        {/* Global Toast / Feedback */}
        {statusNotice && (
          <div className={`alert-box ${statusNotice.type === 'success' ? 'alert-success' : 'alert-danger'}`}>
            {statusNotice.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{statusNotice.text}</span>
          </div>
        )}

        {/* TAB 1: EXPLORE EVENTS */}
        {activeTab === 'events' && (
          <div>
            <section className="hero-section">
              <div className="hero-pill">
                <Sparkles size={14} /> National Tech Symposium 2026
              </div>
              <h2 className="hero-title">
                Code. Build. Compete. <span className="gradient-text">Deploy.</span>
              </h2>
              <p className="hero-subtitle">
                Welcome to the official Tech-Fest 2026 Portal. Discover flagship hackathons, robotics tournaments,
                and technical workshops. Powered by a production-ready MERN Stack.
              </p>

              {/* Stats Ribbon */}
              <div className="stats-ribbon">
                <div className="stat-card">
                  <div className="stat-value gradient-text">₹2.9L+</div>
                  <div className="stat-label">Prize Pool</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">6+</div>
                  <div className="stat-label">Flagship Events</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">1,500+</div>
                  <div className="stat-label">Participants</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value" style={{ color: '#34d399' }}>100%</div>
                  <div className="stat-label">Cloud Connected</div>
                </div>
              </div>
            </section>

            {/* Controls Bar: Search & Category filter */}
            <div className="controls-bar">
              <div className="search-box-wrapper">
                <Search size={18} className="search-icon-inside" />
                <input
                  id="event-search-input"
                  type="text"
                  placeholder="Search events, topics, or keywords..."
                  className="search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="category-filter-list">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    id={`cat-btn-${cat}`}
                    className={`category-btn ${selectedCategory === cat ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Events Grid */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
                <Activity size={32} className="animate-pulse-glow" style={{ margin: '0 auto 1rem' }} />
                <p>Loading Techfest 2026 events from backend API...</p>
              </div>
            ) : events.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
                <p>No events found matching your criteria.</p>
                <button
                  className="btn-secondary"
                  style={{ marginTop: '1rem' }}
                  onClick={() => {
                    setSelectedCategory('All');
                    setSearchQuery('');
                  }}
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="events-grid">
                {events.map((evt) => {
                  const isRegistered = registrations.some(
                    (r) => r.eventId === evt._id || r.eventId === evt._id?.toString()
                  );
                  const isFull = evt.registeredCount >= evt.capacity;

                  return (
                    <div key={evt._id} className="event-card">
                      <div className="event-card-header">
                        <span className="category-tag">{evt.category}</span>
                        <div className="prize-pill">
                          <Trophy size={14} /> {evt.prize?.split('+')[0] || evt.prize}
                        </div>
                      </div>

                      <div className="event-card-body">
                        <h3 className="event-card-title">{evt.title}</h3>
                        <p className="event-card-desc">{evt.description}</p>

                        <div className="event-meta-info">
                          <div className="meta-row">
                            <Calendar size={14} color="var(--accent-cyan)" />
                            <span>{evt.date}</span>
                          </div>
                          <div className="meta-row">
                            <MapPin size={14} color="var(--accent-indigo)" />
                            <span>{evt.venue}</span>
                          </div>
                          <div className="capacity-wrapper">
                            <div className="capacity-label-row">
                              <span>Slots Filled</span>
                              <span style={{ fontWeight: 600 }}>
                                {evt.registeredCount} / {evt.capacity}
                              </span>
                            </div>
                            <div className="capacity-bar-bg">
                              <div
                                className="capacity-bar-fill"
                                style={{ width: `${Math.min(100, (evt.registeredCount / evt.capacity) * 100)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="event-card-footer">
                        <button
                          id={`btn-view-${evt._id}`}
                          className="btn-secondary"
                          onClick={() => setEventDetailModal(evt)}
                        >
                          <Info size={15} /> Details
                        </button>
                        {isRegistered ? (
                          <button
                            className="btn-secondary"
                            style={{ borderColor: '#10b981', color: '#34d399' }}
                            onClick={() => setActiveTab('my-passes')}
                          >
                            <CheckCircle2 size={15} /> Registered
                          </button>
                        ) : (
                          <button
                            id={`btn-reg-${evt._id}`}
                            className="btn-primary"
                            disabled={isFull}
                            onClick={() => {
                              setEventDetailModal(evt);
                            }}
                          >
                            <Ticket size={15} /> {isFull ? 'Sold Out' : 'Register Pass'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MY PASSES / DASHBOARD */}
        {activeTab === 'my-passes' && (
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem' }}>
              <h2 className="font-display" style={{ fontSize: '1.8rem', marginBottom: '0.4rem' }}>
                My Registered Passes
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Official participant digital badges for entry into Techfest 2026 events and workshops.
              </p>
            </div>

            {registrations.length === 0 ? (
              <div
                className="glass-panel"
                style={{ textAlign: 'center', padding: '3.5rem 1.5rem', color: 'var(--text-muted)' }}
              >
                <Ticket size={48} style={{ opacity: 0.4, margin: '0 auto 1rem' }} />
                <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>No Event Passes Yet</h3>
                <p style={{ maxWidth: '420px', margin: '0 auto 1.5rem' }}>
                  You haven't registered for any events yet. Explore our upcoming hackathons and competitions to claim your spot!
                </p>
                <button className="btn-primary" onClick={() => setActiveTab('events')}>
                  Browse Events
                </button>
              </div>
            ) : (
              <div>
                {registrations.map((reg) => (
                  <div key={reg._id} className="ticket-card">
                    <div className="ticket-top">
                      <div>
                        <span className="category-tag">OFFICIAL PASS</span>
                        <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginTop: '0.4rem' }}>
                          {reg.eventTitle}
                        </h3>
                      </div>
                      <div className="ticket-code-badge">{reg.ticketCode}</div>
                    </div>

                    <div className="ticket-details-grid">
                      <div>
                        <div className="ticket-field-label">Participant</div>
                        <div className="ticket-field-val">{reg.userName}</div>
                      </div>
                      <div>
                        <div className="ticket-field-label">Team / Category</div>
                        <div className="ticket-field-val">{reg.teamName || 'Individual Entry'}</div>
                      </div>
                      <div>
                        <div className="ticket-field-label">Registered Email</div>
                        <div className="ticket-field-val">{reg.userEmail}</div>
                      </div>
                      <div>
                        <div className="ticket-field-label">Booking Date</div>
                        <div className="ticket-field-val">
                          {new Date(reg.registeredAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#34d399', fontSize: '0.82rem' }}>
                        <CheckCircle2 size={16} /> Verified & Confirmed on MongoDB
                      </div>
                      <button
                        className="btn-outline-danger"
                        onClick={() => handleCancelRegistration(reg._id)}
                      >
                        <Trash2 size={14} /> Cancel Pass
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ARCHITECTURE & DEPLOYMENT (Maps directly to Lab Guide Slides 2, 3, 17, 20) */}
        {activeTab === 'architecture' && (
          <div style={{ maxWidth: '850px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem' }}>
              <div className="hero-pill">
                <Cpu size={14} /> Slide 02 Architecture Reference
              </div>
              <h2 className="font-display" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                Full MERN Stack Deployment Blueprint
              </h2>
              <p style={{ color: 'var(--text-secondary)' }}>
                How this Tech-Fest-2026-portal operates across cloud providers and local development environments.
              </p>
            </div>

            <div className="arch-flow-diagram">
              <div className="arch-node active-node">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <Globe size={24} color="var(--accent-cyan)" />
                  <div>
                    <div className="arch-node-name">1. React Frontend (Vite)</div>
                    <div className="arch-node-role">Dynamic UI, Event Catalog, Pass Generation, Auth Modals</div>
                  </div>
                </div>
                <div className="arch-node-host">Hosted on Netlify</div>
              </div>

              <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                ⬇ HTTPS REST API Requests (JSON payload)
              </div>

              <div className="arch-node active-node">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <Server size={24} color="var(--accent-indigo)" />
                  <div>
                    <div className="arch-node-name">2. Express & Node.js API</div>
                    <div className="arch-node-role">CORS, JWT Authentication, Event & Registration CRUD Routes</div>
                  </div>
                </div>
                <div className="arch-node-host">Hosted on Render</div>
              </div>

              <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                ⬇ Mongoose ODM Connection String (TLS encrypted)
              </div>

              <div className="arch-node active-node">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <Database size={24} color="#10b981" />
                  <div>
                    <div className="arch-node-name">3. MongoDB Atlas</div>
                    <div className="arch-node-role">Cloud NoSQL DB: User credentials (bcrypt), Events & Bookings</div>
                  </div>
                </div>
                <div className="arch-node-host">Cloud Database Cluster</div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem', marginTop: '2rem' }}>
              <h3 style={{ fontSize: '1.15rem', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Shield size={18} color="var(--accent-cyan)" /> Security & Environment Variables
              </h3>
              <ul style={{ paddingLeft: '1.25rem', color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.8' }}>
                <li><strong>No Secrets in Public Frontend:</strong> Only <code>VITE_API_URL</code> is exposed to the React bundle.</li>
                <li><strong>Render Private Environment:</strong> <code>MONGO_URI</code>, <code>JWT_SECRET</code>, and <code>CLIENT_ORIGIN</code> are kept on the server.</li>
                <li><strong>Password Protection:</strong> Passwords hashed using bcrypt 10 salt rounds before storage.</li>
                <li><strong>Health-Check Endpoint:</strong> <code>GET /api/health</code> allows automatic uptime monitoring on Render.</li>
              </ul>
            </div>
          </div>
        )}
      </main>

      {/* MODAL 1: EVENT DETAILS & REGISTRATION */}
      {eventDetailModal && (
        <div className="modal-overlay" onClick={() => setEventDetailModal(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="category-tag">{eventDetailModal.category}</span>
                <span className="prize-pill">
                  <Trophy size={14} /> {eventDetailModal.prize}
                </span>
              </div>
              <button className="close-btn" onClick={() => setEventDetailModal(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.8rem' }}>
                {eventDetailModal.title}
              </h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.25rem', fontSize: '0.92rem' }}>
                {eventDetailModal.description}
              </p>

              <div className="event-meta-info">
                <div className="meta-row">
                  <Calendar size={15} color="var(--accent-cyan)" />
                  <span><strong>Schedule:</strong> {eventDetailModal.date}</span>
                </div>
                <div className="meta-row">
                  <MapPin size={15} color="var(--accent-indigo)" />
                  <span><strong>Venue:</strong> {eventDetailModal.venue}</span>
                </div>
                <div className="meta-row">
                  <Users size={15} color="#34d399" />
                  <span><strong>Organizer:</strong> {eventDetailModal.organizer || 'Techfest Committee'}</span>
                </div>
              </div>

              {eventDetailModal.rules && eventDetailModal.rules.length > 0 && (
                <div style={{ marginTop: '1.25rem' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem' }}>Rules & Guidelines</h4>
                  <ul style={{ paddingLeft: '1.2rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    {eventDetailModal.rules.map((rule, idx) => (
                      <li key={idx} style={{ marginBottom: '0.3rem' }}>{rule}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Team Registration Input */}
              <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)' }}>
                <div className="form-group">
                  <label className="form-label">Team / Project Name (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Binary Beasts / Solo"
                    className="form-control"
                    value={teamNameInput}
                    onChange={(e) => setTeamNameInput(e.target.value)}
                  />
                  <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.2rem', display: 'block' }}>
                    Leave blank if registering as an individual participant.
                  </small>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setEventDetailModal(null)}>
                Close
              </button>
              <button
                id="modal-confirm-reg-btn"
                className="btn-primary"
                onClick={() => handleRegisterEvent(eventDetailModal)}
              >
                <Ticket size={16} /> Confirm & Generate Pass
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: USER AUTHENTICATION (LOGIN / REGISTER) */}
      {authModalOpen && (
        <div className="modal-overlay" onClick={() => setAuthModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 className="modal-title font-display">
                {authMode === 'login' ? 'Welcome Back' : 'Create Student Account'}
              </h3>
              <button className="close-btn" onClick={() => setAuthModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <div className="auth-tabs">
                <button
                  id="tab-login"
                  className={`auth-tab-btn ${authMode === 'login' ? 'active' : ''}`}
                  onClick={() => setAuthMode('login')}
                >
                  Sign In
                </button>
                <button
                  id="tab-register"
                  className={`auth-tab-btn ${authMode === 'register' ? 'active' : ''}`}
                  onClick={() => setAuthMode('register')}
                >
                  Register
                </button>
              </div>

              <form onSubmit={handleAuthSubmit}>
                {authMode === 'register' && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Full Name</label>
                      <input
                        id="auth-name"
                        type="text"
                        required
                        placeholder="e.g. Aarav Sharma"
                        className="form-control"
                        value={authForm.name}
                        onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">College / Institute</label>
                      <input
                        id="auth-college"
                        type="text"
                        placeholder="e.g. National Institute of Tech"
                        className="form-control"
                        value={authForm.college}
                        onChange={(e) => setAuthForm({ ...authForm, college: e.target.value })}
                      />
                    </div>
                  </>
                )}

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    id="auth-email"
                    type="email"
                    required
                    placeholder="student@example.com"
                    className="form-control"
                    value={authForm.email}
                    onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input
                    id="auth-password"
                    type="password"
                    required
                    minLength={6}
                    placeholder="••••••••"
                    className="form-control"
                    value={authForm.password}
                    onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                  />
                </div>

                <button
                  id="auth-submit-btn"
                  type="submit"
                  className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center', marginTop: '1rem', padding: '0.75rem' }}
                >
                  {authMode === 'login' ? 'Sign In to Portal' : 'Create Account'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: API HEALTH REPORT & DIAGNOSTICS */}
      {healthModalOpen && (
        <div className="modal-overlay" onClick={() => setHealthModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title font-display" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Activity size={20} color="var(--accent-cyan)" /> Health Check Diagnostics
              </h3>
              <button className="close-btn" onClick={() => setHealthModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
                Direct live diagnostic query to <code>{API_URL}/api/health</code> (Slide 8 & 19).
              </p>

              <div
                style={{
                  background: 'rgba(0, 0, 0, 0.4)',
                  padding: '1rem',
                  borderRadius: 'var(--radius-sm)',
                  fontFamily: 'monospace',
                  fontSize: '0.85rem',
                  color: '#34d399',
                  overflowX: 'auto'
                }}
              >
                <pre>{JSON.stringify(apiHealth, null, 2)}</pre>
              </div>

              <div style={{ marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <strong>Current API Target:</strong> {API_URL}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={checkHealth}>
                Re-check Health
              </button>
              <button className="btn-primary" onClick={() => setHealthModalOpen(false)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '0.3rem' }}>
              Tech-Fest-2026-portal
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Built for Full-Stack MERN Stack Lab Experiment & Classroom Submission.
            </p>
          </div>

          <div className="stack-tags">
            <span className="stack-tag">MongoDB Atlas</span>
            <span className="stack-tag">Express.js</span>
            <span className="stack-tag">React (Vite)</span>
            <span className="stack-tag">Node.js</span>
            <span className="stack-tag">Render Cloud</span>
            <span className="stack-tag">Netlify</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
