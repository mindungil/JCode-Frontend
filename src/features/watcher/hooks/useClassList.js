import { useState, useEffect, useCallback } from 'react';
import axios from '../../../api/axios';
import { useAuth } from '../../../contexts/AuthContext';
import { getErrorMessage } from '../../../services/errorHandler';

export const useClassList = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 강의 목록 로드
  const loadClasses = useCallback(async (background = false) => {
    try {
      if (!background) setLoading(true);
      
      let response;
      
      if (user?.role === 'ADMIN') {
        response = await axios.get('/api/courses');
      } else {
        response = await axios.get('/api/users/me/courses');
      }
      
      const formattedData = user?.role === 'ADMIN' ? 
        response.data.map(course => ({
          courseId: course.courseId,
          courseName: course.name,
          courseCode: course.code,
          courseProfessor: course.professor,
          courseYear: course.year,
          courseTerm: course.term,
          courseClss: course.clss,
          courseRole: 'ADMIN',
          status: course.status,
          canCancelCreation: course.canCancelCreation
        })) : response.data;
      
      setClasses(formattedData);
      setError('');
    } catch (err) {
      //console.error('강의 목록 로드 실패:', err);
      if (!background) setError('수업 목록을 불러오는데 실패했습니다.');
    } finally {
      if (!background) setLoading(false);
    }
  }, [user]);

  // 새 강의 추가
  const addClass = useCallback(async (classData) => {
    const knownCourseIds = new Set(classes.map(course => course.courseId));
    try {
      const createResponse = await axios.post('/api/courses', {
        code: classData.code,
        name: classData.name,
        professor: classData.professor,
        year: classData.year,
        term: classData.term,
        clss: parseInt(classData.clss),
        vnc: classData.vnc
      });

      const { courseId, courseKey } = createResponse.data;

      // 생성 요청이 수락되면 창을 즉시 닫을 수 있도록 목록 갱신은 백그라운드에서 수행한다.
      void loadClasses(true);

      return { 
        success: true, 
        courseId, 
        courseKey 
      };
    } catch (err) {
      if (!err.response && user?.role === 'ADMIN') {
        try {
          const latest = await axios.get('/api/courses');
          const accepted = latest.data.find(course =>
            !knownCourseIds.has(course.courseId)
            &&
            course.code?.toLowerCase() === classData.code.trim().toLowerCase()
            && Number(course.clss) === Number(classData.clss)
            && course.status !== 'ARCHIVED'
          );
          if (accepted) {
            void loadClasses(true);
            return {
              success: true,
              courseId: accepted.courseId,
              courseKey: null
            };
          }
        } catch {
          // 원래 요청 오류를 유지한다.
        }
      }
      return { 
        success: false, 
        error: getErrorMessage(err, '수업 생성 요청에 실패했습니다.')
      };
    }
  }, [classes, loadClasses, user?.role]);

  // 참가 코드 재발급
  const regenerateCourseKey = useCallback(async (courseId) => {
    try {
      // 백엔드 스펙: GET /api/courses/{courseId}/key → 응답은 문자열(newKey)
      const response = await axios.get(`/api/courses/${courseId}/key`);
      const data = response.data;
      const courseKey = typeof data === 'string' ? data : data?.courseKey;

      if (!courseKey) {
        throw new Error('서버 응답에서 참가 코드를 찾을 수 없습니다.');
      }

      // 목록 새로고침
      await loadClasses();

      return {
        success: true,
        courseKey
      };
    } catch (err) {
      //console.error('참가 코드 재발급 실패:', err);
      return {
        success: false,
        error: getErrorMessage(err, '참가 코드 재발급에 실패했습니다.')
      };
    }
  }, [loadClasses]);

  // 강의 삭제
  const deleteClass = useCallback(async (courseId) => {
    try {
      await axios.delete(`/api/courses/${courseId}`);
      
      // 목록 새로고침
      await loadClasses();
      
      return { success: true };
    } catch (err) {
      //console.error('강의 삭제 실패:', err);
      return { 
        success: false, 
        error: getErrorMessage(err, '강의 삭제에 실패했습니다.')
      };
    }
  }, [loadClasses]);

  // 강의 목록 필터링 유틸리티
  const filterClasses = useCallback((selectedYear, selectedTerm) => {
    return classes.filter(course => {
      if (course.status === 'ARCHIVED') return false;
      const yearMatch = selectedYear === 'all' || course.courseYear === selectedYear;
      const termMatch = selectedTerm === 'all' || course.courseTerm === selectedTerm;
      return yearMatch && termMatch;
    });
  }, [classes]);

  // 고유한 연도와 학기 목록 추출
  const getAvailableYears = useCallback(() => {
    return [...new Set(classes.map(course => course.courseYear))].sort((a, b) => b - a);
  }, [classes]);

  const getAvailableTerms = useCallback(() => {
    return [...new Set(classes.map(course => course.courseTerm))].sort();
  }, [classes]);

  // 현재 학기 추천
  const getCurrentSemester = useCallback(() => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    const currentTerm = currentMonth >= 9 ? 2 : 1;
    
    return { year: currentYear, term: currentTerm };
  }, []);

  // 폼 유효성 검사
  const validateClassForm = useCallback((formData) => {
    const errors = { courseClss: '', courseCode: '' };
    let isValid = true;

    // 분반 유효성 검사 - 숫자만 허용
    if (!/^\d+$/.test(formData.clss)) {
      errors.courseClss = '분반은 숫자만 입력 가능합니다';
      isValid = false;
    }

    // 과목 코드 유효성 검사 - 영문자로 시작하고 영문자+숫자 조합만 허용
    if (!/^[A-Za-z][A-Za-z0-9]*$/.test(formData.code)) {
      errors.courseCode = '영문자로 시작하고 영문자와 숫자만 사용 가능합니다';
      isValid = false;
    }

    return { isValid, errors };
  }, []);

  // 초기 데이터 로드
  useEffect(() => {
    if (user) {
      loadClasses();
    }
  }, [user, loadClasses]);

  useEffect(() => {
    const transitional = new Set(['PROVISIONING', 'TERMINATING', 'ARCHIVING']);
    if (!classes.some(course => transitional.has(course.status))) return undefined;
    const timer = window.setInterval(() => loadClasses(true), 3000);
    return () => window.clearInterval(timer);
  }, [classes, loadClasses]);

  return {
    // 상태
    classes,
    loading,
    error,
    
    // 계산된 값
    availableYears: getAvailableYears(),
    availableTerms: getAvailableTerms(),
    currentSemester: getCurrentSemester(),
    
    // 액션
    loadClasses,
    addClass,
    regenerateCourseKey,
    deleteClass,
    
    // 유틸리티
    filterClasses,
    validateClassForm
  };
};
