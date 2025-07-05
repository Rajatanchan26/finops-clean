const WebSocket = require('ws');
const jwt = require('jsonwebtoken');

class NotificationService {
  constructor(server) {
    this.wss = new WebSocket.Server({ server });
    this.clients = new Map(); // userId -> WebSocket connection
    this.notifications = new Map(); // userId -> notifications array
    
    this.setupWebSocket();
  }

  setupWebSocket() {
    this.wss.on('connection', (ws, req) => {
      console.log('New WebSocket connection');
      
      // Extract token from query string
      const url = new URL(req.url, 'http://localhost');
      const token = url.searchParams.get('token');
      
      if (!token) {
        ws.close(1008, 'No token provided');
        return;
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;
        
        // Store client connection
        this.clients.set(userId, ws);
        
        // Send pending notifications
        this.sendPendingNotifications(userId);
        
        ws.on('close', () => {
          this.clients.delete(userId);
          console.log(`Client ${userId} disconnected`);
        });
        
        ws.on('error', (error) => {
          console.error('WebSocket error:', error);
          this.clients.delete(userId);
        });
        
        console.log(`Client ${userId} connected`);
        
      } catch (error) {
        console.error('Token verification failed:', error);
        ws.close(1008, 'Invalid token');
      }
    });
  }

  // Send notification to specific user
  sendNotification(userId, notification) {
    const ws = this.clients.get(userId);
    
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(notification));
    } else {
      // Store notification for when user comes online
      this.storeNotification(userId, notification);
    }
  }

  // Store notification for offline users
  storeNotification(userId, notification) {
    if (!this.notifications.has(userId)) {
      this.notifications.set(userId, []);
    }
    
    const userNotifications = this.notifications.get(userId);
    userNotifications.push({
      ...notification,
      timestamp: new Date().toISOString(),
      read: false
    });
    
    // Keep only last 50 notifications per user
    if (userNotifications.length > 50) {
      userNotifications.splice(0, userNotifications.length - 50);
    }
  }

  // Send pending notifications when user connects
  sendPendingNotifications(userId) {
    const notifications = this.notifications.get(userId) || [];
    const unreadNotifications = notifications.filter(n => !n.read);
    
    if (unreadNotifications.length > 0) {
      const ws = this.clients.get(userId);
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'pending_notifications',
          notifications: unreadNotifications
        }));
      }
    }
  }

  // Mark notification as read
  markAsRead(userId, notificationId) {
    const notifications = this.notifications.get(userId) || [];
    const notification = notifications.find(n => n.id === notificationId);
    
    if (notification) {
      notification.read = true;
    }
  }

  // Get user notifications
  getUserNotifications(userId) {
    return this.notifications.get(userId) || [];
  }

  // Clear old notifications
  clearOldNotifications(userId, daysOld = 30) {
    const notifications = this.notifications.get(userId) || [];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const filteredNotifications = notifications.filter(n => 
      new Date(n.timestamp) > cutoffDate
    );
    
    this.notifications.set(userId, filteredNotifications);
  }

  // Notification templates
  createInvoiceApprovedNotification(userId, invoiceNumber, amount) {
    return {
      id: `invoice_approved_${Date.now()}`,
      type: 'invoice_approved',
      title: 'Invoice Approved',
      message: `Invoice ${invoiceNumber} for $${amount.toLocaleString()} has been approved.`,
      data: {
        invoiceNumber,
        amount
      },
      priority: 'medium',
      timestamp: new Date().toISOString()
    };
  }

  createInvoiceRejectedNotification(userId, invoiceNumber, reason) {
    return {
      id: `invoice_rejected_${Date.now()}`,
      type: 'invoice_rejected',
      title: 'Invoice Rejected',
      message: `Invoice ${invoiceNumber} has been rejected. Reason: ${reason}`,
      data: {
        invoiceNumber,
        reason
      },
      priority: 'high',
      timestamp: new Date().toISOString()
    };
  }

  createBudgetAlertNotification(userId, department, budgetUsed, budgetTotal) {
    const percentage = (budgetUsed / budgetTotal) * 100;
    let priority = 'low';
    let title = 'Budget Update';
    
    if (percentage >= 90) {
      priority = 'high';
      title = 'Budget Alert - Critical';
    } else if (percentage >= 75) {
      priority = 'medium';
      title = 'Budget Alert - Warning';
    }
    
    return {
      id: `budget_alert_${Date.now()}`,
      type: 'budget_alert',
      title,
      message: `${department} department has used ${percentage.toFixed(1)}% of its budget ($${budgetUsed.toLocaleString()} / $${budgetTotal.toLocaleString()}).`,
      data: {
        department,
        budgetUsed,
        budgetTotal,
        percentage
      },
      priority,
      timestamp: new Date().toISOString()
    };
  }

  createCommissionNotification(userId, amount, period) {
    return {
      id: `commission_${Date.now()}`,
      type: 'commission_earned',
      title: 'Commission Earned',
      message: `You've earned $${amount.toLocaleString()} in commission for ${period}.`,
      data: {
        amount,
        period
      },
      priority: 'medium',
      timestamp: new Date().toISOString()
    };
  }

  createSystemNotification(userId, title, message, priority = 'low') {
    return {
      id: `system_${Date.now()}`,
      type: 'system',
      title,
      message,
      data: {},
      priority,
      timestamp: new Date().toISOString()
    };
  }

  // Broadcast to all connected clients
  broadcast(notification, filter = null) {
    this.clients.forEach((ws, userId) => {
      if (ws.readyState === WebSocket.OPEN) {
        if (!filter || filter(userId)) {
          ws.send(JSON.stringify(notification));
        }
      }
    });
  }

  // Broadcast to specific department
  broadcastToDepartment(department, notification) {
    this.clients.forEach((ws, userId) => {
      if (ws.readyState === WebSocket.OPEN) {
        // Note: In a real implementation, you'd need to check user's department
        // This is a simplified version
        ws.send(JSON.stringify(notification));
      }
    });
  }

  // Get connection stats
  getStats() {
    return {
      connectedClients: this.clients.size,
      totalNotifications: Array.from(this.notifications.values())
        .reduce((sum, notifications) => sum + notifications.length, 0),
      unreadNotifications: Array.from(this.notifications.values())
        .reduce((sum, notifications) => sum + notifications.filter(n => !n.read).length, 0)
    };
  }
}

module.exports = NotificationService; 