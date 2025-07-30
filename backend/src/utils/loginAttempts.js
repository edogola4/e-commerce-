// src/utils/loginAttempts.js (Simple memory-only version)

// In-memory store for login attempts
const attemptStore = new Map();

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of attemptStore.entries()) {
    if (now - data.lastAttempt > 15 * 60 * 1000) { // 15 minutes
      attemptStore.delete(key);
    }
  }
}, 5 * 60 * 1000); // Clean every 5 minutes

const getAttempts = (identifier) => {
  const data = attemptStore.get(identifier);
  if (!data) {
    return { count: 0, lastAttempt: null };
  }
  return data;
};

const incrementAttempts = (identifier) => {
  const current = getAttempts(identifier);
  const updated = {
    count: current.count + 1,
    lastAttempt: Date.now()
  };
  attemptStore.set(identifier, updated);
  return updated;
};

const resetAttempts = (identifier) => {
  attemptStore.delete(identifier);
};

const isBlocked = (identifier, maxAttempts = 5, blockDuration = 900000) => { // 15 minutes in ms
  const attempts = getAttempts(identifier);
  
  if (attempts.count >= maxAttempts && attempts.lastAttempt) {
    const timeDiff = Date.now() - attempts.lastAttempt;
    return timeDiff < blockDuration;
  }
  
  return false;
};

const getRemainingBlockTime = (identifier, maxAttempts = 5, blockDuration = 900000) => {
  const attempts = getAttempts(identifier);
  
  if (attempts.count >= maxAttempts && attempts.lastAttempt) {
    const timeDiff = Date.now() - attempts.lastAttempt;
    const remaining = blockDuration - timeDiff;
    
    return remaining > 0 ? Math.ceil(remaining / 1000) : 0; // Return seconds
  }
  
  return 0;
};

// Export as an object with loginAttemptTracker property to match the import
const loginAttemptTracker = {
  getAttempts,
  incrementAttempts,
  resetAttempts,
  isBlocked,
  getRemainingBlockTime
};

module.exports = {
  loginAttemptTracker
};