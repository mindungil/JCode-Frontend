import React, { useEffect, useState } from 'react';

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
import RefreshIcon from '@mui/icons-material/Refresh';
import { LoadingSpinner, GlassPaper } from '../../../components/ui';

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
  // 사용자 역할 확인 (교수, 조교, 관리자)
  const isAuthorized = user && (user.role === 'PROFESSOR' || user.role === 'ADMIN' || user.assistantCourses?.length > 0);

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
        const status = err?.response?.status;
        const serverMsg = err?.response?.data?.message;
        if (status === 403) {
          toast.error('과제 목록 조회 권한이 없습니다.');
        } else if (!err.response) {
          toast.error('네트워크 연결을 확인해주세요.');
        } else {
          toast.error(serverMsg || '과제 목록을 불러오는데 실패했습니다.');
        }
        console.error(`[Assignments] ${status || 'NETWORK'}: ${serverMsg || err.message}`);
      }
    }
  };

  // 고유한 연도와 학기 목록 추출
  const years = [...new Set(courses.map(course => course.courseYear))].sort((a, b) => b - a);
  const terms = [...new Set(courses.map(course => course.courseTerm))].sort();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const courses = await userService.getMyCourses();
        if (Array.isArray(courses)) {
          setCourses(courses);
          if (courses.length > 0) {
            const currentDate = new Date();
            const currentYear = currentDate.getFullYear();
            const currentMonth = currentDate.getMonth() + 1;
            const currentTerm = currentMonth >= 9 ? 2 : 1;
            setSelectedYear(currentYear);
            setSelectedTerm(currentTerm);
          } else {
            setSelectedYear('all');
            setSelectedTerm('all');
          }
        } else {
          setCourses([]);
          setSelectedYear('all');
          setSelectedTerm('all');
        }
        setLoading(false);
      } catch (err) {
        setError('수업 목록을 불러오는데 실패했습니다.');
        setCourses([]);
        setLoading(false);
        setSelectedYear('all');
        setSelectedTerm('all');
      }
    };

    fetchCourses();
  }, []);

  const handleWebIDEOpen = async (courseId, isSnapshot = false, assignmentId = null) => {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      await jcodeService.createAndWaitUntilReady(courseId, {
        userEmail: user.email,
        snapshot: isSnapshot,
        ...(assignmentId && { assignmentId })
      });

      const redirectData = await redirectService.redirectToJCode({
        userEmail: user.email,
        courseId: courseId,
        snapshot: isSnapshot,
        ...(assignmentId && { assignmentId })
      });

      if (redirectData?.url) {
        window.open(redirectData.url, '_blank');
      } else {
        throw new Error("리다이렉트 URL을 찾을 수 없습니다.");
      }

    } catch (err) {
      const status = err?.response?.status;
      const serverMsg = err?.response?.data?.detail || err?.response?.data?.message;
      let userMsg = '서버 오류가 발생했습니다.';
      if (!err.response) {
        userMsg = err.message || '네트워크 연결을 확인해주세요.';
      } else if (status === 404) {
        userMsg = 'JCode가 아직 생성되지 않았습니다. 잠시 후 다시 시도해주세요.';
      } else if (status === 403) {
        userMsg = '해당 강의에 대한 접근 권한이 없습니다.';
      } else if (serverMsg) {
        userMsg = serverMsg;
      }
      toast.error(userMsg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoinCourse = async () => {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      await userService.joinCourse({
        courseKey: joinDialog.courseKey
      });
      
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
      // Backend가 접근을 먼저 차단하고 일반·Snapshot JCode를 함께 정리한다.
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

  // 필터링된 강의 목록 (ARCHIVED 강의는 제외)
  const filteredCourses = courses.filter(course => {
    if (course.status === 'ARCHIVED') return false;
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
                              PROVISIONING: 'Workspace 준비 중',
                              PROVISION_FAILED: 'Workspace 준비 오류',
                              DELETE_PENDING: '탈퇴 처리 중',
                              DELETE_FAILED: '탈퇴 처리 오류',
                              ARCHIVED: '탈퇴 완료'
                            }[course.membershipStatus] || course.membershipStatus}
                            color={course.membershipStatus.includes('FAILED') ? 'error' : 'info'}
                            size="small"
                            variant="outlined"
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
                      {course.status !== 'ACTIVE' || course.membershipStatus !== 'READY' ? (
                        <Box sx={{ width: '100%', textAlign: 'center' }}>
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
                            PROVISIONING: '강의 환경을 생성하고 있습니다',
                            TERMINATING: '강의를 종료하고 있습니다',
                            ENDED: '종료된 강의입니다',
                            ARCHIVING: '강의를 보관하고 있습니다',
                            ERROR: '강의 환경 처리 중 오류가 발생했습니다'
                          }[course.status] || (course.membershipError || 'Workspace를 준비하고 있습니다')}
                        </Typography>
                        {course.membershipStatus?.includes('FAILED') && (
                          <Button
                            size="small"
                            startIcon={<RefreshIcon />}
                            onClick={async () => {
                              try {
                                await userService.retryWorkspace(course.courseId);
                                const refreshedCourses = await userService.getMyCourses();
                                setCourses(Array.isArray(refreshedCourses) ? refreshedCourses : []);
                                toast.success('Workspace 작업 재시도를 요청했습니다.');
                              } catch (error) {
                                toast.error(error.response?.data?.detail || error.message);
                              }
                            }}
                          >
                            다시 시도
                          </Button>
                        )}
                        </Box>
                      ) : (
                      <>
                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={expandedCourse === course.courseId ? <ExpandLessIcon sx={{ fontSize: '1rem' }} /> : <ExpandMoreIcon sx={{ fontSize: '1rem' }} />}
                        onClick={() => handleToggleAssignments(course.courseId)}
                        size="small"
                        disabled={actionLoading}
                        sx={{
                          fontFamily: "'JetBrains Mono', 'Noto Sans KR', sans-serif",
                          fontSize: '0.75rem',
                          py: 0.5,
                          px: 1.5,
                          minHeight: '28px',
                          borderRadius: '20px',
                          textTransform: 'none',
                          flex: isAuthorized ? 1 : 'auto'
                        }}
                      >
                        과제 목록
                      </Button>

                      {isAuthorized && (
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
                            px: 1.5,
                            minHeight: '28px',
                            borderRadius: '20px',
                            textTransform: 'none',
                            ml: 1,
                            flex: 1,
                            borderColor: (theme) =>
                              theme.palette.mode === 'dark' ? '#FF79C6' : 'primary.main',
                            color: (theme) =>
                              theme.palette.mode === 'dark' ? '#FF79C6' : 'primary.main',
                            '&:hover': {
                              borderColor: (theme) =>
                                theme.palette.mode === 'dark' ? '#FF92D0' : 'primary.dark',
                              backgroundColor: (theme) =>
                                theme.palette.mode === 'dark' ? 'rgba(255, 121, 198, 0.1)' : 'rgba(63, 81, 181, 0.1)'
                            }
                          }}
                        >
                          스냅샷 확인
                        </Button>
                      )}
                      </>
                      )}

                    </CardActions>
                    {/* 과제 목록 확장 영역 */}
                    {expandedCourse === course.courseId && (
                      <Box sx={{ px: 2, pb: 2, pt: 0.5 }}>
                        {!courseAssignments[course.courseId] ? (
                          <CircularProgress size={20} sx={{ display: 'block', mx: 'auto', my: 1 }} />
                        ) : courseAssignments[course.courseId].length === 0 ? (
                          <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', textAlign: 'center', py: 1 }}>
                            등록된 과제가 없습니다
                          </Typography>
                        ) : (
                          <Stack spacing={0.5}>
                            {courseAssignments[course.courseId].map((assignment) => (
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
                                <Typography sx={{ fontSize: '0.8rem', fontFamily: "'Noto Sans KR', sans-serif", flex: 1, mr: 1 }}>
                                  {assignment.assignmentName}
                                </Typography>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  startIcon={<CodeIcon sx={{ fontSize: '0.8rem' }} />}
                                  onClick={() => handleWebIDEOpen(course.courseId, false, assignment.assignmentId)}
                                  disabled={
                                    actionLoading ||
                                    assignment.lifecycleStatus !== 'ACTIVE' ||
                                    assignment.scheduleStatus !== 'OPEN'
                                  }
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
                                  {assignment.scheduleStatus === 'OPEN' ? 'IDE 열기' : '사용 불가'}
                                </Button>
                              </Box>
                            ))}
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
