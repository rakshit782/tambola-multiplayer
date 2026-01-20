// Tambola Live - Main JavaScript

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Navbar scroll effect
let lastScroll = 0;
const navbar = document.querySelector('.navbar');

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll <= 0) {
        navbar.classList.remove('scroll-up');
        return;
    }
    
    if (currentScroll > lastScroll && currentScroll > 100) {
        // Scrolling down
        navbar.classList.add('scroll-down');
        navbar.classList.remove('scroll-up');
    } else {
        // Scrolling up
        navbar.classList.remove('scroll-down');
        navbar.classList.add('scroll-up');
    }
    
    lastScroll = currentScroll;
});

// Intersection Observer for animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

// Observe all animated elements
document.querySelectorAll('.animate-slide-up').forEach(el => observer.observe(el));

// Game filters
const filterBtns = document.querySelectorAll('.filter-btn');
filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const filter = btn.dataset.filter;
        loadGames(filter);
    });
});

// Load live games
function loadGames(filter = 'all') {
    const gamesGrid = document.getElementById('liveGames');
    
    // Demo games data
    const games = [
        {
            id: 1,
            title: 'Quick Cash Game',
            host: 'TambolaLive',
            players: '45/100',
            ticketPrice: 5,
            prizePool: 475,
            status: 'live',
            startsIn: null,
            category: 'low'
        },
        {
            id: 2,
            title: 'Friday Night Jackpot',
            host: 'MegaWins',
            players: '78/200',
            ticketPrice: 10,
            prizePool: 1560,
            status: 'filling',
            startsIn: '5 min',
            category: 'medium'
        },
        {
            id: 3,
            title: 'Weekend Special',
            host: 'ProHost',
            players: '23/50',
            ticketPrice: 25,
            prizePool: 1125,
            status: 'filling',
            startsIn: '12 min',
            category: 'high'
        },
        {
            id: 4,
            title: 'Beginner Friendly',
            host: 'Starter',
            players: '12/30',
            ticketPrice: 2,
            prizePool: 54,
            status: 'filling',
            startsIn: '3 min',
            category: 'low'
        },
        {
            id: 5,
            title: 'High Rollers Only',
            host: 'VIPGames',
            players: '8/20',
            ticketPrice: 100,
            prizePool: 1600,
            status: 'filling',
            startsIn: '8 min',
            category: 'high'
        },
        {
            id: 6,
            title: 'Speed Round',
            host: 'FastPlay',
            players: '56/100',
            ticketPrice: 8,
            prizePool: 640,
            status: 'live',
            startsIn: null,
            category: 'medium'
        }
    ];
    
    // Filter games
    let filteredGames = games;
    if (filter !== 'all') {
        filteredGames = games.filter(g => g.category === filter);
    }
    
    // Generate HTML
    if (filteredGames.length === 0) {
        gamesGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: var(--gray-500);">
                <div style="font-size: 3rem; margin-bottom: 16px;">🎮</div>
                <h3 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 8px; color: white;">No games found</h3>
                <p>Try changing the filter or check back later</p>
            </div>
        `;
        return;
    }
    
    gamesGrid.innerHTML = filteredGames.map(game => `
        <div class="game-card glass" onclick="joinGame(${game.id})">
            <div class="game-card-header">
                <div>
                    <h3 class="game-title">${game.title}</h3>
                    <p class="game-host">👑 ${game.host}</p>
                </div>
                <div class="game-status ${game.status}">
                    ${game.status === 'live' ? '🔴 LIVE' : '⏳ Filling'}
                </div>
            </div>
            
            <div class="game-info">
                <div class="info-item">
                    <span class="info-label">👥 Players</span>
                    <span class="info-value">${game.players}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">🎫 Ticket</span>
                    <span class="info-value">$${game.ticketPrice}</span>
                </div>
            </div>
            
            <div class="game-prize">
                <span class="prize-label">💰 Prize Pool</span>
                <span class="prize-amount">$${game.prizePool}</span>
            </div>
            
            ${game.startsIn ? `
                <div class="game-timer">
                    ⏱️ Starts in ${game.startsIn}
                </div>
            ` : ''}
            
            <div class="game-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${parseInt(game.players.split('/')[0]) / parseInt(game.players.split('/')[1]) * 100}%"></div>
                </div>
            </div>
            
            <button class="btn btn-primary gradient-shine" style="width: 100%;" onclick="event.stopPropagation(); joinGame(${game.id})">
                <span>${game.status === 'live' ? 'Join Now' : 'Reserve Seat'}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
            </button>
        </div>
    `).join('');
}

// Join game function
function joinGame(gameId) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!user.username) {
        window.location.href = '/auth.html';
        return;
    }
    
    // Redirect to game room
    window.location.href = `/game-room.html?game=${gameId}`;
}

// Load games on page load
if (document.getElementById('liveGames')) {
    setTimeout(() => {
        loadGames('all');
    }, 500);
}

// Mobile menu toggle
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
        const navMenu = document.querySelector('.nav-menu');
        navMenu.classList.toggle('active');
        mobileMenuBtn.classList.toggle('active');
    });
}

// Video demo button
const watchVideoBtn = document.getElementById('watchVideoBtn');
if (watchVideoBtn) {
    watchVideoBtn.addEventListener('click', () => {
        alert('🎥 Video demo coming soon!\n\nFor now, you can:\n1. Sign up for a free account\n2. Browse live games\n3. Join a game and start playing!');
    });
}

// Console welcome message
console.log('%c🎲 Welcome to Tambola Live! 🎲', 'color: #6366f1; font-size: 24px; font-weight: bold;');
console.log('%cBuilt with ❤️ using Socket.IO, Express, and modern web technologies', 'color: #a855f7; font-size: 14px;');
console.log('%cTest Accounts:', 'color: #10b981; font-size: 16px; font-weight: bold;');
console.log('%c  Host: host@tambola.com / host123', 'color: #6366f1;');
console.log('%c  Player: player@tambola.com / player123', 'color: #6366f1;');
