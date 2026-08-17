import React from 'react';
import {
  Box,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Stack,
  Typography,
  Fade,
  Chip,
  Tooltip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import ReplayIcon from '@mui/icons-material/Replay';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { FONT_FAMILY } from '../../../../constants/uiConstants';
import RemainingTime from '../common/RemainingTime';

const SCHEDULE_LABEL = { SCHEDULED: '시작 전', OPEN: '진행 중', CLOSED: '마감', ARCHIVED: '보관' };
const LIFECYCLE_LABEL = { PROVISIONING: '준비 중', PROVISION_FAILED: '준비 오류', DELETING: '보관 중', ARCHIVED: '보관 완료' };

/**
 * 과제 목록 탭 컴포넌트
 * 과제 테이블과 관리 기능 제공
 */
const AssignmentsTab = ({
  assignments,
  onAddAssignment,
  onEditAssignment,
  onDeleteAssignment,
  onRetryAssignment,
  onReopenAssignment,
  onUploadStarter,
  userRole,
  courseId
}) => {
  const navigate = useNavigate();

  // 날짜 형식 변환 함수
  const formatToLocalDateTimeString = (dateString) => {
    const date = new Date(dateString);
    
    // 로컬 시간대의 연, 월, 일, 시, 분 추출
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    // HTML datetime-local 입력에 필요한 형식 (YYYY-MM-DDThh:mm)
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // 과제 수정 핸들러
  const handleEditClick = (assignment) => {
    const formattedAssignment = {
      ...assignment,
      originalAssignmentName: assignment.assignmentName,
      kickoffDate: formatToLocalDateTimeString(assignment.kickoffDate),
      deadlineDate: formatToLocalDateTimeString(assignment.deadlineDate)
    };
    onEditAssignment(formattedAssignment);
  };

  // 과제 행 클릭 핸들러
  const handleRowClick = (assignmentId) => {
    navigate(`/watcher/class/${courseId}/assignment/${assignmentId}`);
  };

  return (
    <Fade in={true} timeout={300}>
      <Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontFamily: FONT_FAMILY, fontWeight: 'bold' }}>
                  과제명
                </TableCell>
                <TableCell sx={{ fontFamily: FONT_FAMILY, fontWeight: 'bold' }}>
                  설명
                </TableCell>
                <TableCell sx={{ fontFamily: FONT_FAMILY, fontWeight: 'bold' }}>
                  상태
                </TableCell>
                <TableCell sx={{ fontFamily: FONT_FAMILY, fontWeight: 'bold' }}>
                  시작일
                </TableCell>
                <TableCell sx={{ fontFamily: FONT_FAMILY, fontWeight: 'bold' }}>
                  마감일
                </TableCell>
                <TableCell sx={{ fontFamily: FONT_FAMILY, fontWeight: 'bold', width: '250px' }}>
                  남은 시간
                </TableCell>
                {userRole !== 'STUDENT' && (
                  <TableCell sx={{ fontFamily: FONT_FAMILY, fontWeight: 'bold', width: '100px' }}>
                    작업
                  </TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {assignments.map((assignment) => (
                <TableRow 
                  key={assignment.assignmentId}
                  sx={{ 
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: (theme) => 
                        theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
                    },
                    transition: 'background-color 0.2s ease'
                  }}
                >
                  <TableCell 
                    onClick={() => handleRowClick(assignment.assignmentId)}
                    sx={{ fontFamily: FONT_FAMILY }}
                  >
                    {assignment.assignmentName}
                  </TableCell>
                  <TableCell 
                    onClick={() => handleRowClick(assignment.assignmentId)}
                    sx={{ 
                      fontFamily: FONT_FAMILY,
                      maxWidth: '300px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {assignment.assignmentDescription}
                  </TableCell>
                  <TableCell onClick={() => handleRowClick(assignment.assignmentId)}>
                    <Stack spacing={0.5} alignItems="flex-start">
                      <Chip size="small" label={SCHEDULE_LABEL[assignment.scheduleStatus] || '상태 미상'} variant="outlined" />
                      {assignment.lifecycleStatus && assignment.lifecycleStatus !== 'ACTIVE' && (
                        <Chip size="small" label={LIFECYCLE_LABEL[assignment.lifecycleStatus] || assignment.lifecycleStatus} color={assignment.lifecycleStatus.includes('FAILED') ? 'error' : 'info'} />
                      )}
                      {assignment.starterVersion && <Typography variant="caption">스타터 v{assignment.starterVersion}</Typography>}
                      {assignment.lastError && <Tooltip title={assignment.lastError}><Typography variant="caption" color="error">오류 확인</Typography></Tooltip>}
                    </Stack>
                  </TableCell>
                  <TableCell 
                    onClick={() => handleRowClick(assignment.assignmentId)}
                    sx={{ fontFamily: FONT_FAMILY }}
                  >
                    {new Date(assignment.kickoffDate).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </TableCell>
                  <TableCell 
                    onClick={() => handleRowClick(assignment.assignmentId)}
                    sx={{ fontFamily: FONT_FAMILY }}
                  >
                    {new Date(assignment.deadlineDate).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </TableCell>
                  <TableCell 
                    onClick={() => handleRowClick(assignment.assignmentId)}
                    sx={{ 
                      width: '250px',
                      textAlign: 'left'
                    }}
                  >
                    <RemainingTime deadline={assignment.deadlineDate} />
                  </TableCell>
                  
                  {/* 학생이 아닌 경우에만 작업 셀을 표시 */}
                  {userRole !== 'STUDENT' && (
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <IconButton
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditClick(assignment);
                          }}
                          size="small"
                          sx={{ 
                            color: 'primary.main',
                            '&:hover': {
                              backgroundColor: (theme) => 
                                theme.palette.mode === 'dark' ? 'rgba(144, 202, 249, 0.08)' : 'rgba(33, 150, 243, 0.08)'
                            }
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        {(assignment.lifecycleStatus === 'PROVISION_FAILED' || assignment.lastError) && (
                          <Tooltip title="실패 작업 재시도">
                            <IconButton size="small" color="warning" onClick={(e) => { e.stopPropagation(); onRetryAssignment(assignment); }}>
                              <ReplayIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {assignment.lifecycleStatus === 'ACTIVE' && ['SCHEDULED', 'OPEN'].includes(assignment.scheduleStatus) && (
                          <Tooltip title="새 스타터 버전">
                            <IconButton size="small" color="primary" onClick={(e) => { e.stopPropagation(); onUploadStarter(assignment); }}>
                              <CloudUploadIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {assignment.scheduleStatus === 'CLOSED' && assignment.lifecycleStatus === 'ACTIVE' && assignment.finalizedAt && (
                          <Tooltip title="과제 다시 열기">
                            <IconButton size="small" color="primary" onClick={(e) => { e.stopPropagation(); onReopenAssignment(assignment); }}>
                              <LockOpenIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        <IconButton
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteAssignment(assignment);
                          }}
                          size="small"
                          sx={{ 
                            color: 'error.main',
                            '&:hover': {
                              backgroundColor: (theme) => 
                                theme.palette.mode === 'dark' ? 'rgba(244, 67, 54, 0.08)' : 'rgba(244, 67, 54, 0.08)'
                            }
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              
              {/* 학생이 아닌 경우에만 과제 추가 행을 표시 */}
              {userRole !== 'STUDENT' && (
                <TableRow
                  onClick={onAddAssignment}
                  sx={{ 
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: (theme) => 
                        theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
                    },
                    transition: 'all 0.2s ease',
                    height: '60px'
                  }}
                >
                  <TableCell 
                    colSpan={7}
                    align="center"
                    sx={{ 
                      border: (theme) => `2px dashed ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'}`,
                      borderRadius: 1,
                      m: 1,
                    }}
                  >
                    <Box 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        gap: 1,
                        color: 'text.secondary'
                      }}
                    >
                      <AddIcon />
                      <Typography sx={{ fontFamily: FONT_FAMILY }}>
                        새 과제 추가
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Fade>
  );
};

export default AssignmentsTab;
