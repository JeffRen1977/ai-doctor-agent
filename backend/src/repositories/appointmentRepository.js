/**
 * Repository 接口契约：Appointment（预约）
 * 实际实现由 Adapter 提供（见 adapters/firebase/appointmentAdapter.js）。
 *
 * @interface
 * saveAppointment(appointment) => Promise<void>
 * getAppointment(appointmentId) => Promise<Object | null>
 * updateAppointment(appointmentId, updates) => Promise<void>
 * deleteAppointment(appointmentId) => Promise<void>
 * listAppointmentsByUser(userEmail, options?) => Promise<Object[]>
 */

function notImplemented() {
  throw new Error('Appointment repository not implemented: use adapters and repositories/index.js facade');
}

module.exports = {
  saveAppointment: () => notImplemented(),
  getAppointment: () => notImplemented(),
  updateAppointment: () => notImplemented(),
  deleteAppointment: () => notImplemented(),
  listAppointmentsByUser: () => notImplemented()
};
