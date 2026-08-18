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
import StopIcon from '@mui/icons-material/Stop';
import ArchiveIcon from '@mui/icons-material/Archive';
import ReplayIcon from '@mui/icons-material/Replay';
import SyncProblemIcon from '@mui/icons-material/SyncProblem';
import { CELL_STYLE } from '../AdminTable';

const STATUS_CONFIG = {
  PROVISIONING: { label: '생성 중', color: 'info' },
  ACTIVE: { label: '활성', color: 'success' },
  TERMINATING: { label: '종료 중', color: 'info' },
  ENDED: { label: '종료', color: 'warning' },
  ARCHIVING: { label: '보관 중', color: 'info' },
  ERROR: { label: '처리 오류', color: 'error' },
  ARCHIVED: { label: '보관', color: 'default' }
};

const PROFILE_LABEL = {
  ALGORITHM: '알고리즘',
  LAB: '그래픽·Jupyter',
  CUSTOM: '사용자 정의'
};

const CourseTableRow = memo(({
  item,
  itemIndex,
  onOpenDialog
}) => {
  const statusConfig = STATUS_CONFIG[item.status] || { label: item.status || '상태 미상', color: 'default' };

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
        <Chip
          label={PROFILE_LABEL[item.environmentProfile] || (item.vnc ? PROFILE_LABEL.LAB : PROFILE_LABEL.ALGORITHM)}
          size="small"
          variant="outlined"
        />
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
          {item.status === 'ERROR' && (
            <Tooltip title="인프라 작업 재시도">
              <IconButton
                size="small"
                color="error"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenDialog('retry', item);
                }}
              >
                <SyncProblemIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </TableCell>
    </TableRow>
  );
});

export default CourseTableRow;
