import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import AssignmentStatusChip from './AssignmentStatusChip';

describe('AssignmentStatusChip', () => {
  const deadlineDate = '2026-09-10T13:30:00Z';

  test('renders the open state as a compact status without a loading indicator', () => {
    render(<AssignmentStatusChip assignment={{ lifecycleStatus: 'ACTIVE', scheduleStatus: 'OPEN', deadlineDate }} />);

    expect(screen.getByText('진행 중')).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  test('shows the exact deadline when the status is hovered', async () => {
    render(<AssignmentStatusChip assignment={{ lifecycleStatus: 'ACTIVE', scheduleStatus: 'OPEN', deadlineDate }} />);

    fireEvent.mouseOver(screen.getByText('진행 중'));

    expect(await screen.findByRole('tooltip')).toHaveTextContent('마감일:');
  });

  test('uses a loading indicator only for transitional states', () => {
    render(<AssignmentStatusChip assignment={{ lifecycleStatus: 'PROVISIONING', deadlineDate }} />);

    expect(screen.getByText('준비 중')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
});
