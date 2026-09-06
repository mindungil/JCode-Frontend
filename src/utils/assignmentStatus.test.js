import { getAssignmentStatus } from './assignmentStatus';

describe('getAssignmentStatus', () => {
  test.each([
    ['SCHEDULED', '시작 전', 'default'],
    ['OPEN', '진행 중', 'success'],
    ['CLOSED', '마감', 'warning'],
  ])('maps %s schedule status to a visible chip', (scheduleStatus, label, color) => {
    expect(getAssignmentStatus({ lifecycleStatus: 'ACTIVE', scheduleStatus }))
      .toEqual({ label, color, progress: false });
  });

  test.each([
    ['PROVISIONING', '준비 중', 'info', true],
    ['PROVISION_FAILED', '준비 오류', 'error', false],
    ['DELETING', '보관 중', 'info', true],
    ['ARCHIVED', '보관 완료', 'default', false],
  ])('prioritizes %s lifecycle status', (lifecycleStatus, label, color, progress) => {
    expect(getAssignmentStatus({ lifecycleStatus, scheduleStatus: 'OPEN' }))
      .toEqual({ label, color, progress });
  });

  test('does not present an unknown status as active', () => {
    expect(getAssignmentStatus({ lifecycleStatus: 'ACTIVE', scheduleStatus: 'UNKNOWN' }))
      .toEqual({ label: '상태 확인 필요', color: 'default', progress: false });
  });
});
