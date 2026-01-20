// Main Application Logic

class TambolaApp {
  constructor() {
    this.socket = null;
    this.currentUser = null;
    this.currentGame = null;
    this.init();
  }

  async init() {
    // Check authentication
    this.checkAuth();
    
    // Initialize Socket.IO
    this.initSocket();
    
    // Load active games
    await this.loadGames();
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Initialize animations
    this.initAnimations();
  }

  checkAuth() {
    const token = localStorage.getItem('token');
    if (token) {
      this.currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      this.updateUIForLoggedInUser();
    }
  }

  updateUIForLoggedInUser() {
    document.getElementById('loginBtn').style.display = 'none';
    document.getElementById('registerBtn').textContent = this.currentUser.username;
    document.getElementById('walletDisplay').style.display = 'flex';
    document.getElementById('walletBalance').textContent = 
      `$${this.currentUser.wallet_balance || 0}`;
  }

  initSocket() {
    this.socket = io();
    
    this.socket.on('connect', () => {
      console.log('Connected to server');
    });
    
    this.socket.on('game-update', (data) => {
      this.handleGameUpdate(data);
    });
    
    this.socket.on('number-called', (data) => {
      this.handleNumberCalled(data);
    });
  }

  async loadGames() {
    try {
      const response = await fetch('/api/game/active');
      const data = await response.json();
      
      this.renderGames(data.games || []);
    } catch (error) {
      console.error('Failed to load games:', error);
      this.showToast('Failed to load games', 'error');
    }
  }

