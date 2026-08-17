import api from '../../api/axios';
import jcodeService from './jcodeService';

jest.mock('../../api/axios', () => ({
  post: jest.fn(),
  delete: jest.fn()
}));

beforeEach(() => {
  jest.clearAllMocks();
});

test('실패한 과제 JCode를 재시도하고 준비 완료를 기다린다', async () => {
  api.post
    .mockResolvedValueOnce({ data: { status: 'PROVISION_FAILED', lastError: 'temporary' } })
    .mockResolvedValueOnce({ data: { msg: 'accepted' } })
    .mockResolvedValueOnce({ data: { status: 'READY', jcodeUrl: 'https://ide.example.com' } });

  const result = await jcodeService.createAndWaitUntilReady(
    10,
    { userEmail: 'student@example.com', snapshot: false, assignmentId: 7 },
    { timeoutMs: 1000, intervalMs: 0 }
  );

  expect(result.status).toBe('READY');
  expect(api.post).toHaveBeenNthCalledWith(2, '/api/courses/10/jcodes/retry', {
    userEmail: 'student@example.com',
    snapshot: false,
    assignmentId: 7
  });
});

test('과제 JCode 삭제 요청에 assignmentId를 유지한다', async () => {
  api.delete.mockResolvedValue({ data: 'accepted' });

  await jcodeService.deleteJCode(10, {
    userEmail: 'student@example.com',
    snapshot: false,
    assignmentId: 7
  });

  expect(api.delete).toHaveBeenCalledWith('/api/courses/10/jcodes', {
    data: { userEmail: 'student@example.com', snapshot: false, assignmentId: 7 },
    headers: { 'Content-Type': 'application/json' }
  });
});
