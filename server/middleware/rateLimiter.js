/**
 * Daily Generation Rate Limiter
 * Implements 20 free generations per day per user
 * Resets at midnight UTC
 */

class DailyRateLimiter {
  constructor(db) {
    this.db = db;
    this.defaultLimit = 20;
    this.resetHour = 0; // Midnight UTC
  }

  /**
   * Check if user can make a generation
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Result with allowed status and remaining count
   */
  async checkLimit(userId) {
    const user = await this.db.findUserById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    // Pro/Enterprise users have unlimited generations
    if (user.plan === 'pro' || user.plan === 'enterprise') {
      return {
        allowed: true,
        remaining: Infinity,
        limit: Infinity,
        resetAt: null,
        currentUsage: 0
      };
    }

    // Initialize daily generations tracking if needed
    if (!user.dailyGenerations) {
      user.dailyGenerations = {
        count: 0,
        limit: this.defaultLimit,
        resetAt: this.getNextResetTime().toISOString(),
        lastReset: new Date().toISOString()
      };
    }

    // Check if we need to reset the daily counter
    const now = new Date();
    const resetAt = new Date(user.dailyGenerations.resetAt);
    
    if (now >= resetAt) {
      // Reset the counter
      user.dailyGenerations.count = 0;
      user.dailyGenerations.resetAt = this.getNextResetTime().toISOString();
      user.dailyGenerations.lastReset = now.toISOString();
      
      // Save to database
      await this.db.updateUser(userId, {
        dailyGenerations: user.dailyGenerations
      });
    }

    const currentCount = user.dailyGenerations.count;
    const limit = user.dailyGenerations.limit || this.defaultLimit;
    const remaining = Math.max(0, limit - currentCount);

    return {
      allowed: currentCount < limit,
      remaining,
      limit,
      resetAt: user.dailyGenerations.resetAt,
      currentUsage: currentCount
    };
  }

  /**
   * Increment generation count for user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Updated limit info
   */
  async incrementUsage(userId) {
    const user = await this.db.findUserById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    // Skip for paid users
    if (user.plan === 'pro' || user.plan === 'enterprise') {
      return {
        allowed: true,
        remaining: Infinity,
        limit: Infinity
      };
    }

    // Ensure dailyGenerations object exists
    if (!user.dailyGenerations) {
      user.dailyGenerations = {
        count: 0,
        limit: this.defaultLimit,
        resetAt: this.getNextResetTime().toISOString()
      };
    }

    // Check if we need to reset first
    const now = new Date();
    const resetAt = new Date(user.dailyGenerations.resetAt);
    
    if (now >= resetAt) {
      user.dailyGenerations.count = 0;
      user.dailyGenerations.resetAt = this.getNextResetTime().toISOString();
    }

    // Increment counter
    user.dailyGenerations.count++;
    
    // Save to database
    await this.db.updateUser(userId, {
      dailyGenerations: user.dailyGenerations
    });

    const remaining = Math.max(0, user.dailyGenerations.limit - user.dailyGenerations.count);

    return {
      allowed: user.dailyGenerations.count <= user.dailyGenerations.limit,
      remaining,
      limit: user.dailyGenerations.limit,
      resetAt: user.dailyGenerations.resetAt,
      currentUsage: user.dailyGenerations.count
    };
  }

