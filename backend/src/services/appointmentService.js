/**
 * 预约管理服务
 */

const { createAppointment } = require('../models/appointmentModels');
const { appointmentRepo } = require('../repositories');

class AppointmentService {
  constructor() {}

  async createAppointment(userEmail, appointmentData) {
    try {
      const appointment = createAppointment({ ...appointmentData, userEmail });
      await appointmentRepo.saveAppointment(appointment);
      return { success: true, appointment };
    } catch (error) {
      console.error('createAppointment:', error.message);
      return { success: false, error: error.message };
    }
  }

  async getAppointment(appointmentId) {
    try {
      const appointment = await appointmentRepo.getAppointment(appointmentId);
      if (!appointment) return { success: false, error: 'Appointment not found' };
      return { success: true, appointment };
    } catch (error) {
      console.error('getAppointment:', error.message);
      return { success: false, error: error.message };
    }
  }

  async updateAppointment(appointmentId, updates) {
    try {
      const existing = await appointmentRepo.getAppointment(appointmentId);
      if (!existing) return { success: false, error: 'Appointment not found' };
      await appointmentRepo.updateAppointment(appointmentId, updates);
      return { success: true, appointmentId };
    } catch (error) {
      console.error('updateAppointment:', error.message);
      return { success: false, error: error.message };
    }
  }

  async deleteAppointment(appointmentId) {
    try {
      await appointmentRepo.deleteAppointment(appointmentId);
      return { success: true };
    } catch (error) {
      console.error('deleteAppointment:', error.message);
      return { success: false, error: error.message };
    }
  }

  async getUserAppointments(userEmail, filters = {}) {
    try {
      const appointments = await appointmentRepo.listAppointmentsByUser(userEmail, {
        status: filters.status,
        startDate: filters.startDate,
        endDate: filters.endDate,
        limit: filters.limit
      });
      return { success: true, appointments };
    } catch (error) {
      console.error('getUserAppointments:', error.message);
      return { success: false, error: error.message };
    }
  }

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
      console.error('getUpcomingAppointments:', error.message);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new AppointmentService();
