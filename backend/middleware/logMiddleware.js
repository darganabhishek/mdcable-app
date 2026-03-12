const { ActivityLog } = require('../models');

/**
 * Record a system activity
 * @param {string} userId - ID of the user performing the action
 * @param {string} action - Action name (e.g., 'CREATE_CUSTOMER')
 * @param {string} targetId - ID of the affected resource
 * @param {string} targetType - Type of the affected resource ('Customer', 'Payment', etc.)
 * @param {object} details - Additional structured data
 * @param {string} ip - IP address of the requester
 */
const logActivity = async (userId, action, targetId = null, targetType = null, details = {}, ip = null) => {
  try {
    await ActivityLog.create({
      user_id: userId,
      action,
      target_id: String(targetId),
      target_type: targetType,
      details,
      ip_address: ip
    });
  } catch (error) {
    console.error('Logging Error:', error);
    // Don't throw - we don't want logging failure to break the main application flow
  }
};

module.exports = { logActivity };
