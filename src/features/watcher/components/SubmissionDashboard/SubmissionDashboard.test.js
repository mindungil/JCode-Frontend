import { render, screen } from '@testing-library/react';
import { dashboardService } from '../../../../services/api';
import SubmissionDashboard from './SubmissionDashboard';

jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
  useParams: () => ({ courseId: '1', assignmentId: '2' })
}));

jest.mock('../../../../services/api', () => ({
  dashboardService: {
    getSubmissionDashboard: jest.fn()
  }
}));

test('Watcher 장애를 활동 없음과 구분해 표시한다', async () => {
  dashboardService.getSubmissionDashboard.mockResolvedValue({
    assignmentName: '과제 1',
    totalStudents: 1,
    submittedCount: 0,
    flaggedCount: 0,
    watcherStatus: 'UNAVAILABLE',
    students: []
  });

  render(<SubmissionDashboard />);

  expect(
    await screen.findByText('Watcher에 연결할 수 없어 학생 활동을 판정할 수 없습니다.')
  ).toBeInTheDocument();
});
