import api from '../../api/axios';

/**
 * 리다이렉션 API 서비스
 * 백엔드 API 명세서에 따른 Redirect API 구현
 */

const redirectService = {
  /**
   * Node.js 서버 리다이렉션
   * POST /api/redirect
   */
  redirectToJCode: async (redirectData, options = {}) => {
    if (!redirectData) {
      throw new Error('리다이렉트 데이터가 필요합니다.');
    }

    if (!redirectData.userEmail || !redirectData.courseId) {
      throw new Error('사용자 이메일과 강의 ID가 필요합니다.');
    }

    const response = await api.post('/api/redirect', {
      userEmail: redirectData.userEmail,
      courseId: redirectData.courseId,
      snapshot: redirectData.snapshot || false,
      ...(redirectData.assignmentId && { assignmentId: redirectData.assignmentId })
    });
    return { url: response.data?.url, data: response.data };
  }
};

export default redirectService;
