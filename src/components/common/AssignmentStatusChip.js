import React from 'react';
import { Box, Chip, CircularProgress, Tooltip } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { getAssignmentDeadlineTooltip, getAssignmentStatus } from '../../utils/assignmentStatus';

const STATUS_TONES = {
  light: {
    success: '#496B52',
    warning: '#756438',
    error: '#8A5357',
    info: '#526A78',
    default: '#626870',
  },
  dark: {
    success: '#93A997',
    warning: '#B1A071',
    error: '#B98A8D',
    info: '#91A5B0',
    default: '#A2A7AE',
  },
};

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
                sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: 'currentColor', flexShrink: 0 }}
              />
            )}
            {status.label}
          </Box>
        )}
        sx={(theme) => {
          const tones = STATUS_TONES[theme.palette.mode] || STATUS_TONES.light;
          const tone = tones[status.color] || tones.default;

          return {
            height: 20,
            borderRadius: 1,
            flexShrink: 0,
            color: tone,
            bgcolor: alpha(tone, 0.06),
            borderColor: alpha(tone, 0.22),
            fontSize: '0.7rem',
            fontWeight: 500,
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
