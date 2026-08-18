import { 
  apiGet
} from '../apiHelpers';
import api from '../../api/axios';

/**
 * 과제 관련 API 서비스 (조회 전용)
 * 백엔드 API 명세서에 따른 Assignment API 구현
 * 
 * 참고: 과제 CRUD (생성, 수정, 삭제)는 adminService.js에 있습니다.
 */

const assignmentService = {
  /**
   * 특정 강의의 과제 목록 조회
   * GET /api/courses/{courseId}/assignments
   */
  getCourseAssignments: async (courseId, options = {}) => {
    if (!courseId) {
      throw new Error('강의 ID가 필요합니다.');
    }

    return apiGet(`/api/courses/${courseId}/assignments`, {
      customErrorMessage: '과제 목록을 불러올 수 없습니다.',
      ...options
    });
  },

  /**
   * 과제 목록에서 특정 과제 찾기 (유틸리티 함수)
   */
  findAssignmentInCourse: async (courseId, assignmentId, options = {}) => {
    if (!courseId || !assignmentId) {
      throw new Error('강의 ID와 과제 ID가 필요합니다.');
    }

    const assignments = await assignmentService.getCourseAssignments(courseId, {
      ...options,
      showToast: false // 찾기 실패는 조용히 처리
    });

    const foundAssignment = assignments.find(a => a.assignmentId === parseInt(assignmentId));
    
    if (!foundAssignment) {
      throw new Error('과제를 찾을 수 없습니다.');
    }

    return foundAssignment;
  },

  /**
   * 새 과제의 Workspace 준비가 끝날 때까지 기다립니다.
   */
  waitUntilActive: async (courseId, assignmentId, { timeoutMs = 90000, intervalMs = 1500 } = {}) => {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const assignment = await assignmentService.findAssignmentInCourse(courseId, assignmentId, {
        showToast: false
      });
      if (assignment.lifecycleStatus === 'ACTIVE') return assignment;
      if (assignment.lifecycleStatus === 'PROVISION_FAILED') {
        throw new Error(assignment.lastError || '과제 Workspace 준비에 실패했습니다.');
      }
      if (['DELETING', 'ARCHIVED'].includes(assignment.lifecycleStatus)) {
        throw new Error('삭제 중이거나 보관된 과제에는 스타터 코드를 올릴 수 없습니다.');
      }
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
    throw new Error('과제 Workspace 준비 시간이 초과됐습니다. 과제는 생성됐으며 상태를 확인한 뒤 스타터 코드를 다시 올려주세요.');
  },

  uploadStarterWhenActive: async (
    courseId,
    assignmentId,
    file,
    overwritePolicy,
    deployNow,
    waitOptions
  ) => {
    await assignmentService.waitUntilActive(courseId, assignmentId, waitOptions);
    const formData = new FormData();
    formData.append('file', file);
    return api.post(
      `/api/courses/${courseId}/assignments/${assignmentId}/starter-code?overwritePolicy=${overwritePolicy}&deployNow=${deployNow}`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
  },

  /**
   * 과제 상태 확인 (마감일 기준)
   */
  getAssignmentStatus: (assignment) => {
    if (!assignment || !assignment.deadlineDate) {
      return 'unknown';
    }

    const now = new Date();
    const deadline = new Date(assignment.deadlineDate);
    const kickoff = new Date(assignment.kickoffDate);

    if (now < kickoff) {
      return 'not_started'; // 시작 전
    } else if (now > deadline) {
      return 'ended'; // 마감됨
    } else {
      return 'active'; // 진행 중
    }
  },

  /**
   * 남은 시간 계산
   */
  getRemainingTime: (assignment) => {
    if (!assignment || !assignment.deadlineDate) {
      return null;
    }

    const now = new Date();
    const deadline = new Date(assignment.deadlineDate);
    const timeDiff = deadline.getTime() - now.getTime();

    if (timeDiff <= 0) {
      return { expired: true, days: 0, hours: 0, minutes: 0 };
    }

    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

    return { expired: false, days, hours, minutes };
  }
};

export default assignmentService;
