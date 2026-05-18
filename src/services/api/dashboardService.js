import api from '../../api/axios';

const dashboardService = {
  getSubmissionDashboard: async (courseId, assignmentId) => {
    const response = await api.get(
      `/api/watcher/dashboard/courses/${courseId}/assignments/${assignmentId}`
    );
    return response.data;
  }
};

export default dashboardService;
