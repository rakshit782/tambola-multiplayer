// Frontend Game Logic with Socket.io
const socket = io();

let currentGame = null;
let myTicket = null;
let markedNumbers = new Set();

// Join Game
function joinGame(gameCode) {
  socket.emit('join-game', { gameCode });
}

// Buy Ticket
async function buyTicket(gameCode) {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/game/buy-ticket', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ gameCode })
    });
    
    const data = await response.json();
    
    if (data.success) {
      myTicket = data.ticket;
      renderTicket(data.ticket.grid);
      
      // Handle payment
      if (data.payment.gateway === 'razorpay') {
        handleRazorpayPayment(data.payment);
      } else {
        handleStripePayment(data.payment);
      }
    }
  } catch (error) {
    console.error('Error buying ticket:', error);
    alert('Failed to purchase ticket');
  }
}

// Render Ticket on Screen
function renderTicket(grid) {
  const ticketContainer = document.getElementById('ticket-container');
  ticketContainer.innerHTML = '';
  
  const ticketDiv = document.createElement('div');
  ticketDiv.className = 'ticket';
  
  grid.forEach((row, rowIndex) => {
    row.forEach((num, colIndex) => {
      const cell = document.createElement('div');
      cell.className = num === 0 ? 'ticket-cell empty' : 'ticket-cell';
      cell.textContent = num || '';
      cell.dataset.number = num;
      
      if (num !== 0) {
        cell.addEventListener('click', () => markNumber(num, cell));
      }
      
      ticketDiv.appendChild(cell);
    });
  });
  
  ticketContainer.appendChild(ticketDiv);
}

// Mark Number
function markNumber(number, cellElement) {
  if (markedNumbers.has(number)) {
    markedNumbers.delete(number);
    cellElement.classList.remove('marked');
  } else {
    markedNumbers.add(number);
    cellElement.classList.add('marked');
  }
  
  checkForWin();
}

// Auto-mark when number is called
socket.on('number-called', (data) => {
  const { number } = data;
  
  // Display the called number
  document.getElementById('current-number').textContent = number;
  
  // Auto-mark if exists on ticket
  const cells = document.querySelectorAll('.ticket-cell');
  cells.forEach(cell => {
    if (parseInt(cell.dataset.number) === number) {
      cell.classList.add('marked');
      markedNumbers.add(number);
    }
  });
  
  checkForWin();
});

// Check for Win Conditions
function checkForWin() {
  if (!myTicket) return;
  
  const grid = myTicket.grid;
  
  // Check Early Five
  if (markedNumbers.size === 5 && !hasClaimedEarlyFive) {
    claimPrize('early_five');
  }
  
  // Check Top Line
  if (isLineComplete(grid[0])) {
    claimPrize('top_line');
  }
  
  // Check Middle Line
  if (isLineComplete(grid[1])) {
    claimPrize('middle_line');
  }
  
  // Check Bottom Line
  if (isLineComplete(grid[2])) {
    claimPrize('bottom_line');
  }
  
  // Check Full House
  if (isFullHouse(grid)) {
    claimPrize('full_house');
  }
}

function isLineComplete(row) {
  return row.every(num => num === 0 || markedNumbers.has(num));
}

function isFullHouse(grid) {
  return grid.every(row => isLineComplete(row));
}

// Claim Prize
function claimPrize(claimType) {
  socket.emit('claim-prize', {
    gameCode: currentGame.gameCode,
    claimType: claimType,
    ticketNumber: myTicket.number
  });
}

// Prize Claim Result
socket.on('claim-result', (data) => {
  if (data.valid) {
    alert(`Congratulations! You won ${data.claimType}! Prize: ${data.prizeAmount}`);
  } else {
    alert('Invalid claim or already claimed by another player.');
  }
});

// Payment Handlers
function handleRazorpayPayment(paymentData) {
  const options = {
    key: 'YOUR_RAZORPAY_KEY',
    amount: paymentData.amount,
    currency: paymentData.currency,
    order_id: paymentData.orderId,
    handler: function(response) {
      verifyPayment(response);
    }
  };
  const rzp = new Razorpay(options);
  rzp.open();
}

function handleStripePayment(paymentData) {
  // Stripe payment integration
  // Implement Stripe Elements here
}

async function verifyPayment(response) {
  // Send to backend for verification
  const token = localStorage.getItem('token');
  await fetch('/api/payment/verify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(response)
  });
}
