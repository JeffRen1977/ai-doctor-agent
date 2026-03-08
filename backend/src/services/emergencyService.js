/**
 * 紧急求助服务
 */

const { createEmergencyContact, createEmergencyAlert } = require('../models/emergencyModels');
const reportService = require('./reportService');
const { emergencyContactRepo, emergencyAlertRepo } = require('../repositories');

class EmergencyService {
  constructor() {
    console.log('🚨 Emergency Service initialized');
  }

  async createEmergencyContact(userEmail, contactData) {
    try {
      const contact = createEmergencyContact({ ...contactData, userEmail });
      if (contact.isPrimary) await emergencyContactRepo.unsetPrimaryForUser(userEmail);
      await emergencyContactRepo.saveContact(contact);
      console.log(`✅ Emergency contact created: ${contact.contactId}`);
      return { success: true, contact };
    } catch (error) {
      console.error('❌ Error creating emergency contact:', error);
      return { success: false, error: error.message };
    }
  }

  async getEmergencyContact(contactId) {
    try {
      const contact = await emergencyContactRepo.getContact(contactId);
      if (!contact) return { success: false, error: 'Emergency contact not found' };
      return { success: true, contact };
    } catch (error) {
      console.error('❌ Error getting emergency contact:', error);
      return { success: false, error: error.message };
    }
  }

  async getUserEmergencyContacts(userEmail) {
    try {
      const contacts = await emergencyContactRepo.listByUser(userEmail);
      return { success: true, contacts };
    } catch (error) {
      console.error('❌ Error getting user emergency contacts:', error);
      return { success: false, error: error.message };
    }
  }

  async updateEmergencyContact(contactId, updates) {
    try {
      const current = await emergencyContactRepo.getContact(contactId);
      if (!current) return { success: false, error: 'Emergency contact not found' };
      if (updates.isPrimary && !current.isPrimary) await emergencyContactRepo.unsetPrimaryForUser(current.userEmail);
      await emergencyContactRepo.updateContact(contactId, { ...updates, updatedAt: new Date().toISOString() });
      return { success: true, contactId };
    } catch (error) {
      console.error('❌ Error updating emergency contact:', error);
      return { success: false, error: error.message };
    }
  }

  async deleteEmergencyContact(contactId) {
    try {
      await emergencyContactRepo.deleteContact(contactId);
      return { success: true };
    } catch (error) {
      console.error('❌ Error deleting emergency contact:', error);
      return { success: false, error: error.message };
    }
  }

  async triggerEmergencyAlert(userEmail, triggerType, options = {}) {
    try {
      console.log(`🚨 Triggering emergency alert for user: ${userEmail}, type: ${triggerType}`);
      const severity = this.determineSeverity(triggerType, options);
      const alert = createEmergencyAlert({
        userEmail,
        triggerType,
        severity,
        location: options.location || null,
        message: options.message || this.getDefaultMessage(triggerType),
        details: options.details || {}
      });
      await emergencyAlertRepo.saveAlert(alert);
      const notificationResult = await this.notifyEmergencyContacts(userEmail, alert);
      if (severity === 'high' || severity === 'critical') {
        await this.sendHealthReportToContacts(userEmail, alert);
      }
      console.log(`✅ Emergency alert triggered: ${alert.alertId}`);
      return {
        success: true,
        alert: { ...alert, contactsNotified: notificationResult.contactsNotified || [] }
      };
    } catch (error) {
      console.error('❌ Error triggering emergency alert:', error);
      return { success: false, error: error.message };
    }
  }

  async getUserEmergencyAlerts(userEmail, filters = {}) {
    try {
      const alerts = await emergencyAlertRepo.listByUser(userEmail, {
        status: filters.status,
        severity: filters.severity,
        limit: filters.limit
      });
      return { success: true, alerts };
    } catch (error) {
      console.error('❌ Error getting user emergency alerts:', error);
      return { success: false, error: error.message };
    }
  }

