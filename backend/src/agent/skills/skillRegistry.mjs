export class SkillRegistry {
  constructor() {
    this.skills = new Map();
    this._default = null;
  }

  register(skill) {
    if (!skill?.name) throw new Error('Skill must have a name');
    if (!Array.isArray(skill.allowedTools)) throw new Error(`Skill "${skill.name}" must have allowedTools array`);
    this.skills.set(skill.name, skill);
    if (skill.isDefault || !this._default) {
      this._default = skill.name;
    }
  }

  get(name) {
    return this.skills.get(name);
  }

  getDefault() {
    return this.skills.get(this._default);
  }

  has(name) {
    return this.skills.has(name);
  }

  list() {
    return [...this.skills.keys()];
  }
}
