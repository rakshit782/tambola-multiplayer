# Tambola Live - Setup Guide

## Quick Start (5 Minutes)

### Prerequisites
- Node.js 18+ installed ([Download](https://nodejs.org/))
- Git installed

### Steps to Run on Localhost

#### 1. Clone the Repository
```bash
git clone https://github.com/rakshit782/tambola-multiplayer.git
cd tambola-multiplayer
```

#### 2. Install Dependencies
```bash
npm install
```

#### 3. Setup Environment Variables
```bash
# Copy example env file
cp .env.example .env

# The default values work for basic testing
# You can edit .env later for database and payment integrations
```

#### 4. Start the Server
```bash
npm start
```

You should see:
```
========================================
   🎲 TAMBOLA LIVE SERVER RUNNING 🎲
========================================
✓ Server: http://localhost:3000
✓ Environment: development
✓ Socket.IO: Ready
========================================
```

#### 5. Open Your Browser
```
http://localhost:3000
```

✅ **Done!** Your Tambola app is now running!

---

## Development Mode (Auto-reload)

For development with auto-restart on file changes:

```bash
npm run dev
```

---

## Full Setup (With Database & Payments)

### Option A: Without Database (Testing UI Only)

The app will run without database for frontend testing. API calls will fail gracefully.

### Option B: With PostgreSQL Database

#### 1. Install PostgreSQL

**Windows:**
- Download from [postgresql.org](https://www.postgresql.org/download/windows/)
- Install and remember the password

**Mac:**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Linux (Ubuntu):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

#### 2. Create Database

```bash
# Login to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE tambola_db;

# Exit
\q
```

#### 3. Run Schema

```bash
psql -U postgres -d tambola_db -f database/schema.sql
```

#### 4. Update .env

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tambola_db
DB_USER=postgres
DB_PASSWORD=your_postgres_password
```

### Option C: With Docker (Easiest)

```bash
# Start everything (PostgreSQL + Redis + App)
docker-compose up

# Access at http://localhost:3000
```

---

## Testing the App

### 1. View Homepage
- Open `http://localhost:3000`
- You should see the beautiful landing page

### 2. Test Socket.IO
- Open browser console (F12)
- You should see connection messages

### 3. Test API Endpoints
```bash
# Health check
curl http://localhost:3000/health

# Should return:
# {"status":"ok","timestamp":"...","environment":"development"}
```

---

## Project Structure

```
tambola-multiplayer/
├── public/              # Frontend files
│   ├── index.html      # Main page
│   ├── css/
│   │   ├── style.css
│   │   ├── components.css
│   │   └── animations.css
│   └── js/
│       ├── app.js      # Main app logic
│       ├── game.js     # Game functionality
│       └── payment.js  # Payment integration
├── routes/             # API routes
│   ├── game.js
│   └── payment.js
├── config/             # Configuration
│   ├── database.js
│   ├── hyperswitch.js
│   └── wise.js
├── middleware/         # Express middleware
│   └── auth.js
├── database/           # Database schema
│   └── schema.sql
├── server.js           # Main server file
├── package.json        # Dependencies
├── .env                # Environment variables
└── docker-compose.yml  # Docker setup
```

---

## Troubleshooting

### Port Already in Use
```bash
# Change port in .env
PORT=3001

# Or kill process on port 3000
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux:
lsof -ti:3000 | xargs kill
```

### Module Not Found
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Database Connection Failed
- Check PostgreSQL is running
- Verify credentials in `.env`
- Check database exists: `psql -U postgres -l`

### Can't Access localhost:3000
- Check firewall settings
- Try `http://127.0.0.1:3000`
- Check server is running: `npm start`

---

## Next Steps

1. **Add Sample Data**
   - Create some test games
   - Add mock users

2. **Configure Payments**
   - Get Hyperswitch API keys
   - Get Wise API credentials
   - Update `.env` file

3. **Deploy**
   - Use Vercel, Railway, or AWS
   - See `DEPLOYMENT.md` for guides

---

## Development Tips

### Live Reload
```bash
npm run dev  # Uses nodemon for auto-restart
```

### View Logs
Server logs appear in terminal with colored output:
- 🟢 Green = Success
- 🔴 Red = Error
- 🟡 Yellow = Warning
- 🔵 Blue = Info

### Browser DevTools
- F12 to open console
- Check Network tab for API calls
- Check Console for errors

---

## Need Help?

- Check existing issues on GitHub
- Create new issue with error details
- Include:
  - Node version: `node --version`
  - npm version: `npm --version`
  - Error message
  - Steps to reproduce

---

## License

MIT License - feel free to use for your projects!