  /**
   * Get user's current generation status
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Current status
   */
  async getStatus(userId) {
    const limitInfo = await this.checkLimit(userId);
    
    // Format reset time
    const resetAt = new Date(limitInfo.resetAt);
    const now = new Date();
    const hoursUntilReset = Math.ceil((resetAt - now) / (1000 * 60 * 60));
    
    return {
      ...limitInfo,
      hoursUntilReset,
      formattedResetTime: resetAt.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
      })
    };
  }

  /**
   * Calculate next reset time (midnight UTC)
   * @returns {Date} - Next reset time
   */
  getNextResetTime() {
    const now = new Date();
    const tomorrow = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + 1,
      this.resetHour, // Midnight UTC
      0,
      0
    ));
    return tomorrow;
  }

  /**
   * Admin: Get usage statistics
   * @returns {Promise<Object>} - Usage stats
   */
  async getStats() {
    const allUsers = await this.db.getAllUsers();
    
    const stats = {
      totalUsers: allUsers.length,
      freeUsers: allUsers.filter(u => !u.plan || u.plan === 'free').length,
      proUsers: allUsers.filter(u => u.plan === 'pro').length,
      enterpriseUsers: allUsers.filter(u => u.plan === 'enterprise').length,
      totalGenerationsToday: 0,
      averagePerUser: 0,
      limitReached: 0
    };

    let totalUsed = 0;
    let usersAtLimit = 0;

    for (const user of allUsers) {
      if (user.dailyGenerations) {
        // Check if today's count
        const lastReset = new Date(user.dailyGenerations.lastReset || 0);
        const now = new Date();
        const isToday = lastReset.toDateString() === now.toDateString();
        
        if (isToday) {
          totalUsed += user.dailyGenerations.count;
          
          if (user.dailyGenerations.count >= (user.dailyGenerations.limit || this.defaultLimit)) {
            usersAtLimit++;
          }
        }
      }
    }

    stats.totalGenerationsToday = totalUsed;
    stats.averagePerUser = stats.freeUsers > 0 ? totalUsed / stats.freeUsers : 0;
    stats.limitReached = usersAtLimit;

    return stats;
  }

  /**
   * Admin: Reset a user's daily counter
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} - Success status
   */
  async resetUserCounter(userId) {
    const user = await this.db.findUserById(userId);
    
    if (!user) {
      return false;
    }

    await this.db.updateUser(userId, {
      dailyGenerations: {
        count: 0,
        limit: this.defaultLimit,
        resetAt: this.getNextResetTime().toISOString(),
        lastReset: new Date().toISOString()
      }
    });

    return true;
  }

  /**
   * Admin: Change user's generation limit
   * @param {string} userId - User ID
   * @param {number} newLimit - New daily limit
   * @returns {Promise<boolean>} - Success status
   */
  async setUserLimit(userId, newLimit) {
    const user = await this.db.findUserById(userId);
    
    if (!user) {
      return false;
    }

    const dailyGenerations = user.dailyGenerations || {
      count: 0,
      resetAt: this.getNextResetTime().toISOString()
    };

    dailyGenerations.limit = newLimit;

    await this.db.updateUser(userId, {
      dailyGenerations
    });

    return true;
  }
}

/**
 * Express middleware for rate limiting
 */
function createRateLimitMiddleware(limiter) {
  return async (req, res, next) => {
    try {
      // Skip if no user (public routes)
      if (!req.user) {
        return next();
      }

      const userId = req.user.userId;
      
      // Check limit before processing
      const limitInfo = await limiter.checkLimit(userId);
      
      if (!limitInfo.allowed) {
        const resetTime = new Date(limitInfo.resetAt);
        const hoursUntil = Math.ceil((resetTime - new Date()) / (1000 * 60 * 60));
        
        return res.status(429).json({
          error: 'Daily generation limit reached',
          message: `You have used all ${limitInfo.limit} free generations for today.`,
          limit: limitInfo.limit,
          used: limitInfo.currentUsage,
          remaining: 0,
          resetAt: limitInfo.resetAt,
          hoursUntilReset: hoursUntil,
          upgradeUrl: '/upgrade' // Link to upgrade page
        });
      }

      // Attach limit info to request for later use
      req.generationLimit = limitInfo;
      
      next();
    } catch (error) {
      console.error('Rate limit check failed:', error);
      // Fail open - allow request but log error
      next();
    }
  };
}

/**
 * Middleware to increment usage after successful generation
 */
function createUsageTracker(limiter) {
  return async (req, res, next) => {
    // Store original json method
    const originalJson = res.json.bind(res);
    
    // Override json method to track usage on successful generation
    res.json = function(data) {
      // Check if this was a successful generation
      if (data && data.success && req.user) {
        // Increment usage asynchronously (don't block response)
        limiter.incrementUsage(req.user.userId)
          .then(updated => {
            // Add usage info to response
            data.dailyGenerationsRemaining = updated.remaining;
            data.dailyGenerationsLimit = updated.limit;
            data.dailyGenerationsResetAt = updated.resetAt;
            
            originalJson(data);
          })
          .catch(err => {
            console.error('Failed to track usage:', err);
            originalJson(data);
          });
      } else {
        originalJson(data);
      }
    };
    
    next();
  };
}

module.exports = {
  DailyRateLimiter,
  createRateLimitMiddleware,
  createUsageTracker
};
