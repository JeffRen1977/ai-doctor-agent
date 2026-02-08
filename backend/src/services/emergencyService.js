/**
 * 紧急求助服务
 */

const { db } = require('../config/firebase');
const { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, query, where, orderBy, limit, getDocs } = require('firebase/firestore');
const { createEmergencyContact, createEmergencyAlert } = require('../models/emergencyModels');
const reportService = require('./reportService');

class EmergencyService {
  constructor() {
    console.log('🚨 Emergency Service initialized');
  }

  // ========== 紧急联系人管理 ==========

  /**
   * 创建紧急联系人
   * @param {string} userEmail 用户邮箱
   * @param {Object} contactData 联系人数据
   * @returns {Promise<Object>} 结果
   */
  async createEmergencyContact(userEmail, contactData) {
    try {
      const contact = createEmergencyContact({
        ...contactData,
        userEmail: userEmail
      });

      // 如果设置为主要联系人，取消其他主要联系人
      if (contact.isPrimary) {
        await this.unsetPrimaryContacts(userEmail);
      }

      // 保存到Firestore
      const contactRef = doc(collection(db, 'emergencyContacts'), contact.contactId);
      await setDoc(contactRef, contact);

      console.log(`✅ Emergency contact created: ${contact.contactId}`);
      return {
        success: true,
        contact: contact
      };
    } catch (error) {
      console.error('❌ Error creating emergency contact:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 获取紧急联系人
   * @param {string} contactId 联系人ID
   * @returns {Promise<Object>} 联系人对象
   */
  async getEmergencyContact(contactId) {
    try {
      const contactRef = doc(db, 'emergencyContacts', contactId);
      const contactDoc = await getDoc(contactRef);

      if (!contactDoc.exists()) {
        return { success: false, error: 'Emergency contact not found' };
      }

      return {
        success: true,
        contact: contactDoc.data()
      };
    } catch (error) {
      console.error('❌ Error getting emergency contact:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 获取用户的所有紧急联系人
   * @param {string} userEmail 用户邮箱
   * @returns {Promise<Object>} 联系人列表
   */
  async getUserEmergencyContacts(userEmail) {
    try {
      const contactsRef = collection(db, 'emergencyContacts');
      const q = query(
        contactsRef,
        where('userEmail', '==', userEmail),
        orderBy('isPrimary', 'desc'),
        orderBy('createdAt', 'desc')
      );

      let querySnapshot;
      try {
        querySnapshot = await getDocs(q);
      } catch (error) {
        // 如果索引不存在，使用fallback查询
        console.warn('⚠️ Index not found, using fallback query');
        const fallbackQ = query(contactsRef, where('userEmail', '==', userEmail));
        querySnapshot = await getDocs(fallbackQ);
      }

      let contacts = querySnapshot.docs.map(doc => ({
        contactId: doc.id,
        ...doc.data()
      }));

      // 如果无法使用orderBy，在内存中排序
      contacts.sort((a, b) => {
        if (a.isPrimary !== b.isPrimary) {
          return b.isPrimary - a.isPrimary; // 主要联系人优先
        }
        return new Date(b.createdAt) - new Date(a.createdAt);
      });

      return {
        success: true,
        contacts: contacts
      };
    } catch (error) {
      console.error('❌ Error getting user emergency contacts:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 更新紧急联系人
   * @param {string} contactId 联系人ID
   * @param {Object} updates 更新数据
   * @returns {Promise<Object>} 结果
   */
  async updateEmergencyContact(contactId, updates) {
    try {
      const contactRef = doc(db, 'emergencyContacts', contactId);
      const contactDoc = await getDoc(contactRef);

      if (!contactDoc.exists()) {
        return { success: false, error: 'Emergency contact not found' };
      }

      const currentContact = contactDoc.data();

      // 如果设置为主要联系人，取消其他主要联系人
      if (updates.isPrimary && !currentContact.isPrimary) {
        await this.unsetPrimaryContacts(currentContact.userEmail);
      }

      await updateDoc(contactRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      });

      return { success: true, contactId: contactId };
    } catch (error) {
      console.error('❌ Error updating emergency contact:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 删除紧急联系人
   * @param {string} contactId 联系人ID
   * @returns {Promise<Object>} 结果
   */
  async deleteEmergencyContact(contactId) {
    try {
      const contactRef = doc(db, 'emergencyContacts', contactId);
      await deleteDoc(contactRef);

      return { success: true };
    } catch (error) {
      console.error('❌ Error deleting emergency contact:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 取消所有主要联系人
   * @param {string} userEmail 用户邮箱
   */
  async unsetPrimaryContacts(userEmail) {
    try {
      const contactsRef = collection(db, 'emergencyContacts');
      const q = query(
        contactsRef,
        where('userEmail', '==', userEmail),
        where('isPrimary', '==', true)
      );

      const querySnapshot = await getDocs(q);
      const updatePromises = querySnapshot.docs.map(doc => {
        return updateDoc(doc.ref, {
          isPrimary: false,
          updatedAt: new Date().toISOString()
        });
      });

      await Promise.all(updatePromises);
    } catch (error) {
      console.error('❌ Error unsetting primary contacts:', error);
    }
  }

  // ========== 紧急警报管理 ==========

  /**
   * 触发紧急警报
   * @param {string} userEmail 用户邮箱
   * @param {string} triggerType 触发类型
   * @param {Object} options 选项（location, message, details等）
   * @returns {Promise<Object>} 警报对象
   */
  async triggerEmergencyAlert(userEmail, triggerType, options = {}) {
    try {
      console.log(`🚨 Triggering emergency alert for user: ${userEmail}, type: ${triggerType}`);

      // 确定严重程度
      const severity = this.determineSeverity(triggerType, options);

      // 创建警报对象
      const alert = createEmergencyAlert({
        userEmail: userEmail,
        triggerType: triggerType,
        severity: severity,
        location: options.location || null,
        message: options.message || this.getDefaultMessage(triggerType),
        details: options.details || {}
      });

      // 保存警报到Firestore
      const alertRef = doc(collection(db, 'emergencyAlerts'), alert.alertId);
      await setDoc(alertRef, alert);

      // 通知紧急联系人
      const notificationResult = await this.notifyEmergencyContacts(userEmail, alert);

      // 发送健康报告（如果严重程度为high或critical）
      if (severity === 'high' || severity === 'critical') {
        await this.sendHealthReportToContacts(userEmail, alert);
      }

      console.log(`✅ Emergency alert triggered: ${alert.alertId}`);
      return {
        success: true,
        alert: {
          ...alert,
          contactsNotified: notificationResult.contactsNotified || []
        }
      };
    } catch (error) {
      console.error('❌ Error triggering emergency alert:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 获取用户的紧急警报历史
   * @param {string} userEmail 用户邮箱
   * @param {Object} filters 过滤条件
   * @returns {Promise<Object>} 警报列表
   */
  async getUserEmergencyAlerts(userEmail, filters = {}) {
    try {
      const alertsRef = collection(db, 'emergencyAlerts');
      let q = query(
        alertsRef,
        where('userEmail', '==', userEmail)
      );

      // 按状态过滤
      if (filters.status) {
        q = query(q, where('status', '==', filters.status));
      }

      // 按严重程度过滤
      if (filters.severity) {
        q = query(q, where('severity', '==', filters.severity));
      }

      // 排序
      try {
        q = query(q, orderBy('timestamp', 'desc'));
      } catch (error) {
        console.warn('⚠️ Index not found, skipping orderBy');
      }

      // 限制数量
      if (filters.limit) {
        q = query(q, limit(filters.limit));
      }

      const querySnapshot = await getDocs(q);
      let alerts = querySnapshot.docs.map(doc => ({
        alertId: doc.id,
        ...doc.data()
      }));

      // 如果无法使用orderBy，在内存中排序
      if (!filters.limit || alerts.length < filters.limit) {
        alerts.sort((a, b) => {
          return new Date(b.timestamp) - new Date(a.timestamp);
        });
      }

      return {
        success: true,
        alerts: alerts
      };
    } catch (error) {
      console.error('❌ Error getting user emergency alerts:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 更新紧急警报状态
   * @param {string} alertId 警报ID
   * @param {Object} updates 更新数据
   * @returns {Promise<Object>} 结果
   */
  async updateEmergencyAlert(alertId, updates) {
    try {
      const alertRef = doc(db, 'emergencyAlerts', alertId);
      const alertDoc = await getDoc(alertRef);

      if (!alertDoc.exists()) {
        return { success: false, error: 'Emergency alert not found' };
      }

      // 如果状态变为resolved，记录解决时间
      if (updates.status === 'resolved' && !updates.resolvedAt) {
        updates.resolvedAt = new Date().toISOString();
      }

      await updateDoc(alertRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      });

      return { success: true, alertId: alertId };
    } catch (error) {
      console.error('❌ Error updating emergency alert:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ========== 通知和消息发送 ==========

  /**
   * 通知紧急联系人
   * @param {string} userEmail 用户邮箱
   * @param {Object} alert 警报对象
   * @returns {Promise<Object>} 通知结果
   */
  async notifyEmergencyContacts(userEmail, alert) {
    try {
      const contactsResult = await this.getUserEmergencyContacts(userEmail);
      if (!contactsResult.success || !contactsResult.contacts.length) {
        console.warn('⚠️ No emergency contacts found for user:', userEmail);
        return { contactsNotified: [] };
      }

      const contactsToNotify = contactsResult.contacts.filter(contact => contact.notificationEnabled);
      const notifiedContactIds = [];

      // 这里应该集成实际的通知服务（短信、电话、推送等）
      // 目前只是记录日志
      for (const contact of contactsToNotify) {
        console.log(`📞 Notifying emergency contact: ${contact.name} (${contact.phone})`);
        console.log(`   Alert: ${alert.message || 'Emergency alert triggered'}`);
        if (alert.location) {
          console.log(`   Location: ${alert.location.address || `${alert.location.latitude}, ${alert.location.longitude}`}`);
        }
        notifiedContactIds.push(contact.contactId);
      }

      // 更新警报中的已通知联系人列表
      if (alert.alertId) {
        await this.updateEmergencyAlert(alert.alertId, {
          contactsNotified: notifiedContactIds
        });
      }

      return {
        contactsNotified: notifiedContactIds,
        totalContacts: contactsToNotify.length
      };
    } catch (error) {
      console.error('❌ Error notifying emergency contacts:', error);
      return { contactsNotified: [] };
    }
  }

  /**
   * 发送紧急消息
   * @param {string} userEmail 用户邮箱
   * @param {Object} messageData 消息数据
   * @returns {Promise<Object>} 结果
   */
  async sendEmergencyMessage(userEmail, messageData) {
    try {
      const contactsResult = await this.getUserEmergencyContacts(userEmail);
      if (!contactsResult.success || !contactsResult.contacts.length) {
        return {
          success: false,
          error: 'No emergency contacts found'
        };
      }

      const message = messageData.message || 'Emergency message from user';
      const contactsToNotify = contactsResult.contacts.filter(contact => contact.notificationEnabled);

      // 这里应该集成实际的消息发送服务
      for (const contact of contactsToNotify) {
        console.log(`📨 Sending emergency message to ${contact.name} (${contact.phone}): ${message}`);
      }

      return {
        success: true,
        message: 'Emergency messages sent',
        contactsNotified: contactsToNotify.length
      };
    } catch (error) {
      console.error('❌ Error sending emergency message:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 发送健康报告给紧急联系人
   * @param {string} userEmail 用户邮箱
   * @param {Object} alert 警报对象
   */
  async sendHealthReportToContacts(userEmail, alert) {
    try {
      // 生成最新的健康报告
      const reportResult = await reportService.generateComprehensiveReport(userEmail, {
        title: 'Emergency Health Report',
        period: {
          start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 最近7天
          end: new Date().toISOString()
        }
      });

      if (reportResult.success) {
        console.log(`📄 Health report generated for emergency: ${reportResult.report.reportId}`);
        
        // 更新警报，标记健康报告已发送
        if (alert.alertId) {
          await this.updateEmergencyAlert(alert.alertId, {
            healthReportSent: true
          });
        }

        // 这里应该将报告发送给紧急联系人
        // 实际实现中应该通过邮件、短信等方式发送报告链接或内容
      }
    } catch (error) {
      console.error('❌ Error sending health report to contacts:', error);
    }
  }

  // ========== 辅助方法 ==========

  /**
   * 确定警报严重程度
   * @param {string} triggerType 触发类型
   * @param {Object} options 选项
   * @returns {string} 严重程度
   */
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

  /**
   * 获取默认警报消息
   * @param {string} triggerType 触发类型
   * @returns {string} 默认消息
   */
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
