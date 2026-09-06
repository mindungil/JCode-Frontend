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

export const getAssignmentStatus = (assignment = {}) => {
  const lifecycle = assignment.lifecycleStatus || 'ACTIVE';
  if (LIFECYCLE_STATUS[lifecycle]) return LIFECYCLE_STATUS[lifecycle];

  return SCHEDULE_STATUS[assignment.scheduleStatus]
    || { label: '상태 확인 필요', color: 'default', progress: false };
};
