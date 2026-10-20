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

const ALLERGY_RE = /(?:对(.{1,20}?)过敏|过敏.{0,5}(?:是|为|：|:)\s*(.+?)(?:[，。,.]|$)|allerg\w*\s+(?:to\s+)?(.+?)(?:[,.]|$))/i;

const GOAL_RE = /(?:目标|希望|想要|打算|goal|want to|plan to)\s*[：:是]?\s*(.+?)(?:[。，,.]|$)/i;

const SELF_CONDITION_RE = /我(?:有|得了|得过|患有|患了|确诊|被诊断)|我是.{0,8}患者|患有|确诊|诊断为|\bi (?:have|had|was diagnosed|am diagnosed|suffer)/i;
const NEGATION_RE = /没有|没得|未患|不是|否认|排除|\bnot\b|\bno\b|\bnever\b|don't have|do not have/i;
const ALLERGY_NEGATION_RE = /不过敏|没有过敏|无过敏|not allergic|no (?:known )?allerg/i;
const QUESTION_RE = /[？?]|吗|能不能|可不可以|是否|怎么|如何|为什么|什么|哪些/;
const OTHER_PERSON_RE = /妈妈|母亲|爸爸|父亲|爷爷|奶奶|外公|外婆|姥姥|姥爷|家人|亲戚|哥哥|姐姐|弟弟|妹妹|儿子|女儿|孩子|老婆|老公|丈夫|妻子|朋友|同事|\bmy (?:mother|mom|father|dad|parents?|brother|sister|son|daughter|wife|husband|friend)/i;

function splitClauses(text) {
  return text.split(/(?<=[，。！？；,.!?;\n])/).map((c) => c.trim()).filter(Boolean);
}

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
      if (msg.role !== 'user') continue;

      for (const clause of splitClauses(msg.content || '')) {
        if (QUESTION_RE.test(clause) || OTHER_PERSON_RE.test(clause)) continue;

        if (SELF_CONDITION_RE.test(clause) && !NEGATION_RE.test(clause)) {
          for (const pattern of CONDITION_PATTERNS) {
            const m = clause.match(pattern);
            if (m) conditions.add(m[0]);
          }
        }

        if (!ALLERGY_NEGATION_RE.test(clause)) {
          const allergyMatch = clause.match(ALLERGY_RE);
          if (allergyMatch) {
            const allergen = (allergyMatch[1] || allergyMatch[2] || allergyMatch[3] || '').trim();
            if (allergen) allergies.add(allergen);
          }
        }

        const goalMatch = clause.match(GOAL_RE);
        if (goalMatch) {
          const goal = goalMatch[1].trim();
          if (goal.length >= 3 && goal.length <= 100) goals.add(goal);
        }
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