  async updateEmergencyAlert(alertId, updates) {
    try {
      const existing = await emergencyAlertRepo.getAlert(alertId);
      if (!existing) return { success: false, error: 'Emergency alert not found' };
      if (updates.status === 'resolved' && !updates.resolvedAt) updates.resolvedAt = new Date().toISOString();
      await emergencyAlertRepo.updateAlert(alertId, updates);
      return { success: true, alertId };
    } catch (error) {
      console.error('❌ Error updating emergency alert:', error);
      return { success: false, error: error.message };
    }
  }

  async notifyEmergencyContacts(userEmail, alert) {
    try {
      const contactsResult = await this.getUserEmergencyContacts(userEmail);
      if (!contactsResult.success || !contactsResult.contacts.length) {
        console.warn('⚠️ No emergency contacts found for user:', userEmail);
        return { contactsNotified: [] };
      }
      const contactsToNotify = contactsResult.contacts.filter((c) => c.notificationEnabled);
      const notifiedContactIds = contactsToNotify.map((c) => c.contactId);
      for (const contact of contactsToNotify) {
        console.log(`📞 Notifying emergency contact: ${contact.name} (${contact.phone})`);
        console.log(`   Alert: ${alert.message || 'Emergency alert triggered'}`);
        if (alert.location) console.log(`   Location: ${alert.location.address || `${alert.location.latitude}, ${alert.location.longitude}`}`);
      }
      if (alert.alertId) {
        await emergencyAlertRepo.updateAlert(alert.alertId, { contactsNotified: notifiedContactIds });
      }
      return { contactsNotified: notifiedContactIds, totalContacts: contactsToNotify.length };
    } catch (error) {
      console.error('❌ Error notifying emergency contacts:', error);
      return { contactsNotified: [] };
    }
  }

  async sendEmergencyMessage(userEmail, messageData) {
    try {
      const contactsResult = await this.getUserEmergencyContacts(userEmail);
      if (!contactsResult.success || !contactsResult.contacts.length) {
        return { success: false, error: 'No emergency contacts found' };
      }
      const message = messageData.message || 'Emergency message from user';
      const contactsToNotify = contactsResult.contacts.filter((c) => c.notificationEnabled);
      for (const contact of contactsToNotify) {
        console.log(`📨 Sending emergency message to ${contact.name} (${contact.phone}): ${message}`);
      }
      return { success: true, message: 'Emergency messages sent', contactsNotified: contactsToNotify.length };
    } catch (error) {
      console.error('❌ Error sending emergency message:', error);
      return { success: false, error: error.message };
    }
  }

  async sendHealthReportToContacts(userEmail, alert) {
    try {
      const reportResult = await reportService.generateComprehensiveReport(userEmail, {
        title: 'Emergency Health Report',
        period: {
          start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          end: new Date().toISOString()
        }
      });
      if (reportResult.success && alert.alertId) {
        console.log(`📄 Health report generated for emergency: ${reportResult.report.reportId}`);
        await emergencyAlertRepo.updateAlert(alert.alertId, { healthReportSent: true });
      }
    } catch (error) {
      console.error('❌ Error sending health report to contacts:', error);
    }
  }

  determineSeverity(triggerType, options) {
    switch (triggerType) {
      case 'fallDetection':
      case 'severeArrhythmia':
      case 'hypoglycemiaEmergency':
        return 'critical';
      case 'manualTrigger':
        return options.severity || 'high';
      default:
        return 'medium';
    }
  }

  getDefaultMessage(triggerType) {
    const messages = {
      fallDetection: 'Fall detected! Emergency assistance may be needed.',
      severeArrhythmia: 'Severe arrhythmia detected! Immediate medical attention required.',
      hypoglycemiaEmergency: 'Severe hypoglycemia detected! Immediate medical attention required.',
      manualTrigger: 'Emergency alert manually triggered by user.',
      other: 'Emergency alert triggered.'
    };
    return messages[triggerType] || messages.other;
  }
}

module.exports = new EmergencyService();
