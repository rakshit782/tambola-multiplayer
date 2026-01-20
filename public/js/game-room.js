// Tambola Game Room - Ticket System

// Ticket Generator
class TambolaTicket {
    constructor(ticketId) {
        this.ticketId = ticketId;
        this.numbers = this.generateTicket();
        this.markedNumbers = new Set();
    }

    generateTicket() {
        const ticket = [];
        
        // Generate 3 rows with 9 columns each
        for (let row = 0; row < 3; row++) {
            const rowNumbers = [];
            const positions = this.getRandomPositions(5); // 5 numbers per row
            
            for (let col = 0; col < 9; col++) {
                if (positions.includes(col)) {
                    const min = col === 0 ? 1 : col * 10;
                    const max = col === 8 ? 90 : (col + 1) * 10 - 1;
                    let num;
                    do {
                        num = Math.floor(Math.random() * (max - min + 1)) + min;
                    } while (rowNumbers.includes(num) || this.isDuplicate(ticket, num));
                    rowNumbers.push(num);
                } else {
                    rowNumbers.push(null);
                }
            }
            ticket.push(rowNumbers);
        }
        
        return ticket;
    }

    getRandomPositions(count) {
        const positions = [];
        while (positions.length < count) {
            const pos = Math.floor(Math.random() * 9);
            if (!positions.includes(pos)) {
                positions.push(pos);
            }
        }
        return positions.sort((a, b) => a - b);
    }

    isDuplicate(ticket, num) {
        return ticket.some(row => row.includes(num));
    }

    markNumber(number) {
        let marked = false;
        this.ticket.forEach(row => {
            if (row.includes(number)) {
                this.markedNumbers.add(number);
                marked = true;
            }
        });
        return marked;
    }

    isNumberMarked(number) {
        return this.markedNumbers.has(number);
    }

    checkEarlyFive() {
        return this.markedNumbers.size >= 5;
    }

    checkTopLine() {
        return this.isLineComplete(0);
    }

    checkMiddleLine() {
        return this.isLineComplete(1);
    }

    checkBottomLine() {
        return this.isLineComplete(2);
    }

    checkFullHouse() {
        return this.markedNumbers.size === 15; // All 15 numbers
    }

    isLineComplete(rowIndex) {
        const row = this.numbers[rowIndex];
        return row.filter(n => n !== null).every(n => this.markedNumbers.has(n));
    }

    render(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const ticketHTML = `
            <div class="tambola-ticket" id="ticket-${this.ticketId}">
                <div class="ticket-header">
                    <span class="ticket-id">#${this.ticketId}</span>
                    <span class="ticket-status">✅ Active</span>
                </div>
                <div class="ticket-grid">
                    ${this.numbers.map((row, rowIndex) => `
                        <div class="ticket-row" data-row="${rowIndex}">
                            ${row.map((num, colIndex) => `
                                <div class="ticket-cell ${num === null ? 'empty' : ''}" data-number="${num}">
                                    ${num !== null ? num : ''}
                                </div>
                            `).join('')}
                        </div>
                    `).join('')}
                </div>
                <div class="ticket-footer">
                    <button class="claim-btn" data-claim="early-five" disabled>🎯 Early Five</button>
                    <button class="claim-btn" data-claim="top-line" disabled>🔺 Top Line</button>
                    <button class="claim-btn" data-claim="middle-line" disabled>🔺 Middle Line</button>
                    <button class="claim-btn" data-claim="bottom-line" disabled>🔺 Bottom Line</button>
                    <button class="claim-btn" data-claim="full-house" disabled>🏆 Full House</button>
                </div>
            </div>
        `;

        container.insertAdjacentHTML('beforeend', ticketHTML);
    }

    updateDisplay(number) {
        if (this.numbers.flat().includes(number)) {
            this.markedNumbers.add(number);
            const cell = document.querySelector(`#ticket-${this.ticketId} .ticket-cell[data-number="${number}"]`);
            if (cell) {
                cell.classList.add('marked');
            }

            // Update claim buttons
            this.updateClaimButtons();
        }
    }

    updateClaimButtons() {
        const ticketEl = document.getElementById(`ticket-${this.ticketId}`);
        if (!ticketEl) return;

        const buttons = {
            'early-five': this.checkEarlyFive(),
            'top-line': this.checkTopLine(),
            'middle-line': this.checkMiddleLine(),
            'bottom-line': this.checkBottomLine(),
            'full-house': this.checkFullHouse()
        };

        Object.entries(buttons).forEach(([claim, enabled]) => {
            const btn = ticketEl.querySelector(`[data-claim="${claim}"]`);
            if (btn) {
                btn.disabled = !enabled;
                if (enabled) {
                    btn.classList.add('active');
                }
            }
        });
    }
}

