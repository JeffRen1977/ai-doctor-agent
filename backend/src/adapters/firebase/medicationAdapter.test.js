/**
 * Unit tests: Medication Firebase Adapter (colocated with source)
 * 仅使用子集合，无旧集合双写/回退。
 */

const mockGetDoc = jest.fn();
const mockSetDoc = jest.fn();
const mockDeleteDoc = jest.fn();
const mockGetDocs = jest.fn();
jest.mock('../../config/firebase', () => ({ db: {} }));
jest.mock('firebase/firestore', () => ({
  doc: jest.fn((db, c, id, sub, subId) => ({ _c: c, _id: id, _sub: sub, _subId: subId })),
  getDoc: (...args) => mockGetDoc(...args),
  setDoc: (...args) => mockSetDoc(...args),
  deleteDoc: (...args) => mockDeleteDoc(...args),
  collection: jest.fn(() => ({ _col: true })),
  query: jest.fn(() => ({ _q: true })),
  where: jest.fn(() => {}),
  getDocs: (...args) => mockGetDocs(...args)
}));

const { listActive, add, update, remove } = require('./medicationAdapter');

beforeEach(() => {
  mockGetDoc.mockReset();
  mockSetDoc.mockReset();
  mockDeleteDoc.mockReset();
  mockGetDocs.mockReset();
});

describe('listActive', () => {
  test('子集合有 2 条 active 时返回 2 条', async () => {
    mockGetDocs.mockResolvedValue({
      empty: false,
      docs: [
        { id: 'm1', data: () => ({ id: 'm1', name: 'A', status: 'active' }) },
        { id: 'm2', data: () => ({ id: 'm2', name: 'B', status: 'active' }) }
      ]
    });
    const result = await listActive('user_1');
    expect(result).toHaveLength(2);
    expect(result.map(m => m.name)).toEqual(['A', 'B']);
  });

  test('子集合为空时返回空数组', async () => {
    mockGetDocs.mockResolvedValue({ empty: true, docs: [] });
    const result = await listActive('user_1');
    expect(result).toEqual([]);
  });
});

describe('add', () => {
  test('调用 add(userId, medication) 只写子集合', async () => {
    mockSetDoc.mockResolvedValue(undefined);
    await add('user_1', { name: 'Aspirin', status: 'active', dosage: '100mg' });
    expect(mockSetDoc).toHaveBeenCalledTimes(1);
  });
});

describe('update', () => {
  test('调用 update(userId, id, { status: "stopped" }) 只更新子集合', async () => {
    mockGetDoc.mockResolvedValue({ exists: () => true, data: () => ({ id: 'm1', name: 'A', status: 'active' }) });
    mockSetDoc.mockResolvedValue(undefined);
    await update('user_1', 'm1', { status: 'stopped' });
    expect(mockGetDoc).toHaveBeenCalledTimes(1);
    expect(mockSetDoc).toHaveBeenCalledTimes(1);
  });
});

describe('remove', () => {
  test('调用 remove(userId, id) 只删除子集合文档', async () => {
    mockDeleteDoc.mockResolvedValue(undefined);
    await remove('user_1', 'm1');
    expect(mockDeleteDoc).toHaveBeenCalledTimes(1);
    expect(mockSetDoc).not.toHaveBeenCalled();
  });
});
