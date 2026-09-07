import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
}));
jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: null }),
}));
jest.mock('../../../contexts/ThemeContext', () => ({
  useTheme: () => ({ isDarkMode: false }),
}));
jest.mock('../../../services/api', () => ({
  assignmentService: {},
  jcodeService: {},
  redirectService: {},
  userService: {},
}));

import { CourseActionTile } from './WebIDECourses';

describe('CourseActionTile', () => {
  test('renders course actions with a visible dashed outline', () => {
    render(
      <CourseActionTile
        icon={<span aria-hidden="true">+</span>}
        label="새 수업 참가"
        onClick={() => {}}
      />
    );

    const card = screen.getByRole('button', { name: '새 수업 참가' }).closest('.MuiCard-root');

    expect(card).toHaveClass('MuiPaper-outlined');
    expect(card).toHaveStyle({
      borderStyle: 'dashed',
      borderWidth: '1px',
    });
  });
});
