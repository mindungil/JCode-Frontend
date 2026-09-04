import api from '../../api/axios';

/**
 * JCode 관리 API 서비스
 * 백엔드 API 명세서에 따른 JCode Admin API 구현
 */

const jcodeService = {
  /**
   * JCode 생성 및 할당
   * POST /api/courses/{courseId}/jcodes
   */
  createJCode: async (courseId, jcodeData, options = {}) => {
    if (!courseId || !jcodeData) {
      throw new Error('강의 ID와 JCode 데이터가 필요합니다.');
    }

    if (!jcodeData.userEmail) {
      throw new Error('사용자 이메일이 필요합니다.');
    }

    const response = await api.post(`/api/courses/${courseId}/jcodes`, {
      userEmail: jcodeData.userEmail,
      snapshot: jcodeData.snapshot || false,
      ...(jcodeData.assignmentId && { assignmentId: jcodeData.assignmentId })
    });
    return response.data;
  },

  /**
   * JCode 삭제
   * DELETE /api/courses/{courseId}/jcodes
   */
  deleteJCode: async (courseId, jcodeData, options = {}) => {
    if (!courseId || !jcodeData) {
      throw new Error('강의 ID와 JCode 데이터가 필요합니다.');
    }

    const { userEmail, snapshot = false } = jcodeData;
    if (!userEmail) {
      throw new Error('사용자 이메일이 필요합니다.');
    }

    try {
      //console.log('JCode 삭제 요청:', { courseId });
      
      const response = await api.delete(`/api/courses/${courseId}/jcodes`, {
        data: { userEmail, snapshot },
        headers: { 'Content-Type': 'application/json' }
      });

      //console.log('JCode 삭제 성공:', response.data);
      return response.data;

    } catch (error) {
      //console.error('JCode 삭제 에러:', error);
      
      if (error.response?.status === 403) {
        throw new Error('JCode 삭제 권한이 없습니다.');
      } else if (error.response?.status === 404) {
        throw new Error('삭제할 JCode를 찾을 수 없습니다.');
      }
      
      throw new Error(`JCode 삭제에 실패했습니다: ${error.message}`);
    }
  }
};

export default jcodeService;
