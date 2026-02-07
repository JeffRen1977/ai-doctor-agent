/**
 * 预约管理API路由
 */

const express = require('express');
const router = express.Router();
const appointmentService = require('../services/appointmentService');
const { authenticateToken } = require('../middleware/auth');

/**
 * POST /api/appointments
 * 创建预约
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user?.email;
    if (!userEmail) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const result = await appointmentService.createAppointment(userEmail, req.body);

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.status(201).json({
      success: true,
      message: 'Appointment created successfully',
      appointment: result.appointment
    });
  } catch (error) {
    console.error('❌ Create appointment error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create appointment.',
      details: error.message 
    });
  }
});

/**
 * GET /api/appointments
 * 获取用户的预约列表
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user?.email;
    if (!userEmail) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { status, startDate, endDate, limit } = req.query;
    const filters = {};
    if (status) filters.status = status;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    if (limit) filters.limit = parseInt(limit);

    const result = await appointmentService.getUserAppointments(userEmail, filters);

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json({
      success: true,
      appointments: result.appointments
    });
  } catch (error) {
    console.error('❌ Get appointments error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get appointments.',
      details: error.message 
    });
  }
});

/**
 * GET /api/appointments/upcoming
 * 获取即将到来的预约
 */
router.get('/upcoming', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user?.email;
    if (!userEmail) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { days } = req.query;
    const daysCount = days ? parseInt(days) : 7;

    const result = await appointmentService.getUpcomingAppointments(userEmail, daysCount);

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json({
      success: true,
      appointments: result.appointments
    });
  } catch (error) {
    console.error('❌ Get upcoming appointments error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get upcoming appointments.',
      details: error.message 
    });
  }
});

/**
 * GET /api/appointments/:appointmentId
 * 获取单个预约
 */
router.get('/:appointmentId', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user?.email;
    if (!userEmail) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { appointmentId } = req.params;

    const result = await appointmentService.getAppointment(appointmentId);

    if (!result.success) {
      return res.status(404).json({ error: result.error });
    }

    // 验证预约属于当前用户
    if (result.appointment.userEmail !== userEmail) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      success: true,
      appointment: result.appointment
    });
  } catch (error) {
    console.error('❌ Get appointment error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get appointment.',
      details: error.message 
    });
  }
});

/**
 * PUT /api/appointments/:appointmentId
 * 更新预约
 */
router.put('/:appointmentId', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user?.email;
    if (!userEmail) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { appointmentId } = req.params;

    // 验证预约属于当前用户
    const appointmentResult = await appointmentService.getAppointment(appointmentId);
    if (!appointmentResult.success || appointmentResult.appointment.userEmail !== userEmail) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await appointmentService.updateAppointment(appointmentId, req.body);

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json({
      success: true,
      message: 'Appointment updated successfully',
      appointmentId: result.appointmentId
    });
  } catch (error) {
    console.error('❌ Update appointment error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update appointment.',
      details: error.message 
    });
  }
});

/**
 * DELETE /api/appointments/:appointmentId
 * 删除预约
 */
router.delete('/:appointmentId', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user?.email;
    if (!userEmail) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { appointmentId } = req.params;

    // 验证预约属于当前用户
    const appointmentResult = await appointmentService.getAppointment(appointmentId);
    if (!appointmentResult.success || appointmentResult.appointment.userEmail !== userEmail) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await appointmentService.deleteAppointment(appointmentId);

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json({
      success: true,
      message: 'Appointment deleted successfully'
    });
  } catch (error) {
    console.error('❌ Delete appointment error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete appointment.',
      details: error.message 
    });
  }
});

module.exports = router;
