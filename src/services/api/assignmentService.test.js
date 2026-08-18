import { apiGet } from '../apiHelpers';
import api from '../../api/axios';
import assignmentService from './assignmentService';

jest.mock('../apiHelpers', () => ({
  apiGet: jest.fn()
}));
jest.mock('../../api/axios', () => ({
  post: jest.fn()
}));

beforeEach(() => {
  jest.clearAllMocks();
});

test('새 과제가 ACTIVE가 된 뒤 스타터 업로드를 계속할 수 있다', async () => {
  apiGet
    .mockResolvedValueOnce([{ assignmentId: 7, lifecycleStatus: 'PROVISIONING' }])
    .mockResolvedValueOnce([{ assignmentId: 7, lifecycleStatus: 'ACTIVE' }]);

  const assignment = await assignmentService.waitUntilActive(10, 7, {
    timeoutMs: 1000,
    intervalMs: 0
  });

  expect(assignment.lifecycleStatus).toBe('ACTIVE');
  expect(apiGet).toHaveBeenCalledTimes(2);
  expect(apiGet).toHaveBeenCalledWith('/api/courses/10/assignments', expect.objectContaining({
    showToast: false
  }));
});

test('과제 Workspace 준비 실패를 업로드 실패로 전달한다', async () => {
  apiGet.mockResolvedValueOnce([{
    assignmentId: 7,
    lifecycleStatus: 'PROVISION_FAILED',
    lastError: 'NFS 준비 실패'
  }]);

  await expect(assignmentService.waitUntilActive(10, 7, {
    timeoutMs: 1000,
    intervalMs: 0
  })).rejects.toThrow('NFS 준비 실패');
});

test('ACTIVE 확인 전에는 스타터 ZIP을 업로드하지 않는다', async () => {
  apiGet
    .mockResolvedValueOnce([{ assignmentId: 7, lifecycleStatus: 'PROVISIONING' }])
    .mockResolvedValueOnce([{ assignmentId: 7, lifecycleStatus: 'ACTIVE' }]);
  api.post.mockResolvedValue({ data: { version: '1' } });
  const file = new File(['zip'], 'starter.zip', { type: 'application/zip' });

  await assignmentService.uploadStarterWhenActive(
    10,
    7,
    file,
    'PRESERVE_EXISTING',
    true,
    { timeoutMs: 1000, intervalMs: 0 }
  );

  expect(apiGet).toHaveBeenCalledTimes(2);
  expect(apiGet.mock.invocationCallOrder[1]).toBeLessThan(api.post.mock.invocationCallOrder[0]);
  expect(api.post).toHaveBeenCalledWith(
    '/api/courses/10/assignments/7/starter-code?overwritePolicy=PRESERVE_EXISTING&deployNow=true',
    expect.any(FormData),
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
});
