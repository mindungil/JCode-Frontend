const LIFECYCLE_STATUS = {
  PROVISIONING: { label: '준비 중', color: 'info', progress: true },
  PROVISION_FAILED: { label: '준비 오류', color: 'error', progress: false },
  DELETING: { label: '보관 중', color: 'info', progress: true },
  ARCHIVED: { label: '보관 완료', color: 'default', progress: false },
};

const SCHEDULE_STATUS = {
  SCHEDULED: { label: '시작 전', color: 'default', progress: false },
  OPEN: { label: '진행 중', color: 'success', progress: false },
  CLOSED: { label: '마감', color: 'warning', progress: false },
  ARCHIVED: { label: '보관 완료', color: 'default', progress: false },
};

export const getEffectiveScheduleStatus = (assignment = {}, now = new Date()) => {
  const kickoff = new Date(assignment.kickoffDate);
  const deadline = new Date(assignment.deadlineDate);
  const current = now instanceof Date ? now : new Date(now);
  if ([kickoff, deadline, current].some(value => Number.isNaN(value.getTime()))) {
    return assignment.scheduleStatus;
  }
  if (current >= deadline) return 'CLOSED';
  if (current < kickoff) return 'SCHEDULED';
  return 'OPEN';
};

export const getAssignmentStatus = (assignment = {}, now = new Date()) => {
  const lifecycle = assignment.lifecycleStatus || 'ACTIVE';
  if (LIFECYCLE_STATUS[lifecycle]) return LIFECYCLE_STATUS[lifecycle];
  if (assignment.starterDistributionPending) {
    return assignment.lastError
      ? { label: '스타터 배포 오류', color: 'error', progress: false }
      : { label: '스타터 배포 중', color: 'info', progress: true };
  }
  const scheduleStatus = getEffectiveScheduleStatus(assignment, now);

  if (scheduleStatus === 'CLOSED' && !assignment.finalizedAt) {
    return assignment.lastError
      ? { label: '보관 오류', color: 'error', progress: false }
      : { label: '최종본 보관 중', color: 'info', progress: true };
  }

  return SCHEDULE_STATUS[scheduleStatus]
    || { label: '상태 확인 필요', color: 'default', progress: false };
};

// Button state for a student's assignment row. The Backend reports READ_ONLY for
// closed assignments the student can still view; older Backends omit studentAccess.
export const getStudentAssignmentAction = (assignment = {}, now = new Date()) => {
  const writable = assignment.lifecycleStatus === 'ACTIVE' &&
    getEffectiveScheduleStatus(assignment, now) === 'OPEN' &&
    !assignment.starterDistributionPending &&
    assignment.studentAccess !== 'NONE';
  if (writable) return { label: 'IDE 열기', enabled: true, readOnly: false };
  if (assignment.studentAccess === 'READ_ONLY') {
    return { label: '열람', enabled: true, readOnly: true };
  }
  return { label: 'IDE 열기', enabled: false, readOnly: false };
};

export const getAssignmentDeadlineTooltip = (deadlineDate) => {
  if (!deadlineDate) return '마감일 정보 없음';

  const deadline = new Date(deadlineDate);
  if (Number.isNaN(deadline.getTime())) return '마감일 정보 없음';

  return `마감일: ${new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(deadline)}`;
};
