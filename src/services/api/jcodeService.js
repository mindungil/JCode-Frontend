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

    try {
      //console.log('JCode 생성 요청:', { courseId, userEmail: jcodeData.userEmail, snapshot: jcodeData.snapshot });
      
      const response = await api.post(`/api/courses/${courseId}/jcodes`, {
        userEmail: jcodeData.userEmail,
        snapshot: jcodeData.snapshot || false,
        ...(jcodeData.assignmentId && { assignmentId: jcodeData.assignmentId })
      });

      //console.log('JCode 생성 성공:', response.data);
      return response.data;

    } catch (error) {
      //console.error('JCode 생성 에러:', error);
      
      const detail = error.response?.data?.detail || error.response?.data?.message;
      if (error.response?.status === 403) {
        // 403 에러는 이미 JCode가 존재하거나 권한 없음을 의미할 수 있음
        //console.warn('JCode 생성 실패 (이미 존재하거나 권한 없음):', error.response?.data);
        throw new Error('JCode가 이미 존재하거나 생성 권한이 없습니다.');
      } else if (error.response?.status === 404) {
        throw new Error('해당 강의를 찾을 수 없습니다.');
      }
      
      const wrapped = new Error(detail || `JCode 생성에 실패했습니다: ${error.message}`);
      wrapped.response = error.response;
      throw wrapped;
    }
  },

  createAndWaitUntilReady: async (courseId, jcodeData, { timeoutMs = 90000, intervalMs = 1500 } = {}) => {
    const deadline = Date.now() + timeoutMs;
    let lastError;
    while (Date.now() < deadline) {
      try {
        const jcode = await jcodeService.createJCode(courseId, jcodeData);
        if (jcode.status === 'READY' && jcode.jcodeUrl) return jcode;
        if (jcode.status === 'PROVISION_FAILED' || jcode.status === 'DELETE_FAILED') {
          await api.post(`/api/courses/${courseId}/jcodes/retry`, {
            userEmail: jcodeData.userEmail,
            snapshot: jcodeData.snapshot || false,
            ...(jcodeData.assignmentId && { assignmentId: jcodeData.assignmentId })
          });
        } else if (jcode.lastError) {
          throw new Error(jcode.lastError || 'JCode 준비 작업이 실패했습니다.');
        }
      } catch (error) {
        lastError = error;
        if (![409, 502, 503].includes(error.response?.status)) throw error;
      }
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
    throw lastError || new Error('JCode 준비 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.');
  },

  /**
   * JCode 삭제
   * DELETE /api/courses/{courseId}/jcodes
   */
  deleteJCode: async (courseId, jcodeData, options = {}) => {
    if (!courseId || !jcodeData) {
      throw new Error('강의 ID와 JCode 데이터가 필요합니다.');
    }

    const { userEmail, snapshot = false, assignmentId } = jcodeData;
    if (!userEmail) {
      throw new Error('사용자 이메일이 필요합니다.');
    }

    try {
      //console.log('JCode 삭제 요청:', { courseId });
      
      const response = await api.delete(`/api/courses/${courseId}/jcodes`, {
        data: { userEmail, snapshot, ...(assignmentId && { assignmentId }) },
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
