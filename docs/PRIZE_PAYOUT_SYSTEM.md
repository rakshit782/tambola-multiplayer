# 💰 Prize Payout System - Tambola Live

## Overview

**IMPORTANT:** Hosts DO NOT pay winners directly. The platform handles all prize payments automatically through an escrow system.

---

## 🔒 How It Works (Escrow System)

### **Step-by-Step Flow:**

#### **1. Player Buys Ticket ($5 example)**
```
Player Payment: $5.00
├── Held in Platform Escrow
├── Not given to host yet
├── Not given to prize pool yet
└── Secured until game ends
```

#### **2. Money Split (After Game Ends)**
```
Ticket Price: $5.00

├── Prize Pool (60%): $3.00
│   ├── Early Five: $0.50
│   ├── Top Line: $0.75
│   ├── Middle Line: $0.75
│   ├── Bottom Line: $0.75
│   └── Full House: $0.25
│
├── Host Commission (34%): $1.70
│   └── Paid to host's wallet
│
└── Platform Fee (6%): $0.30
    ├── Payment processing: $0.15
    ├── Server costs: $0.05
    ├── Support: $0.05
    └── Platform profit: $0.05
```

#### **3. Winner Verification**
```
Player claims win → Automatic verification
├── System checks ticket
├── Validates pattern
├── Confirms legitimacy
└── If valid → Auto-pay from escrow
```

#### **4. Instant Payout**
```
Winner verified → Money released
├── Prize deducted from escrow
├── Added to winner's wallet
├── Winner can withdraw anytime
└── Host never touches prize money
```

---

## 💡 Why This System is Safe