  renderGames(games) {
    const container = document.getElementById('gamesGrid');
    
    if (games.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🎮</div>
          <h3>No active games right now</h3>
          <p>Be the first to create a game!</p>
          <button class="btn btn-primary" id="createFirstGame">Create Game</button>
        </div>
      `;
      return;
    }
    
    container.innerHTML = games.map(game => this.createGameCard(game)).join('');
    
    // Add click listeners to game cards
    document.querySelectorAll('.game-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (!e.target.closest('.btn')) {
          this.openGameDetails(card.dataset.gameId);
        }
      });
    });
  }

  createGameCard(game) {
    const statusClass = game.status === 'active' ? 'live' : 'waiting';
    const ticketsSold = game.tickets_sold || 0;
    const maxTickets = game.max_tickets || 100;
    const progress = (ticketsSold / maxTickets) * 100;
    
    return `
      <div class="game-card animate-scale-in" data-game-id="${game.id}">
        <div class="game-card-header">
          <div>
            <h3 class="game-title">${game.title}</h3>
            <p class="game-host">by ${game.host_name}</p>
          </div>
          <span class="game-status ${statusClass}">
            ${game.status === 'active' ? 'Live' : 'Waiting'}
          </span>
        </div>
        
        <div class="game-info">
          <div class="info-item">
            <span class="info-label">Ticket Price</span>
            <span class="info-value">${game.currency} ${game.ticket_price}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Players</span>
            <span class="info-value">${ticketsSold}/${maxTickets}</span>
          </div>
        </div>
        
        <div class="progress-bar" style="margin-bottom: 16px;">
          <div class="progress-fill" style="width: ${progress}%"></div>
        </div>
        
        <div class="prize-pool">
          <div class="prize-label">Total Prize Pool</div>
          <div class="prize-amount">
            ${game.currency} ${this.calculateTotalPrize(game)}
          </div>
        </div>
        
        <div class="game-footer">
          <button class="btn btn-outline" onclick="app.viewPrizes('${game.id}')">
            View Prizes
          </button>
          <button class="btn btn-primary" onclick="app.joinGame('${game.game_code}')">
            Join Game
          </button>
        </div>
      </div>
    `;
  }

  calculateTotalPrize(game) {
    const total = parseFloat(game.prize_early_five || 0) +
                  parseFloat(game.prize_top_line || 0) +
                  parseFloat(game.prize_middle_line || 0) +
                  parseFloat(game.prize_bottom_line || 0) +
                  parseFloat(game.prize_full_house || 0);
    return total.toFixed(2);
  }

  async joinGame(gameCode) {
    if (!this.currentUser) {
      this.showAuthModal();
      return;
    }
    
    try {
      // Show payment modal
      await paymentHandler.purchaseTicket(gameCode, 10, 'USD');
      
      // On successful payment, join the game
      this.socket.emit('join-game', { gameCode });
      
      // Navigate to game room
      window.location.href = `/game/${gameCode}`;
    } catch (error) {
      console.error('Failed to join game:', error);
      this.showToast('Failed to join game', 'error');
    }
  }

  viewPrizes(gameId) {
    // Implementation for prize modal
    console.log('View prizes for game:', gameId);
  }

  setupEventListeners() {
    // Mobile menu toggle
    document.getElementById('mobileMenuToggle')?.addEventListener('click', () => {
      document.getElementById('navMenu').classList.toggle('active');
    });
    
    // Play Now button
    document.getElementById('playNowBtn')?.addEventListener('click', () => {
      document.getElementById('games').scrollIntoView({ behavior: 'smooth' });
    });
    
    // Create Game button
    document.getElementById('createGameBtn')?.addEventListener('click', () => {
      if (!this.currentUser) {
        this.showAuthModal();
        return;
      }
      this.showCreateGameModal();
    });
    
    // Auth buttons
    document.getElementById('loginBtn')?.addEventListener('click', () => {
      this.showAuthModal('login');
    });
    
    document.getElementById('registerBtn')?.addEventListener('click', () => {
      if (!this.currentUser) {
        this.showAuthModal('register');
      }
    });
    
    // Game tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.filterGames(e.target.dataset.tab);
      });
    });
  }

  filterGames(category) {
    console.log('Filter games by:', category);
    // Implementation for filtering games
  }

  initAnimations() {
    // Intersection Observer for scroll animations
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-slide-in-up');
        }
      });
    }, { threshold: 0.1 });
    
    document.querySelectorAll('.section').forEach(section => {
      observer.observe(section);
    });
    
    // Navbar scroll effect
    window.addEventListener('scroll', () => {
      const navbar = document.getElementById('navbar');
      if (window.scrollY > 100) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    });
  }

  showAuthModal(mode = 'login') {
    const modal = document.getElementById('authModal');
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2 class="modal-title">${mode === 'login' ? 'Sign In' : 'Create Account'}</h2>
          <button class="modal-close" onclick="app.closeModal('authModal')">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line x1="18" y1="6" x2="6" y2="18" stroke-width="2"/>
              <line x1="6" y1="6" x2="18" y2="18" stroke-width="2"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <form id="authForm" class="form">
            ${mode === 'register' ? `
              <div class="form-group">
                <label>Username</label>
                <input type="text" name="username" required class="form-input">
              </div>
            ` : ''}
            <div class="form-group">
              <label>Email</label>
              <input type="email" name="email" required class="form-input">
            </div>
            <div class="form-group">
              <label>Password</label>
              <input type="password" name="password" required class="form-input">
            </div>
            <button type="submit" class="btn btn-primary btn-block">
              ${mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
            <p class="text-center" style="margin-top: 16px;">
              ${mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
              <a href="#" onclick="app.toggleAuthMode(event)" class="link">
                ${mode === 'login' ? 'Sign Up' : 'Sign In'}
              </a>
            </p>
          </form>
        </div>
      </div>
    `;
    modal.classList.add('active');
  }

  toggleAuthMode(e) {
    e.preventDefault();
    const currentMode = document.querySelector('.modal-title').textContent;
    const newMode = currentMode === 'Sign In' ? 'register' : 'login';
    this.showAuthModal(newMode);
  }

  closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
  }

  showCreateGameModal() {
    // Implementation for create game modal
    this.showToast('Create game feature coming soon!', 'info');
  }

  handleGameUpdate(data) {
    console.log('Game update:', data);
    this.loadGames();
  }

  handleNumberCalled(data) {
    console.log('Number called:', data);
  }

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <circle cx="12" cy="12" r="10" stroke-width="2"/>
        <line x1="12" y1="8" x2="12" y2="12" stroke-width="2"/>
        <line x1="12" y1="16" x2="12.01" y2="16" stroke-width="2"/>
      </svg>
      <span>${message}</span>
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
}

// Initialize app
const app = new TambolaApp();
