const { OAuth2Client } = require('google-auth-library');
const UserStorage = require('./UserStorage');

class AuthService {
  constructor() {
    this.client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    this.storage = new UserStorage();
  }

  async verifyGoogleToken(token) {
    try {
      const ticket = await this.client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      
      const payload = ticket.getPayload();
      const user = {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
        isPaid: false,
        createdAt: new Date()
      };

      // Check if user exists, if not create new
      const existingUser = this.storage.getUser(user.id);
      if (!existingUser) {
        this.storage.setUser(user.id, user);
      } else {
        // Update login time but keep payment status
        this.storage.setUser(user.id, { ...user, isPaid: existingUser.isPaid, paidAt: existingUser.paidAt });
      }

      return this.storage.getUser(user.id);
    } catch (error) {
      throw new Error('Invalid Google token');
    }
  }

  getUser(userId) {
    return this.storage.getUser(userId);
  }

  updateUserPaymentStatus(userId, isPaid) {
    this.storage.setPremium(userId, isPaid);
    return this.storage.getUser(userId);
  }

  canRewriteCV(userId) {
    const user = this.storage.getUser(userId);
    return user && user.isPaid;
  }
}

module.exports = AuthService;