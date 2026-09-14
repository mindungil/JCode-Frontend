import React from 'react';
import { render, screen } from '@testing-library/react';
import api from '../../../../api/axios';
import StudentsTab from './StudentsTab';

jest.mock('../../../../api/axios', () => ({
  post: jest.fn(),
}));

jest.mock('react-toastify', () => ({
  toast: { error: jest.fn() },
}));

describe('StudentsTab JCode privacy boundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.open = jest.fn();
  });

  test('does not expose a course-wide student workspace action', () => {
    render(
      <StudentsTab
        students={[{
          email: 'student@example.com',
          name: 'Student',
          studentNum: '202600001',
          courseRole: 'STUDENT',
        }]}
        searchQuery=""
        onSearchChange={jest.fn()}
        sort={{ field: 'name', order: 'asc' }}
        onToggleSort={jest.fn()}
        onWithdrawUser={jest.fn()}
        onPromoteStudent={jest.fn()}
        userRole="PROFESSOR"
        courseId={60}
        isDarkMode={false}
      />
    );

    expect(screen.queryByRole('button', { name: 'JCode' })).not.toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });
});
