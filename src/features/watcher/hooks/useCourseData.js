import { useState, useEffect } from 'react';
import { fetchCourseInfo, fetchUserCoursesDetails } from '../components/charts/api';
import { useAuth } from '../../../contexts/AuthContext';
import { getCourseRole } from '../utils/coursePermissions';

export const useCourseData = (courseId) => {
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadCourseData = async () => {
    if (!courseId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      let courseData = null;

      if (user?.role === 'ADMIN') {
        // 관리자는 직접 강의 정보 조회
        courseData = await fetchCourseInfo(courseId);
      } else if (user) {
        // 일반 사용자의 권한은 전역 역할이 아니라 이 강의의 멤버십으로 결정한다.
        const userCoursesData = await fetchUserCoursesDetails();
        courseData = userCoursesData.find(c => c.courseId === parseInt(courseId));
        
        if (!courseData) {
          throw new Error('접근 권한이 없는 강의입니다.');
        }
      } else {
        throw new Error('인증되지 않은 사용자입니다.');
      }

      setCourse(courseData);
    } catch (err) {
      //console.error('강의 정보 로드 실패:', err);
      setError('강의 정보를 불러오는데 실패했습니다.');
      setCourse(null);
    } finally {
      setLoading(false);
    }
  };

  // 강의 정보 새로고침
  const refreshCourse = () => {
    loadCourseData();
  };

  // 강의 이름 가져오기
  const getCourseName = () => {
    if (!course) return '로딩중...';
    return course.courseName || course.name || '강의명 없음';
  };

  // 강의 상태 확인
  const isCourseActive = () => {
    if (!course) return false;
    
    const now = new Date();
    const startDate = course.startDate ? new Date(course.startDate) : null;
    const endDate = course.endDate ? new Date(course.endDate) : null;

    if (!startDate || !endDate) return true; // 날짜 정보가 없으면 활성으로 간주

    return startDate <= now && now <= endDate;
  };

  const isCourseExpired = () => {
    if (!course || !course.endDate) return false;
    
    return new Date() > new Date(course.endDate);
  };

  const isCourseUpcoming = () => {
    if (!course || !course.startDate) return false;
    
    return new Date() < new Date(course.startDate);
  };

  // 강의 기간 정보
  const getCoursePeriod = () => {
    if (!course) return null;

    const startDate = course.startDate ? new Date(course.startDate) : null;
    const endDate = course.endDate ? new Date(course.endDate) : null;

    if (!startDate || !endDate) return null;

    return {
      start: startDate,
      end: endDate,
      duration: endDate - startDate
    };
  };

  // 사용자의 강의 내 역할 확인
  const getUserCourseRole = () => {
    if (!course || !user) return null;

    return getCourseRole(course, user);
  };

  // 권한 확인 함수들
  const canManageCourse = () => {
    const role = getUserCourseRole();
    return ['ADMIN', 'PROFESSOR'].includes(role);
  };

  const canViewStudents = () => {
    const role = getUserCourseRole();
    return ['ADMIN', 'PROFESSOR', 'ASSISTANT'].includes(role);
  };

  const canCreateAssignments = () => {
    const role = getUserCourseRole();
    return ['ADMIN', 'PROFESSOR', 'ASSISTANT'].includes(role);
  };

  const isStudent = () => {
    const role = getUserCourseRole();
    return role === 'STUDENT';
  };

  useEffect(() => {
    loadCourseData();
  }, [courseId, user]);

  return {
    // 상태
    course,
    loading,
    error,
    
    // 계산된 값
    courseName: getCourseName(),
    userRole: getUserCourseRole(),
    isActive: isCourseActive(),
    isExpired: isCourseExpired(),
    isUpcoming: isCourseUpcoming(),
    coursePeriod: getCoursePeriod(),
    
    // 권한 확인
    canManageCourse: canManageCourse(),
    canViewStudents: canViewStudents(),
    canCreateAssignments: canCreateAssignments(),
    isStudent: isStudent(),
    
    // 액션
    refreshCourse,
    loadCourseData
  };
};
