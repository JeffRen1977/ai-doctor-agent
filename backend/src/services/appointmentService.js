/**
 * 预约管理服务
 */

const { db } = require('../config/firebase');
const { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, query, where, orderBy, limit, getDocs, addDoc } = require('firebase/firestore');
const { createAppointment } = require('../models/appointmentModels');

class AppointmentService {
  constructor() {
    console.log('📅 Appointment Service initialized');
  }

  /**
   * 创建预约
   * @param {string} userEmail 用户邮箱
   * @param {Object} appointmentData 预约数据
   * @returns {Promise<Object>} 结果
   */
  async createAppointment(userEmail, appointmentData) {
    try {
      const appointment = createAppointment({
        ...appointmentData,
        userEmail: userEmail
      });

      // 保存到Firestore
      const appointmentRef = doc(collection(db, 'appointments'), appointment.appointmentId);
      await setDoc(appointmentRef, appointment);

      console.log(`✅ Appointment created: ${appointment.appointmentId}`);
      return {
        success: true,
        appointment: appointment
      };
    } catch (error) {
      console.error('❌ Error creating appointment:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 获取预约
   * @param {string} appointmentId 预约ID
   * @returns {Promise<Object>} 预约对象
   */
  async getAppointment(appointmentId) {
    try {
      const appointmentRef = doc(db, 'appointments', appointmentId);
      const appointmentDoc = await getDoc(appointmentRef);

      if (!appointmentDoc.exists()) {
        return { success: false, error: 'Appointment not found' };
      }

      return {
        success: true,
        appointment: appointmentDoc.data()
      };
    } catch (error) {
      console.error('❌ Error getting appointment:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 更新预约
   * @param {string} appointmentId 预约ID
   * @param {Object} updates 更新数据
   * @returns {Promise<Object>} 结果
   */
  async updateAppointment(appointmentId, updates) {
    try {
      const appointmentRef = doc(db, 'appointments', appointmentId);
      const appointmentDoc = await getDoc(appointmentRef);

      if (!appointmentDoc.exists()) {
        return { success: false, error: 'Appointment not found' };
      }

      await updateDoc(appointmentRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      });

      return { success: true, appointmentId: appointmentId };
    } catch (error) {
      console.error('❌ Error updating appointment:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 删除预约
   * @param {string} appointmentId 预约ID
   * @returns {Promise<Object>} 结果
   */
  async deleteAppointment(appointmentId) {
    try {
      const appointmentRef = doc(db, 'appointments', appointmentId);
      await deleteDoc(appointmentRef);

      return { success: true };
    } catch (error) {
      console.error('❌ Error deleting appointment:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 获取用户的预约列表
   * @param {string} userEmail 用户邮箱
   * @param {Object} filters 过滤条件
   * @returns {Promise<Object>} 预约列表
   */
  async getUserAppointments(userEmail, filters = {}) {
    try {
      const appointmentsRef = collection(db, 'appointments');
      
      // 先尝试使用索引查询（如果索引存在）
      try {
        let q = query(
          appointmentsRef,
          where('userEmail', '==', userEmail)
        );

        // 按状态过滤
        if (filters.status) {
          q = query(q, where('status', '==', filters.status));
        }

        // 按日期范围过滤
        if (filters.startDate || filters.endDate) {
          if (filters.startDate) {
            q = query(q, where('scheduledDateTime', '>=', filters.startDate));
          }
          if (filters.endDate) {
            q = query(q, where('scheduledDateTime', '<=', filters.endDate));
          }
        }

        // 排序
        q = query(q, orderBy('scheduledDateTime', 'asc'));

        // 限制数量
        if (filters.limit) {
          q = query(q, limit(filters.limit));
        }

        const querySnapshot = await getDocs(q);
        let appointments = querySnapshot.docs.map(doc => ({
          appointmentId: doc.id,
          ...doc.data()
        }));

        return {
          success: true,
          appointments: appointments
        };
      } catch (indexError) {
        // 如果索引不存在，使用备用方案：先获取所有该用户的预约，然后在内存中过滤和排序
        if (indexError.code === 'failed-precondition') {
          console.warn('⚠️ Firestore index not found, using fallback query method');
          
          // 只使用 where 查询（不需要索引）
          const fallbackQuery = query(
            appointmentsRef,
            where('userEmail', '==', userEmail)
          );
          
          const querySnapshot = await getDocs(fallbackQuery);
          let appointments = querySnapshot.docs.map(doc => ({
            appointmentId: doc.id,
            ...doc.data()
          }));

          // 在内存中按状态过滤
          if (filters.status) {
            appointments = appointments.filter(apt => apt.status === filters.status);
          }

          // 在内存中按日期范围过滤
          if (filters.startDate || filters.endDate) {
            appointments = appointments.filter(apt => {
              const aptDate = new Date(apt.scheduledDateTime);
              if (filters.startDate && aptDate < new Date(filters.startDate)) {
                return false;
              }
              if (filters.endDate && aptDate > new Date(filters.endDate)) {
                return false;
              }
              return true;
            });
          }

          // 在内存中按时间排序
          appointments.sort((a, b) => {
            return new Date(a.scheduledDateTime) - new Date(b.scheduledDateTime);
          });

          // 限制数量
          if (filters.limit) {
            appointments = appointments.slice(0, filters.limit);
          }

          return {
            success: true,
            appointments: appointments
          };
        } else {
          // 其他错误，重新抛出
          throw indexError;
        }
      }
    } catch (error) {
      console.error('❌ Error getting user appointments:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 获取即将到来的预约
   * @param {string} userEmail 用户邮箱
   * @param {number} days 天数（默认7天）
   * @returns {Promise<Object>} 预约列表
   */
  async getUpcomingAppointments(userEmail, days = 7) {
    try {
      const now = new Date();
      const endDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
      
      return await this.getUserAppointments(userEmail, {
        status: 'scheduled',
        startDate: now.toISOString(),
        endDate: endDate.toISOString(),
        limit: 10
      });
    } catch (error) {
      console.error('❌ Error getting upcoming appointments:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new AppointmentService();
