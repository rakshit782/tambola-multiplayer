# 🎲 Tambola Live - Multiplayer Housie/Bingo Platform

<div align="center">

![Tambola Live](https://img.shields.io/badge/Tambola-Live-6366f1?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMTgiIGZpbGw9IiM2MzY2ZjEiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtc2l6ZT0iMjIiIGZvbnQtd2VpZ2h0PSI4MDAiPlQ8L3RleHQ+PC9zdmc+)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.x-000000?style=for-the-badge&logo=express&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4.x-010101?style=for-the-badge&logo=socket.io&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)

**The world's most exciting multiplayer Tambola/Housie platform with real-time gameplay, stunning UI, and instant payouts!**

[Live Demo](#) • [Documentation](#features) • [Report Bug](https://github.com/rakshit782/tambola-multiplayer/issues) • [Request Feature](https://github.com/rakshit782/tambola-multiplayer/issues)

</div>

---

## ✨ Features

### 🎨 **Stunning Modern UI**
- ✅ **Glassmorphism Design** - Premium frosted glass effects throughout
- ✅ **Animated Background** - 3 floating gradient orbs with smooth animations
- ✅ **3D Visual Elements** - Interactive ticket visualization with glow effects
- ✅ **Gradient Magic** - Beautiful color flows and shine effects
- ✅ **Fully Responsive** - Perfect on mobile, tablet, and desktop
- ✅ **Dark Theme** - Eye-friendly dark mode by default

### 👤 **Authentication System**
- ✅ **User Registration** - Sign up with email and password
- ✅ **Login/Logout** - Secure session management
- ✅ **Role-Based Access** - Separate interfaces for Hosts and Players
- ✅ **Test Accounts** - Pre-loaded demo accounts for testing
- ✅ **Session Persistence** - Stay logged in across page refreshes
- ✅ **User Profile** - View balance, stats, and game history

### 🎮 **Game Features**
- ✅ **Live Games Grid** - Browse active and upcoming games
- ✅ **Game Filters** - Filter by stake level (Low/Medium/High)
- ✅ **Real-Time Updates** - See player counts and status live
- ✅ **Game Room** - Interactive gameplay with auto-marking
- ✅ **Number Calling** - Automatic number generation (every 3 seconds)
- ✅ **Prize Distribution** - Early Five, Lines, and Full House

### 👑 **Host Features**
- ✅ **Create Games** - Set up custom games with:
  - Custom game titles
  - Ticket pricing
  - Max player limits
  - Prize pool distribution
  - Auto-start options
- ✅ **Game Management** - Monitor active games
- ✅ **Revenue Tracking** - View earnings from hosted games

### 💰 **Wallet System**
- ✅ **Balance Management** - View current balance
- ✅ **Quick Add Money** - Preset amounts ($10, $25, $50, $100, $250)
- ✅ **Custom Amounts** - Add any amount
- ✅ **Payment Methods**:
  - Credit/Debit Cards
  - UPI (GooglePay, PhonePe, Paytm)
  - E-Wallets (PayPal, Skrill, Neteller)
- ✅ **Transaction History** - Track all deposits and withdrawals
- ✅ **Instant Updates** - Real-time balance synchronization

### 📊 **Dashboard**
- ✅ **Personal Statistics**:
  - Total Balance
  - Games Played/Hosted
  - Total Winnings
- ✅ **Recent Activity** - Last 10 transactions/games
- ✅ **Quick Actions** - One-click access to common features
- ✅ **Profile Management** - Update settings and preferences

### 🔧 **Technical Features**
- ✅ **Socket.IO Integration** - Real-time bidirectional communication
- ✅ **RESTful API** - Clean API endpoints for all operations
- ✅ **In-Memory Storage** - Fast session and game state management
- ✅ **Express Middleware** - CORS, Helmet, Morgan for security & logging
- ✅ **Error Handling** - Comprehensive error management
- ✅ **Environment Config** - Easy deployment configuration

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18.x or higher
- **npm** 8.x or higher
- **Git**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/rakshit782/tambola-multiplayer.git
   cd tambola-multiplayer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment file** (optional)
   ```bash
   cp .env.example .env
   ```
   Edit `.env` to configure:
   ```env
   PORT=3001
   NODE_ENV=development
   CORS_ORIGIN=*
   ```

4. **Start the server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   ```
   http://localhost:3001
   ```

---

## 🧪 Test Accounts

### Host Account (Create and manage games)
```
Email: host@tambola.com
Password: host123
Balance: $5,000
Role: Host
```

### Player Account (Join and play games)
```
Email: player@tambola.com
Password: player123
Balance: $250
Role: Player
```

### Regular User
```
Email: john@example.com
Password: test123
Balance: $100
Role: Player
```

---

## 📁 Project Structure

```
tambola-multiplayer/
│
├── public/                      # Frontend files
│   ├── index.html              # Homepage with live games
│   ├── auth.html               # Login/Register page
│   ├── dashboard.html          # User dashboard
│   ├── create-game.html        # Game creation (hosts only)
│   ├── game-room.html          # Live game room
│   ├── wallet.html             # Wallet management
│   │
│   ├── css/
│   │   └── redesign.css        # Main stylesheet (24KB)
│   │
│   └── js/
│       ├── redesign.js         # Main JavaScript
│       └── auth-check.js       # Authentication handler
│
├── routes/
│   └── auth.js                 # Authentication API routes
│
├── server.js                   # Express server & Socket.IO
├── package.json               # Dependencies & scripts
├── .env.example               # Environment template
└── README.md                  # This file
```

---

## 🎯 Usage Guide

### For Players

1. **Sign Up/Login**
   - Visit `/auth.html`
   - Use test account or create new account
   - Choose "Play Games" role

2. **Browse Games**
   - Homepage shows all live and upcoming games
   - Filter by stake level
   - See real-time player counts

3. **Join a Game**
   - Click on any game card
   - Purchase tickets
   - Wait for game to start

4. **Play**
   - Numbers are called automatically
   - Tickets are auto-marked
   - Claim prizes when you win

5. **Manage Wallet**
   - Add money via `/wallet.html`
   - Choose payment method
   - View transaction history

### For Hosts

1. **Login as Host**
   - Use `host@tambola.com` / `host123`
   - Or create account with "Host Games" role

2. **Create Game**
   - Go to `/create-game.html`
   - Set game parameters:
     - Title
     - Ticket price
     - Max players
     - Prize distribution
   - Start immediately or schedule

3. **Manage Games**
   - View active games in dashboard
   - Monitor player count
   - Track revenue

4. **Call Numbers**
   - Game room auto-calls numbers
   - Verify prize claims
   - Distribute winnings

---

## 🔌 API Endpoints

### Authentication

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "player@tambola.com",
  "password": "player123"
}
```

```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "newuser",
  "email": "user@example.com",
  "password": "password123",
  "role": "user"
}
```

```http
GET /api/auth/me
Authorization: Bearer <token>
```

```http
POST /api/auth/logout
Authorization: Bearer <token>
```

### Test Accounts

```http
GET /api/auth/test-accounts
```

---

## 🎮 Socket.IO Events

### Client → Server

```javascript
// Join a game room
socket.emit('join-game', {
  gameCode: 'GAME123'
});