// Game State
const gameState = {
    tickets: [],
    ticketPrice: 5,
    gameCode: 'GAME123',
    userBalance: 0
};

// Initialize
function initGameRoom() {
    // Get user data
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.username) {
        window.location.href = '/auth.html';
        return;
    }

    gameState.userBalance = user.balance || 0;
    updateBalanceDisplay();

    // Setup buy ticket button
    const buyBtn = document.getElementById('buyTicketBtn');
    if (buyBtn) {
        buyBtn.addEventListener('click', buyTicket);
    }

    // Load existing tickets (if any)
    loadUserTickets();
}

function buyTicket() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    // Check balance
    if (user.balance < gameState.ticketPrice) {
        showNotification('Insufficient balance! Please add money to your wallet.', 'error');
        return;
    }

    // Deduct amount
    user.balance -= gameState.ticketPrice;
    localStorage.setItem('user', JSON.stringify(user));
    gameState.userBalance = user.balance;
    updateBalanceDisplay();

    // Generate ticket
    const ticketId = `TKT${Date.now()}`;
    const ticket = new TambolaTicket(ticketId);
    gameState.tickets.push(ticket);

    // Clear empty state and render ticket
    const container = document.getElementById('ticketsContainer');
    if (container.querySelector('.no-tickets')) {
        container.innerHTML = '';
    }
    ticket.render('ticketsContainer');

    // Save to localStorage
    saveUserTickets();

    // Show success
    showNotification(`Ticket purchased successfully! Ticket ID: ${ticketId}`, 'success');

    // Setup claim button listeners
    setupClaimButtons(ticketId);
}

function setupClaimButtons(ticketId) {
    const ticketEl = document.getElementById(`ticket-${ticketId}`);
    if (!ticketEl) return;

    const claimBtns = ticketEl.querySelectorAll('.claim-btn');
    claimBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const claimType = btn.dataset.claim;
            claimPrize(ticketId, claimType);
        });
    });
}

function claimPrize(ticketId, claimType) {
    const ticket = gameState.tickets.find(t => t.ticketId === ticketId);
    if (!ticket) return;

    // Verify claim
    let isValid = false;
    switch(claimType) {
        case 'early-five':
            isValid = ticket.checkEarlyFive();
            break;
        case 'top-line':
            isValid = ticket.checkTopLine();
            break;
        case 'middle-line':
            isValid = ticket.checkMiddleLine();
            break;
        case 'bottom-line':
            isValid = ticket.checkBottomLine();
            break;
        case 'full-house':
            isValid = ticket.checkFullHouse();
            break;
    }

    if (isValid) {
        // Emit claim to server
        socket.emit('claim-prize', {
            gameCode: gameState.gameCode,
            ticketId,
            claimType
        });
        showNotification(`🏆 Claim submitted for ${claimType}!`, 'success');
    } else {
        showNotification('Invalid claim! Pattern not complete.', 'error');
    }
}

function updateBalanceDisplay() {
    const balanceEl = document.getElementById('userBalance');
    if (balanceEl) {
        balanceEl.textContent = `$${gameState.userBalance.toFixed(2)}`;
    }
}

function saveUserTickets() {
    const ticketsData = gameState.tickets.map(t => ({
        ticketId: t.ticketId,
        numbers: t.numbers,
        markedNumbers: Array.from(t.markedNumbers)
    }));
    localStorage.setItem('gameTickets_' + gameState.gameCode, JSON.stringify(ticketsData));
}

function loadUserTickets() {
    const saved = localStorage.getItem('gameTickets_' + gameState.gameCode);
    if (saved) {
        const ticketsData = JSON.parse(saved);
        const container = document.getElementById('ticketsContainer');
        if (container && ticketsData.length > 0) {
            container.innerHTML = '';
            ticketsData.forEach(data => {
                const ticket = new TambolaTicket(data.ticketId);
                ticket.numbers = data.numbers;
                ticket.markedNumbers = new Set(data.markedNumbers);
                gameState.tickets.push(ticket);
                ticket.render('ticketsContainer');
                setupClaimButtons(data.ticketId);
            });
        }
    }
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 24px;
        padding: 16px 24px;
        background: ${type === 'success' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'};
        color: white;
        border-radius: 12px;
        font-weight: 600;
        box-shadow: 0 8px 24px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Auto-mark numbers when called
function onNumberCalled(number) {
    gameState.tickets.forEach(ticket => {
        ticket.updateDisplay(number);
    });
}

// Export functions
window.initGameRoom = initGameRoom;
window.onNumberCalled = onNumberCalled;
window.buyTicket = buyTicket;
