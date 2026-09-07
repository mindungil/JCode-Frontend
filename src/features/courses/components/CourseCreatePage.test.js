import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import CourseCreatePage from './CourseCreatePage';
import { userService } from '../../../services/api';
import { useClassList } from '../../watcher/hooks';

jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { email: 'professor@example.com', role: 'PROFESSOR' } }),
}));
jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
}));
jest.mock('../../../services/api', () => ({
  userService: { getCurrentUser: jest.fn() },
}));
jest.mock('../../watcher/hooks', () => ({
  useClassList: jest.fn(),
}));

describe('CourseCreatePage', () => {
  const addClass = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    userService.getCurrentUser.mockResolvedValue({ name: '김교수' });
    addClass.mockResolvedValue({
      success: true,
      courseId: 72,
      courseKey: 'student-join-code',
      status: 'PROVISIONING',
    });
    useClassList.mockReturnValue({
      addClass,
      classes: [],
      validateClassForm: () => ({
        isValid: true,
        errors: { courseName: '', courseClss: '', professor: '' },
      }),
    });
  });

  test('uses the professor profile and does not ask for a course code', async () => {
    render(<CourseCreatePage />);

    expect(await screen.findByDisplayValue('김교수')).toHaveAttribute('readonly');
    expect(screen.queryByLabelText(/과목 코드/)).not.toBeInTheDocument();
  });

  test('submits the course metadata and shows the one-time join code', async () => {
    render(<CourseCreatePage />);

    await screen.findByDisplayValue('김교수');
    fireEvent.change(screen.getByLabelText('과목명'), { target: { value: '자료구조' } });
    fireEvent.change(screen.getByLabelText('분반'), { target: { value: '3' } });
    fireEvent.click(screen.getByRole('button', { name: '수업 개설' }));

    await waitFor(() => expect(addClass).toHaveBeenCalledWith(expect.objectContaining({
      name: '자료구조',
      clss: '3',
      vnc: false,
    })));
    expect(await screen.findByDisplayValue('student-join-code')).toBeInTheDocument();
    expect(screen.getByText('환경 준비 중')).toBeInTheDocument();
  });
});
