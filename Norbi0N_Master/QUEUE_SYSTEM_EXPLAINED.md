# 🎯 Queue System - Visual Explanation

## 📊 Your Question: What Happens When They Overlap?

### Example Scenario

**You asked:** *"If we are farming then in same time we need to scav but we cant? Normally wait 3 minutes than scav. no?"*

**Answer:** ✅ YES! Exactly right!

---

## 🎬 Step-by-Step Timeline

```
⏰ TIME    | 🎮 ACTION                           | 📋 QUEUE STATUS
-----------|-------------------------------------|----------------------------------
00:00      | Farm requests slot                  | ✅ GRANTED (no one running)
00:00      | 🚜 Farm starts working              | Running: FARM
           |                                     | Queue: []
-----------|-------------------------------------|----------------------------------
00:30      | Scavenger requests slot             | ❌ DENIED (farm is running)
00:30      | ⏳ Scavenger added to queue         | Running: FARM
           |                                     | Queue: [SCAVENGER]
-----------|-------------------------------------|----------------------------------
01:00      | Builder requests slot               | ❌ DENIED (farm still running)
01:00      | ⏳ Builder added to queue           | Running: FARM
           |                                     | Queue: [SCAVENGER, BUILDER]
-----------|-------------------------------------|----------------------------------
03:00      | ✅ Farm completes work              | Slot released!
03:00      | 🗺️ Scavenger starts automatically  | Running: SCAVENGER
           |                                     | Queue: [BUILDER]
-----------|-------------------------------------|----------------------------------
05:00      | ✅ Scavenger completes work         | Slot released!
05:00      | 🏗️ Builder starts automatically    | Running: BUILDER
           |                                     | Queue: []
-----------|-------------------------------------|----------------------------------
08:00      | ✅ Builder completes work           | Slot released!
08:00      | ⏸️ System idle                      | Running: NONE
           |                                     | Queue: []
```

---

## 🎯 Priority System in Action

### Scenario: All modules want to run at the same time

```
Request Order:  Recruiter → Builder → Farm → Scavenger

Execution Order (by priority):
  1️⃣ Farm      (Priority 1) ✅ Runs first
  2️⃣ Scavenger (Priority 2) ⏳ Waits for farm
  3️⃣ Builder   (Priority 3) ⏳ Waits for farm + scavenger
  4️⃣ Recruiter (Priority 4) ⏳ Waits for everyone
```

**Even though Recruiter requested first, Farm runs first due to higher priority!**

---

## 📈 Visual Flow Diagram

```
┌─────────────┐
│  Module     │
│  wants to   │───┐
│  work       │   │
└─────────────┘   │
                  ▼
            ┌──────────────┐
            │ Is anyone    │──── NO ──►┌─────────────┐
            │ running?     │            │ Start work  │
            └──────────────┘            │ immediately │
                  │                     └─────────────┘
                  │ YES
                  ▼
            ┌──────────────┐
            │ Add to queue │
            │ (by priority)│
            └──────────────┘
                  │
                  ▼
            ┌──────────────┐
            │ Wait for     │
            │ current task │
            │ to finish    │
            └──────────────┘
                  │
                  ▼
            ┌──────────────┐
            │ Current task │
            │ finishes     │
            └──────────────┘
                  │
                  ▼
            ┌──────────────┐
            │ Next module  │
            │ in queue     │
            │ starts       │
            └──────────────┘
```

---

## 🔢 Real Numbers Example

### Your Configuration:
- 🚜 Farm loop: every 30 minutes
- 🗺️ Scavenger: every 60 minutes  
- 🏗️ Builder: every 45 minutes
- 👥 Recruiter: every 15 minutes

### First Hour Timeline:

```
00:00 ───► 🚜 Farm starts (3 min work)
00:03 ───► ✅ Farm done
00:03 ───► 👥 Recruiter starts (was waiting, priority 4 but no one else in queue)
00:05 ───► ✅ Recruiter done
00:15 ───► 👥 Recruiter starts again (3 min work)
00:18 ───► ✅ Recruiter done
00:30 ───► 🚜 Farm starts (3 min work)
00:30 ───► 👥 Recruiter requests (added to queue)
00:33 ───► ✅ Farm done
00:33 ───► 👥 Recruiter starts (3 min work)
00:36 ───► ✅ Recruiter done
00:45 ───► 🏗️ Builder starts (5 min work)
00:45 ───► 👥 Recruiter requests (added to queue)
00:50 ───► ✅ Builder done
00:50 ───► 👥 Recruiter starts (3 min work)
00:53 ───► ✅ Recruiter done
01:00 ───► 🗺️ Scavenger starts (4 min work)
01:00 ───► 🚜 Farm requests (added to queue - but Farm has higher priority!)
01:04 ───► ✅ Scavenger done
01:04 ───► 🚜 Farm starts (priority 1, goes before recruiter)
01:07 ───► ✅ Farm done
```

**No conflicts! Everyone gets their turn! 🎉**

---

## 🎛️ What You'll See in Master Control Panel

### Queue Status UI Shows:

```
╔════════════════════════════════════╗
║  📋 Task Queue                     ║
╠════════════════════════════════════╣
║  ▶️ Running: farm                  ║
║  ⏳ Queue: scavenger, builder      ║
║                                    ║
║  Priorities: Farm(1) → Scavenger(2)║
║  → Builder(3) → Recruiter(4)       ║
╚════════════════════════════════════╝
```

### Browser Console Shows:

```javascript
[QUEUE] farm requesting slot...
[QUEUE] ▶️ Executing: farm (Priority 1)
[FARM] Starting work...
[QUEUE] scavenger requesting slot...
[QUEUE] scavenger added to queue (farm is running with higher priority)
[QUEUE] Queue updated: [scavenger]
...
[FARM] Work done!
[QUEUE] ✅ farm completed
[QUEUE] farm releasing slot
[QUEUE] Processing next task: scavenger
[QUEUE] ▶️ Executing: scavenger (Priority 2)
```

---

## ✅ Key Benefits

1. **Zero Conflicts** - Only one module works at a time
2. **Fair Scheduling** - Priority system ensures important tasks go first
3. **Automatic Coordination** - No manual management needed
4. **Visual Feedback** - See what's running and what's waiting
5. **Error Handling** - If a module fails, queue continues with next task

---

## 🎯 Your Answer

> **"If we are farming then in same time we need to scav but we cant? Normally wait 3 minutes than scav. no?"**

✅ **Correct!** 

- Farm is working (3 minutes)
- Scavenger wants to start → **Waits in queue**
- Farm finishes after 3 minutes
- Scavenger **immediately starts**

**The wait time depends on:**
- Current task duration (e.g., farm takes 3 minutes)
- Number of tasks ahead in queue
- Priority (higher priority = goes first)

---

## 🚀 Implementation Status

✅ Queue System implemented in Master Control Panel  
✅ Priority levels configured (Farm → Scavenger → Builder → Recruiter)  
✅ UI displays current task and queue  
✅ Console logging for debugging  
✅ Error handling included  
✅ Integration guide created  

**Next step:** Integrate queue system into each module! 📝

