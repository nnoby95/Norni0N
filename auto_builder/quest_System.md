Quest System API Documentation
1. Main Quest Object: Quests
The global Quests object manages all quests in the game.
Key Methods:
javascript// Get all available quests
Quests.getAll()  // Returns object with quest IDs as keys

// Get specific quest by ID
Quests.getQuest(questId)  // Returns quest object

// Check if quest exists
Quests.hasQuest(questId)  // Returns boolean

// Handle quest button actions
Quests.handleButton(questId, action)
2. Quest Data Structure
Each quest has these properties (accessed via quest.getData()):
javascript{
  id: 1205,                          // Quest ID
  title: "Parancsodra!",            // Quest title
  state: "active",                   // Quest state
  finished: true,                    // Is quest completed?
  goals_completed: 1,                // Number of goals done
  goals_total: 1,                    // Total goals
  rewards: [],                       // Reward objects
  rewards_html: [],                  // HTML for rewards
  can_be_skipped: false,            // Can skip?
  objective: "...",                  // Quest description
  goals_html: [...]                 // Goal details with images
}
3. Finding Collectable Quests
javascriptfunction getCompletedQuests() {
  const allQuests = Quests.getAll();
  const completed = [];
  
  Object.keys(allQuests).forEach(id => {
    const quest = Quests.getQuest(id);
    const data = quest.getData();
    
    // Quest is finished and can be collected
    if (data.finished && data.state === 'active') {
      completed.push({
        id: data.id,
        title: data.title,
        rewards: data.rewards
      });
    }
  });
  
  return completed;
}
4. Current Completed Quests in Your Game
I found these quests ready to collect:

Quest 1210: "Hadsereg fejlesztése" (Army Development)
Quest 1800: "Folytasd a toborzást" (Continue Recruiting)
Quest 1900: "A kutatás a kulcsa mindennek" (Research is Key)

5. Completing/Collecting Quests
javascript// To complete a quest
const quest = Quests.getQuest(questId);
quest.complete();  // Triggers quest completion
6. Integration with Your Auto Builder
Here's how to add quest auto-completion to your script:
javascript// Add this to your auto builder
function autoCompleteQuests() {
  const allQuests = Quests.getAll();
  let collected = 0;
  
  Object.keys(allQuests).forEach(id => {
    const quest = Quests.getQuest(id);
    const data = quest.getData();
    
    // If quest is finished, try to complete it
    if (data.finished && data.state === 'active') {
      console.log(`Completing quest: ${data.title}`);
      quest.complete();
      collected++;
    }
  });
  
  return collected;
}

// Run periodically
setInterval(() => {
  const completed = autoCompleteQuests();
  if (completed > 0) {
    console.log(`Auto-collected ${completed} quest rewards!`);
  }
}, 30000); // Check every 30 seconds
7. Resource Collection Feature
For collecting resources from quests:
javascriptfunction checkQuestRewards() {
  const allQuests = Quests.getAll();
  const questsWithResources = [];
  
  Object.keys(allQuests).forEach(id => {
    const quest = Quests.getQuest(id);
    const data = quest.getData();
    
    // Check if rewards contain resources
    if (data.rewards && data.rewards.length > 0) {
      data.rewards.forEach(reward => {
        if (reward.wood || reward.stone || reward.iron) {
          questsWithResources.push({
            questId: id,
            title: data.title,
            resources: reward
          });
        }
      });
    }
  });
  
  return questsWithResources;
}
8. Integration Example for Your Auto Builder
javascript// Add to your existing auto builder script
class QuestManager {
  constructor() {
    this.checkInterval = 30000; // 30 seconds
    this.start();
  }
  
  start() {
    setInterval(() => this.processQuests(), this.checkInterval);
  }
  
  processQuests() {
    const completed = this.collectCompletedQuests();
    console.log(`[Quest Manager] Collected ${completed} quests`);
  }
  
  collectCompletedQuests() {
    if (typeof Quests === 'undefined') return 0;
    
    const allQuests = Quests.getAll();
    let count = 0;
    
    Object.keys(allQuests).forEach(id => {
      const quest = Quests.getQuest(id);
      const data = quest.getData();
      
      if (data.finished && data.state === 'active') {
        try {
          quest.complete();
          count++;
          console.log(`✓ Collected: ${data.title}`);
        } catch (e) {
          console.error(`✗ Failed to collect quest ${id}:`, e);
        }
      }
    });
    
    return count;
  }
  
  getAvailableResources() {
    // Check what resources can be collected from pending quests
    const allQuests = Quests.getAll();
    const resources = { wood: 0, stone: 0, iron: 0 };
    
    Object.keys(allQuests).forEach(id => {
      const quest = Quests.getQuest(id);
      const data = quest.getData();
      
      if (data.finished) {
        data.rewards.forEach(reward => {
          if (reward.wood) resources.wood += reward.wood;
          if (reward.stone) resources.stone += reward.stone;
          if (reward.iron) resources.iron += reward.iron;
        });
      }
    });
    
    return resources;
  }
}

// Initialize quest manager
const questManager = new QuestManager();