# 🎲 Tambola Live - Global Multiplayer Game

<div align="center">

![Tambola Live](https://img.shields.io/badge/Tambola-Live-purple?style=for-the-badge)
![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=for-the-badge&logo=node.js)
![Socket.IO](https://img.shields.io/badge/Socket.IO-Real--Time-blue?style=for-the-badge&logo=socket.io)
![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)

**Multi-user Tambola (Bingo/Housie) game with real-time gameplay, global payments, and instant payouts**

[🚀 Quick Start](#quick-start) • [✨ Features](#features) • [📖 Documentation](#documentation) • [🎮 Demo](#demo)

</div>

---

## 🌟 Features

### 🎮 Real-Time Gameplay
- Live multiplayer games with Socket.IO
- Auto-marking tickets as numbers are called
- Instant win verification
- Multiple prize categories (Early Five, Lines, Full House)

### 💳 Global Payments
- **50+ Payment Methods** via Juspay Hyperswitch
  - Credit/Debit Cards
  - UPI (PhonePe, Google Pay, Paytm)
  - Digital Wallets (PayPal, Apple Pay)
  - Local payment methods
- **Global Payouts** via Wise API
  - 160+ countries supported
  - 80+ currencies
  - Real exchange rates
  - 1-2 day payouts

### 🎨 Beautiful UI/UX
- Modern gradient design
- Smooth animations
- Mobile-first responsive
- Dark mode support (coming soon)

### 🔒 Secure & Fair
- JWT authentication
- Encrypted connections
- Auto win verification
- Transparent prize distribution

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18 or higher
- npm or yarn

### Installation

```bash
# Clone repository
git clone https://github.com/rakshit782/tambola-multiplayer.git
cd tambola-multiplayer

# Install dependencies
npm install

# Setup environment
cp .env.example .env

# Start server
npm start
```

### Access the App

Open your browser and visit:
```
http://localhost:3000
```

**That's it!** 🎉

For detailed setup including database and payments, see [SETUP.md](SETUP.md)

---

## 📸 Screenshots

### Landing Page
Beautiful hero section with live stats and game listings

### Game Room
Real-time gameplay with auto-marking tickets

### Payment Flow
Seamless checkout with 50+ payment methods

---

## 🛠️ Tech Stack

### Frontend
- HTML5, CSS3 (Modern gradient designs)
- Vanilla JavaScript (ES6+)
- Socket.IO Client
- Responsive Design

### Backend
- Node.js & Express.js
- Socket.IO for real-time
- PostgreSQL (database)
- Redis (caching & real-time state)

### Payment Systems
- Juspay Hyperswitch (Pay-in)
- Wise API (Pay-out)
- Razorpay & Stripe (fallback)

### DevOps
- Docker & Docker Compose
- GitHub Actions (CI/CD)
- Environment-based configs

---

## 📖 Documentation

- [Setup Guide](SETUP.md) - Complete installation guide
- [API Documentation](docs/API.md) - REST API endpoints
- [Socket.IO Events](docs/SOCKET.md) - Real-time events
- [Payment Integration](docs/PAYMENTS.md) - Payment setup
- [Deployment Guide](docs/DEPLOY.md) - Production deployment

---

## 🎮 How to Play

1. **Join a Game**
   - Browse active games
   - Purchase tickets (starting from ₹10)

2. **Play Live**
   - Numbers are called automatically
   - Your ticket marks numbers in real-time

3. **Win Prizes**
   - Early Five: First 5 numbers
   - Top/Middle/Bottom Line: Complete any row
   - Full House: All numbers marked

4. **Get Paid**
   - Instant verification
   - Money added to wallet
   - Withdraw to bank anytime

---

## 🌍 Global Scale Features

### Multi-Currency Support
- INR, USD, EUR, GBP, AUD, CAD, SGD, AED
- Automatic exchange rates
- Local payment methods per region

### Multi-Language (Coming Soon)
- English, Hindi, Spanish, French
- Portuguese, German, Japanese
- RTL support for Arabic

### Regional Servers
- Asia-Pacific
- Europe
- Americas
- Middle East

---

## 📊 Project Status

- ✅ Core gameplay engine
- ✅ Real-time multiplayer
- ✅ Payment integration
- ✅ Beautiful UI
- ✅ Mobile responsive
- 🔄 User authentication (in progress)
- 🔄 Admin dashboard (in progress)
- 📋 Mobile apps (planned)
- 📋 AI-powered moderation (planned)

---

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) first.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Rakshit Vaish**
- GitHub: [@rakshit782](https://github.com/rakshit782)

---

## 🙏 Acknowledgments

- Socket.IO for real-time engine
- Juspay for unified payments
- Wise for global payouts
- Community contributors

---

## 📞 Support

Need help? 
- 📧 Email: support@tambolalive.com
- 💬 Discord: [Join our server](https://discord.gg/tambola)
- 🐛 Issues: [GitHub Issues](https://github.com/rakshit782/tambola-multiplayer/issues)

---

<div align="center">

**Made with ❤️ for Tambola lovers worldwide**

⭐ Star us on GitHub — it motivates us a lot!

</div>
