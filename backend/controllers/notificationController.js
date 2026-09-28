const { AppNotification, sequelize } = require('../models');
const { Op } = require('sequelize');

exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const userCenter = req.user.center; // mapped from healthCentre

    const notifications = await AppNotification.findAll({
      where: {
        [Op.or]: [
          { userId: userId },
          { 
            recipientRole: userRole, 
            recipientCenter: userCenter 
          },
          {
            recipientRole: userRole,
            recipientCenter: null
          }
        ]
      },
      order: [['timestamp', 'DESC']],
      limit: 50
    });

    res.json({ success: true, data: notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, error: 'Server error fetching notifications' });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const userCenter = req.user.center;

    const count = await AppNotification.count({
      where: {
        read: false,
        [Op.or]: [
          { userId: userId },
          { recipientRole: userRole, recipientCenter: userCenter },
          { recipientRole: userRole, recipientCenter: null }
        ]
      }
    });

    res.json({ success: true, data: { count } });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    const userCenter = req.user.center;

    const notification = await AppNotification.findOne({
      where: {
        id,
        [Op.or]: [
          { userId: userId },
          { recipientRole: userRole, recipientCenter: userCenter },
          { recipientRole: userRole, recipientCenter: null }
        ]
      }
    });

    if (!notification) {
      return res.status(403).json({ success: false, error: 'Unauthorized or not found' });
    }

    notification.read = true;
    await notification.save();

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking as read:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const userCenter = req.user.center;

    await AppNotification.update(
      { read: true },
      {
        where: {
          read: false,
          [Op.or]: [
            { userId: userId },
            { recipientRole: userRole, recipientCenter: userCenter },
            { recipientRole: userRole, recipientCenter: null }
          ]
        }
      }
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking all as read:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};
