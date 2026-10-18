export class ToolRegistry {
  constructor() {
    this.tools = new Map();
    this.permissions = new Map();
  }

  register(name, toolObj, permission = 'read') {
    this.tools.set(name, toolObj);
    this.permissions.set(name, permission);
  }

  get(name) {
    return this.tools.get(name);
  }

  getForSkill(skill) {
    const subset = {};
    for (const name of skill.allowedTools) {
      const t = this.tools.get(name);
      if (t) subset[name] = t;
    }
    return subset;
  }

  getPermission(name) {
    return this.permissions.get(name) || 'read';
  }

  isWriteTool(name) {
    return this.permissions.get(name) === 'write';
  }

  list() {
    return [...this.tools.keys()];
  }
}
