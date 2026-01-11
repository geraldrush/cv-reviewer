const fs = require('fs');
const path = require('path');

class UserStorage {
  constructor() {
    this.filePath = path.join(__dirname, '../data/users.json');
    this.ensureDataDir();
    this.users = this.loadUsers();
  }

  ensureDataDir() {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  loadUsers() {
    try {
      if (fs.existsSync(this.filePath)) {
        return JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
    return {};
  }

  saveUsers() {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.users, null, 2));
    } catch (error) {
      console.error('Error saving users:', error);
    }
  }

  setUser(userId, userData) {
    this.users[userId] = { ...this.users[userId], ...userData, updatedAt: new Date() };
    this.saveUsers();
  }

  getUser(userId) {
    return this.users[userId];
  }

  setPremium(userId, isPaid) {
    if (this.users[userId]) {
      this.users[userId].isPaid = isPaid;
      this.users[userId].paidAt = isPaid ? new Date() : null;
      this.saveUsers();
    }
  }
}

module.exports = UserStorage;