// Call a number (host only)
socket.emit('call-number', {
  gameCode: 'GAME123',
  number: 42
});

// Claim a prize
socket.emit('claim-prize', {
  gameCode: 'GAME123',
  claimType: 'full-house',
  ticketNumber: 'TICKET001'
});
```

### Server → Client

```javascript
// New player joined
socket.on('player-joined', (data) => {
  console.log('Player joined:', data.playerId);
});

// Number called
socket.on('number-called', (data) => {
  console.log('Number:', data.number);
});

// Claim result
socket.on('claim-result', (data) => {
  console.log('Valid:', data.valid);
  console.log('Prize:', data.prizeAmount);
});
```

---

## 🎨 UI Components

### Colors
- **Primary**: `#6366f1` (Indigo)
- **Accent**: `#a855f7` (Purple)
- **Success**: `#10b981` (Green)
- **Warning**: `#fbbf24` (Amber)
- **Error**: `#ef4444` (Red)

### Gradients
- Primary: `linear-gradient(135deg, #6366f1 0%, #a855f7 100%)`
- Glow: `linear-gradient(135deg, #6366f1 0%, #ec4899 50%, #a855f7 100%)`

### Effects
- Glassmorphism: `backdrop-filter: blur(20px)`
- Shadows: `0 16px 48px rgba(0, 0, 0, 0.12)`
- Transitions: `0.3s cubic-bezier(0.4, 0, 0.2, 1)`

---

## 🛠️ Development

### Scripts

```bash
# Start development server
npm run dev

# Start production server
npm start

# Run tests (when available)
npm test

# Lint code (when configured)
npm run lint
```

### Environment Variables

```env
# Server Configuration
PORT=3001                    # Server port
NODE_ENV=development         # Environment mode

# CORS Configuration
CORS_ORIGIN=*               # Allowed origins

# Database (future)
DATABASE_URL=postgresql://...
REDIS_URL=redis://...

# Payment Gateway (future)
PAYMENT_API_KEY=...
PAYMENT_SECRET=...
```

---

## 📈 Roadmap

### Phase 1: Core Features ✅ (COMPLETE)
- [x] Modern UI/UX design
- [x] Authentication system
- [x] Live games grid
- [x] Game room interface
- [x] Wallet management
- [x] Dashboard
- [x] Host game creation

### Phase 2: Database Integration 🚧 (In Progress)
- [ ] PostgreSQL integration
- [ ] User data persistence
- [ ] Game history storage
- [ ] Transaction records

### Phase 3: Advanced Features 📋 (Planned)
- [ ] Real payment gateway integration
- [ ] Email notifications
- [ ] Leaderboards
- [ ] Achievements system
- [ ] Chat functionality
- [ ] Mobile apps (React Native)

### Phase 4: Scaling 📋 (Future)
- [ ] Redis for session management
- [ ] Load balancing
- [ ] CDN integration
- [ ] Performance optimization
- [ ] Analytics dashboard

---

## 🤝 Contributing

Contributions are welcome! Here's how:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Code Style

- Use ES6+ features
- Follow existing naming conventions
- Add comments for complex logic
- Test thoroughly before submitting

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Rakshit Vaish**
- GitHub: [@rakshit782](https://github.com/rakshit782)
- Repository: [tambola-multiplayer](https://github.com/rakshit782/tambola-multiplayer)

---

## 🙏 Acknowledgments

- **Socket.IO** - Real-time engine
- **Express.js** - Web framework
- **Google Fonts** - Typography (Plus Jakarta Sans, Space Grotesk)
- **Inspiration** - Traditional Tambola/Housie games

---

## 📞 Support

For support, email rakshitvaish@example.com or open an issue on GitHub.

---

## 🎉 Demo Screenshots

### Homepage
![Homepage](https://via.placeholder.com/1200x600/6366f1/ffffff?text=Tambola+Live+Homepage)

### Game Room
![Game Room](https://via.placeholder.com/1200x600/a855f7/ffffff?text=Live+Game+Room)

### Dashboard
![Dashboard](https://via.placeholder.com/1200x600/10b981/ffffff?text=User+Dashboard)

---

<div align="center">

**Built with ❤️ using Node.js, Express, Socket.IO, and modern web technologies**

⭐ Star this repo if you like it!

</div>
