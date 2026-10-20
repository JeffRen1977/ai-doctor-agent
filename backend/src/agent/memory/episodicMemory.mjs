const CONDITION_PATTERNS = [
  /糖尿病|diabetes/i,
  /高血压|hypertension/i,
  /高血脂|hyperlipidemia/i,
  /冠心病|coronary/i,
  /哮喘|asthma/i,
  /甲状腺|thyroid/i,
  /痛风|gout/i,
  /贫血|anemia/i,
  /抑郁|depression/i,
  /焦虑症|anxiety disorder/i,
  /失眠症|insomnia/i,
  /胃炎|gastritis/i,
  /肾病|kidney disease|nephropathy/i,
];

const ALLERGY_RE = /(?:对(.{1,20})过敏|过敏.{0,5}(?:是|为|：|:)\s*(.+?)(?:[，。,.]|$)|allerg\w*\s+(?:to\s+)?(.+?)(?:[,.]|$))/i;

const GOAL_RE = /(?:目标|希望|想要|打算|goal|want to|plan to)\s*[：:是]?\s*(.+?)(?:[。，,.]|$)/i;

export class EpisodicMemory {
  constructor({ patientProfileRepo } = {}) {
    this.repo = patientProfileRepo || null;
  }

  async getProfile(userId) {
    if (!this.repo) return null;
    try {
      return await this.repo.getByUser(userId);
    } catch (err) {
      console.warn('⚠️ EpisodicMemory.getProfile failed:', err.message);
      return null;
    }
  }

  extractFacts(messages) {
    const conditions = new Set();
    const allergies = new Set();
    const goals = new Set();

    for (const msg of messages) {
      const text = msg.content || '';

      for (const pattern of CONDITION_PATTERNS) {
        const m = text.match(pattern);
        if (m) conditions.add(m[0]);
      }

      const allergyMatch = text.match(ALLERGY_RE);
      if (allergyMatch) {
        const allergen = (allergyMatch[1] || allergyMatch[2] || allergyMatch[3] || '').trim();
        if (allergen) allergies.add(allergen);
      }

      const goalMatch = text.match(GOAL_RE);
      if (goalMatch) {
        const goal = goalMatch[1].trim();
        if (goal.length >= 3 && goal.length <= 100) goals.add(goal);
      }
    }

    return {
      conditions: [...conditions],
      allergies: [...allergies],
      goals: [...goals],
    };
  }

  async updateFromConversation(userId, messages) {
    if (!this.repo || !messages || messages.length === 0) return;

    const facts = this.extractFacts(messages);
    const hasUpdates = facts.conditions.length > 0
      || facts.allergies.length > 0
      || facts.goals.length > 0;

    if (!hasUpdates) return;

    try {
      await this.repo.upsert(userId, {
        ...facts,
        lastUpdatedBy: 'agent',
      });
    } catch (err) {
      console.warn('⚠️ EpisodicMemory.updateFromConversation failed:', err.message);
    }
  }

  async deleteByUser(userId) {
    if (!this.repo) return;
    await this.repo.deleteByUser(userId);
  }
}
