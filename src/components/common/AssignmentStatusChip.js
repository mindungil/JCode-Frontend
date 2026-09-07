import React from 'react';
import { Box, Chip, CircularProgress, Tooltip } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { getAssignmentDeadlineTooltip, getAssignmentStatus } from '../../utils/assignmentStatus';

const AssignmentStatusChip = ({ assignment }) => {
  const status = getAssignmentStatus(assignment);

  return (
    <Tooltip
      title={getAssignmentDeadlineTooltip(assignment?.deadlineDate)}
      placement="top"
      enterDelay={250}
      arrow
    >
      <Chip
        size="small"
        variant="outlined"
        label={(
          <Box
            component="span"
            sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.625, lineHeight: 1 }}
          >
            {status.progress ? (
              <CircularProgress size={9} thickness={5} color="inherit" />
            ) : (
              <Box
                component="span"
                sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'currentColor', flexShrink: 0 }}
              />
            )}
            {status.label}
          </Box>
        )}
        sx={(theme) => {
          const palette = theme.palette[status.color] || theme.palette.grey;
          const tone = palette.main || theme.palette.text.secondary;

          return {
            height: 22,
            borderRadius: 1,
            flexShrink: 0,
            color: tone,
            bgcolor: alpha(tone, 0.08),
            borderColor: alpha(tone, 0.32),
            fontSize: '0.7rem',
            fontWeight: 600,
            '& .MuiChip-label': {
              display: 'flex',
              alignItems: 'center',
              px: 0.75,
              py: 0,
            },
          };
        }}
      />
    </Tooltip>
  );
};

export default AssignmentStatusChip;
