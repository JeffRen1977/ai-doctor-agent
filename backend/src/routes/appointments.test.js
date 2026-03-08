/**
 * Unit tests: appointments routes (POST /, GET /, GET /upcoming, GET /:id, PUT /:id, DELETE /:id)
 */

const express = require('express');
const request = require('supertest');

const mockCreateAppointment = jest.fn();
const mockGetUserAppointments = jest.fn();
const mockGetUpcomingAppointments = jest.fn();
const mockGetAppointment = jest.fn();
const mockUpdateAppointment = jest.fn();
const mockDeleteAppointment = jest.fn();

jest.mock('../services/appointmentService', () => ({
  createAppointment: (...args) => mockCreateAppointment(...args),
  getUserAppointments: (...args) => mockGetUserAppointments(...args),
  getUpcomingAppointments: (...args) => mockGetUpcomingAppointments(...args),
  getAppointment: (...args) => mockGetAppointment(...args),
  updateAppointment: (...args) => mockUpdateAppointment(...args),
  deleteAppointment: (...args) => mockDeleteAppointment(...args)
}));

jest.mock('../middleware/auth', () => ({
  authenticateToken: (req, res, next) => {
    req.user = { id: 'user_1', email: 'user@test.com' };
    next();
  }
}));

const appointmentsRoutes = require('./appointments');

const app = express();
app.use(express.json());
app.use('/api/appointments', appointmentsRoutes);

beforeEach(() => {
  mockCreateAppointment.mockReset();
  mockGetUserAppointments.mockReset();
  mockGetUpcomingAppointments.mockReset();
  mockGetAppointment.mockReset();
  mockUpdateAppointment.mockReset();
  mockDeleteAppointment.mockReset();
});

const baseAppointment = {
  type: 'consultation',
  status: 'scheduled',
  scheduledDateTime: '2025-03-01T10:00:00.000Z',
  location: { name: 'Clinic A' },
  provider: { name: 'Dr. Smith' }
};

describe('POST /api/appointments', () => {
  test('returns 201 and appointment when createAppointment succeeds', async () => {
    const created = { appointmentId: 'appt_1', userEmail: 'user@test.com', ...baseAppointment };
    mockCreateAppointment.mockResolvedValue({ success: true, appointment: created });
    const res = await request(app).post('/api/appointments').send(baseAppointment);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.appointment.appointmentId).toBe('appt_1');
    expect(mockCreateAppointment).toHaveBeenCalledWith('user@test.com', baseAppointment);
  });

  test('returns 500 when createAppointment fails', async () => {
    mockCreateAppointment.mockResolvedValue({ success: false, error: 'Validation failed' });
    const res = await request(app).post('/api/appointments').send(baseAppointment);
    expect(res.status).toBe(500);
    expect(res.body.error).toContain('Validation failed');
  });
});

describe('GET /api/appointments', () => {
  test('returns 200 and appointments list when getUserAppointments succeeds', async () => {
    const list = [{ appointmentId: 'appt_1', userEmail: 'user@test.com' }];
    mockGetUserAppointments.mockResolvedValue({ success: true, appointments: list });
    const res = await request(app).get('/api/appointments');
    expect(res.status).toBe(200);
    expect(res.body.appointments).toEqual(list);
    expect(mockGetUserAppointments).toHaveBeenCalledWith('user@test.com', expect.any(Object));
  });

  test('returns 500 when getUserAppointments fails', async () => {
    mockGetUserAppointments.mockResolvedValue({ success: false, error: 'DB error' });
    const res = await request(app).get('/api/appointments');
    expect(res.status).toBe(500);
  });
});

describe('GET /api/appointments/upcoming', () => {
  test('returns 200 and appointments when getUpcomingAppointments succeeds', async () => {
    mockGetUpcomingAppointments.mockResolvedValue({ success: true, appointments: [] });
    const res = await request(app).get('/api/appointments/upcoming');
    expect(res.status).toBe(200);
    expect(res.body.appointments).toEqual([]);
    expect(mockGetUpcomingAppointments).toHaveBeenCalledWith('user@test.com', 7);
  });

  test('passes days query to getUpcomingAppointments', async () => {
    mockGetUpcomingAppointments.mockResolvedValue({ success: true, appointments: [] });
    await request(app).get('/api/appointments/upcoming?days=14');
    expect(mockGetUpcomingAppointments).toHaveBeenCalledWith('user@test.com', 14);
  });
});

describe('GET /api/appointments/:appointmentId', () => {
  test('returns 200 and appointment when getAppointment succeeds', async () => {
    const appt = { appointmentId: 'appt_1', userEmail: 'user@test.com', ...baseAppointment };
    mockGetAppointment.mockResolvedValue({ success: true, appointment: appt });
    const res = await request(app).get('/api/appointments/appt_1');
    expect(res.status).toBe(200);
    expect(res.body.appointment.appointmentId).toBe('appt_1');
    expect(mockGetAppointment).toHaveBeenCalledWith('appt_1');
  });

  test('returns 404 when appointment not found', async () => {
    mockGetAppointment.mockResolvedValue({ success: false, error: 'Appointment not found' });
    const res = await request(app).get('/api/appointments/appt_missing');
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/appointments/:appointmentId', () => {
  test('returns 200 when updateAppointment succeeds', async () => {
    mockGetAppointment.mockResolvedValue({
      success: true,
      appointment: { appointmentId: 'appt_1', userEmail: 'user@test.com' }
    });
    mockUpdateAppointment.mockResolvedValue({ success: true, appointmentId: 'appt_1' });
    const res = await request(app).put('/api/appointments/appt_1').send({ status: 'completed' });
    expect(res.status).toBe(200);
    expect(mockUpdateAppointment).toHaveBeenCalledWith('appt_1', { status: 'completed' });
  });

  test('returns 403 when appointment belongs to another user', async () => {
    mockGetAppointment.mockResolvedValue({
      success: true,
      appointment: { appointmentId: 'appt_1', userEmail: 'other@test.com' }
    });
    const res = await request(app).put('/api/appointments/appt_1').send({ status: 'completed' });
    expect(res.status).toBe(403);
    expect(mockUpdateAppointment).not.toHaveBeenCalled();
  });
});

describe('DELETE /api/appointments/:appointmentId', () => {
  test('returns 200 when deleteAppointment succeeds', async () => {
    mockGetAppointment.mockResolvedValue({
      success: true,
      appointment: { appointmentId: 'appt_1', userEmail: 'user@test.com' }
    });
    mockDeleteAppointment.mockResolvedValue({ success: true });
    const res = await request(app).delete('/api/appointments/appt_1');
    expect(res.status).toBe(200);
    expect(mockDeleteAppointment).toHaveBeenCalledWith('appt_1');
  });

  test('returns 403 when appointment belongs to another user', async () => {
    mockGetAppointment.mockResolvedValue({
      success: true,
      appointment: { appointmentId: 'appt_1', userEmail: 'other@test.com' }
    });
    const res = await request(app).delete('/api/appointments/appt_1');
    expect(res.status).toBe(403);
    expect(mockDeleteAppointment).not.toHaveBeenCalled();
  });
});
