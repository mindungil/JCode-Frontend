import React, { memo } from 'react';
import {
  TableRow,
  TableCell,
  IconButton,
  Box,
  Chip,
  Tooltip
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import StopIcon from '@mui/icons-material/Stop';
import ArchiveIcon from '@mui/icons-material/Archive';
import ReplayIcon from '@mui/icons-material/Replay';
import { CELL_STYLE } from '../AdminTable';

const STATUS_CONFIG = {
  ACTIVE: { label: '활성', color: 'success' },
  ENDED: { label: '종료', color: 'warning' },
  ARCHIVED: { label: '보관', color: 'default' }
};

const CourseTableRow = memo(({
  item,
  itemIndex,
  isDarkMode,
  onOpenDialog
}) => {
  const statusConfig = STATUS_CONFIG[item.status] || STATUS_CONFIG.ACTIVE;

  return (
    <TableRow key={item.courseId}>
      <TableCell sx={CELL_STYLE}>{itemIndex}</TableCell>
      <TableCell sx={CELL_STYLE}>{item.courseName}</TableCell>
      <TableCell sx={CELL_STYLE}>{item.courseCode}</TableCell>
      <TableCell sx={CELL_STYLE}>{item.professor}</TableCell>
      <TableCell sx={CELL_STYLE}>{item.year}</TableCell>
      <TableCell sx={CELL_STYLE}>{item.term}</TableCell>
      <TableCell sx={CELL_STYLE}>{item.clss}</TableCell>
      <TableCell sx={CELL_STYLE}>
        <Chip
          label={statusConfig.label}
          color={statusConfig.color}
          size="small"
          variant="outlined"
        />
      </TableCell>
      <TableCell sx={CELL_STYLE}>
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: item.vnc
              ? (isDarkMode ? '#50FA7B' : '#1b5e20')
              : (isDarkMode ? '#FF5555' : '#b71c1c'),
            fontWeight: 900,
            fontSize: '1rem'
          }}
        >
          {item.vnc ? '○' : '✕'}
        </Box>
      </TableCell>
      <TableCell>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {item.status === 'ACTIVE' && (
            <>
              <Tooltip title="수정">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenDialog('edit', item);
                  }}
                >
                  <EditIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="종료">
                <IconButton
                  size="small"
                  color="warning"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenDialog('end', item);
                  }}
                >
                  <StopIcon />
                </IconButton>
              </Tooltip>
            </>
          )}
          {item.status === 'ENDED' && (
            <>
              <Tooltip title="아카이브">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenDialog('archive', item);
                  }}
                >
                  <ArchiveIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="재개설">
                <IconButton
                  size="small"
                  color="primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenDialog('reopen', item);
                  }}
                >
                  <ReplayIcon />
                </IconButton>
              </Tooltip>
            </>
          )}
          {item.status === 'ARCHIVED' && (
            <Tooltip title="삭제">
              <IconButton
                size="small"
                color="error"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenDialog('delete', item);
                }}
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </TableCell>
    </TableRow>
  );
});

export default CourseTableRow;
