// Tambola Live - Modern App Logic

class TambolaLive {
  constructor() {
    this.socket = null;
    this.currentUser = null;
    this.games = [];
    this.init();
  }

  init() {
    // Initialize Socket.IO
    this.initSocket();
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Check authentication
    this.checkAuth();
    
    // Load games
    this.loadGames();
    
    // Initialize animations
    this.initScrollAnimations();
    
    // Ticker effect
    this.initTickerEffect();
  }

  initSocket() {
    this.socket = io();
    
    this.socket.on('connect', () => {
      console.log('🟢 Connected to server');
    });
    
    this.socket.on('game-update', (data) => {
      console.log('Game update:', data);
      this.loadGames();
    });
    
    this.socket.on('disconnect', () => {
      console.log('🔴 Disconnected from server');
    });
  }

  checkAuth() {
    const token = localStorage.getItem('authToken');
    if (token) {
      this.currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      this.updateAuthUI();
    }
  }

  updateAuthUI() {
    const signInBtn = document.getElementById('signInBtn');
    const getStartedBtn = document.getElementById('getStartedBtn');
    const wallet = document.getElementById('wallet');
    
    if (this.currentUser) {
      signInBtn.style.display = 'none';
      getStartedBtn.textContent = this.currentUser.username || 'Profile';
      wallet.style.display = 'flex';
      document.getElementById('walletAmount').textContent = 
        `$${(this.currentUser.balance || 0).toFixed(2)}`;
    }
  }

