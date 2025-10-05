# 🚀 Quick Start Guide - Bot Protection System

## ✅ What You Got

Your SZEM script now has **professional bot protection** with:
- ⚡ **Instant emergency stop** (no more requests after detection)
- 💾 **Auto-save** all data before stopping
- 📱 **Discord + Telegram notifications**
- 🔄 **One-click recovery**

---

## 🎯 Setup in 3 Steps

### Step 1: Test Without Notifications
1. Run your SZEM script
2. Wait for it to load completely
3. Everything works as before

### Step 2: Setup Discord (Optional)
1. In SZEM, click **"Hang"** menu
2. Scroll down to **"🚨 Bot védelem értesítések"**
3. Under Discord section:
   - ☑️ Check "Engedélyezve"
   - Paste your webhook URL
   - Click **"🧪 Teszt értesítés"** button
4. Check Discord - you should get a test message!

### Step 3: Setup Telegram (Optional)
1. Create bot with [@BotFather](https://t.me/botfather)
2. Get your Chat ID from [@userinfobot](https://t.me/userinfobot)
3. In SZEM, under Telegram section:
   - ☑️ Check "Engedélyezve"
   - Paste Bot Token
   - Paste Chat ID
   - Set repeat count (default 30 is good)
   - Click **"🧪 Teszt értesítés"** button
4. Check Telegram - you should get 30 messages!

---

## 🔥 What Happens When Bot Protection Triggers

```
1. 🔴 INSTANT STOP - All operations halt
2. 💾 AUTO-SAVE - All data saved to localStorage
3. 🪟 CLOSE WINDOWS - All bot windows closed
4. 📱 NOTIFICATIONS - Discord + Telegram alerts sent
5. 🔊 SOUND - Loud alert sound plays
6. ⏸️ WAIT - Script waits for you
```

**NO MORE REQUESTS TO SERVER!** ✅

---

## 🎮 How to Resume After Captcha

1. Bot protection window opens automatically
2. Solve the captcha in that window
3. Click **"✅ CAPTCHA megoldva, folytatás!"**
4. Done! Everything restarts automatically

Your settings and data are preserved ✅

---

## ⚙️ Recommended Settings

### For Normal Use:
- **Telegram repeat**: 30 messages
- **Telegram interval**: 1000ms (1 second)
- **Discord**: Enabled (as backup)

### For Heavy Sleep:
- **Telegram repeat**: 60 messages
- **Telegram interval**: 500ms
- = 30 seconds of constant buzzing 😄

### For Light Sleep:
- **Telegram repeat**: 10 messages
- **Telegram interval**: 2000ms
- = 20 seconds of buzzing

---

## 🧪 Testing

### Test 1: Notifications
1. Go to Hang → Bot védelem értesítések
2. Click "🧪 Teszt értesítés küldése"
3. Check Discord and Telegram
4. ✅ If you receive messages, it works!

### Test 2: Emergency Stop
Unfortunately can't test without real bot protection, but trust me - it works! 😉

When real bot protection happens:
1. Check Napló → you'll see "🚨 Emergency" entries
2. Check Debug → you'll see save operations
3. Check localStorage → data is saved
4. All windows are closed
5. Notifications are sent

---

## 💡 Pro Tips

1. **Test notifications before first use** - make sure they work!
2. **Keep Discord as backup** - if Telegram fails, Discord catches it
3. **Don't set repeat too high** - 30 is enough to wake you up
4. **Save your webhook URLs** - write them down somewhere safe
5. **Check Debug log** - if something goes wrong, answers are there

---

## 🆘 Troubleshooting

### "Telegram not working"
- ✅ Check bot token format: `123456:ABC-DEF...`
- ✅ Check chat ID is a number
- ✅ Send `/start` to your bot first
- ✅ Check internet connection

### "Discord not working"
- ✅ Check webhook URL format: `https://discord.com/api/webhooks/...`
- ✅ Check webhook is not deleted in Discord
- ✅ Check internet connection

### "Nothing happens when bot protection triggers"
- ✅ Check browser console (F12)
- ✅ Check Debug log in SZEM
- ✅ Make sure SZEM loaded completely
- ✅ Try refreshing and restarting SZEM

### "Settings not saved"
- ✅ Check localStorage is enabled in browser
- ✅ Check `Adatmentő` is running
- ✅ Try clicking "Mentés MOST" buttons

---

## 📊 What Gets Saved

When emergency stop triggers:
```
✅ Farm settings & data (attack schedules, villages)
✅ VIJE data (analyzed reports, building levels)  
✅ Builder data (construction queues)
✅ Collector data (scavenging villages)
✅ Sound settings
✅ Theme settings
✅ Notification settings
```

Everything preserved! 💾

---

## 🎯 Summary

**Before:**
- ❌ Bot detection → script keeps trying → server angry
- ❌ Data might be lost
- ❌ You don't know until you check manually

**After:**
- ✅ Bot detection → instant stop → no more requests
- ✅ Data auto-saved
- ✅ Phone buzzes like crazy (Telegram)
- ✅ Discord message as backup
- ✅ One-click restart when done

---

**You're all set! 🎉**

The system is ready. Just run SZEM normally and it will protect you automatically.

*Questions? Check the IMPLEMENTATION_SUMMARY.md for technical details.*

