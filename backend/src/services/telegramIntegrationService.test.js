jest.mock('../repositories', () => ({
  telegramBindingRepo: {
    putBindingCode: jest.fn().mockResolvedValue(undefined),
    takeBindingCode: jest.fn()
  }
}));

jest.mock('./userSettingsService', () => ({
  getUserSettings: jest.fn(),
  updateUserSettings: jest.fn()
}));

const { telegramBindingRepo } = require('../repositories');
const userSettingsService = require('./userSettingsService');
const telegramIntegrationService = require('./telegramIntegrationService');

describe('telegramIntegrationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('createTelegramBindCode stores code', async () => {
    const r = await telegramIntegrationService.createTelegramBindCode('User@Example.com');
    expect(r.success).toBe(true);
    expect(r.code).toHaveLength(6);
    expect(telegramBindingRepo.putBindingCode).toHaveBeenCalled();
    const argUserId = telegramBindingRepo.putBindingCode.mock.calls[0][1].userId;
    expect(argUserId).toBe('user@example.com');
  });

  test('bindTelegramChat updates settings on valid code', async () => {
    telegramBindingRepo.takeBindingCode.mockResolvedValue({ userId: 'u@x.com' });
    userSettingsService.getUserSettings.mockResolvedValue({
      success: true,
      settings: { integrations: { other: 1 } }
    });
    userSettingsService.updateUserSettings.mockResolvedValue({ success: true });

    const r = await telegramIntegrationService.bindTelegramChat(12345, 'ABCDEF');
    expect(r.ok).toBe(true);
    expect(userSettingsService.updateUserSettings).toHaveBeenCalledWith(
      'u@x.com',
      expect.objectContaining({
        integrations: expect.objectContaining({ telegramChatId: '12345', other: 1 })
      })
    );
  });

  test('bindTelegramChat rejects bad code length', async () => {
    const r = await telegramIntegrationService.bindTelegramChat(1, 'ABC');
    expect(r.ok).toBe(false);
    expect(telegramBindingRepo.takeBindingCode).not.toHaveBeenCalled();
  });
});
