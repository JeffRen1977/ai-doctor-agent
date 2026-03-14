const mockFindOne = jest.fn();
const mockUpdateOne = jest.fn();

jest.mock('./connection', () => ({
  getCollection: jest.fn(() => ({
    findOne: mockFindOne,
    updateOne: mockUpdateOne
  }))
}));
jest.mock('./medicationAdapter', () => ({
  listActive: jest.fn().mockResolvedValue([])
}));

const { getBasicInfo, getBasicInfoForAgent, saveBasicInfo, getFullHealthRecord } = require('./userBasicInfoAdapter');

beforeEach(() => {
  mockFindOne.mockReset();
  mockUpdateOne.mockReset();
});

describe('userBasicInfoAdapter', () => {
  it('getBasicInfo returns null when not found', async () => {
    mockFindOne.mockResolvedValue(null);
    expect(await getBasicInfo('u1')).toBeNull();
  });
  it('getBasicInfoForAgent returns 暂无 when not found', async () => {
    mockFindOne.mockResolvedValue(null);
    expect(await getBasicInfoForAgent('u1')).toBe('暂无基础档案信息。');
  });
  it('saveBasicInfo updates doc', async () => {
    mockUpdateOne.mockResolvedValue({ acknowledged: true });
    await saveBasicInfo('u1', { basicInfo: { name: 'x' } });
    expect(mockUpdateOne).toHaveBeenCalledWith(expect.any(Object), expect.objectContaining({ $set: expect.objectContaining({ updatedAt: expect.any(Date) }) }), { upsert: true });
  });
  it('getFullHealthRecord returns null when not found', async () => {
    mockFindOne.mockResolvedValue(null);
    expect(await getFullHealthRecord('u1')).toBeNull();
  });
});