  setupEventListeners() {
    // Navigation
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(anchor.getAttribute('href'));
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });

    // Mobile menu
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const navMenu = document.querySelector('.nav-menu');
    
    mobileMenuBtn?.addEventListener('click', () => {
      navMenu.classList.toggle('active');
      mobileMenuBtn.classList.toggle('active');
    });

    // Auth buttons
    document.getElementById('signInBtn')?.addEventListener('click', () => {
      this.showAuthModal('signin');
    });

    document.getElementById('getStartedBtn')?.addEventListener('click', () => {
      if (this.currentUser) {
        window.location.href = '/dashboard';
      } else {
        this.showAuthModal('signup');
      }
    });

    // Hero CTAs
    document.getElementById('playNowHero')?.addEventListener('click', () => {
      if (this.currentUser) {
        document.getElementById('games')?.scrollIntoView({ behavior: 'smooth' });
      } else {
        this.showAuthModal('signup');
      }
    });

    document.getElementById('watchVideoBtn')?.addEventListener('click', () => {
      this.showVideoModal();
    });

    // Game filters
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.filterGames(e.target.dataset.filter);
      });
    });

    // Navbar scroll effect
    let lastScroll = 0;
    window.addEventListener('scroll', () => {
      const navbar = document.querySelector('.navbar');
      const currentScroll = window.pageYOffset;
      
      if (currentScroll > 100) {
        navbar.style.transform = currentScroll > lastScroll ? 'translateY(-100%)' : 'translateY(0)';
      } else {
        navbar.style.transform = 'translateY(0)';
      }
      
      lastScroll = currentScroll;
    });
  }

  async loadGames() {
    const container = document.getElementById('liveGames');
    
    try {
      // Simulate API call - replace with actual endpoint
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock games data
      this.games = [
        {
          id: 1,
          title: 'Quick Cash Game',
          host: 'TambolaLive',
          players: 45,
          maxPlayers: 100,
          prizePool: 500,
          ticketPrice: 5,
          status: 'live',
          startTime: new Date(Date.now() + 2 * 60000)
        },
        {
          id: 2,
          title: 'Mega Jackpot',
          host: 'ProHost',
          players: 78,
          maxPlayers: 150,
          prizePool: 2500,
          ticketPrice: 15,
          status: 'filling',
          startTime: new Date(Date.now() + 5 * 60000)
        },
        {
          id: 3,
          title: 'Beginner Friendly',
          host: 'TambolaLive',
          players: 23,
          maxPlayers: 50,
          prizePool: 100,
          ticketPrice: 2,
          status: 'filling',
          startTime: new Date(Date.now() + 3 * 60000)
        }
      ];
      
      this.renderGames();
    } catch (error) {
      console.error('Failed to load games:', error);
      container.innerHTML = '<p style="text-align: center; color: var(--gray-500);">Failed to load games. Please refresh.</p>';
    }
  }

  renderGames() {
    const container = document.getElementById('liveGames');
    
    if (this.games.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
          <div style="font-size: 4rem; margin-bottom: 16px;">🎮</div>
          <h3 style="font-size: 1.5rem; margin-bottom: 12px;">No active games right now</h3>
          <p style="color: var(--gray-500); margin-bottom: 24px;">Check back soon or create your own game!</p>
          <button class="btn btn-primary">Create Game</button>
        </div>
      `;
      return;
    }
    
    container.innerHTML = this.games.map(game => this.createGameCard(game)).join('');
    
    // Add click handlers
    container.querySelectorAll('.game-card').forEach((card, index) => {
      card.addEventListener('click', () => this.openGame(this.games[index]));
    });
  }

  createGameCard(game) {
    const progress = (game.players / game.maxPlayers) * 100;
    const timeUntil = this.getTimeUntilStart(game.startTime);
    const statusClass = game.status === 'live' ? 'live' : 'filling';
    const statusText = game.status === 'live' ? '🔴 Live Now' : '⏱️ Starting Soon';
    
    return `
      <div class="game-card glass" data-game-id="${game.id}" style="cursor: pointer; padding: 24px; border-radius: 20px; transition: all 0.3s ease;">
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 16px;">
          <div>
            <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 4px;">${game.title}</h3>
            <p style="color: var(--gray-500); font-size: 0.875rem;">by ${game.host}</p>
          </div>
          <span class="status-badge ${statusClass}" style="padding: 6px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; white-space: nowrap;">
            ${statusText}
          </span>
        </div>
        
        <div style="background: rgba(99, 102, 241, 0.1); padding: 16px; border-radius: 12px; margin-bottom: 16px; text-align: center;">
          <div style="font-size: 0.875rem; color: var(--gray-500); margin-bottom: 4px;">Prize Pool</div>
          <div style="font-size: 2rem; font-weight: 800; background: var(--gradient-primary); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">$${game.prizePool}</div>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 16px;">
          <div>
            <div style="font-size: 0.75rem; color: var(--gray-500); margin-bottom: 4px;">Players</div>
            <div style="font-size: 1rem; font-weight: 700;">${game.players}/${game.maxPlayers}</div>
          </div>
          <div>
            <div style="font-size: 0.75rem; color: var(--gray-500); margin-bottom: 4px;">Ticket</div>
            <div style="font-size: 1rem; font-weight: 700;">$${game.ticketPrice}</div>
          </div>
        </div>
        
        <div style="background: rgba(255,255,255,0.05); height: 4px; border-radius: 2px; overflow: hidden; margin-bottom: 16px;">
          <div style="width: ${progress}%; height: 100%; background: var(--gradient-primary); transition: width 0.5s ease;"></div>
        </div>
        
        <div style="display: flex; gap: 12px;">
          <button class="btn btn-glass" style="flex: 1;" onclick="event.stopPropagation(); app.viewGameDetails(${game.id});">Details</button>
          <button class="btn btn-primary" style="flex: 1;" onclick="event.stopPropagation(); app.joinGame(${game.id});">Join $${game.ticketPrice}</button>
        </div>
        
        ${game.status !== 'live' ? `<div style="text-align: center; margin-top: 12px; font-size: 0.75rem; color: var(--gray-500);">⏱️ Starts in ${timeUntil}</div>` : ''}
      </div>
    `;
  }

  getTimeUntilStart(startTime) {
    const diff = startTime - new Date();
    const minutes = Math.floor(diff / 60000);
    return minutes > 0 ? `${minutes}min` : 'soon';
  }

  filterGames(filter) {
    // Filter logic here
    console.log('Filter by:', filter);
  }

  joinGame(gameId) {
    if (!this.currentUser) {
      this.showAuthModal('signup');
      return;
    }
    
    console.log('Joining game:', gameId);
    // Implement join game logic
  }

  openGame(game) {
    console.log('Opening game:', game);
  }

  viewGameDetails(gameId) {
    console.log('View details:', gameId);
  }

  showAuthModal(mode) {
    console.log('Show auth modal:', mode);
    // Implement auth modal
    this.showToast('🔐 Authentication modal coming soon!', 'info');
  }

  showVideoModal() {
    console.log('Show video modal');
    this.showToast('🎥 Demo video coming soon!', 'info');
  }

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      padding: 16px 24px;
      background: var(--glass-bg);
      backdrop-filter: blur(20px);
      border: 1px solid var(--glass-border);
      border-radius: 12px;
      color: white;
      font-weight: 600;
      z-index: 10000;
      animation: slideIn 0.3s ease;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }
      });
    }, { threshold: 0.1 });
    
    document.querySelectorAll('.section').forEach(section => {
      section.style.opacity = '0';
      section.style.transform = 'translateY(40px)';
      section.style.transition = 'all 0.6s ease';
      observer.observe(section);
    });
  }

  initTickerEffect() {
    // Animate ticket numbers
    const markedNumbers = document.querySelectorAll('.ticket-number.marked');
    markedNumbers.forEach((num, index) => {
      setTimeout(() => {
        num.style.animation = 'mark 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
      }, index * 200);
    });
  }
}

// Initialize app
const app = new TambolaLive();

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(400px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(400px); opacity: 0; }
  }
  .status-badge.live {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
    animation: pulse 2s ease-in-out infinite;
  }
  .status-badge.filling {
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    color: white;
  }
  .game-card:hover {
    transform: translateY(-8px);
    box-shadow: 0 20px 60px rgba(99, 102, 241, 0.3);
  }
`;
document.head.appendChild(style);
