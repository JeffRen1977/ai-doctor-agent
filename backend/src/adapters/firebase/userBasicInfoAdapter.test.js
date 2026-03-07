/**
 * Unit tests: UserBasicInfo Firebase Adapter (colocated with source)
 * See docs/data-format/IMPLEMENTATION_STEPS_DETAILED.md Step 1.4
 */

const mockGetDoc = jest.fn();
const mockSetDoc = jest.fn();
jest.mock('../../config/firebase', () => ({ db: {} }));
jest.mock('firebase/firestore', () => ({
  doc: jest.fn((db, col, id) => ({ _col: col, _id: id })),
  getDoc: (...args) => mockGetDoc(...args),
  setDoc: (...args) => mockSetDoc(...args)
}));

const { getBasicInfo, getBasicInfoForAgent, saveBasicInfo, fromFirestoreDoc } = require('./userBasicInfoAdapter');

beforeEach(() => {
  mockGetDoc.mockReset();
  mockSetDoc.mockReset();
});

describe('getBasicInfoForAgent', () => {
  test('给定根文档 fixture（含 basicInfo、medicalHistory、allergies、familyHistory），无 medications，返回字符串包含上述字段且不包含 medications', async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      id: 'user_1',
      data: () => ({
        userEmail: 'test@example.com',
        basicInfo: { name: '张三', age: 30, gender: 'male' },
        medicalHistory: '既往高血压',
        familyHistory: '父亲糖尿病',
        allergies: '青霉素'
      })
    });
    const result = await getBasicInfoForAgent('user_1');
    expect(result).toContain('张三');
    expect(result).toContain('既往高血压');
    expect(result).toContain('父亲糖尿病');
    expect(result).toContain('青霉素');
    expect(result).not.toMatch(/medications|用药/);
  });

  test('根文档存在但 basicInfo 为空时仍含 medicalHistory 等有值字段', async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      id: 'user_1',
      data: () => ({
        userEmail: 'u@e.com',
        medicalHistory: '无',
        familyHistory: '无',
        allergies: '无'
      })
    });
    const result = await getBasicInfoForAgent('user_1');
    expect(result).toContain('既往病史');
    expect(result).not.toBe('暂无基础档案信息。');
  });

  test('根文档不存在时不抛错，返回暂无或空摘要', async () => {
    mockGetDoc.mockResolvedValue({ exists: () => false });
    const result = await getBasicInfoForAgent('nonexistent');
    expect(result).toBe('暂无基础档案信息。');
  });
});

describe('getBasicInfo', () => {
  test('根文档存在时返回 UserBasicInfo 形态对象', async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      id: 'user_1',
      data: () => ({
        userEmail: 'test@example.com',
        basicInfo: { name: 'Test' },
        medicalHistory: '无',
        familyHistory: '无',
        allergies: '无',
        updatedAt: new Date()
      })
    });
    const result = await getBasicInfo('user_1');
    expect(result).not.toBeNull();
    expect(result.userId).toBe('user_1');
    expect(result.userEmail).toBe('test@example.com');
    expect(result.medicalHistory).toBe('无');
  });

  test('根文档不存在时返回 null', async () => {
    mockGetDoc.mockResolvedValue({ exists: () => false });
    const result = await getBasicInfo('nonexistent');
    expect(result).toBeNull();
  });
});

describe('saveBasicInfo', () => {
  test('传入部分字段时调用 setDoc，写入仅涉及传入字段与 updatedAt', async () => {
    mockSetDoc.mockResolvedValue(undefined);
    await saveBasicInfo('user_1', { medicalHistory: '更新病史' });
    expect(mockSetDoc).toHaveBeenCalledTimes(1);
    const [, updates] = mockSetDoc.mock.calls[0];
    expect(updates.medicalHistory).toBe('更新病史');
    expect(updates.updatedAt).toBeDefined();
    expect(updates.medications).toBeUndefined();
  });
});

describe('fromFirestoreDoc', () => {
  test('将 Firestore 文档转为 UserBasicInfo，通过 models 校验', () => {
    const data = {
      userEmail: 'a@b.com',
      basicInfo: { name: 'X' },
      medicalHistory: '无',
      familyHistory: '无',
      allergies: '无'
    };
    const result = fromFirestoreDoc('user_1', data);
    expect(result).not.toBeNull();
    expect(result.userId).toBe('user_1');
    expect(result.userEmail).toBe('a@b.com');
  });
});
