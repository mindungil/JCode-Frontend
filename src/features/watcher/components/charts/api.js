import { fetchMonitoringData as fetchMonitoringDataService } from './ChartDataService';
import { redirectService, watcherService, userService, courseService, assignmentService } from '../../../../services/api';

// 모니터링 데이터 가져오기
export const fetchMonitoringData = async (intervalValue, courseId, assignmentId, userId) => {
  return fetchMonitoringDataService(intervalValue, courseId, assignmentId, userId);
};

// 학생 정보 가져오기 (courseService를 사용하도록 변경)
export const fetchStudentInfo = courseService.getCourseUser;

// 과제 정보 가져오기 (assignmentService를 사용하도록 변경)
export const fetchAssignmentInfo = assignmentService.findAssignmentInCourse;

// 강의 정보 가져오기 (courseService를 사용하도록 변경)
export const fetchCourseInfo = courseService.getCourseDetails;

// 차트 데이터 시간 단위별 가져오기 (watcherService를 사용하도록 변경)
export const fetchChartDataByTimeRange = async (courseId, assignmentId, startDate, endDate) => {
  try {
    const response = await watcherService.getAssignmentDataBetween(assignmentId, courseId, startDate, endDate);
    return response.results || [];
  } catch (error) {
    //console.error('차트 데이터 로딩 오류:', error);
    return [];
  }
};

// JCode로 리다이렉트 (redirectService를 사용하도록 변경)
export const redirectToJCode = async (email, courseId, assignmentId = null) => {
  try {
    const result = await redirectService.redirectToJCode({
      userEmail: email,
      courseId: courseId,
      ...(assignmentId && { assignmentId })
    });
    
    return result.url || result.data?.url;
  } catch (error) {
    //console.error('JCode 리다이렉션 오류:', error);
    throw error;
  }
};

// 시간 단위 계산 (watcherService를 사용하도록 변경)
export const calculateIntervalValue = watcherService.calculateIntervalValue;

// 과제에 등록된 학생 목록 가져오기 (courseService를 사용하도록 변경)
export const fetchStudents = courseService.getCourseUsers;

// Plotly 차트 인스턴스 정리 함수 (watcherService를 사용하도록 변경)
export const cleanupChartInstance = watcherService.cleanupChartInstance;

// 사용자 강의 세부 정보 가져오기 (userService를 사용하도록 변경)
export const fetchUserCoursesDetails = userService.getMyCoursesDetails;
