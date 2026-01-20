// Authentication Check and UI Update

(function() {
  // Check if user is authenticated
  const token = localStorage.getItem('authToken');
  const userStr = localStorage.getItem('user');
  
  if (token && userStr) {
    try {
      const user = JSON.parse(userStr);
      updateUIForAuthenticatedUser(user);
    } catch (error) {
      console.error('Failed to parse user data:', error);
      // Clear invalid data
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
    }
  }
  
  function updateUIForAuthenticatedUser(user) {
    // Update navbar
    const signInBtn = document.getElementById('signInBtn');
    const getStartedBtn = document.getElementById('getStartedBtn');
    const wallet = document.getElementById('wallet');
    
    if (signInBtn) {
      signInBtn.style.display = 'none';
    }
    
    if (getStartedBtn) {
      getStartedBtn.textContent = '';
      getStartedBtn.innerHTML = `
        <span>${user.username}</span>
        <span style="font-size: 0.75rem; opacity: 0.7;">${user.role === 'host' ? '👑' : '👤'}</span>
      `;
      
      // Add click handler for profile/logout
      getStartedBtn.onclick = showUserMenu;
    }
    
    if (wallet) {
      wallet.style.display = 'flex';
      const walletAmount = document.getElementById('walletAmount');
      if (walletAmount) {
        walletAmount.textContent = `$${user.balance.toFixed(2)}`;
      }
    }
    
    // Add user info to window for access
    window.currentUser = user;
    
    // Show role-specific features
    if (user.role === 'host') {
      showHostFeatures();
    }
  }
  
  function showUserMenu() {
    const user = window.currentUser;
    if (!user) return;
    
    const menu = document.createElement('div');
    menu.style.cssText = `
      position: fixed;
      top: 80px;
      right: 24px;
      background: var(--glass-bg);
      backdrop-filter: blur(20px);
      border: 1px solid var(--glass-border);
      border-radius: 16px;
      padding: 16px;
      min-width: 240px;
      z-index: 10000;
      box-shadow: var(--shadow-lg);
      animation: slideIn 0.2s ease;
    `;
    
    menu.innerHTML = `
      <div style="padding: 12px; border-bottom: 1px solid var(--glass-border); margin-bottom: 12px;">
        <div style="font-weight: 700; color: white; margin-bottom: 4px;">${user.username}</div>
        <div style="font-size: 0.875rem; color: var(--gray-500);">${user.email}</div>
        <div style="margin-top: 8px; padding: 6px 12px; background: var(--gradient-primary); border-radius: 8px; display: inline-block; font-size: 0.75rem; font-weight: 600;">
          ${user.role === 'host' ? '👑 Host' : '👤 Player'}
        </div>
      </div>
      <div style="margin-bottom: 12px;">
        <div style="font-size: 0.75rem; color: var(--gray-500); margin-bottom: 8px;">Account Balance</div>
        <div style="font-size: 1.5rem; font-weight: 800; color: white;">$${user.balance.toFixed(2)}</div>
      </div>
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <button onclick="window.location.href='/dashboard.html'" style="width: 100%; padding: 10px; background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); border-radius: 8px; color: white; cursor: pointer; font-weight: 600; transition: all 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='rgba(255,255,255,0.05)'">
          📊 Dashboard
        </button>
        ${user.role === 'host' ? `
          <button onclick="window.location.href='/create-game.html'" style="width: 100%; padding: 10px; background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); border-radius: 8px; color: white; cursor: pointer; font-weight: 600; transition: all 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='rgba(255,255,255,0.05)'">
            🎮 Create Game
          </button>
        ` : ''}
        <button onclick="window.location.href='/wallet.html'" style="width: 100%; padding: 10px; background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); border-radius: 8px; color: white; cursor: pointer; font-weight: 600; transition: all 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='rgba(255,255,255,0.05)'">
          💰 Add Money
        </button>
        <button onclick="handleLogout()" style="width: 100%; padding: 10px; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2); border-radius: 8px; color: #fca5a5; cursor: pointer; font-weight: 600; transition: all 0.2s;" onmouseover="this.style.background='rgba(239,68,68,0.2)'" onmouseout="this.style.background='rgba(239,68,68,0.1)'">
          🚪 Sign Out
        </button>
      </div>
    `;
    
    document.body.appendChild(menu);
    
    // Close on outside click
    setTimeout(() => {
      document.addEventListener('click', function closeMenu(e) {
        if (!menu.contains(e.target)) {
          menu.remove();
          document.removeEventListener('click', closeMenu);
        }
      });
    }, 100);
  }
  
  function showHostFeatures() {
    // Add host-specific UI elements
    console.log('Host features enabled');
  }
  
  window.handleLogout = async function() {
    const token = localStorage.getItem('authToken');
    
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    // Clear local storage
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    
    // Redirect to home
    window.location.href = '/';
  };
  
  // Update auth buttons to redirect to auth page
  const signInBtn = document.getElementById('signInBtn');
  const playNowHero = document.getElementById('playNowHero');
  
  if (signInBtn && !window.currentUser) {
    signInBtn.addEventListener('click', () => {
      window.location.href = '/auth.html';
    });
  }
  
  if (getStartedBtn && !window.currentUser) {
    getStartedBtn.addEventListener('click', () => {
      window.location.href = '/auth.html';
    });
  }
  
  if (playNowHero && !window.currentUser) {
    playNowHero.addEventListener('click', () => {
      window.location.href = '/auth.html';
    });
  }
})();
