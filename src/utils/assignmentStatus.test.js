import { getAssignmentDeadlineTooltip, getAssignmentStatus } from './assignmentStatus';

describe('getAssignmentStatus', () => {
  test.each([
    ['SCHEDULED', '시작 전', 'default'],
    ['OPEN', '진행 중', 'success'],
    ['CLOSED', '마감', 'warning'],
  ])('maps %s schedule status to a visible chip', (scheduleStatus, label, color) => {
    expect(getAssignmentStatus({
      lifecycleStatus: 'ACTIVE',
      scheduleStatus,
      finalizedAt: scheduleStatus === 'CLOSED' ? '2026-09-10T13:31:00' : null,
    }))
      .toEqual({ label, color, progress: false });
  });

  test('distinguishes final submission processing and failure from a completed deadline', () => {
    expect(getAssignmentStatus({ lifecycleStatus: 'ACTIVE', scheduleStatus: 'CLOSED' }))
      .toEqual({ label: '최종본 보관 중', color: 'info', progress: true });
    expect(getAssignmentStatus({
      lifecycleStatus: 'ACTIVE', scheduleStatus: 'CLOSED', lastError: 'safe error'
    })).toEqual({ label: '보관 오류', color: 'error', progress: false });
  });

  test('surfaces starter distribution before the schedule state', () => {
    expect(getAssignmentStatus({
      lifecycleStatus: 'ACTIVE', scheduleStatus: 'OPEN', starterDistributionPending: true
    })).toEqual({ label: '스타터 배포 중', color: 'info', progress: true });
    expect(getAssignmentStatus({
      lifecycleStatus: 'ACTIVE', scheduleStatus: 'OPEN', starterDistributionPending: true, lastError: 'safe error'
    })).toEqual({ label: '스타터 배포 오류', color: 'error', progress: false });
  });

  test('uses the actual time boundary while the persisted scheduler state is stale', () => {
    const assignment = {
      lifecycleStatus: 'ACTIVE',
      scheduleStatus: 'OPEN',
      kickoffDate: '2026-09-13T10:00:00',
      deadlineDate: '2026-09-13T11:00:00',
    };

    expect(getAssignmentStatus(assignment, new Date('2026-09-13T11:00:00')))
      .toEqual({ label: '최종본 보관 중', color: 'info', progress: true });
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

describe('getAssignmentDeadlineTooltip', () => {
  test('formats the exact deadline for the status chip tooltip', () => {
    const deadline = '2026-09-10T13:30:00Z';
    const formatted = new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(deadline));

    expect(getAssignmentDeadlineTooltip(deadline)).toBe(`마감일: ${formatted}`);
  });

  test.each([null, '', 'not-a-date'])('handles missing or invalid deadline %p', (deadline) => {
    expect(getAssignmentDeadlineTooltip(deadline)).toBe('마감일 정보 없음');
  });
});
