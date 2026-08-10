import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  CircularProgress,
  Stack,
  Fade,
  IconButton,
  Tooltip,
  Alert
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SortIcon from '@mui/icons-material/Sort';
import { useNavigate, useParams } from 'react-router-dom';
import { dashboardService } from '../../../../services/api';
import { FONT_FAMILY } from '../../../../constants/uiConstants';
import { GlassPaper } from '../../../../components/ui';

const FLAG_COLORS = {
  '⚠️ 컴파일 미시도': 'error',
  '⚠️ 대량 단일 변경': 'warning',
  '⚠️ 고속 작성': 'warning',
  '⚠️ 활동 없음': 'default'
};

const SubmissionDashboard = () => {
  const { courseId, assignmentId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortField, setSortField] = useState('flags');
  const [sortAsc, setSortAsc] = useState(false);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const result = await dashboardService.getSubmissionDashboard(courseId, assignmentId);
        setData(result);
      } catch (err) {
        setError('대시보드 데이터를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [courseId, assignmentId]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const getSortedStudents = () => {
    if (!data?.students) return [];
    return [...data.students].sort((a, b) => {
      let valA, valB;
      switch (sortField) {
        case 'flags':
          valA = a.flags.length;
          valB = b.flags.length;
          break;
        case 'buildCount':
          valA = a.buildCount;
          valB = b.buildCount;
          break;
        case 'maxSingleChange':
          valA = a.maxSingleChange;
          valB = b.maxSingleChange;
          break;
        case 'codeVelocity':
          valA = a.codeVelocity;
          valB = b.codeVelocity;
          break;
        case 'totalWorkMinutes':
          valA = a.totalWorkMinutes;
          valB = b.totalWorkMinutes;
          break;
        default:
          valA = a.flags.length;
          valB = b.flags.length;
      }
      return sortAsc ? valA - valB : valB - valA;
    });
  };

  const formatMinutes = (min) => {
    if (min === 0) return '-';
    if (min < 60) return `${min}분`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m > 0 ? `${h}시간 ${m}분` : `${h}시간`;
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '-';
    if (bytes < 1024) return `${bytes}B`;
    return `${(bytes / 1024).toFixed(1)}KB`;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Fade in={true} timeout={300}>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
          <IconButton onClick={() => navigate(-1)} size="small">
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography
              variant="h5"
              sx={{ fontFamily: FONT_FAMILY, fontWeight: 700 }}
            >
              코딩 활동 분석: {data?.assignmentName}
            </Typography>
            <Stack direction="row" spacing={2} sx={{ mt: 0.5 }}>
              <Typography variant="body2" color="text.secondary">
                전체 {data?.totalStudents}명
              </Typography>
              <Typography variant="body2" color="text.secondary">
                참여 {data?.submittedCount}명
              </Typography>
              {data?.flaggedCount > 0 && (
                <Typography variant="body2" color="warning.main" sx={{ fontWeight: 600 }}>
                  주의 {data?.flaggedCount}명
                </Typography>
              )}
            </Stack>
          </Box>
        </Stack>

        {data?.watcherStatus !== 'OK' && (
          <Alert severity={data?.watcherStatus === 'UNAVAILABLE' ? 'error' : 'warning'} sx={{ mb: 2 }}>
            {data?.watcherStatus === 'UNAVAILABLE'
              ? 'Watcher에 연결할 수 없어 학생 활동을 판정할 수 없습니다.'
              : 'Watcher 데이터 일부를 가져오지 못했습니다. 표시된 수치는 불완전할 수 있습니다.'}
          </Alert>
        )}

        {/* Table */}
        <TableContainer component={GlassPaper} sx={{ borderRadius: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontFamily: FONT_FAMILY, fontWeight: 'bold' }}>
                  학번
                </TableCell>
                <TableCell sx={{ fontFamily: FONT_FAMILY, fontWeight: 'bold' }}>
                  이름
                </TableCell>
                <SortableHeader field="buildCount" label="컴파일" current={sortField} asc={sortAsc} onSort={handleSort} />
                <TableCell sx={{ fontFamily: FONT_FAMILY, fontWeight: 'bold' }}>
                  실행
                </TableCell>
                <SortableHeader field="maxSingleChange" label="최대 단일 변경" current={sortField} asc={sortAsc} onSort={handleSort} />
                <SortableHeader field="codeVelocity" label="작성 속도" current={sortField} asc={sortAsc} onSort={handleSort} />
                <SortableHeader field="totalWorkMinutes" label="작업 시간" current={sortField} asc={sortAsc} onSort={handleSort} />
                <SortableHeader field="flags" label="플래그" current={sortField} asc={sortAsc} onSort={handleSort} />
              </TableRow>
            </TableHead>
            <TableBody>
              {getSortedStudents().map((student) => (
                <TableRow
                  key={student.studentNum}
                  sx={{
                    bgcolor: student.flags.length > 0
                      ? (theme) => theme.palette.mode === 'dark'
                        ? 'rgba(255, 183, 108, 0.04)'
                        : 'rgba(255, 183, 108, 0.06)'
                      : 'inherit',
                    '&:hover': {
                      bgcolor: (theme) => theme.palette.mode === 'dark'
                        ? 'rgba(255, 255, 255, 0.03)'
                        : 'rgba(0, 0, 0, 0.02)',
                    }
                  }}
                >
                  <TableCell sx={{ fontFamily: FONT_FAMILY, fontSize: '0.8rem' }}>
                    {student.studentNum}
                  </TableCell>
                  <TableCell sx={{ fontFamily: FONT_FAMILY, fontSize: '0.8rem' }}>
                    {student.studentName || '-'}
                  </TableCell>
                  <TableCell sx={{ fontFamily: FONT_FAMILY, fontSize: '0.8rem' }}>
                    {student.buildCount > 0 ? (
                      <Tooltip title={`성공 ${student.buildCount - student.buildFailCount} / 실패 ${student.buildFailCount}`}>
                        <span>{student.buildCount}회</span>
                      </Tooltip>
                    ) : '-'}
                  </TableCell>
                  <TableCell sx={{ fontFamily: FONT_FAMILY, fontSize: '0.8rem' }}>
                    {student.runCount > 0 ? `${student.runCount}회` : '-'}
                  </TableCell>
                  <TableCell sx={{ fontFamily: FONT_FAMILY, fontSize: '0.8rem' }}>
                    {formatBytes(student.maxSingleChange)}
                  </TableCell>
                  <TableCell sx={{ fontFamily: FONT_FAMILY, fontSize: '0.8rem' }}>
                    {student.codeVelocity > 0 ? `${student.codeVelocity} B/min` : '-'}
                  </TableCell>
                  <TableCell sx={{ fontFamily: FONT_FAMILY, fontSize: '0.8rem' }}>
                    {formatMinutes(student.totalWorkMinutes)}
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5} flexWrap="wrap">
                      {student.watcherStatus && student.watcherStatus !== 'OK' && (
                        <Chip
                          label={student.watcherStatus === 'UNAVAILABLE' ? 'Watcher 오류' : '일부 데이터 오류'}
                          size="small"
                          color={student.watcherStatus === 'UNAVAILABLE' ? 'error' : 'warning'}
                          sx={{ fontSize: '0.65rem', height: '22px' }}
                        />
                      )}
                      {student.flags.length > 0 ? (
                        student.flags.map((flag, idx) => (
                          <Chip
                            key={idx}
                            label={flag}
                            size="small"
                            color={FLAG_COLORS[flag] || 'default'}
                            variant="outlined"
                            sx={{ fontSize: '0.65rem', height: '22px' }}
                          />
                        ))
                      ) : (
                        <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>-</Typography>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Fade>
  );
};

const SortableHeader = ({ field, label, current, asc, onSort }) => (
  <TableCell
    sx={{
      fontFamily: FONT_FAMILY,
      fontWeight: 'bold',
      cursor: 'pointer',
      userSelect: 'none',
      '&:hover': { color: 'primary.main' }
    }}
    onClick={() => onSort(field)}
  >
    <Stack direction="row" alignItems="center" spacing={0.5}>
      <span>{label}</span>
      {current === field && (
        <SortIcon sx={{ fontSize: '0.9rem', transform: asc ? 'rotate(180deg)' : 'none' }} />
      )}
    </Stack>
  </TableCell>
);

export default SubmissionDashboard;
