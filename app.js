/* ========================================
   NeuroPathway Safe Space — Application
   Multi-role platform with localStorage persistence
   ======================================== */

const App = {
  currentUser: null,
  currentPage: 'landing',

  // ========== INITIALIZATION ==========
  init() {
    this.loadUser();
    this.router();
    window.addEventListener('hashchange', () => this.router());
  },

  loadUser() {
    const saved = localStorage.getItem('np_current_user');
    if (saved) {
      this.currentUser = JSON.parse(saved);
    }
  },

  saveUser(user) {
    this.currentUser = user;
    localStorage.setItem('np_current_user', JSON.stringify(user));
  },

  logout() {
    this.currentUser = null;
    localStorage.removeItem('np_current_user');
    window.location.hash = '#/login';
  },

  // ========== ROUTER ==========
  router() {
    const hash = window.location.hash || '#/';
    const appContainer = document.getElementById('app-container');
    const landingPage = document.getElementById('landing-page');

    if (hash === '#/' || hash === '') {
      landingPage.style.display = 'block';
      appContainer.style.display = 'none';
      return;
    }

    landingPage.style.display = 'none';
    appContainer.style.display = 'block';

    if (hash === '#/login') {
      this.renderLogin();
    } else if (hash === '#/register') {
      this.renderRegister();
    } else if (this.currentUser) {
      const role = this.currentUser.role;
      if (hash === '#/dashboard') {
        this.renderDashboard(role);
      } else if (hash === '#/questionnaire') {
        this.renderQuestionnaire(role);
      } else if (hash === '#/patterns') {
        this.renderPatterns(role);
      } else if (hash === '#/ehcp') {
        this.renderEHCP(role);
      } else if (hash === '#/support-tracker') {
        this.renderSupportTracker(role);
      } else if (hash === '#/child-app') {
        this.renderChildApp();
      } else if (hash === '#/journal') {
        this.renderJournal();
      } else if (hash === '#/mood') {
        this.renderMoodTracker();
      } else if (hash === '#/safeguarding') {
        this.renderSafeguarding();
      } else {
        this.renderDashboard(role);
      }
    } else {
      window.location.hash = '#/login';
    }
  },

  // ========== DATA HELPERS ==========
  getData(key) {
    const data = localStorage.getItem(`np_${key}`);
    return data ? JSON.parse(data) : null;
  },

  setData(key, value) {
    localStorage.setItem(`np_${key}`, JSON.stringify(value));
  },

  getChildrenForUser() {
    const children = this.getData('children') || [];
    if (this.currentUser.role === 'child') {
      return children.filter(c => c.id === this.currentUser.childId);
    }
    return children.filter(c => c.userId === this.currentUser.id);
  },

  generateId() {
    const bytes = new Uint8Array(8);
    window.crypto.getRandomValues(bytes);
    const randomPart = Array.from(bytes, b => b.toString(36).padStart(2, '0')).join('').slice(0, 9);
    return 'id_' + Date.now() + '_' + randomPart;
  },

  // ========== LOGIN PAGE ==========
  renderLogin() {
    const container = document.getElementById('app-container');
    container.innerHTML = `
      <div class="app-page login-page">
        <div class="app-card login-card">
          <img src="/assets/logo.jpg" alt="NeuroPathway" class="login-logo">
          <h1>Welcome to <span class="highlight">NeuroPathway</span></h1>
          <p class="login-subtitle">Choose your role to sign in</p>

          <div class="role-selector">
            <button class="role-btn" onclick="App.selectLoginRole('parent')">
              <span class="role-icon">&#128106;</span>
              <span class="role-label">Parent / Carer</span>
            </button>
            <button class="role-btn" onclick="App.selectLoginRole('teacher')">
              <span class="role-icon">&#128218;</span>
              <span class="role-label">Teacher / SENDCo</span>
            </button>
            <button class="role-btn" onclick="App.selectLoginRole('professional')">
              <span class="role-icon">&#127973;</span>
              <span class="role-label">Professional (NHS / LA)</span>
            </button>
            <button class="role-btn" onclick="App.selectLoginRole('child')">
              <span class="role-icon">&#11088;</span>
              <span class="role-label">Young Person</span>
            </button>
          </div>

          <div id="login-form" style="display:none">
            <h3 id="login-role-title"></h3>
            <form onsubmit="App.handleLogin(event)">
              <div class="form-group">
                <label for="login-email">Email</label>
                <input type="email" id="login-email" required placeholder="your@email.com">
              </div>
              <div class="form-group">
                <label for="login-password">Password</label>
                <input type="password" id="login-password" required placeholder="Your password">
              </div>
              <button type="submit" class="btn btn-primary btn-full">Sign In</button>
            </form>
            <p class="login-switch">Don't have an account? <a href="#/register">Register here</a></p>
          </div>

          <a href="#/" class="back-link">&larr; Back to homepage</a>
        </div>
      </div>
    `;
  },

  selectedRole: null,

  selectLoginRole(role) {
    this.selectedRole = role;
    document.getElementById('login-form').style.display = 'block';
    const titles = {
      parent: 'Parent / Carer Login',
      teacher: 'Teacher / SENDCo Login',
      professional: 'Professional Login',
      child: 'Young Person Login'
    };
    document.getElementById('login-role-title').textContent = titles[role];
    document.querySelectorAll('.role-btn').forEach(btn => btn.classList.remove('active'));
    event.currentTarget.classList.add('active');
  },

  handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const users = this.getData('users') || [];
    const user = users.find(u => u.email === email && u.role === this.selectedRole);

    if (user && user.password === btoa(password)) {
      this.saveUser(user);
      if (user.role === 'child') {
        window.location.hash = '#/child-app';
      } else {
        window.location.hash = '#/dashboard';
      }
    } else {
      alert('Invalid credentials or account not found. Please register first.');
    }
  },

  // ========== REGISTER PAGE ==========
  renderRegister() {
    const container = document.getElementById('app-container');
    container.innerHTML = `
      <div class="app-page login-page">
        <div class="app-card login-card">
          <img src="/assets/logo.jpg" alt="NeuroPathway" class="login-logo">
          <h1>Create Account</h1>

          <div class="role-selector">
            <button class="role-btn" onclick="App.selectRegRole('parent')">
              <span class="role-icon">&#128106;</span>
              <span class="role-label">Parent / Carer</span>
            </button>
            <button class="role-btn" onclick="App.selectRegRole('teacher')">
              <span class="role-icon">&#128218;</span>
              <span class="role-label">Teacher / SENDCo</span>
            </button>
            <button class="role-btn" onclick="App.selectRegRole('professional')">
              <span class="role-icon">&#127973;</span>
              <span class="role-label">Professional</span>
            </button>
            <button class="role-btn" onclick="App.selectRegRole('child')">
              <span class="role-icon">&#11088;</span>
              <span class="role-label">Young Person</span>
            </button>
          </div>

          <div id="register-form" style="display:none">
            <form onsubmit="App.handleRegister(event)">
              <div class="form-group">
                <label for="reg-name">Full Name</label>
                <input type="text" id="reg-name" required placeholder="Your full name">
              </div>
              <div class="form-group">
                <label for="reg-email">Email</label>
                <input type="email" id="reg-email" required placeholder="your@email.com">
              </div>
              <div class="form-group">
                <label for="reg-password">Password</label>
                <input type="password" id="reg-password" required minlength="6" placeholder="Min 6 characters">
              </div>
              <div id="child-name-field" style="display:none">
                <div class="form-group">
                  <label for="reg-child-name">Child's Name (you are supporting)</label>
                  <input type="text" id="reg-child-name" placeholder="Child's name">
                </div>
                <div class="form-group">
                  <label for="reg-child-age">Child's Age</label>
                  <input type="number" id="reg-child-age" min="4" max="18" placeholder="Age">
                </div>
              </div>
              <div id="child-own-fields" style="display:none">
                <div class="form-group">
                  <label for="reg-age">Your Age</label>
                  <input type="number" id="reg-age" min="8" max="17" placeholder="Your age">
                </div>
              </div>
              <button type="submit" class="btn btn-primary btn-full">Create Account</button>
            </form>
            <p class="login-switch">Already have an account? <a href="#/login">Sign in here</a></p>
          </div>

          <a href="#/" class="back-link">&larr; Back to homepage</a>
        </div>
      </div>
    `;
  },

  regRole: null,

  selectRegRole(role) {
    this.regRole = role;
    document.getElementById('register-form').style.display = 'block';
    document.getElementById('child-name-field').style.display =
      (role === 'parent' || role === 'teacher' || role === 'professional') ? 'block' : 'none';
    document.getElementById('child-own-fields').style.display =
      (role === 'child') ? 'block' : 'none';
    document.querySelectorAll('.role-btn').forEach(btn => btn.classList.remove('active'));
    event.currentTarget.classList.add('active');
  },

  handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const role = this.regRole;

    if (!role) {
      alert('Please select a role first.');
      return;
    }

    const users = this.getData('users') || [];
    if (users.find(u => u.email === email && u.role === role)) {
      alert('An account with this email and role already exists.');
      return;
    }

    const userId = this.generateId();
    const user = {
      id: userId,
      name,
      email,
      password: btoa(password),
      role,
      createdAt: new Date().toISOString()
    };

    // Handle child creation for parent/teacher/professional
    if (role !== 'child') {
      const childName = document.getElementById('reg-child-name').value;
      const childAge = document.getElementById('reg-child-age').value;
      if (childName) {
        const children = this.getData('children') || [];
        const childId = this.generateId();
        children.push({
          id: childId,
          name: childName,
          age: parseInt(childAge) || 10,
          userId: userId,
          createdAt: new Date().toISOString()
        });
        this.setData('children', children);
      }
    } else {
      const age = document.getElementById('reg-age').value;
      user.age = parseInt(age) || 10;
      const childId = this.generateId();
      user.childId = childId;
      const children = this.getData('children') || [];
      children.push({
        id: childId,
        name: name,
        age: user.age,
        userId: userId,
        isSelf: true,
        createdAt: new Date().toISOString()
      });
      this.setData('children', children);
    }

    users.push(user);
    this.setData('users', users);
    this.saveUser(user);

    if (role === 'child') {
      window.location.hash = '#/child-app';
    } else {
      window.location.hash = '#/dashboard';
    }
  },

  // ========== APP NAV BAR ==========
  getAppNav(activeItem) {
    const role = this.currentUser.role;
    const name = this.currentUser.name;
    const roleLabels = {
      parent: 'Parent / Carer',
      teacher: 'Teacher / SENDCo',
      professional: 'Professional',
      child: 'Young Person'
    };

    if (role === 'child') {
      return `
        <nav class="app-nav child-nav">
          <div class="app-nav-inner">
            <a href="#/child-app" class="app-nav-brand">
              <img src="/assets/logo.jpg" alt="NeuroPathway" class="app-nav-logo">
              <span>My Safe Space</span>
            </a>
            <div class="app-nav-links">
              <a href="#/child-app" class="${activeItem === 'home' ? 'active' : ''}">Home</a>
              <a href="#/mood" class="${activeItem === 'mood' ? 'active' : ''}">Mood</a>
              <a href="#/journal" class="${activeItem === 'journal' ? 'active' : ''}">Journal</a>
              <button onclick="App.logout()" class="app-nav-logout">Log Out</button>
            </div>
          </div>
        </nav>`;
    }

    return `
      <nav class="app-nav">
        <div class="app-nav-inner">
          <a href="#/dashboard" class="app-nav-brand">
            <img src="/assets/logo.jpg" alt="NeuroPathway" class="app-nav-logo">
            <span>NeuroPathway</span>
          </a>
          <div class="app-nav-links">
            <a href="#/dashboard" class="${activeItem === 'dashboard' ? 'active' : ''}">Dashboard</a>
            <a href="#/questionnaire" class="${activeItem === 'questionnaire' ? 'active' : ''}">Questionnaires</a>
            <a href="#/patterns" class="${activeItem === 'patterns' ? 'active' : ''}">AI Patterns</a>
            <a href="#/ehcp" class="${activeItem === 'ehcp' ? 'active' : ''}">EHCP Evidence</a>
            <a href="#/support-tracker" class="${activeItem === 'support' ? 'active' : ''}">Support Tracker</a>
            ${role === 'professional' ? `<a href="#/safeguarding" class="${activeItem === 'safeguarding' ? 'active' : ''}">Safeguarding</a>` : ''}
            <button onclick="App.logout()" class="app-nav-logout">Log Out</button>
          </div>
          <div class="app-nav-user">
            <span class="user-badge">${roleLabels[role]}</span>
            <span class="user-name">${name}</span>
          </div>
        </div>
      </nav>`;
  },

  // ========== DASHBOARD ==========
  renderDashboard(role) {
    const container = document.getElementById('app-container');
    const children = this.getChildrenForUser();
    const questionnaires = this.getData('questionnaires') || [];
    const userQ = questionnaires.filter(q => q.userId === this.currentUser.id);
    const support = this.getData('support_records') || [];
    const userSupport = support.filter(s => s.userId === this.currentUser.id);
    const ehcpEvidence = this.getData('ehcp_evidence') || [];
    const userEhcp = ehcpEvidence.filter(e => e.userId === this.currentUser.id);

    const totalQ = userQ.length;
    const helpedCount = userSupport.filter(s => s.outcome === 'helped').length;
    const didntHelpCount = userSupport.filter(s => s.outcome === 'didnt_help').length;

    const roleGreetings = {
      parent: 'Parent & Carer Dashboard',
      teacher: 'Teacher & SENDCo Dashboard',
      professional: 'Professional Dashboard'
    };

    container.innerHTML = `
      ${this.getAppNav('dashboard')}
      <div class="app-page dashboard-page">
        <div class="container">
          <h1>${roleGreetings[role] || 'Dashboard'}</h1>
          <p class="dash-welcome">Welcome back, ${this.currentUser.name}. Here's your overview.</p>

          <div class="dash-stats">
            <div class="dash-stat-card">
              <div class="dash-stat-number">${children.length}</div>
              <div class="dash-stat-label">Children</div>
            </div>
            <div class="dash-stat-card">
              <div class="dash-stat-number">${totalQ}</div>
              <div class="dash-stat-label">Questionnaires</div>
            </div>
            <div class="dash-stat-card">
              <div class="dash-stat-number">${userEhcp.length}</div>
              <div class="dash-stat-label">EHCP Evidence</div>
            </div>
            <div class="dash-stat-card accent">
              <div class="dash-stat-number">${helpedCount}</div>
              <div class="dash-stat-label">Support Helped</div>
            </div>
            <div class="dash-stat-card warn">
              <div class="dash-stat-number">${didntHelpCount}</div>
              <div class="dash-stat-label">Didn't Work</div>
            </div>
          </div>

          <div class="dash-grid">
            <div class="dash-section">
              <h2>Children You Support</h2>
              ${children.length === 0 ? '<p class="empty-state">No children added yet. Complete a questionnaire to get started.</p>' : ''}
              <div class="children-list">
                ${children.map(child => `
                  <div class="child-card">
                    <div class="child-avatar">${child.name.charAt(0).toUpperCase()}</div>
                    <div class="child-info">
                      <h3>${child.name}</h3>
                      <p>Age: ${child.age}</p>
                      <p class="child-risk">${this.calculateRiskLevel(child.id)}</p>
                    </div>
                  </div>
                `).join('')}
              </div>
              <button onclick="App.showAddChildModal()" class="btn btn-outline btn-sm">+ Add Child</button>
            </div>

            <div class="dash-section">
              <h2>Quick Actions</h2>
              <div class="quick-actions">
                <a href="#/questionnaire" class="action-card">
                  <span class="action-icon">&#128221;</span>
                  <span>Daily Questionnaire</span>
                </a>
                <a href="#/patterns" class="action-card">
                  <span class="action-icon">&#129504;</span>
                  <span>AI Pattern Analysis</span>
                </a>
                <a href="#/ehcp" class="action-card">
                  <span class="action-icon">&#128196;</span>
                  <span>EHCP Evidence</span>
                </a>
                <a href="#/support-tracker" class="action-card">
                  <span class="action-icon">&#128200;</span>
                  <span>Support Tracker</span>
                </a>
              </div>
            </div>

            <div class="dash-section">
              <h2>Recent Activity</h2>
              <div class="activity-list">
                ${this.getRecentActivity().map(a => `
                  <div class="activity-item">
                    <span class="activity-icon">${a.icon}</span>
                    <span class="activity-text">${a.text}</span>
                    <span class="activity-time">${a.time}</span>
                  </div>
                `).join('') || '<p class="empty-state">No recent activity yet.</p>'}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  calculateRiskLevel(childId) {
    const questionnaires = this.getData('questionnaires') || [];
    const childQ = questionnaires.filter(q => q.childId === childId);
    if (childQ.length === 0) return '<span class="risk-badge low">No data yet</span>';

    const recent = childQ.slice(-5);
    const avgScore = recent.reduce((sum, q) => sum + (q.totalScore || 0), 0) / recent.length;

    if (avgScore >= 7) return '<span class="risk-badge high">High Concern</span>';
    if (avgScore >= 4) return '<span class="risk-badge medium">Medium Concern</span>';
    return '<span class="risk-badge low">Low Concern</span>';
  },

  getRecentActivity() {
    const activities = [];
    const questionnaires = this.getData('questionnaires') || [];
    const support = this.getData('support_records') || [];
    const ehcp = this.getData('ehcp_evidence') || [];

    const myQ = questionnaires.filter(q => q.userId === this.currentUser.id).slice(-3);
    const myS = support.filter(s => s.userId === this.currentUser.id).slice(-3);
    const myE = ehcp.filter(e => e.userId === this.currentUser.id).slice(-3);

    myQ.forEach(q => activities.push({
      icon: '&#128221;',
      text: `Completed questionnaire for ${q.childName || 'child'}`,
      time: this.timeAgo(q.date),
      date: q.date
    }));

    myS.forEach(s => activities.push({
      icon: s.outcome === 'helped' ? '&#9989;' : '&#10060;',
      text: `${s.strategy} — ${s.outcome === 'helped' ? 'Helped' : "Didn't work"}`,
      time: this.timeAgo(s.date),
      date: s.date
    }));

    myE.forEach(e => activities.push({
      icon: '&#128196;',
      text: `EHCP evidence: ${e.category}`,
      time: this.timeAgo(e.date),
      date: e.date
    }));

    return activities.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8);
  },

  timeAgo(dateStr) {
    const now = new Date();
    const date = new Date(dateStr);
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    return Math.floor(diff / 86400) + 'd ago';
  },

  showAddChildModal() {
    const name = prompt("Child's name:");
    if (!name) return;
    const age = prompt("Child's age:");
    if (!age) return;

    const children = this.getData('children') || [];
    children.push({
      id: this.generateId(),
      name: name,
      age: parseInt(age) || 10,
      userId: this.currentUser.id,
      createdAt: new Date().toISOString()
    });
    this.setData('children', children);
    this.renderDashboard(this.currentUser.role);
  },

  // ========== DAILY QUESTIONNAIRES ==========
  renderQuestionnaire(role) {
    const container = document.getElementById('app-container');
    const children = this.getChildrenForUser();
    const questionnaires = this.getData('questionnaires') || [];
    const myQ = questionnaires.filter(q => q.userId === this.currentUser.id);

    const roleQuestions = this.getQuestionsForRole(role);

    container.innerHTML = `
      ${this.getAppNav('questionnaire')}
      <div class="app-page">
        <div class="container">
          <h1>Daily Questionnaire</h1>
          <p class="page-desc">Complete this daily to track patterns and build evidence over time. Your observations are vital for early identification.</p>

          <div class="questionnaire-layout">
            <div class="q-form-section">
              <form onsubmit="App.submitQuestionnaire(event)" id="q-form">
                <div class="form-group">
                  <label for="q-child">Select Child</label>
                  <select id="q-child" required>
                    <option value="">Choose a child...</option>
                    ${children.map(c => `<option value="${c.id}" data-name="${c.name}">${c.name} (age ${c.age})</option>`).join('')}
                  </select>
                </div>

                <div class="form-group">
                  <label for="q-date">Date</label>
                  <input type="date" id="q-date" value="${new Date().toISOString().split('T')[0]}" required>
                </div>

                ${roleQuestions.map((q, i) => `
                  <div class="q-question">
                    <label>${q.text}</label>
                    ${q.type === 'scale' ? `
                      <div class="scale-input">
                        <span>Not at all</span>
                        <div class="scale-options">
                          ${[0,1,2,3,4,5].map(v => `
                            <label class="scale-option">
                              <input type="radio" name="q${i}" value="${v}" required>
                              <span>${v}</span>
                            </label>
                          `).join('')}
                        </div>
                        <span>Very much</span>
                      </div>
                    ` : q.type === 'select' ? `
                      <select name="q${i}" required>
                        <option value="">Select...</option>
                        ${q.options.map(o => `<option value="${o}">${o}</option>`).join('')}
                      </select>
                    ` : `
                      <textarea name="q${i}" rows="2" placeholder="${q.placeholder || 'Describe...'}" required></textarea>
                    `}
                  </div>
                `).join('')}

                <div class="q-question">
                  <label>Additional Notes / Observations</label>
                  <textarea id="q-notes" rows="3" placeholder="Any additional observations today..."></textarea>
                </div>

                <button type="submit" class="btn btn-primary btn-full">Submit Questionnaire</button>
              </form>
            </div>

            <div class="q-history-section">
              <h2>Recent Submissions</h2>
              <div class="q-history-list">
                ${myQ.length === 0 ? '<p class="empty-state">No questionnaires submitted yet.</p>' : ''}
                ${myQ.slice(-10).reverse().map(q => `
                  <div class="q-history-item">
                    <div class="q-history-header">
                      <strong>${q.childName || 'Child'}</strong>
                      <span class="q-history-date">${new Date(q.date).toLocaleDateString()}</span>
                    </div>
                    <div class="q-history-score">Score: ${q.totalScore}/30 ${q.totalScore >= 20 ? '<span class="risk-badge high">High</span>' : q.totalScore >= 12 ? '<span class="risk-badge medium">Medium</span>' : '<span class="risk-badge low">Low</span>'}</div>
                    ${q.notes ? `<p class="q-history-notes">${q.notes}</p>` : ''}
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  getQuestionsForRole(role) {
    const common = [
      { text: "How was the child's emotional regulation today?", type: 'scale' },
      { text: "Did the child show signs of anxiety or distress?", type: 'scale' },
      { text: "How was their social interaction with peers?", type: 'scale' },
      { text: "Were there any sensory sensitivities observed?", type: 'scale' },
      { text: "How was their focus and attention?", type: 'scale' },
    ];

    const roleSpecific = {
      parent: [
        { text: "How was their sleep last night?", type: 'select', options: ['Very good', 'Good', 'Okay', 'Poor', 'Very poor'] },
        { text: "Any changes in eating habits?", type: 'select', options: ['Normal', 'Ate less', 'Ate more', 'Refused food', 'Very picky'] },
        { text: "Describe any meltdowns or shutdowns today", type: 'text', placeholder: 'Describe what happened, triggers, duration...' },
      ],
      teacher: [
        { text: "How did they cope with transitions between activities?", type: 'scale' },
        { text: "Were there any behaviour incidents in class?", type: 'select', options: ['None', 'Minor disruption', 'Left seat frequently', 'Verbal outburst', 'Physical incident', 'Refusal to participate'] },
        { text: "Describe the learning environment response today", type: 'text', placeholder: 'Noise tolerance, group work, independent task engagement...' },
      ],
      professional: [
        { text: "Risk level assessment for this session", type: 'select', options: ['Low risk', 'Medium risk', 'High risk', 'Immediate concern'] },
        { text: "Were safeguarding indicators present?", type: 'select', options: ['No concerns', 'Minor indicators', 'Moderate concern', 'Significant concern', 'Immediate action needed'] },
        { text: "Clinical/professional observations", type: 'text', placeholder: 'Professional assessment notes...' },
      ]
    };

    return [...common, ...(roleSpecific[role] || [])];
  },

  submitQuestionnaire(e) {
    e.preventDefault();
    const form = document.getElementById('q-form');
    const childSelect = document.getElementById('q-child');
    const childId = childSelect.value;
    const childName = childSelect.options[childSelect.selectedIndex].dataset.name;
    const date = document.getElementById('q-date').value;
    const notes = document.getElementById('q-notes').value;

    const questions = this.getQuestionsForRole(this.currentUser.role);
    const answers = [];
    let totalScore = 0;

    questions.forEach((q, i) => {
      const input = form.querySelector(`[name="q${i}"]`);
      let value;
      if (q.type === 'scale') {
        const checked = form.querySelector(`[name="q${i}"]:checked`);
        value = checked ? parseInt(checked.value) : 0;
        totalScore += value;
      } else if (q.type === 'select') {
        value = input ? input.value : '';
      } else {
        value = input ? input.value : '';
      }
      answers.push({ question: q.text, value, type: q.type });
    });

    const questionnaires = this.getData('questionnaires') || [];
    questionnaires.push({
      id: this.generateId(),
      userId: this.currentUser.id,
      childId,
      childName,
      date,
      answers,
      totalScore,
      notes,
      role: this.currentUser.role,
      createdAt: new Date().toISOString()
    });
    this.setData('questionnaires', questionnaires);

    // Run AI pattern check
    this.runPatternAnalysis(childId);

    alert('Questionnaire submitted successfully!');
    this.renderQuestionnaire(this.currentUser.role);
  },

  // ========== AI PATTERN RECOGNITION ==========
  renderPatterns(role) {
    const container = document.getElementById('app-container');
    const children = this.getChildrenForUser();

    container.innerHTML = `
      ${this.getAppNav('patterns')}
      <div class="app-page">
        <div class="container">
          <h1>AI Pattern Recognition</h1>
          <p class="page-desc">AI-powered analysis of questionnaire data to identify neurodivergent behaviours, traits, and emerging patterns.</p>

          <div class="form-group">
            <label for="pattern-child">Select Child</label>
            <select id="pattern-child" onchange="App.showPatternAnalysis(this.value)">
              <option value="">Choose a child to analyse...</option>
              ${children.map(c => `<option value="${c.id}">${c.name} (age ${c.age})</option>`).join('')}
            </select>
          </div>

          <div id="pattern-results"></div>
        </div>
      </div>
    `;
  },

  runPatternAnalysis(childId) {
    const questionnaires = this.getData('questionnaires') || [];
    const childQ = questionnaires.filter(q => q.childId === childId);
    if (childQ.length < 1) return;

    const patterns = this.getData('patterns') || {};
    const analysis = this.analysePatterns(childQ);
    patterns[childId] = {
      ...analysis,
      lastUpdated: new Date().toISOString(),
      dataPoints: childQ.length
    };
    this.setData('patterns', patterns);
  },

  analysePatterns(entries) {
    const traits = {
      emotional_regulation: { scores: [], label: 'Emotional Regulation Difficulties', category: 'emotional' },
      anxiety: { scores: [], label: 'Anxiety / Distress Indicators', category: 'emotional' },
      social_interaction: { scores: [], label: 'Social Interaction Challenges', category: 'social' },
      sensory: { scores: [], label: 'Sensory Processing Differences', category: 'sensory' },
      attention: { scores: [], label: 'Attention / Focus Difficulties', category: 'cognitive' }
    };

    const ndIndicators = {
      autism_traits: 0,
      adhd_traits: 0,
      anxiety_traits: 0,
      sensory_processing: 0,
      pda_traits: 0
    };

    entries.forEach(entry => {
      if (entry.answers && entry.answers.length >= 5) {
        traits.emotional_regulation.scores.push(entry.answers[0]?.value || 0);
        traits.anxiety.scores.push(entry.answers[1]?.value || 0);
        traits.social_interaction.scores.push(entry.answers[2]?.value || 0);
        traits.sensory.scores.push(entry.answers[3]?.value || 0);
        traits.attention.scores.push(entry.answers[4]?.value || 0);
      }
    });

    // Calculate averages and detect patterns
    const results = {};
    Object.keys(traits).forEach(key => {
      const scores = traits[key].scores;
      if (scores.length === 0) return;
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      const trend = scores.length >= 3 ?
        (scores.slice(-3).reduce((a, b) => a + b, 0) / 3 > avg ? 'increasing' : 'stable') : 'insufficient_data';

      results[key] = {
        label: traits[key].label,
        category: traits[key].category,
        average: Math.round(avg * 10) / 10,
        trend,
        concern: avg >= 3.5 ? 'high' : avg >= 2 ? 'medium' : 'low',
        dataPoints: scores.length
      };
    });

    // Detect neurodivergent trait patterns
    const avgScores = {};
    Object.keys(results).forEach(k => { avgScores[k] = results[k].average; });

    if ((avgScores.social_interaction || 0) >= 3 && (avgScores.sensory || 0) >= 3) {
      ndIndicators.autism_traits = Math.min(((avgScores.social_interaction + avgScores.sensory) / 10) * 100, 95);
    }
    if ((avgScores.attention || 0) >= 3 && (avgScores.emotional_regulation || 0) >= 3) {
      ndIndicators.adhd_traits = Math.min(((avgScores.attention + avgScores.emotional_regulation) / 10) * 100, 95);
    }
    if ((avgScores.anxiety || 0) >= 3) {
      ndIndicators.anxiety_traits = Math.min((avgScores.anxiety / 5) * 100, 95);
    }
    if ((avgScores.sensory || 0) >= 3) {
      ndIndicators.sensory_processing = Math.min((avgScores.sensory / 5) * 100, 95);
    }
    if ((avgScores.emotional_regulation || 0) >= 4 && (avgScores.anxiety || 0) >= 3) {
      ndIndicators.pda_traits = Math.min(((avgScores.emotional_regulation + avgScores.anxiety) / 10) * 100, 85);
    }

    return { traits: results, ndIndicators, totalEntries: entries.length };
  },

  showPatternAnalysis(childId) {
    const resultsDiv = document.getElementById('pattern-results');
    if (!childId) {
      resultsDiv.innerHTML = '';
      return;
    }

    this.runPatternAnalysis(childId);
    const patterns = this.getData('patterns') || {};
    const analysis = patterns[childId];

    if (!analysis || analysis.dataPoints === 0) {
      resultsDiv.innerHTML = '<div class="app-card"><p class="empty-state">No data available yet. Complete daily questionnaires to build pattern data.</p></div>';
      return;
    }

    const traitHTML = Object.values(analysis.traits).map(t => `
      <div class="pattern-trait">
        <div class="trait-header">
          <span class="trait-label">${t.label}</span>
          <span class="risk-badge ${t.concern}">${t.concern} concern</span>
        </div>
        <div class="trait-bar">
          <div class="trait-bar-fill ${t.concern}" style="width: ${(t.average / 5) * 100}%"></div>
        </div>
        <div class="trait-meta">
          <span>Average: ${t.average}/5</span>
          <span>Trend: ${t.trend === 'increasing' ? '&#8593; Increasing' : t.trend === 'stable' ? '&#8596; Stable' : 'Building data...'}</span>
          <span>${t.dataPoints} data points</span>
        </div>
      </div>
    `).join('');

    const ndHTML = Object.entries(analysis.ndIndicators)
      .filter(([, v]) => v > 0)
      .sort(([, a], [, b]) => b - a)
      .map(([key, value]) => {
        const labels = {
          autism_traits: 'Autism Spectrum Indicators',
          adhd_traits: 'ADHD Indicators',
          anxiety_traits: 'Anxiety Indicators',
          sensory_processing: 'Sensory Processing Differences',
          pda_traits: 'PDA (Pathological Demand Avoidance) Indicators'
        };
        const concern = value >= 60 ? 'high' : value >= 30 ? 'medium' : 'low';
        return `
          <div class="nd-indicator">
            <div class="nd-header">
              <span class="nd-label">${labels[key]}</span>
              <span class="nd-value">${Math.round(value)}%</span>
            </div>
            <div class="trait-bar">
              <div class="trait-bar-fill ${concern}" style="width: ${value}%"></div>
            </div>
          </div>
        `;
      }).join('');

    resultsDiv.innerHTML = `
      <div class="app-card">
        <h2>Behaviour Pattern Analysis</h2>
        <p class="pattern-disclaimer">This AI analysis identifies patterns from questionnaire data to support professional assessment. It is not a diagnostic tool.</p>
        <div class="patterns-list">${traitHTML}</div>
      </div>
      ${ndHTML ? `
        <div class="app-card">
          <h2>Neurodivergent Trait Indicators</h2>
          <p class="pattern-disclaimer">Pattern-based indicators calculated from repeated observations. Always consult qualified professionals for formal assessment.</p>
          <div class="nd-indicators">${ndHTML}</div>
        </div>
      ` : ''}
      <div class="app-card">
        <h2>Recommendations</h2>
        <div class="recommendations">${this.getRecommendations(analysis)}</div>
      </div>
    `;
  },

  getRecommendations(analysis) {
    const recs = [];
    const traits = analysis.traits;

    if (traits.emotional_regulation && traits.emotional_regulation.concern !== 'low') {
      recs.push({ icon: '&#128150;', text: 'Consider implementing emotional regulation strategies such as visual emotion cards, calm-down zones, and co-regulation techniques.' });
    }
    if (traits.anxiety && traits.anxiety.concern !== 'low') {
      recs.push({ icon: '&#127793;', text: 'Anxiety indicators suggest exploring structured routines, transition warnings, and anxiety management resources.' });
    }
    if (traits.social_interaction && traits.social_interaction.concern !== 'low') {
      recs.push({ icon: '&#129309;', text: 'Social interaction patterns may benefit from social stories, structured play opportunities, and peer buddy systems.' });
    }
    if (traits.sensory && traits.sensory.concern !== 'low') {
      recs.push({ icon: '&#127912;', text: 'Sensory differences detected. Consider sensory audit of learning/home environment, sensory breaks, and occupational therapy referral.' });
    }
    if (traits.attention && traits.attention.concern !== 'low') {
      recs.push({ icon: '&#127919;', text: 'Attention difficulties noted. Visual timetables, chunked tasks, movement breaks, and reduced distractions may help.' });
    }

    if (recs.length === 0) {
      recs.push({ icon: '&#9989;', text: 'Current patterns show low concern levels. Continue regular monitoring and questionnaire completion.' });
    }

    return recs.map(r => `
      <div class="rec-item">
        <span class="rec-icon">${r.icon}</span>
        <span class="rec-text">${r.text}</span>
      </div>
    `).join('');
  },

  // ========== EHCP EVIDENCE COLLECTOR ==========
  renderEHCP(role) {
    const container = document.getElementById('app-container');
    const children = this.getChildrenForUser();
    const evidence = this.getData('ehcp_evidence') || [];
    const myEvidence = evidence.filter(e => e.userId === this.currentUser.id);

    const categories = [
      'Communication & Interaction',
      'Cognition & Learning',
      'Social, Emotional & Mental Health',
      'Sensory &/or Physical Needs',
      'Independence & Self-Care',
      'Behaviour Observations',
      'Professional Assessments',
      'Parent/Carer Observations',
      'Medical Information',
      'Educational Progress'
    ];

    container.innerHTML = `
      ${this.getAppNav('ehcp')}
      <div class="app-page">
        <div class="container">
          <h1>EHCP-Ready Evidence Collector</h1>
          <p class="page-desc">Collect, organise, and generate evidence for Education, Health and Care Plan applications. All evidence is categorised to match EHCP assessment requirements.</p>

          <div class="ehcp-layout">
            <div class="ehcp-form-section">
              <div class="app-card">
                <h2>Add Evidence</h2>
                <form onsubmit="App.submitEHCP(event)">
                  <div class="form-group">
                    <label for="ehcp-child">Child</label>
                    <select id="ehcp-child" required>
                      <option value="">Select child...</option>
                      ${children.map(c => `<option value="${c.id}" data-name="${c.name}">${c.name}</option>`).join('')}
                    </select>
                  </div>
                  <div class="form-group">
                    <label for="ehcp-category">Evidence Category</label>
                    <select id="ehcp-category" required>
                      <option value="">Select category...</option>
                      ${categories.map(c => `<option value="${c}">${c}</option>`).join('')}
                    </select>
                  </div>
                  <div class="form-group">
                    <label for="ehcp-title">Evidence Title</label>
                    <input type="text" id="ehcp-title" required placeholder="Brief title for this evidence">
                  </div>
                  <div class="form-group">
                    <label for="ehcp-detail">Detailed Description</label>
                    <textarea id="ehcp-detail" rows="5" required placeholder="Describe the evidence in detail. Include dates, observations, impacts on learning/wellbeing, and any professional input..."></textarea>
                  </div>
                  <div class="form-group">
                    <label for="ehcp-impact">Impact on Child</label>
                    <select id="ehcp-impact" required>
                      <option value="">How significant is the impact?</option>
                      <option value="low">Low — minimal impact on daily function</option>
                      <option value="medium">Medium — noticeable impact on some areas</option>
                      <option value="high">High — significant impact on daily function</option>
                      <option value="severe">Severe — prevents engagement without support</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label for="ehcp-date">Date of Observation</label>
                    <input type="date" id="ehcp-date" value="${new Date().toISOString().split('T')[0]}" required>
                  </div>
                  <button type="submit" class="btn btn-primary btn-full">Save Evidence</button>
                </form>
              </div>
            </div>

            <div class="ehcp-evidence-section">
              <div class="app-card">
                <h2>Collected Evidence</h2>
                <button onclick="App.generateEHCPReport()" class="btn btn-outline btn-sm" style="margin-bottom:16px">Generate EHCP Report</button>
                ${myEvidence.length === 0 ? '<p class="empty-state">No evidence collected yet. Start adding evidence to build your EHCP application.</p>' : ''}
                ${categories.map(cat => {
                  const catEvidence = myEvidence.filter(e => e.category === cat);
                  if (catEvidence.length === 0) return '';
                  return `
                    <div class="ehcp-category-group">
                      <h3>${cat} <span class="count-badge">${catEvidence.length}</span></h3>
                      ${catEvidence.map(e => `
                        <div class="ehcp-evidence-item impact-${e.impact}">
                          <div class="ehcp-ev-header">
                            <strong>${e.title}</strong>
                            <span class="ehcp-ev-date">${new Date(e.date).toLocaleDateString()}</span>
                          </div>
                          <p>${e.detail}</p>
                          <span class="impact-badge ${e.impact}">${e.impact} impact</span>
                        </div>
                      `).join('')}
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  submitEHCP(e) {
    e.preventDefault();
    const childSelect = document.getElementById('ehcp-child');
    const evidence = this.getData('ehcp_evidence') || [];
    evidence.push({
      id: this.generateId(),
      userId: this.currentUser.id,
      childId: childSelect.value,
      childName: childSelect.options[childSelect.selectedIndex].dataset.name,
      category: document.getElementById('ehcp-category').value,
      title: document.getElementById('ehcp-title').value,
      detail: document.getElementById('ehcp-detail').value,
      impact: document.getElementById('ehcp-impact').value,
      date: document.getElementById('ehcp-date').value,
      createdAt: new Date().toISOString()
    });
    this.setData('ehcp_evidence', evidence);
    alert('Evidence saved successfully!');
    this.renderEHCP(this.currentUser.role);
  },

  generateEHCPReport() {
    const evidence = this.getData('ehcp_evidence') || [];
    const myEvidence = evidence.filter(e => e.userId === this.currentUser.id);
    if (myEvidence.length === 0) {
      alert('No evidence collected yet. Add evidence items first.');
      return;
    }

    const children = this.getChildrenForUser();
    let report = '=== EHCP EVIDENCE REPORT ===\n';
    report += `Generated: ${new Date().toLocaleDateString()}\n`;
    report += `Prepared by: ${this.currentUser.name} (${this.currentUser.role})\n\n`;

    children.forEach(child => {
      const childEvidence = myEvidence.filter(e => e.childId === child.id);
      if (childEvidence.length === 0) return;

      report += `--- Child: ${child.name} (Age: ${child.age}) ---\n\n`;

      const categories = [...new Set(childEvidence.map(e => e.category))];
      categories.forEach(cat => {
        report += `[${cat}]\n`;
        childEvidence.filter(e => e.category === cat).forEach(e => {
          report += `  * ${e.title} (${e.date}) - Impact: ${e.impact}\n`;
          report += `    ${e.detail}\n\n`;
        });
      });
      report += '\n';
    });

    // Download as text file
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `EHCP_Evidence_Report_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  },

  // ========== SUPPORT TRACKER ==========
  renderSupportTracker(role) {
    const container = document.getElementById('app-container');
    const children = this.getChildrenForUser();
    const records = this.getData('support_records') || [];
    const myRecords = records.filter(r => r.userId === this.currentUser.id);

    const strategyCategories = {
      'Emotional Regulation': ['Calm-down zone', 'Visual emotion cards', 'Deep breathing exercises', 'Co-regulation with adult', 'Fidget tools', 'Weighted blanket/vest', 'Timer for transitions'],
      'Learning Support': ['Visual timetable', 'Chunked instructions', 'Movement breaks', 'Reduced worksheet content', 'Extra processing time', 'Pre-teaching vocabulary', 'Quiet workstation'],
      'Social Support': ['Social stories', 'Peer buddy system', 'Structured play', 'Small group activities', 'Adult-led interaction support', 'Communication aids'],
      'Sensory Support': ['Sensory breaks', 'Noise-cancelling headphones', 'Reduced visual clutter', 'Seating adjustments', 'Sensory diet activities', 'Modified PE activities'],
      'Behaviour Support': ['Positive reinforcement', 'First-then board', 'Choice boards', 'Clear boundaries with visuals', 'Restorative conversations', 'Behaviour reward chart'],
    };

    container.innerHTML = `
      ${this.getAppNav('support')}
      <div class="app-page">
        <div class="container">
          <h1>Support Tracker</h1>
          <p class="page-desc">Track what support strategies have helped and what didn't work. This builds a clear picture for EHCP applications and ongoing support planning.</p>

          <div class="support-layout">
            <div class="support-form-section">
              <div class="app-card">
                <h2>Record Support Strategy</h2>
                <form onsubmit="App.submitSupport(event)">
                  <div class="form-group">
                    <label for="sup-child">Child</label>
                    <select id="sup-child" required>
                      <option value="">Select child...</option>
                      ${children.map(c => `<option value="${c.id}" data-name="${c.name}">${c.name}</option>`).join('')}
                    </select>
                  </div>
                  <div class="form-group">
                    <label for="sup-category">Support Category</label>
                    <select id="sup-category" required onchange="App.updateStrategyOptions()">
                      <option value="">Select category...</option>
                      ${Object.keys(strategyCategories).map(c => `<option value="${c}">${c}</option>`).join('')}
                    </select>
                  </div>
                  <div class="form-group">
                    <label for="sup-strategy">Strategy Used</label>
                    <select id="sup-strategy" required>
                      <option value="">Select or type strategy...</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label for="sup-custom">Or describe a custom strategy</label>
                    <input type="text" id="sup-custom" placeholder="Custom strategy name...">
                  </div>
                  <div class="form-group">
                    <label>Did it help?</label>
                    <div class="outcome-selector">
                      <label class="outcome-option helped">
                        <input type="radio" name="outcome" value="helped" required>
                        <span>&#9989; Helped</span>
                      </label>
                      <label class="outcome-option partial">
                        <input type="radio" name="outcome" value="partial">
                        <span>&#128310; Partially</span>
                      </label>
                      <label class="outcome-option didnt_help">
                        <input type="radio" name="outcome" value="didnt_help">
                        <span>&#10060; Didn't Work</span>
                      </label>
                    </div>
                  </div>
                  <div class="form-group">
                    <label for="sup-notes">Notes</label>
                    <textarea id="sup-notes" rows="3" placeholder="How did the child respond? Any observations..."></textarea>
                  </div>
                  <div class="form-group">
                    <label for="sup-date">Date</label>
                    <input type="date" id="sup-date" value="${new Date().toISOString().split('T')[0]}" required>
                  </div>
                  <button type="submit" class="btn btn-primary btn-full">Record Strategy</button>
                </form>
              </div>
            </div>

            <div class="support-history-section">
              <div class="app-card">
                <h2>Support History</h2>
                <div class="support-summary">
                  <div class="support-sum-item helped">
                    <strong>${myRecords.filter(r => r.outcome === 'helped').length}</strong>
                    <span>Helped</span>
                  </div>
                  <div class="support-sum-item partial">
                    <strong>${myRecords.filter(r => r.outcome === 'partial').length}</strong>
                    <span>Partial</span>
                  </div>
                  <div class="support-sum-item didnt_help">
                    <strong>${myRecords.filter(r => r.outcome === 'didnt_help').length}</strong>
                    <span>Didn't Work</span>
                  </div>
                </div>

                ${myRecords.length === 0 ? '<p class="empty-state">No support records yet.</p>' : ''}
                <div class="support-records">
                  ${myRecords.slice().reverse().map(r => `
                    <div class="support-record ${r.outcome}">
                      <div class="support-rec-header">
                        <strong>${r.strategy}</strong>
                        <span class="support-rec-date">${new Date(r.date).toLocaleDateString()}</span>
                      </div>
                      <div class="support-rec-meta">
                        <span>Child: ${r.childName}</span>
                        <span>Category: ${r.category}</span>
                        <span class="outcome-badge ${r.outcome}">${r.outcome === 'helped' ? 'Helped' : r.outcome === 'partial' ? 'Partial' : "Didn't Work"}</span>
                      </div>
                      ${r.notes ? `<p class="support-rec-notes">${r.notes}</p>` : ''}
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  updateStrategyOptions() {
    const category = document.getElementById('sup-category').value;
    const stratSelect = document.getElementById('sup-strategy');
    const strategies = {
      'Emotional Regulation': ['Calm-down zone', 'Visual emotion cards', 'Deep breathing exercises', 'Co-regulation with adult', 'Fidget tools', 'Weighted blanket/vest', 'Timer for transitions'],
      'Learning Support': ['Visual timetable', 'Chunked instructions', 'Movement breaks', 'Reduced worksheet content', 'Extra processing time', 'Pre-teaching vocabulary', 'Quiet workstation'],
      'Social Support': ['Social stories', 'Peer buddy system', 'Structured play', 'Small group activities', 'Adult-led interaction support', 'Communication aids'],
      'Sensory Support': ['Sensory breaks', 'Noise-cancelling headphones', 'Reduced visual clutter', 'Seating adjustments', 'Sensory diet activities', 'Modified PE activities'],
      'Behaviour Support': ['Positive reinforcement', 'First-then board', 'Choice boards', 'Clear boundaries with visuals', 'Restorative conversations', 'Behaviour reward chart'],
    };

    const opts = strategies[category] || [];
    stratSelect.innerHTML = '<option value="">Select strategy...</option>' +
      opts.map(s => `<option value="${s}">${s}</option>`).join('');
  },

  submitSupport(e) {
    e.preventDefault();
    const childSelect = document.getElementById('sup-child');
    const custom = document.getElementById('sup-custom').value;
    const strategy = custom || document.getElementById('sup-strategy').value;
    const outcome = document.querySelector('[name="outcome"]:checked');

    if (!strategy) {
      alert('Please select or enter a strategy.');
      return;
    }

    const records = this.getData('support_records') || [];
    records.push({
      id: this.generateId(),
      userId: this.currentUser.id,
      childId: childSelect.value,
      childName: childSelect.options[childSelect.selectedIndex].dataset.name,
      category: document.getElementById('sup-category').value,
      strategy,
      outcome: outcome.value,
      notes: document.getElementById('sup-notes').value,
      date: document.getElementById('sup-date').value,
      createdAt: new Date().toISOString()
    });
    this.setData('support_records', records);
    alert('Support record saved!');
    this.renderSupportTracker(this.currentUser.role);
  },

  // ========== CHILDREN'S INTEGRATED APP ==========
  renderChildApp() {
    const container = document.getElementById('app-container');
    const moods = this.getData('moods') || [];
    const myMoods = moods.filter(m => m.userId === this.currentUser.id);
    const todayMood = myMoods.find(m => m.date === new Date().toISOString().split('T')[0]);
    const journals = this.getData('journals') || [];
    const myJournals = journals.filter(j => j.userId === this.currentUser.id);

    const moodStreak = this.calculateMoodStreak();

    container.innerHTML = `
      ${this.getAppNav('home')}
      <div class="app-page child-app-page">
        <div class="container">
          <div class="child-welcome">
            <h1>Hey ${this.currentUser.name}! &#128075;</h1>
            <p class="child-subtitle">Welcome to your safe space. This is YOUR place to express yourself.</p>
          </div>

          <div class="child-dashboard">
            <div class="child-mood-check">
              <h2>How are you feeling right now?</h2>
              ${todayMood ? `
                <div class="today-mood">
                  <span class="mood-emoji-large">${todayMood.emoji}</span>
                  <p>You said you're feeling <strong>${todayMood.label}</strong> today</p>
                  <a href="#/mood" class="btn btn-outline btn-sm">Update mood</a>
                </div>
              ` : `
                <div class="mood-quick-select">
                  ${this.getMoodEmojis().map(m => `
                    <button class="mood-quick-btn" onclick="App.quickMood('${m.emoji}', '${m.label}')">
                      <span class="mood-emoji">${m.emoji}</span>
                      <span class="mood-label">${m.label}</span>
                    </button>
                  `).join('')}
                </div>
              `}
            </div>

            <div class="child-stats-row">
              <div class="child-stat">
                <span class="child-stat-icon">&#128293;</span>
                <span class="child-stat-num">${moodStreak}</span>
                <span class="child-stat-label">Day streak</span>
              </div>
              <div class="child-stat">
                <span class="child-stat-icon">&#128214;</span>
                <span class="child-stat-num">${myJournals.length}</span>
                <span class="child-stat-label">Journal entries</span>
              </div>
              <div class="child-stat">
                <span class="child-stat-icon">&#127775;</span>
                <span class="child-stat-num">${myMoods.length}</span>
                <span class="child-stat-label">Mood check-ins</span>
              </div>
            </div>

            <div class="child-actions-grid">
              <a href="#/mood" class="child-action-card mood-card">
                <span class="child-action-icon">&#128522;</span>
                <h3>Mood Tracker</h3>
                <p>Track how you feel each day with emojis</p>
              </a>
              <a href="#/journal" class="child-action-card journal-card">
                <span class="child-action-icon">&#128221;</span>
                <h3>My Journal</h3>
                <p>Write about your day — it's private and safe</p>
              </a>
              <div class="child-action-card coping-card" onclick="App.showCopingStrategy()">
                <span class="child-action-icon">&#127793;</span>
                <h3>Coping Toolbox</h3>
                <p>Find strategies to help when things feel tough</p>
              </div>
            </div>

            ${myMoods.length >= 3 ? `
              <div class="child-mood-history">
                <h2>Your Recent Moods</h2>
                <div class="mood-timeline">
                  ${myMoods.slice(-7).map(m => `
                    <div class="mood-timeline-item">
                      <span class="mood-emoji">${m.emoji}</span>
                      <span class="mood-day">${new Date(m.date).toLocaleDateString('en-GB', {weekday: 'short'})}</span>
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  },

  getMoodEmojis() {
    return [
      { emoji: '&#128513;', label: 'Happy', value: 5 },
      { emoji: '&#128522;', label: 'Good', value: 4 },
      { emoji: '&#128528;', label: 'Okay', value: 3 },
      { emoji: '&#128533;', label: 'Worried', value: 2 },
      { emoji: '&#128546;', label: 'Sad', value: 1 },
      { emoji: '&#128545;', label: 'Angry', value: 1 },
      { emoji: '&#128554;', label: 'Tired', value: 2 },
      { emoji: '&#128561;', label: 'Scared', value: 1 },
    ];
  },

  quickMood(emoji, label) {
    const moods = this.getData('moods') || [];
    const today = new Date().toISOString().split('T')[0];
    const existing = moods.findIndex(m => m.userId === this.currentUser.id && m.date === today);

    const moodEntry = {
      id: this.generateId(),
      userId: this.currentUser.id,
      emoji,
      label,
      date: today,
      time: new Date().toLocaleTimeString(),
      createdAt: new Date().toISOString()
    };

    if (existing >= 0) {
      moods[existing] = moodEntry;
    } else {
      moods.push(moodEntry);
    }

    this.setData('moods', moods);
    this.renderChildApp();
  },

  calculateMoodStreak() {
    const moods = this.getData('moods') || [];
    const myMoods = moods.filter(m => m.userId === this.currentUser.id).sort((a, b) => new Date(b.date) - new Date(a.date));

    let streak = 0;
    let checkDate = new Date();

    for (let i = 0; i < 365; i++) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (myMoods.find(m => m.date === dateStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  },

  showCopingStrategy() {
    const strategies = [
      { title: 'Box Breathing', desc: 'Breathe in for 4 counts, hold for 4, out for 4, hold for 4. Repeat 3 times.', emoji: '&#127748;' },
      { title: '5-4-3-2-1 Grounding', desc: 'Name 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste.', emoji: '&#127795;' },
      { title: 'Butterfly Hug', desc: 'Cross your arms over your chest and gently tap left, right, left, right. Slow and steady.', emoji: '&#129419;' },
      { title: 'Safe Place Imagination', desc: 'Close your eyes and picture your favourite safe place. What can you see, hear, and feel there?', emoji: '&#127968;' },
      { title: 'Music Break', desc: 'Put on your favourite song and focus on the music. Let it take over your thoughts for a bit.', emoji: '&#127925;' },
      { title: 'Drawing Your Feelings', desc: 'Get some paper and draw or colour how you feel. No rules — just let it flow.', emoji: '&#127912;' },
      { title: 'Squeeze and Release', desc: 'Squeeze your fists really tight for 5 seconds, then slowly let go. Feel the tension melt away.', emoji: '&#9994;' },
      { title: 'Talk to Someone', desc: 'Find a trusted adult — a parent, teacher, or another grown-up you trust — and tell them how you feel.', emoji: '&#128172;' },
    ];

    const strategy = strategies[Math.floor(Math.random() * strategies.length)];
    alert(`${strategy.title}\n\n${strategy.desc}`);
  },

  // ========== MOOD TRACKER ==========
  renderMoodTracker() {
    const container = document.getElementById('app-container');
    const moods = this.getData('moods') || [];
    const myMoods = moods.filter(m => m.userId === this.currentUser.id);
    const today = new Date().toISOString().split('T')[0];
    const todayMood = myMoods.find(m => m.date === today);

    container.innerHTML = `
      ${this.getAppNav('mood')}
      <div class="app-page child-app-page">
        <div class="container">
          <h1>Mood Tracker &#128522;</h1>
          <p class="page-desc">How are you feeling? Pick the emoji that matches your mood.</p>

          <div class="mood-selector-grid">
            ${this.getMoodEmojis().map(m => `
              <button class="mood-select-btn ${todayMood && todayMood.label === m.label ? 'selected' : ''}"
                      onclick="App.selectMood('${m.emoji}', '${m.label}', ${m.value})">
                <span class="mood-big-emoji">${m.emoji}</span>
                <span class="mood-select-label">${m.label}</span>
              </button>
            `).join('')}
          </div>

          <div class="mood-note-section">
            <h2>Want to say more about how you feel?</h2>
            <textarea id="mood-note" rows="3" placeholder="You can write something here if you want to... (optional)">${todayMood?.note || ''}</textarea>
            <button onclick="App.saveMoodNote()" class="btn btn-primary btn-sm" ${!todayMood ? 'disabled' : ''}>Save Note</button>
          </div>

          ${myMoods.length > 0 ? `
            <div class="mood-history-section">
              <h2>Your Mood History</h2>
              <div class="mood-calendar">
                ${myMoods.slice(-14).reverse().map(m => `
                  <div class="mood-cal-day">
                    <span class="mood-cal-emoji">${m.emoji}</span>
                    <span class="mood-cal-date">${new Date(m.date).toLocaleDateString('en-GB', {day: 'numeric', month: 'short'})}</span>
                    <span class="mood-cal-label">${m.label}</span>
                    ${m.note ? '<span class="mood-cal-has-note">&#128221;</span>' : ''}
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  },

  selectMood(emoji, label, value) {
    const moods = this.getData('moods') || [];
    const today = new Date().toISOString().split('T')[0];
    const existing = moods.findIndex(m => m.userId === this.currentUser.id && m.date === today);

    const moodEntry = {
      id: this.generateId(),
      userId: this.currentUser.id,
      emoji,
      label,
      value,
      date: today,
      time: new Date().toLocaleTimeString(),
      createdAt: new Date().toISOString()
    };

    if (existing >= 0) {
      moodEntry.note = moods[existing].note;
      moods[existing] = moodEntry;
    } else {
      moods.push(moodEntry);
    }

    this.setData('moods', moods);

    // Check for safeguarding patterns in mood data
    this.checkMoodSafeguarding();

    this.renderMoodTracker();
  },

  saveMoodNote() {
    const note = document.getElementById('mood-note').value;
    const moods = this.getData('moods') || [];
    const today = new Date().toISOString().split('T')[0];
    const existing = moods.findIndex(m => m.userId === this.currentUser.id && m.date === today);

    if (existing >= 0) {
      moods[existing].note = note;
      this.setData('moods', moods);

      // Scan note for safeguarding triggers
      if (note) this.scanForTriggers(note, 'mood_note');

      alert('Note saved!');
    }
  },

  checkMoodSafeguarding() {
    const moods = this.getData('moods') || [];
    const myMoods = moods.filter(m => m.userId === this.currentUser.id).slice(-7);

    // Check for persistent low mood (safeguarding indicator)
    const lowMoodDays = myMoods.filter(m => m.value <= 1).length;
    if (lowMoodDays >= 3) {
      const alerts = this.getData('safeguarding_alerts') || [];
      alerts.push({
        id: this.generateId(),
        type: 'persistent_low_mood',
        userId: this.currentUser.id,
        userName: this.currentUser.name,
        detail: `${lowMoodDays} days of very low mood in the last 7 days`,
        severity: lowMoodDays >= 5 ? 'high' : 'medium',
        date: new Date().toISOString(),
        reviewed: false
      });
      this.setData('safeguarding_alerts', alerts);
    }
  },

  // ========== JOURNAL ==========
  renderJournal() {
    const container = document.getElementById('app-container');
    const journals = this.getData('journals') || [];
    const myJournals = journals.filter(j => j.userId === this.currentUser.id);

    container.innerHTML = `
      ${this.getAppNav('journal')}
      <div class="app-page child-app-page">
        <div class="container">
          <h1>My Journal &#128221;</h1>
          <p class="page-desc">This is your private space to write about anything. Your journal is safe and private.</p>

          <div class="journal-layout">
            <div class="journal-write-section">
              <div class="app-card">
                <h2>Write a New Entry</h2>
                <div class="journal-prompt">
                  <p class="journal-prompt-text">${this.getJournalPrompt()}</p>
                  <button onclick="App.newJournalPrompt()" class="btn btn-outline btn-sm">Different prompt</button>
                </div>
                <form onsubmit="App.submitJournal(event)">
                  <div class="form-group">
                    <label for="journal-title">Title (optional)</label>
                    <input type="text" id="journal-title" placeholder="Give your entry a title...">
                  </div>
                  <div class="form-group">
                    <label for="journal-content">What's on your mind?</label>
                    <textarea id="journal-content" rows="8" required placeholder="Write whatever you want here. This is YOUR space..."></textarea>
                  </div>
                  <div class="form-group">
                    <label>How are you feeling about what you wrote?</label>
                    <div class="journal-mood-row">
                      ${this.getMoodEmojis().slice(0, 6).map(m => `
                        <label class="journal-mood-option">
                          <input type="radio" name="journal-mood" value="${m.label}">
                          <span>${m.emoji}</span>
                        </label>
                      `).join('')}
                    </div>
                  </div>
                  <button type="submit" class="btn btn-primary btn-full">Save Entry &#128274;</button>
                </form>
              </div>
            </div>

            <div class="journal-entries-section">
              <h2>Your Entries</h2>
              ${myJournals.length === 0 ? '<p class="empty-state">No journal entries yet. Start writing!</p>' : ''}
              ${myJournals.slice().reverse().map(j => `
                <div class="journal-entry-card">
                  <div class="journal-entry-header">
                    <strong>${j.title || 'Untitled'}</strong>
                    <span class="journal-entry-date">${new Date(j.date).toLocaleDateString('en-GB', {day: 'numeric', month: 'short', year: 'numeric'})}</span>
                  </div>
                  ${j.mood ? `<span class="journal-entry-mood">${j.mood}</span>` : ''}
                  <p class="journal-entry-preview">${j.content.substring(0, 150)}${j.content.length > 150 ? '...' : ''}</p>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  },

  getJournalPrompt() {
    const prompts = [
      "What made you smile today?",
      "If you could have any superpower, what would it be and why?",
      "What is something you're really good at?",
      "Describe your perfect day.",
      "What's something that worried you today? How did you handle it?",
      "Who is someone that makes you feel safe?",
      "What are three things you're grateful for right now?",
      "If you could talk to your future self, what would you ask?",
      "What's something new you learned recently?",
      "How would your best friend describe you?",
      "What does being brave mean to you?",
      "Write about a time you felt really proud of yourself."
    ];
    return prompts[Math.floor(Math.random() * prompts.length)];
  },

  newJournalPrompt() {
    document.querySelector('.journal-prompt-text').textContent = this.getJournalPrompt();
  },

  submitJournal(e) {
    e.preventDefault();
    const content = document.getElementById('journal-content').value;
    const title = document.getElementById('journal-title').value;
    const moodInput = document.querySelector('[name="journal-mood"]:checked');

    // AI safeguarding scan — only AI checks, nothing shown to child
    this.scanForTriggers(content, 'journal');

    const journals = this.getData('journals') || [];
    journals.push({
      id: this.generateId(),
      userId: this.currentUser.id,
      title,
      content,
      mood: moodInput ? moodInput.value : null,
      date: new Date().toISOString(),
      createdAt: new Date().toISOString()
    });
    this.setData('journals', journals);
    alert('Journal entry saved! &#128274;');
    this.renderJournal();
  },

  // ========== SAFEGUARDING - TRIGGER WORD SCANNING ==========
  // PRIVATE: Only AI checks these patterns. Children never see the scanning.
  // Only professionals with safeguarding access can view alerts.

  scanForTriggers(text, source) {
    if (!text) return;

    const triggerPatterns = [
      { pattern: /\b(hurt\s*(my)?self|self[- ]?harm|cutting|cut\s*myself)\b/i, category: 'self_harm', severity: 'high' },
      { pattern: /\b(kill\s*(my)?self|suicid|end\s*(it|my\s*life)|don'?t\s*want\s*to\s*(live|be\s*alive|be\s*here))\b/i, category: 'suicidal', severity: 'critical' },
      { pattern: /\b(hit(s)?\s*me|beat(s)?\s*me|punch(es)?\s*me|hurt(s)?\s*me|abuse|abused)\b/i, category: 'physical_abuse', severity: 'high' },
      { pattern: /\b(touch(es|ed)?\s*me|inappropriate|molest|assault)\b/i, category: 'sexual_abuse', severity: 'critical' },
      { pattern: /\b(no\s*one\s*(cares|loves)|nobody\s*(cares|loves)|all\s*alone|hate\s*(my\s*life|myself|everything))\b/i, category: 'emotional_distress', severity: 'medium' },
      { pattern: /\b(bully|bullied|bullying|pick\s*on\s*me|leave\s*me\s*out)\b/i, category: 'bullying', severity: 'medium' },
      { pattern: /\b(scared\s*(at\s*home|of\s*(mum|dad|step))|frighten|terrified)\b/i, category: 'fear_at_home', severity: 'high' },
      { pattern: /\b(run\s*away|ran\s*away|running\s*away)\b/i, category: 'running_away', severity: 'medium' },
      { pattern: /\b(starv(ing|ed)|no\s*food|hungry\s*all\s*the\s*time)\b/i, category: 'neglect', severity: 'high' },
    ];

    const matches = [];
    triggerPatterns.forEach(tp => {
      if (tp.pattern.test(text)) {
        matches.push({ category: tp.category, severity: tp.severity });
      }
    });

    if (matches.length > 0) {
      const alerts = this.getData('safeguarding_alerts') || [];
      const highestSeverity = matches.reduce((max, m) =>
        m.severity === 'critical' ? 'critical' : (m.severity === 'high' && max !== 'critical') ? 'high' : max, 'medium');

      alerts.push({
        id: this.generateId(),
        type: 'trigger_words',
        userId: this.currentUser.id,
        userName: this.currentUser.name,
        source,
        categories: matches.map(m => m.category),
        severity: highestSeverity,
        date: new Date().toISOString(),
        reviewed: false
      });
      this.setData('safeguarding_alerts', alerts);
    }
  },

  // ========== SAFEGUARDING DASHBOARD (Professionals Only) ==========
  renderSafeguarding() {
    const container = document.getElementById('app-container');

    if (this.currentUser.role !== 'professional') {
      container.innerHTML = `${this.getAppNav('safeguarding')}<div class="app-page"><div class="container"><h1>Access Denied</h1><p>Only professionals with safeguarding responsibilities can access this area.</p></div></div>`;
      return;
    }

    const alerts = this.getData('safeguarding_alerts') || [];
    const unreviewed = alerts.filter(a => !a.reviewed);
    const reviewed = alerts.filter(a => a.reviewed);

    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    unreviewed.sort((a, b) => (severityOrder[a.severity] || 3) - (severityOrder[b.severity] || 3));

    const categoryLabels = {
      self_harm: 'Self-Harm Indicators',
      suicidal: 'Suicidal Ideation',
      physical_abuse: 'Physical Abuse Indicators',
      sexual_abuse: 'Sexual Abuse Indicators',
      emotional_distress: 'Emotional Distress',
      bullying: 'Bullying',
      fear_at_home: 'Fear at Home',
      running_away: 'Running Away',
      neglect: 'Neglect Indicators',
      persistent_low_mood: 'Persistent Low Mood'
    };

    container.innerHTML = `
      ${this.getAppNav('safeguarding')}
      <div class="app-page">
        <div class="container">
          <h1>Safeguarding Dashboard</h1>
          <p class="page-desc">AI-flagged safeguarding concerns from children's journal entries and mood data. Only AI scans the children's private content — human review is of the flagged patterns only, not the original text.</p>

          <div class="safeguarding-stats">
            <div class="sg-stat critical">
              <strong>${unreviewed.filter(a => a.severity === 'critical').length}</strong>
              <span>Critical</span>
            </div>
            <div class="sg-stat high">
              <strong>${unreviewed.filter(a => a.severity === 'high').length}</strong>
              <span>High</span>
            </div>
            <div class="sg-stat medium">
              <strong>${unreviewed.filter(a => a.severity === 'medium').length}</strong>
              <span>Medium</span>
            </div>
            <div class="sg-stat reviewed">
              <strong>${reviewed.length}</strong>
              <span>Reviewed</span>
            </div>
          </div>

          <h2>Active Alerts (${unreviewed.length})</h2>
          ${unreviewed.length === 0 ? '<p class="empty-state">No active safeguarding alerts.</p>' : ''}
          <div class="sg-alerts-list">
            ${unreviewed.map(a => `
              <div class="sg-alert severity-${a.severity}">
                <div class="sg-alert-header">
                  <span class="sg-severity-badge ${a.severity}">${a.severity.toUpperCase()}</span>
                  <span class="sg-alert-type">${a.type === 'trigger_words' ? 'Trigger Words Detected' : 'Mood Pattern Alert'}</span>
                  <span class="sg-alert-date">${new Date(a.date).toLocaleString()}</span>
                </div>
                <div class="sg-alert-body">
                  <p><strong>Young Person:</strong> ${a.userName}</p>
                  ${a.source ? `<p><strong>Source:</strong> ${a.source === 'journal' ? 'Journal Entry' : 'Mood Note'}</p>` : ''}
                  ${a.categories ? `<p><strong>Concerns:</strong> ${a.categories.map(c => categoryLabels[c] || c).join(', ')}</p>` : ''}
                  ${a.detail ? `<p><strong>Detail:</strong> ${a.detail}</p>` : ''}
                </div>
                <button onclick="App.markAlertReviewed('${a.id}')" class="btn btn-outline btn-sm">Mark as Reviewed</button>
              </div>
            `).join('')}
          </div>

          ${reviewed.length > 0 ? `
            <h2>Reviewed Alerts (${reviewed.length})</h2>
            <div class="sg-alerts-list reviewed-list">
              ${reviewed.slice(-10).reverse().map(a => `
                <div class="sg-alert severity-${a.severity} reviewed">
                  <div class="sg-alert-header">
                    <span class="sg-severity-badge ${a.severity}">${a.severity}</span>
                    <span class="sg-alert-type">${a.type === 'trigger_words' ? 'Trigger Words' : 'Mood Pattern'}</span>
                    <span class="sg-alert-date">${new Date(a.date).toLocaleString()}</span>
                    <span class="reviewed-badge">Reviewed</span>
                  </div>
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>
      </div>
    `;
  },

  markAlertReviewed(alertId) {
    const alerts = this.getData('safeguarding_alerts') || [];
    const idx = alerts.findIndex(a => a.id === alertId);
    if (idx >= 0) {
      alerts[idx].reviewed = true;
      alerts[idx].reviewedBy = this.currentUser.name;
      alerts[idx].reviewedAt = new Date().toISOString();
      this.setData('safeguarding_alerts', alerts);
      this.renderSafeguarding();
    }
  }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => App.init());