### **For Players:**
✅ Money held securely in escrow  
✅ Guaranteed payouts (can't be stolen by host)  
✅ Automatic verification (no disputes)  
✅ Instant crediting to wallet  
✅ Platform guarantee  

### **For Hosts:**
✅ No prize money handling (less liability)  
✅ No risk of player disputes  
✅ Commission paid automatically  
✅ No cash flow issues  
✅ Focus on hosting games  

### **For Platform:**
✅ Full control over funds  
✅ Prevent fraud  
✅ Guarantee compliance  
✅ Build trust  
✅ Scalable system  

---

## 🎮 Real Example

### **Game: "Evening Jackpot"**
```
Ticket Price: $10
Tickets Sold: 100
Total Revenue: $1,000

💰 Money Distribution:

Prize Pool (60% = $600):
├── Early Five: $100 → Winner: Sarah M.
├── Top Line: $150 → Winner: John D.
├── Middle Line: $150 → Winner: Mike R.
├── Bottom Line: $150 → Winner: Lisa K.
└── Full House: $50 → Winner: Sarah M.

Host Commission (34% = $340):
└── Paid to host: TambolaKing

Platform Fee (6% = $60):
└── Platform operating costs
```

### **What Actually Happens:**

**When tickets are sold:**
- Players pay: $1,000 total
- Platform holds: $1,000 in escrow
- Host balance: $0 (not paid yet)

**During game:**
- Numbers called automatically
- Tickets marked automatically
- Winners verified automatically

**When Sarah claims "Early Five":**
```
Time: 7:15 PM
Claim: Early Five

System checks:
✓ Ticket valid
✓ Pattern complete
✓ First to claim

Action:
├── Deduct $100 from escrow
├── Add $100 to Sarah's wallet
├── Show notification: "🎉 You won $100!"
└── Update prize pool (Early Five claimed)
```

**When game ends:**
```
All prizes distributed: $600
Remaining in escrow: $400

Distribution:
├── Host Commission: $340 → Host wallet
├── Platform Fee: $60 → Platform account
└── Escrow balance: $0 (empty)
```

---

## 🔐 Escrow Account Structure

### **Per-Game Escrow:**

```javascript
Game ID: GAME_12345
Escrow Account:
{
  gameId: "GAME_12345",
  totalCollected: 1000.00,
  prizePool: 600.00,
  prizesDistributed: 0.00,
  prizesRemaining: 600.00,
  hostCommission: 340.00,
  platformFee: 60.00,
  status: "ACTIVE",
  
  breakdown: {
    earlyFive: { amount: 100, claimed: false, winner: null },
    topLine: { amount: 150, claimed: false, winner: null },
    middleLine: { amount: 150, claimed: false, winner: null },
    bottomLine: { amount: 150, claimed: false, winner: null },
    fullHouse: { amount: 50, claimed: false, winner: null }
  }
}
```

### **When Prize is Claimed:**

```javascript
// Before claim
earlyFive: { amount: 100, claimed: false, winner: null }

// Player claims
claimPrize({
  gameId: "GAME_12345",
  playerId: "PLAYER_789",
  prizeType: "earlyFive",
  ticketId: "TICKET_456"
});

// After verification & payout
earlyFive: { 
  amount: 100, 
  claimed: true, 
  winner: "PLAYER_789",
  claimedAt: "2026-01-20T19:15:00Z",
  transactionId: "TXN_ABC123"
}

// Player wallet updated
player.balance += 100;
```

---

## 💸 Payment Flow Diagram

```
┌─────────────┐
│   PLAYER    │
│  Buys Ticket│
│    $10      │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│  PLATFORM ESCROW    │
│   (Holds $10)       │
│                     │
│  Status: LOCKED     │
│  Release: After game│
└──────┬──────────────┘
       │
       │ Game Ends
       ▼
┌──────────────────────────────┐
│   AUTO DISTRIBUTION          │
├──────────────────────────────┤
│ ✓ Prize Pool: $6.00         │
│   → Winner wallets          │
│                             │
│ ✓ Host Commission: $3.40    │
│   → Host wallet             │
│                             │
│ ✓ Platform Fee: $0.60       │
│   → Platform account        │
└──────────────────────────────┘
```

---

## 🏆 Prize Distribution Methods

### **Method 1: Instant Auto-Claim (Recommended)**

```javascript
// System automatically detects winning pattern
function onNumberCalled(number) {
  markTickets(number);
  
  // Check all tickets for winning patterns
  tickets.forEach(ticket => {
    if (hasEarlyFive(ticket) && !prizes.earlyFive.claimed) {
      // Auto-claim
      claimPrize(ticket, 'earlyFive');
      notifyWinner(ticket.owner, 'earlyFive', 100);
    }
    
    if (hasFullHouse(ticket) && !prizes.fullHouse.claimed) {
      claimPrize(ticket, 'fullHouse');
      notifyWinner(ticket.owner, 'fullHouse', 200);
    }
  });
}
```

### **Method 2: Manual Claim with Auto-Verify**

```javascript
// Player clicks "Claim" button
function claimPrize(playerId, prizeType) {
  // Verify ticket
  const valid = verifyPattern(playerId, prizeType);
  
  if (valid && !prizes[prizeType].claimed) {
    // Pay instantly
    const amount = prizes[prizeType].amount;
    transferFromEscrow(gameId, playerId, amount);
    prizes[prizeType].claimed = true;
    
    // Notify
    toast.success(`🎉 You won $${amount}!`);
  } else {
    toast.error('Invalid claim or already claimed');
  }
}
```

---

## 🔄 Unclaimed Prize Handling

### **What if prizes aren't claimed?**

**Scenario:** Game ends but Full House not claimed

**Options:**

#### **Option A: Return to Players (Fair)**
```
Prize: $200 unclaimed
Tickets sold: 100
Refund per player: $2

Action:
├── Divide unclaimed among all players
├── Add to player wallets
└── Notify: "$2 refund from unclaimed prizes"
```

#### **Option B: Rollover to Next Game**
```
Prize: $200 unclaimed

Action:
├── Add to next game's prize pool
├── Announce: "Jackpot rollover: +$200!"
└── Attract more players
```

#### **Option C: Community Jackpot**
```
Prize: $200 unclaimed

Action:
├── Add to weekly jackpot
├── Special tournament at week end
└── Bigger prizes for community
```

---

## 💳 Technical Implementation

### **Database Schema:**

```sql
-- Escrow Accounts Table
CREATE TABLE escrow_accounts (
  id UUID PRIMARY KEY,
  game_id UUID NOT NULL,
  total_collected DECIMAL(10,2) NOT NULL,
  prize_pool DECIMAL(10,2) NOT NULL,
  prizes_distributed DECIMAL(10,2) DEFAULT 0,
  host_commission DECIMAL(10,2) NOT NULL,
  platform_fee DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT NOW(),
  settled_at TIMESTAMP
);

-- Prize Claims Table
CREATE TABLE prize_claims (
  id UUID PRIMARY KEY,
  game_id UUID NOT NULL,
  player_id UUID NOT NULL,
  prize_type VARCHAR(50) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  ticket_id UUID NOT NULL,
  claimed_at TIMESTAMP DEFAULT NOW(),
  transaction_id UUID NOT NULL,
  verified BOOLEAN DEFAULT true
);

-- Transactions Table
CREATE TABLE transactions (
  id UUID PRIMARY KEY,
  from_account VARCHAR(100) NOT NULL,
  to_account VARCHAR(100) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'TICKET_PURCHASE', 'PRIZE_PAYOUT', 'HOST_COMMISSION'
  status VARCHAR(20) DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);
```

### **Backend Logic:**

```javascript
// When ticket is purchased
async function purchaseTicket(playerId, gameId, ticketPrice) {
  // 1. Charge player
  await chargePlayer(playerId, ticketPrice);
  
  // 2. Add to escrow
  await addToEscrow(gameId, ticketPrice);
  
  // 3. Calculate splits
  const prizePool = ticketPrice * 0.60;
  const hostCommission = ticketPrice * 0.34;
  const platformFee = ticketPrice * 0.06;
  
  // 4. Update escrow account
  await updateEscrow(gameId, {
    totalCollected: '+=' + ticketPrice,
    prizePool: '+=' + prizePool,
    hostCommission: '+=' + hostCommission,
    platformFee: '+=' + platformFee
  });
  
  // 5. Issue ticket
  return generateTicket(playerId, gameId);
}

// When prize is claimed
async function processPrizeClaim(gameId, playerId, prizeType) {
  // 1. Verify pattern
  const valid = await verifyPattern(playerId, gameId, prizeType);
  if (!valid) throw new Error('Invalid claim');
  
  // 2. Check if already claimed
  const escrow = await getEscrow(gameId);
  if (escrow.breakdown[prizeType].claimed) {
    throw new Error('Already claimed');
  }
  
  // 3. Get prize amount
  const amount = escrow.breakdown[prizeType].amount;
  
  // 4. Transfer from escrow to player
  const txn = await transferFunds({
    from: `escrow_${gameId}`,
    to: `player_${playerId}`,
    amount: amount,
    type: 'PRIZE_PAYOUT'
  });
  
  // 5. Update escrow
  await updateEscrow(gameId, {
    prizesDistributed: '+=' + amount,
    prizesRemaining: '-=' + amount,
    [`breakdown.${prizeType}.claimed`]: true,
    [`breakdown.${prizeType}.winner`]: playerId,
    [`breakdown.${prizeType}.transactionId`]: txn.id
  });
  
  // 6. Update player balance
  await updatePlayerBalance(playerId, '+' + amount);
  
  // 7. Notify player
  await notifyPlayer(playerId, {
    type: 'PRIZE_WON',
    amount: amount,
    prizeType: prizeType
  });
  
  return txn;
}

// When game ends
async function settleGame(gameId) {
  const escrow = await getEscrow(gameId);
  
  // 1. Pay host commission
  await transferFunds({
    from: `escrow_${gameId}`,
    to: `host_${escrow.hostId}`,
    amount: escrow.hostCommission,
    type: 'HOST_COMMISSION'
  });
  
  // 2. Transfer platform fee
  await transferFunds({
    from: `escrow_${gameId}`,
    to: 'platform',
    amount: escrow.platformFee,
    type: 'PLATFORM_FEE'
  });
  
  // 3. Handle unclaimed prizes
  const unclaimed = escrow.prizesRemaining;
  if (unclaimed > 0) {
    await handleUnclaimedPrizes(gameId, unclaimed);
  }
  
  // 4. Mark escrow as settled
  await updateEscrow(gameId, {
    status: 'SETTLED',
    settledAt: new Date()
  });
}
```

---

## 🛡️ Security & Compliance

### **Fraud Prevention:**

✅ **Double-spend protection**  
- Escrow prevents same money being paid twice
- Atomic transactions (all or nothing)
- Race condition handling

✅ **Pattern verification**  
- Server-side validation only
- Client claims can't be trusted
- Cross-check with game state

✅ **Anti-collusion**  
- Monitor suspicious patterns
- Flag unusual win rates
- Review high-value claims

### **Legal Compliance:**

✅ **Money transmitter license**  
- Required in most jurisdictions
- Escrow accounts regulated
- Regular audits

✅ **Player protection**  
- Funds segregated from operating capital
- Insurance on escrow accounts
- Transparent prize pool display

✅ **Tax reporting**  
- Winner tax forms (if >$600/year)
- Transaction records
- Compliance with local laws

---

## 📊 Example with Real Numbers

### **Daily Host Performance:**

```
Host: ProGamer123
Date: January 20, 2026
Games Hosted: 5

Game 1 - Morning Fun:
├── Tickets: 30 × $5 = $150
├── Prize Pool (60%): $90 → Winners
├── Host Commission (34%): $51 → Host wallet
└── Platform Fee (6%): $9 → Platform

Game 2 - Afternoon Special:
├── Tickets: 50 × $10 = $500
├── Prize Pool (60%): $300 → Winners
├── Host Commission (34%): $170 → Host wallet
└── Platform Fee (6%): $30 → Platform

Game 3 - Evening Jackpot:
├── Tickets: 100 × $10 = $1,000
├── Prize Pool (60%): $600 → Winners
├── Host Commission (34%): $340 → Host wallet
└── Platform Fee (6%): $60 → Platform

Game 4 - Dinner Time:
├── Tickets: 40 × $8 = $320
├── Prize Pool (60%): $192 → Winners
├── Host Commission (34%): $108.80 → Host wallet
└── Platform Fee (6%): $19.20 → Platform

Game 5 - Night Owl:
├── Tickets: 60 × $5 = $300
├── Prize Pool (60%): $180 → Winners
├── Host Commission (34%): $102 → Host wallet
└── Platform Fee (6%): $18 → Platform

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DAILY TOTALS:
├── Total Revenue: $2,270
├── Prizes Paid: $1,362 (to 23 different winners)
├── Host Earned: $771.80
└── Platform Fee: $136.20

Host keeps: $771.80 for one day's work! 💰
```

---

## ✅ Summary

### **Key Points:**

1. **Hosts DON'T pay winners** - Platform handles everything
2. **Escrow system** - Money locked until game ends
3. **Auto-verification** - No manual checking needed
4. **Instant payouts** - Winners credited immediately
5. **Commission-based** - Host earns % without touching prizes

### **Benefits:**

✅ **Safe for everyone**  
✅ **Automated & fast**  
✅ **Transparent**  
✅ **Scalable**  
✅ **Legally compliant**  

---

**Last Updated:** January 20, 2026  
**Version:** 1.0  
**Contact:** support@tambolalive.com
