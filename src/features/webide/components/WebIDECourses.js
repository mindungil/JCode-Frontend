import React, { useCallback, useEffect, useState } from 'react';

import { 
  Container, 
  CircularProgress, 
  Typography, 
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Box,
  Chip,
  FormControl,
  Select,
  MenuItem,
  Stack,
  Paper,
  Fade,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton
} from '@mui/material';
import { useAuth } from '../../../contexts/AuthContext';
import { userService, jcodeService, redirectService, assignmentService } from '../../../services/api';
import CodeIcon from '@mui/icons-material/Code';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { selectStyles } from '../../../styles/selectStyles';
import AddIcon from '@mui/icons-material/Add';
import { toast } from 'react-toastify';
import { useTheme } from '../../../contexts/ThemeContext';
import ErrorIcon from '@mui/icons-material/Error';
import DeleteIcon from '@mui/icons-material/Delete';
import { LoadingSpinner, GlassPaper } from '../../../components/ui';
import { getErrorMessage } from '../../../services/errorHandler';
import { canViewCourseStudents } from '../../watcher/utils/coursePermissions';

const sleep = (milliseconds) => new Promise(resolve => window.setTimeout(resolve, milliseconds));
const JCODE_READY_TIMEOUT_MS = 3 * 60 * 1000;

