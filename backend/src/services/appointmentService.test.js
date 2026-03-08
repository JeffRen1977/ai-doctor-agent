/**
 * Unit tests: AppointmentService
 */

const mockSaveAppointment = jest.fn();
const mockGetAppointment = jest.fn();
const mockUpdateAppointment = jest.fn();
const mockDeleteAppointment = jest.fn();
const mockListAppointmentsByUser = jest.fn();

jest.mock('../repositories', () => ({
  appointmentRepo: {
    saveAppointment: (...args) => mockSaveAppointment(...args),
    getAppointment: (...args) => mockGetAppointment(...args),
    updateAppointment: (...args) => mockUpdateAppointment(...args),
    deleteAppointment: (...args) => mockDeleteAppointment(...args),
    listAppointmentsByUser: (...args) => mockListAppointmentsByUser(...args)
  }
}));

const appointmentService = require('./appointmentService');

beforeEach(() => {
  mockSaveAppointment.mockReset();
  mockGetAppointment.mockReset();
  mockUpdateAppointment.mockReset();
  mockDeleteAppointment.mockReset();
  mockListAppointmentsByUser.mockReset();
});

const baseAppointmentData = {
  userEmail: 'user@example.com',
  type: 'consultation',
  status: 'scheduled',
  scheduledDateTime: '2025-03-01T10:00:00.000Z',
  location: { name: 'Clinic A' },
  provider: { name: 'Dr. Smith' }
};

describe('AppointmentService', () => {
  describe('createAppointment', () => {
    test('creates appointment and saves via repo', async () => {
      const saved = { ...baseAppointmentData, appointmentId: 'appt_123' };
      mockSaveAppointment.mockResolvedValue(undefined);
      const result = await appointmentService.createAppointment('user@example.com', baseAppointmentData);
      expect(result.success).toBe(true);
      expect(result.appointment).toHaveProperty('appointmentId');
      expect(result.appointment.userEmail).toBe('user@example.com');
      expect(result.appointment.type).toBe('consultation');
      expect(mockSaveAppointment).toHaveBeenCalledWith(expect.objectContaining({ userEmail: 'user@example.com' }));
    });

    test('returns error when save throws', async () => {
      mockSaveAppointment.mockRejectedValue(new Error('DB error'));
      const result = await appointmentService.createAppointment('u@x.com', baseAppointmentData);
      expect(result.success).toBe(false);
      expect(result.error).toContain('DB error');
    });
  });

  describe('getAppointment', () => {
    test('returns appointment when found', async () => {
      const appt = { appointmentId: 'appt_1', ...baseAppointmentData };
      mockGetAppointment.mockResolvedValue(appt);
      const result = await appointmentService.getAppointment('appt_1');
      expect(result.success).toBe(true);
      expect(result.appointment).toEqual(appt);
      expect(mockGetAppointment).toHaveBeenCalledWith('appt_1');
    });

    test('returns success false when not found', async () => {
      mockGetAppointment.mockResolvedValue(null);
      const result = await appointmentService.getAppointment('appt_missing');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Appointment not found');
    });

    test('returns error when repo throws', async () => {
      mockGetAppointment.mockRejectedValue(new Error('Network error'));
      const result = await appointmentService.getAppointment('appt_1');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });
  });

  describe('updateAppointment', () => {
    test('updates when appointment exists', async () => {
      mockGetAppointment.mockResolvedValue({ appointmentId: 'appt_1' });
      mockUpdateAppointment.mockResolvedValue(undefined);
      const result = await appointmentService.updateAppointment('appt_1', { status: 'completed' });
      expect(result.success).toBe(true);
      expect(result.appointmentId).toBe('appt_1');
      expect(mockUpdateAppointment).toHaveBeenCalledWith('appt_1', { status: 'completed' });
    });

    test('returns error when appointment not found', async () => {
      mockGetAppointment.mockResolvedValue(null);
      const result = await appointmentService.updateAppointment('appt_missing', {});
      expect(result.success).toBe(false);
      expect(result.error).toBe('Appointment not found');
      expect(mockUpdateAppointment).not.toHaveBeenCalled();
    });
  });

  describe('deleteAppointment', () => {
    test('returns success when delete succeeds', async () => {
      mockDeleteAppointment.mockResolvedValue(undefined);
      const result = await appointmentService.deleteAppointment('appt_1');
      expect(result.success).toBe(true);
      expect(mockDeleteAppointment).toHaveBeenCalledWith('appt_1');
    });

    test('returns error when delete throws', async () => {
      mockDeleteAppointment.mockRejectedValue(new Error('Forbidden'));
      const result = await appointmentService.deleteAppointment('appt_1');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Forbidden');
    });
  });

  describe('getUserAppointments', () => {
    test('returns list from repo with filters', async () => {
      const list = [{ appointmentId: 'appt_1', userEmail: 'u@x.com' }];
      mockListAppointmentsByUser.mockResolvedValue(list);
      const result = await appointmentService.getUserAppointments('u@x.com', {
        status: 'scheduled',
        limit: 10
      });
      expect(result.success).toBe(true);
      expect(result.appointments).toEqual(list);
      expect(mockListAppointmentsByUser).toHaveBeenCalledWith('u@x.com', expect.objectContaining({
        status: 'scheduled',
        limit: 10
      }));
    });
  });

  describe('getUpcomingAppointments', () => {
    test('calls getUserAppointments with scheduled status and date range', async () => {
      mockListAppointmentsByUser.mockResolvedValue([]);
      const result = await appointmentService.getUpcomingAppointments('u@x.com', 7);
      expect(result.success).toBe(true);
      expect(result.appointments).toEqual([]);
      expect(mockListAppointmentsByUser).toHaveBeenCalledWith('u@x.com', expect.objectContaining({
        status: 'scheduled',
        limit: 10
      }));
    });
  });
});