const WebIDECourses = () => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedTerm, setSelectedTerm] = useState('all');
  const [joinDialog, setJoinDialog] = useState({
    open: false,
    courseKey: ''
  });
  const [withdrawDialog, setWithdrawDialog] = useState({
    open: false,
    courseId: null,
    courseName: '',
    confirmText: '',
    doubleCheck: false
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [expandedCourse, setExpandedCourse] = useState(null);
  const [courseAssignments, setCourseAssignments] = useState({});
  const handleToggleAssignments = async (courseId) => {
    if (expandedCourse === courseId) {
      setExpandedCourse(null);
      return;
    }
    setExpandedCourse(courseId);
    if (!courseAssignments[courseId]) {
      try {
        const assignments = await assignmentService.getCourseAssignments(courseId);
        setCourseAssignments(prev => ({ ...prev, [courseId]: assignments }));
      } catch (err) {
        setCourseAssignments(prev => ({ ...prev, [courseId]: [] }));
        toast.error(getErrorMessage(err, '과제 목록을 불러오지 못했습니다.'));
      }
    }
  };

  // 고유한 연도와 학기 목록 추출
  const years = [...new Set(courses.map(course => course.courseYear))].sort((a, b) => b - a);
  const terms = [...new Set(courses.map(course => course.courseTerm))].sort();

  const fetchCourses = useCallback(async (initial = false) => {
      try {
        const nextCourses = await userService.getMyCourses({ showToast: false });
        if (Array.isArray(nextCourses)) {
          setCourses(nextCourses);
          if (initial && nextCourses.length > 0) {
            const currentDate = new Date();
            const currentYear = currentDate.getFullYear();
            const currentMonth = currentDate.getMonth() + 1;
            const currentTerm = currentMonth >= 9 ? 2 : 1;
            setSelectedYear(currentYear);
            setSelectedTerm(currentTerm);
          } else if (initial) {
            setSelectedYear('all');
            setSelectedTerm('all');
          }
        } else {
          setCourses([]);
          if (initial) {
            setSelectedYear('all');
            setSelectedTerm('all');
          }
        }
      } catch (err) {
        if (initial) {
          setError('수업 목록을 불러오는데 실패했습니다.');
          setCourses([]);
          setSelectedYear('all');
          setSelectedTerm('all');
        }
      } finally {
        if (initial) setLoading(false);
      }
  }, []);

  useEffect(() => {
    fetchCourses(true);
  }, [fetchCourses]);

  useEffect(() => {
    const courseTransitions = new Set(['PROVISIONING', 'TERMINATING', 'ARCHIVING']);
    const membershipTransitions = new Set(['PROVISIONING', 'DELETE_PENDING']);
    if (!courses.some(course => (
      courseTransitions.has(course.status) || membershipTransitions.has(course.membershipStatus)
    ))) return undefined;
    const timer = window.setInterval(() => fetchCourses(false), 3000);
    return () => window.clearInterval(timer);
  }, [courses, fetchCourses]);

  const waitForJcodeReady = async (jcodeId) => {
    const deadline = Date.now() + JCODE_READY_TIMEOUT_MS;
    let consecutiveFailures = 0;
    while (Date.now() < deadline) {
      try {
        const jcodes = await userService.getMyJCodes({ showToast: false });
        const current = jcodes.find(jcode => String(jcode.jcodeId) === String(jcodeId));
        consecutiveFailures = 0;
        if (current?.status === 'READY') return;
        if (current?.status === 'PROVISION_FAILED') {
          throw new Error('JCode 환경을 준비하지 못했습니다. 관리자에게 문의해주세요.');
        }
        if (current?.status === 'DELETE_PENDING' || current?.status === 'ARCHIVED') {
          throw new Error('JCode 환경이 종료되어 열 수 없습니다.');
        }
      } catch (error) {
        if (!error.response && error.message?.startsWith('JCode 환경')) throw error;
        consecutiveFailures += 1;
        if (consecutiveFailures >= 5) {
          throw new Error('JCode 준비 상태를 확인할 수 없습니다. 네트워크 연결을 확인해주세요.');
        }
      }
      await sleep(2000);
    }
    throw new Error('JCode 준비 시간이 길어지고 있습니다. 잠시 후 다시 시도해주세요.');
  };

  const getJcodeRedirect = async (redirectData) => {
    let lastError;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        return await redirectService.redirectToJCode(redirectData);
      } catch (error) {
        lastError = error;
        const status = error.response?.status;
        if (status && status !== 409 && status < 500) throw error;
        if (attempt < 4) await sleep(1500);
      }
    }
    throw lastError;
  };

  const handleWebIDEOpen = async (courseId, isSnapshot = false, assignmentId = null) => {
    if (actionLoading) return;
    const ideWindow = window.open('about:blank', '_blank');
    if (!ideWindow) {
      toast.error('새 창이 차단되었습니다. 브라우저의 팝업 허용 설정을 확인해주세요.');
      return;
    }
    ideWindow.opener = null;
    ideWindow.document.title = 'JCode 준비 중';
    ideWindow.document.body.textContent = 'JCode 환경을 준비하고 있습니다...';
    setActionLoading(true);
    try {
      const jcode = await jcodeService.createJCode(courseId, {
        userEmail: user.email,
        snapshot: isSnapshot,
        ...(assignmentId && { assignmentId })
      });
      if (jcode.status !== 'READY') {
        toast.info('JCode 환경을 준비하고 있습니다. 완료되면 자동으로 열립니다.');
        await waitForJcodeReady(jcode.jcodeId);
      }

      const redirectData = await getJcodeRedirect({
        userEmail: user.email,
        courseId: courseId,
        snapshot: isSnapshot,
        ...(assignmentId && { assignmentId })
      });

      if (redirectData?.url) {
        ideWindow.location.replace(redirectData.url);
      } else {
        throw new Error('JCode 연결 주소를 확인할 수 없습니다.');
      }

    } catch (err) {
      if (!ideWindow.closed) ideWindow.close();
      toast.error(getErrorMessage(err, 'JCode를 열지 못했습니다. 잠시 후 다시 시도해주세요.'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoinCourse = async () => {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      const joinedCourse = await userService.joinCourse({
        courseKey: joinDialog.courseKey
      });
      
      // 수업 참가 성공 후 JCode 생성 시도
      const courseId = joinedCourse.courseId;
      try {
        await jcodeService.createJCode(courseId, {
          userEmail: user.email,
          snapshot: false
        });
        //console.log('강의 참가 후 JCode 생성 성공');
      } catch (jcodeError) {
        // JCode 생성 실패 시 콘솔에만 로그 (치명적 오류가 아니므로)
        //console.warn('강의 참가 후 JCode 생성 실패:', jcodeError.message);
        // 대부분의 경우 자동으로 JCode가 생성되거나 이미 존재할 수 있음
      }

      // 수업 목록 새로고침
      const courses = await userService.getMyCourses();
      setCourses(courses);
      
      // 다이얼로그 닫기 및 초기화
      setJoinDialog({
        open: false,
        courseKey: ''
      });
      
      // 성공 토스트는 서비스에서 자동 표시됨
      
    } catch (error) {
      // 에러 토스트는 서비스에서 자동 표시됨
      //console.error('수업 참가 실패:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleWithdrawCourse = async () => {
    if (actionLoading) return;
    if (withdrawDialog.confirmText !== '강의를 탈퇴하겠습니다') {
      toast.error('정확한 확인 문구를 입력해주세요.', {
        icon: ({theme, type}) => <ErrorIcon sx={{ color: '#fff', fontSize: '1.5rem', mr: 1 }}/>,
        style: {
          background: isDarkMode ? '#d32f2f' : '#f44336',
          color: '#fff',
          fontFamily: "'JetBrains Mono', 'Noto Sans KR', sans-serif",
          borderRadius: '8px',
          fontSize: '0.95rem',
          padding: '12px 20px'
        }
      });
      return;
    }

    setActionLoading(true);
    try {
      // JCode 삭제 시도
      try {
        await userService.deleteMyJCode(withdrawDialog.courseId);
      } catch (jcodeError) {
        //console.error('JCode 삭제 중 오류:', jcodeError);
        // JCode 삭제 실패 시에도 강의 탈퇴는 계속 진행
      }
      // Snapshot JCode 삭제 시도
      try {
        await userService.deleteMySnapshot(withdrawDialog.courseId);
      } catch (jcodeError) {
        //console.error('JCode 삭제 중 오류:', jcodeError);
        // JCode 삭제 실패 시에도 권한 변경은 계속 진행
      }

      // 강의 탈퇴 진행
      await userService.leaveCourse(withdrawDialog.courseId);
      
      // 강의 목록 새로고침
      const courses = await userService.getMyCourses();
      setCourses(courses);
      
      setWithdrawDialog({
        open: false,
        courseId: null,
        courseName: '',
        confirmText: '',
        doubleCheck: false
      });
      
      // 성공 토스트는 서비스에서 자동 표시됨
    } catch (error) {
      // 에러 토스트는 서비스에서 자동 표시됨
      //console.error('강의 탈퇴 중 오류:', error);
    } finally {
      setActionLoading(false);
    }
  };

  // 완료된 강의와 탈퇴 처리가 끝난 가입 정보는 목록에서 제외한다.
  const filteredCourses = courses.filter(course => {
    if (course.status === 'ARCHIVED' || course.membershipStatus === 'ARCHIVED') return false;
    const yearMatch = selectedYear === 'all' || course.courseYear === selectedYear;
    const termMatch = selectedTerm === 'all' || course.courseTerm === selectedTerm;
    return yearMatch && termMatch;
  });

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <Container sx={{ mt: 4, textAlign: 'center' }}>
        <Typography color="error">
          {error}
        </Typography>
      </Container>
    );
  }

  return (
    <Fade in={true} timeout={300}>
      <Container maxWidth="lg" sx={{ mt: 4 }}>  
        <GlassPaper>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            mb: 3 
          }}>
            <Typography variant="h5">
              수강 중인 강의 ({filteredCourses.length})
            </Typography>

            <Stack direction="row" spacing={1} alignItems="center">
              <FormControl sx={{ minWidth: 100 }}>
                <Select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  displayEmpty
                  size="small"
                  MenuProps={selectStyles.menuProps}
                  sx={{
                    ...selectStyles.select,
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#E0E0E0'
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#E0E0E0'
                    }
                  }}
                >
                  <MenuItem value="all" sx={selectStyles.menuItem}>
                    전체 연도
                  </MenuItem>
                  {years.map(year => (
                    <MenuItem key={year} value={year} sx={selectStyles.menuItem}>
                      {year}년
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl sx={{ minWidth: 90 }}>
                <Select
                  value={selectedTerm}
                  onChange={(e) => setSelectedTerm(e.target.value)}
                  displayEmpty
                  size="small"
                  MenuProps={selectStyles.menuProps}
                  sx={selectStyles.select}
                >
                  <MenuItem value="all" sx={selectStyles.menuItem}>
                    전체 학기
                  </MenuItem>
                  {terms.map(term => (
                    <MenuItem key={term} value={term} sx={selectStyles.menuItem}>
                      {term}학기
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </Box>
          
          <Paper 
            elevation={0} 
            sx={{ 
              p: 1.5, 
              mb: 2,
              bgcolor: 'warning.light', 
              color: 'warning.contrastText',
              borderRadius: 1.5,
              border: (theme) =>
                `1px solid ${theme.palette.warning.main}`,
            }}
          >
            <Typography 
              variant="body2"
              sx={{ 
                fontFamily: "'JetBrains Mono', 'Noto Sans KR', sans-serif",
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                fontSize: '0.85rem'
              }}
            >
              <Box component="span" sx={{ fontWeight: 'bold' }}>주의:</Box> 
              강의 참가 후 JCode 최초 실행 시 JCode가 생성되고 있으므로 오류가 발생할 수 있습니다. 잠시 후 다시 시도해주세요
            </Typography>
          </Paper>
          
          {filteredCourses.length === 0 ? (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card sx={{ 
                  mb: 3,
                  backgroundColor: (theme) => 
                    theme.palette.mode === 'dark' ? '#44475A' : '#FFFFFF',
                }}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" color="text.secondary">
                      해당하는 강의가 없습니다.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Card 
                  onClick={() => setJoinDialog({ ...joinDialog, open: true })}
                  sx={{ 
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    backgroundColor: (theme) => 
                      theme.palette.mode === 'dark' ? '#282A36' : '#FFFFFF',
                    border: (theme) =>
                      `1px solid ${theme.palette.mode === 'dark' ? '#44475A' : '#E0E0E0'}`,
                    boxShadow: 'none',
                    borderRadius: '12px',
                    '&:hover': {
                      borderColor: (theme) =>
                        theme.palette.mode === 'dark' ? '#6272A4' : '#BDBDBD',
                      backgroundColor: (theme) =>
                        theme.palette.mode === 'dark' ? '#44475A' : '#FAFAFA',
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography 
                      variant="h5" 
                      component="h2" 
                      gutterBottom
                      sx={{ 
                        fontFamily: "'JetBrains Mono', 'Noto Sans KR', sans-serif",
                        color: (theme) => 
                          theme.palette.mode === 'dark' ? '#F8F8F2' : 'text.secondary'
                      }}
                    >
                      새 수업 참가
                    </Typography>
                    <Chip 
                      icon={<AddIcon sx={{ fontSize: '1rem' }} />}
                      label="수업 참가하기"
                      color="primary"
                      size="small"
                      sx={{ 
                        mb: 2,
                        fontFamily: "'JetBrains Mono', 'Noto Sans KR', sans-serif",
                        backgroundColor: 'transparent',
                        border: '1px dashed',
                        borderRadius: '20px',
                        borderColor: (theme) =>
                          theme.palette.mode === 'dark' ? '#FF79C6' : 'primary.main',
                        color: (theme) =>
                          theme.palette.mode === 'dark' ? '#FF79C6' : 'primary.main',
                        '& .MuiChip-icon': {
                          color: (theme) =>
                            theme.palette.mode === 'dark' ? '#FF79C6' : 'primary.main'
                        }
                      }}
                    />
                    <Typography 
                      color="text.secondary" 
                      sx={{ 
                        fontFamily: "'JetBrains Mono', 'Noto Sans KR', sans-serif",
                        fontSize: '0.875rem',
                        color: (theme) => 
                          theme.palette.mode === 'dark' ? '#F8F8F2' : 'text.secondary'
                      }}
                    >
                      교수님으로부터 받은 참가 코드로 새로운 수업에 참가하세요.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          ) : (
            <Grid container spacing={3} alignItems="flex-start">
              {filteredCourses.map((course) => (
                <Grid item xs={12} sm={6} md={4} key={course.courseId}>
                  <Card
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'all 0.3s ease',
                      animation: 'fadeIn 0.3s ease',
                      '@keyframes fadeIn': {
                        '0%': {
                          opacity: 0,
                          transform: 'translateY(10px)'
                        },
                        '100%': {
                          opacity: 1,
                          transform: 'translateY(0)'
                        }
                      },
                      backgroundColor: (theme) => 
                        theme.palette.mode === 'dark' ? '#282A36' : '#FFFFFF',
                      border: (theme) =>
                        `1px solid ${theme.palette.mode === 'dark' ? '#44475A' : '#E0E0E0'}`,
                      boxShadow: 'none',
                      borderRadius: '12px',
                      '&:hover': {
                        borderColor: (theme) =>
                          theme.palette.mode === 'dark' ? '#6272A4' : '#BDBDBD',
                        backgroundColor: (theme) =>
                          theme.palette.mode === 'dark' ? '#44475A' : '#FAFAFA'
                      }
                    }}
                  >
                    <CardContent sx={{ flexGrow: 1, position: 'relative' }}>
                      <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            setWithdrawDialog({
                              open: true,
                              courseId: course.courseId,
                              courseName: course.courseName,
                              confirmText: '',
                              doubleCheck: false
                            });
                          }}
                          sx={{
                            color: (theme) => theme.palette.mode === 'dark' ? '#FF5555' : '#f44336',
                            '&:hover': {
                              backgroundColor: (theme) => 
                                theme.palette.mode === 'dark' ? 'rgba(255, 85, 85, 0.1)' : 'rgba(244, 67, 54, 0.1)'
                            }
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                      <Typography 
                        variant="h5" 
                        component="h2" 
                        gutterBottom
                        sx={{ fontFamily: "'JetBrains Mono', 'Noto Sans KR', sans-serif" }}
                      >
                        {course.courseName}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                        <Chip
                          label={course.courseCode}
                          color="primary"
                          size="small"
                          sx={{ fontFamily: "'JetBrains Mono', 'Noto Sans KR', sans-serif" }}
                        />
                        {course.status && course.status !== 'ACTIVE' && (
                          <Chip
                            label={{
                              PROVISIONING: '생성 중',
                              TERMINATING: '종료 중',
                              ENDED: '종료됨',
                              ARCHIVING: '보관 중',
                              ERROR: '처리 오류'
                            }[course.status] || course.status}
                            color={course.status === 'ERROR' ? 'error' : 'warning'}
                            size="small"
                            variant="outlined"
                            sx={{ fontFamily: "'JetBrains Mono', 'Noto Sans KR', sans-serif" }}
                          />
                        )}
                        {course.membershipStatus && course.membershipStatus !== 'READY' && (
                          <Chip
                            label={{
                              PROVISIONING: '참여 준비 중',
                              DELETE_PENDING: '탈퇴 처리 중',
                              PROVISION_FAILED: '참여 준비 오류',
                              DELETE_FAILED: '탈퇴 처리 오류'
                            }[course.membershipStatus] || course.membershipStatus}
                            color={course.membershipStatus.endsWith('FAILED') ? 'error' : 'warning'}
                            size="small"
                            variant="outlined"
                            sx={{ fontFamily: "'JetBrains Mono', 'Noto Sans KR', sans-serif" }}
                          />
                        )}
                      </Box>
                      <Typography 
                        color="text.secondary" 
                        gutterBottom
                        sx={{ fontFamily: "'JetBrains Mono', 'Noto Sans KR', sans-serif" }}
                      >
                        담당 교수: {course.courseProfessor} 교수님
                      </Typography>
                      <Typography 
                        color="text.secondary" 
                        variant="body2"
                        sx={{ fontFamily: "'JetBrains Mono', 'Noto Sans KR', sans-serif" }}
                      >
                        {course.courseYear}년 {course.courseTerm}학기
                      </Typography>
                      <Typography 
                        color="text.secondary" 
                        variant="body2"
                        sx={{ fontFamily: "'JetBrains Mono', 'Noto Sans KR', sans-serif" }}
                      >
                        {course.courseClss}분반
                      </Typography>
                    </CardContent>
                    <CardActions>
                      {course.status !== 'ACTIVE' || (course.membershipStatus && course.membershipStatus !== 'READY') ? (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            fontFamily: "'JetBrains Mono', 'Noto Sans KR', sans-serif",
                            textAlign: 'center',
                            width: '100%',
                            py: 0.5
                          }}
                        >
                          {{
                            PROVISIONING: '참여 환경을 준비하고 있습니다',
                            DELETE_PENDING: '강의 탈퇴를 처리하고 있습니다',
                            PROVISION_FAILED: '참여 환경을 준비하지 못했습니다',
                            DELETE_FAILED: '강의 탈퇴 처리에 실패했습니다'
                          }[course.membershipStatus] || {
                            PROVISIONING: '강의 환경을 생성하고 있습니다',
                            TERMINATING: '강의를 종료하고 있습니다',
                            ENDED: '종료된 강의입니다',
                            ARCHIVING: '강의를 보관하고 있습니다',
                            ERROR: '강의 환경 처리 중 오류가 발생했습니다'
                          }[course.status] || '현재 사용할 수 없는 강의입니다'}
                        </Typography>
                      ) : (
                      <Stack spacing={0.75} sx={{ width: '100%' }}>
                        <Button
                          fullWidth
                          variant="contained"
                          startIcon={<CodeIcon sx={{ fontSize: '1rem' }} />}
                          onClick={() => handleWebIDEOpen(course.courseId)}
                          size="small"
                          disabled={actionLoading}
                          sx={{
                            fontFamily: "'JetBrains Mono', 'Noto Sans KR', sans-serif",
                            fontSize: '0.75rem',
                            py: 0.5,
                            px: 1.5,
                            minHeight: '28px',
                            borderRadius: 1,
                            textTransform: 'none',
                          }}
                        >
                          JCode 실행
                        </Button>
                        <Box sx={{ display: 'flex', gap: 0.75 }}>
                          <Button
                            fullWidth
                            variant="outlined"
                            startIcon={expandedCourse === course.courseId ? <ExpandLessIcon sx={{ fontSize: '1rem' }} /> : <ExpandMoreIcon sx={{ fontSize: '1rem' }} />}
                            onClick={() => handleToggleAssignments(course.courseId)}
                            size="small"
                            disabled={actionLoading}
                            sx={{
                              fontFamily: "'JetBrains Mono', 'Noto Sans KR', sans-serif",
                              fontSize: '0.75rem',
                              py: 0.5,
                              px: 1,
                              minHeight: '28px',
                              borderRadius: 1,
                              textTransform: 'none'
                            }}
                          >
                            과제 목록
                          </Button>
                          {canViewCourseStudents(course, user) && (
                            <Button
                              fullWidth
                              variant="outlined"
                              startIcon={<CodeIcon sx={{ fontSize: '1rem' }} />}
                              onClick={() => handleWebIDEOpen(course.courseId, true)}
                              size="small"
                              disabled={actionLoading}
                              sx={{
                                fontFamily: "'JetBrains Mono', 'Noto Sans KR', sans-serif",
                                fontSize: '0.75rem',
                                py: 0.5,
                                px: 1,
                                minHeight: '28px',
                                borderRadius: 1,
                                textTransform: 'none'
                              }}
                            >
                              스냅샷 확인
                            </Button>
                          )}
                        </Box>
                      </Stack>
                      )}

                    </CardActions>
                    {/* 과제 목록 확장 영역 */}
                    {expandedCourse === course.courseId && (
                      <Box sx={{ px: 2, pb: 2, pt: 0.5 }}>
                        {!courseAssignments[course.courseId] ? (
                          <CircularProgress size={20} sx={{ display: 'block', mx: 'auto', my: 1 }} />
                        ) : courseAssignments[course.courseId].filter(assignment => assignment.lifecycleStatus !== 'ARCHIVED').length === 0 ? (
                          <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', textAlign: 'center', py: 1 }}>
                            등록된 과제가 없습니다
                          </Typography>
                        ) : (
                          <Stack spacing={0.5}>
                            {courseAssignments[course.courseId]
                              .filter(assignment => assignment.lifecycleStatus !== 'ARCHIVED')
                              .map((assignment) => {
                              const assignmentReady = assignment.lifecycleStatus === 'ACTIVE' && assignment.scheduleStatus === 'OPEN';
                              return (
                              <Box
                                key={assignment.assignmentId}
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  p: 0.75,
                                  borderRadius: 1,
                                  bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                                  '&:hover': {
                                    bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                                  }
                                }}
                              >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flex: 1, mr: 1 }}>
                                  <Typography sx={{ fontSize: '0.8rem', fontFamily: "'Noto Sans KR', sans-serif" }}>
                                    {assignment.assignmentName}
                                  </Typography>
                                  {!assignmentReady && (
                                    <Chip
                                      size="small"
                                      variant="outlined"
                                      label={{
                                        PROVISIONING: '준비 중',
                                        SCHEDULED: '시작 전',
                                        CLOSED: '마감',
                                        DELETING: '보관 중',
                                        PROVISION_FAILED: '준비 오류'
                                      }[assignment.lifecycleStatus] || ({
                                        SCHEDULED: '시작 전',
                                        CLOSED: '마감'
                                      }[assignment.scheduleStatus] || '사용 불가')}
                                    />
                                  )}
                                </Box>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  startIcon={<CodeIcon sx={{ fontSize: '0.8rem' }} />}
                                  onClick={() => handleWebIDEOpen(course.courseId, false, assignment.assignmentId)}
                                  disabled={actionLoading || !assignmentReady}
                                  sx={{
                                    fontSize: '0.7rem',
                                    py: 0.25,
                                    px: 1,
                                    minHeight: '24px',
                                    borderRadius: '12px',
                                    textTransform: 'none',
                                    whiteSpace: 'nowrap',
                                    flexShrink: 0
                                  }}
                                >
                                  IDE 열기
                                </Button>
                              </Box>
                              );
                            })}
                          </Stack>
                        )}
                      </Box>
                    )}
                  </Card>
                </Grid>
              ))}
              <Grid item xs={12} sm={6} md={4}>
                <Card 
                  onClick={() => setJoinDialog({ ...joinDialog, open: true })}
                  sx={{ 
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    backgroundColor: (theme) => 
                      theme.palette.mode === 'dark' ? '#282A36' : '#FFFFFF',
                    border: (theme) =>
                      `1px solid ${theme.palette.mode === 'dark' ? '#44475A' : '#E0E0E0'}`,
                    boxShadow: 'none',
                    borderRadius: '12px',
                    '&:hover': {
                      borderColor: (theme) =>
                        theme.palette.mode === 'dark' ? '#6272A4' : '#BDBDBD',
                      backgroundColor: (theme) =>
                        theme.palette.mode === 'dark' ? '#44475A' : '#FAFAFA',
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography 
                      variant="h5" 
                      component="h2" 
                      gutterBottom
                      sx={{ 
                        fontFamily: "'JetBrains Mono', 'Noto Sans KR', sans-serif",
                        color: (theme) => 
                          theme.palette.mode === 'dark' ? '#F8F8F2' : 'text.secondary'
                      }}
                    >
                      새 수업 참가
                    </Typography>
                    <Chip 
                      icon={<AddIcon sx={{ fontSize: '1rem' }} />}
                      label="수업 참가하기"
                      color="primary"
                      size="small"
                      sx={{ 
                        mb: 2,
                        fontFamily: "'JetBrains Mono', 'Noto Sans KR', sans-serif",
                        backgroundColor: 'transparent',
                        border: '1px dashed',
                        borderRadius: '20px',
                        borderColor: (theme) =>
                          theme.palette.mode === 'dark' ? '#FF79C6' : 'primary.main',
                        color: (theme) =>
                          theme.palette.mode === 'dark' ? '#FF79C6' : 'primary.main',
                        '& .MuiChip-icon': {
                          color: (theme) =>
                            theme.palette.mode === 'dark' ? '#FF79C6' : 'primary.main'
                        }
                      }}
                    />
                    <Typography 
                      color="text.secondary" 
                      sx={{ 
                        fontFamily: "'JetBrains Mono', 'Noto Sans KR', sans-serif",
                        fontSize: '0.875rem',
                        color: (theme) => 
                          theme.palette.mode === 'dark' ? '#F8F8F2' : 'text.secondary'
                      }}
                    >
                      교수님으로부터 받은 참가 코드로 새로운 수업에 참가하세요.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          <Dialog
            open={joinDialog.open}
            onClose={() => setJoinDialog({ open: false, courseKey: '' })}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle sx={{ fontFamily: "'JetBrains Mono', 'Noto Sans KR', sans-serif" }}>
              수업 참가
            </DialogTitle>
            <DialogContent>
              <Box sx={{ mt: 2 }}>
                <TextField
                  fullWidth
                  label="참가 코드"
                  value={joinDialog.courseKey}
                  onChange={(e) => {
                    setJoinDialog({ ...joinDialog, courseKey: e.target.value });
                  }}
                  placeholder="참가 코드를 입력하세요"
                  helperText="교수님으로부터 받은 참가 코드를 입력해주세요"
                  InputProps={{
                    sx: { 
                      fontFamily: "'JetBrains Mono', monospace",
                    }
                  }}
                />
              </Box>
            </DialogContent>
            <DialogActions>
              <Button 
                onClick={() => setJoinDialog({ open: false, courseKey: '' })}
              >
                취소
              </Button>
              <Button 
                onClick={handleJoinCourse}
                variant="contained"
                disabled={actionLoading || !joinDialog.courseKey.trim()}
              >
                참가
              </Button>
            </DialogActions>
          </Dialog>

          <Dialog
            open={withdrawDialog.open}
            onClose={() => setWithdrawDialog({ ...withdrawDialog, open: false })}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle sx={{ 
              fontFamily: "'JetBrains Mono', 'Noto Sans KR', sans-serif",
              color: '#f44336'
            }}>
              강의 탈퇴 확인
            </DialogTitle>
            <DialogContent>
              <Typography sx={{ mt: 2, mb: 2 }} color="error">
                ⚠️ 주의: 강의 탈퇴 시 다음 사항을 확인해주세요
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                • 모든 강의 데이터와 제출물이 삭제됩니다.
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                • 삭제된 데이터는 복구가 불가능합니다.
              </Typography>
              <Typography variant="body2" sx={{ mb: 3 }}>
                • 재참가 시 새로운 참가 코드가 필요합니다.
              </Typography>
              
              <Typography sx={{ mb: 2 }}>
                정말로 <strong>{withdrawDialog.courseName}</strong> 강의를 탈퇴하시겠습니까?
              </Typography>

              <TextField
                fullWidth
                label="확인을 위해 '강의를 탈퇴하겠습니다'를 입력하세요"
                value={withdrawDialog.confirmText}
                onChange={(e) => setWithdrawDialog({ ...withdrawDialog, confirmText: e.target.value })}
                error={withdrawDialog.confirmText !== '' && withdrawDialog.confirmText !== '강의를 탈퇴하겠습니다'}
                helperText={withdrawDialog.confirmText !== '' && withdrawDialog.confirmText !== '강의를 탈퇴하겠습니다' ? 
                  '정확한 문구를 입력해주세요' : ''}
                sx={{ mt: 2 }}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setWithdrawDialog({ ...withdrawDialog, open: false })}>
                취소
              </Button>
              <Button 
                onClick={handleWithdrawCourse}
                variant="contained"
                color="error"
                disabled={actionLoading || withdrawDialog.confirmText !== '강의를 탈퇴하겠습니다'}
              >
                탈퇴
              </Button>
            </DialogActions>
          </Dialog>
        </GlassPaper>
      </Container>
    </Fade>
  );
};

export default WebIDECourses;
