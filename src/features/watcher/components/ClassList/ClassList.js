import React, { useRef, useState, useEffect } from 'react';
import { 
  Container, 
  Paper, 
  Typography, 
  List, 
  ListItem, 
  ListItemText,
  ListItemButton,
  Box,
  Chip,
  FormControl,
  Select,
  MenuItem,
  Stack,
  Fade,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  InputLabel,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { selectStyles } from '../../../../styles/selectStyles';
import AddIcon from '@mui/icons-material/Add';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useAuth } from '../../../../contexts/AuthContext';
import { LoadingSpinner, Button, GlassPaper } from '../../../../components/ui';
import { useClassList } from '../../hooks';
import { toast } from 'react-toastify';
import { canManageCourse } from '../../utils/coursePermissions';

const ClassList = () => {
  const { user } = useAuth();
  const {
    loading,
    error,
    availableYears,
    availableTerms,
    currentSemester,
    addClass,
    regenerateCourseKey,
    filterClasses,
    validateClassForm
  } = useClassList();

  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedTerm, setSelectedTerm] = useState('all');
  const [isInitialized, setIsInitialized] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [newClass, setNewClass] = useState({
    name: '',
    professor: '',
    year: new Date().getFullYear(),
    term: 1,
    clss: '',
    vnc: false,
  });
  const [formErrors, setFormErrors] = useState({
    courseClss: '',
    courseName: '',
    professor: ''
  });
  const [courseKeyDialog, setCourseKeyDialog] = useState({
    open: false,
    courseKey: '',
    courseId: null,
    operation: null,
  });
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const submissionLock = useRef(false);
  const navigate = useNavigate();

  // 고유한 연도와 학기 목록 (훅에서 제공)
  const years = availableYears;
  const terms = availableTerms;

  useEffect(() => {
    // 현재 학기로 초기값 설정 (한 번만 실행)
    if (currentSemester && !isInitialized) {
      setSelectedYear(currentSemester.year);
      setSelectedTerm(currentSemester.term);
      setIsInitialized(true);
    }
  }, [currentSemester, isInitialized]);

  // 필터링된 강의 목록 (훅에서 제공)
  const filteredClasses = filterClasses(selectedYear, selectedTerm);

  // 유효성 검사 함수 (훅에서 제공)
  const validateForm = () => {
    const { isValid, errors } = validateClassForm(newClass);
    setFormErrors(errors);
    return isValid;
  };

  const handleAddClass = async () => {
    if (!validateForm()) return;
    if (submissionLock.current) return;
    submissionLock.current = true;
    setSubmitting(true);

    try {
      const result = await addClass(newClass);

      if (result.success) {
        setOpenDialog(false);
        setNewClass({
          name: '',
          professor: '',
          year: new Date().getFullYear(),
          term: 1,
          clss: '',
          vnc: false,
        });
        setFormErrors({ courseClss: '', courseName: '', professor: '' });

        if (result.courseKey) {
          setCourseKeyDialog({
            open: true,
            courseKey: result.courseKey,
            courseId: result.courseId,
            operation: 'create'
          });
        } else {
          toast.info('강의 개설 요청이 접수되었습니다. 참가 코드는 수업 목록에서 재발급해주세요.');
        }
      } else {
        toast.error(result.error || '수업 생성 요청에 실패했습니다.');
      }
    } finally {
      submissionLock.current = false;
      setSubmitting(false);
    }
  };

  // 복사 버튼 클릭 핸들러
  const handleCopy = async () => {
    await navigator.clipboard.writeText(courseKeyDialog.courseKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); // 2초 후 사라짐
  };

  // 재발급 핸들러 (훅에서 제공)
  const handleRegenerateKey = async (courseId) => {
    if (submitting) return;
    setSubmitting(true);

    try {
      const result = await regenerateCourseKey(courseId);

      if (result.success) {
        setCourseKeyDialog({
          open: true,
          courseKey: result.courseKey,
          courseId: courseId,
          operation: 'regenerate'
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography 
            color="error" 
            align="center"
            sx={{ fontFamily: "'JetBrains Mono', 'Noto Sans KR', sans-serif" }}
          >
            {error}
          </Typography>
        </Paper>
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
            alignItems: { xs: 'stretch', md: 'center' },
            flexDirection: { xs: 'column', md: 'row' },
            gap: 2,
            mb: 3 
          }}>
            <Typography 
              variant="h5"
              sx={{ fontFamily: "'JetBrains Mono', 'Noto Sans KR', sans-serif" }}
            >
              수업 목록 ({filteredClasses.length})
            </Typography>

            <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap', rowGap: 1 }}>
              {user?.role === 'PROFESSOR' && (
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => navigate('/courses/new')}
                  sx={{ whiteSpace: 'nowrap', flexGrow: { xs: 1, sm: 0 } }}
                >
                  수업 개설
                </Button>
              )}
              <FormControl sx={{ minWidth: 100 }}>
                <Select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  displayEmpty
                  size="small"
                  MenuProps={selectStyles.menuProps}
                  sx={selectStyles.select}
                >
                  <MenuItem 
                    value="all" 
                    sx={{ 
                      ...selectStyles.menuItem,
                      fontFamily: "'JetBrains Mono', 'Noto Sans KR', sans-serif"
                    }}
                  >
                    전체 연도
                  </MenuItem>
                  {years.map(year => (
                    <MenuItem 
                      key={year} 
                      value={year}
                      sx={{ 
                        ...selectStyles.menuItem,
                        fontFamily: "'JetBrains Mono', 'Noto Sans KR', sans-serif"
                      }}
                    >
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
                  <MenuItem 
                    value="all" 
                    sx={{ 
                      ...selectStyles.menuItem,
                      fontFamily: "'JetBrains Mono', 'Noto Sans KR', sans-serif"
                    }}
                  >
                    전체 학기
                  </MenuItem>
                  {terms.map(term => (
                    <MenuItem 
                      key={term} 
                      value={term}
                      sx={{ 
                        ...selectStyles.menuItem,
                        fontFamily: "'JetBrains Mono', 'Noto Sans KR', sans-serif"
                      }}
                    >
                      {term}학기
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </Box>

          <List>
            {filteredClasses.map((classItem, index) => (
              <ListItem 
                key={index} 
                disablePadding 
                divider
                sx={{
                  ...selectStyles.listItem,
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
                  }
                }}
              >
                <ListItemButton 
                  sx={{
                    ...selectStyles.listItemButton,
                    width: '100%'
                  }}
                >
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      width: '100%'
                    }}
                  >
                    <Box 
                      onClick={() => {
                        if (!classItem.status || classItem.status === 'ACTIVE') {
                          navigate(`/watcher/class/${classItem.courseId}`);
                        }
                      }}
                      sx={{ flex: 1 }}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography sx={{ fontFamily: "'JetBrains Mono', 'Noto Sans KR', sans-serif" }}>
                              {classItem.courseName}
                            </Typography>
                            {classItem.status && classItem.status !== 'ACTIVE' && (
                              <Chip
                                label={{
                                  PROVISIONING: '환경 준비 중',
                                  TERMINATING: '종료 중',
                                  ENDED: '종료됨',
                                  ARCHIVING: '보관 중',
                                  ERROR: '준비 오류'
                                }[classItem.status] || classItem.status}
                                size="small"
                                color={classItem.status === 'ERROR' ? 'error' : 'warning'}
                                variant="outlined"
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Typography 
                            component="span" 
                            sx={{ 
                              fontFamily: "'JetBrains Mono', 'Noto Sans KR', sans-serif",
                              color: 'text.secondary',
                              display: 'block',
                              mt: 0.5
                            }}
                          >
                            {classItem.courseYear}년 {classItem.courseTerm}학기 | {classItem.courseClss}분반 | {classItem.courseProfessor} 교수님
                          </Typography>
                        }
                        primaryTypographyProps={{ 
                          fontFamily: "'JetBrains Mono', 'Noto Sans KR', sans-serif" 
                        }}
                        secondaryTypographyProps={{ 
                          fontFamily: "'JetBrains Mono', 'Noto Sans KR', sans-serif",
                          sx: { mt: 0.5 }
                        }}
                      />
                    </Box>
                    {canManageCourse(classItem, user) && (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRegenerateKey(classItem.courseId);
                        }}
                        disabled={submitting || (classItem.status && classItem.status !== 'ACTIVE')}
                        startIcon={<RefreshIcon sx={{ fontSize: '1rem' }} />}
                        size="small"
                        variant="outlined"
                        sx={{
                          ml: 2,
                          fontFamily: "'JetBrains Mono', 'Noto Sans KR', sans-serif",
                          minWidth: 'auto',
                          fontSize: '0.75rem',
                          py: 0.5,
                          px: 1,
                          height: '28px',
                          '& .MuiButton-startIcon': {
                            mr: 0.5
                          }
                        }}
                      >
                        참가 코드 재발급
                      </Button>
                    )}
                  </Box>
                </ListItemButton>
              </ListItem>
            ))}
          </List>

          {filteredClasses.length === 0 && (
            <Typography 
              variant="h6" 
              color="text.secondary"
              sx={{ 
                fontFamily: "'JetBrains Mono', 'Noto Sans KR', sans-serif",
                textAlign: 'center'
              }}
            >
              해당하는 강의가 없습니다.
            </Typography>
          )}

          {user?.role === 'ADMIN' && (
            <ListItem 
              disablePadding 
              divider
              onClick={() => setOpenDialog(true)}
              sx={{
                ...selectStyles.listItem,
                cursor: 'pointer',
                backgroundColor: (theme) => 
                  theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
                '&:hover': {
                  backgroundColor: (theme) => 
                    theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
                },
                transition: 'background-color 0.2s ease'
              }}
            >
              <ListItemButton 
                sx={{
                  ...selectStyles.listItemButton,
                  width: '100%',
                  justifyContent: 'center',
                  py: 2
                }}
              >
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  color: (theme) => theme.palette.text.secondary
                }}>
                  <AddIcon sx={{ fontSize: '1.1rem' }} />
                  <Typography sx={{ 
                    fontSize: '0.9rem',
                    fontFamily: "'JetBrains Mono', 'Noto Sans KR', sans-serif"
                  }}>
                    새 수업 추가
                  </Typography>
                </Box>
              </ListItemButton>
            </ListItem>
          )}

          <Dialog 
            open={openDialog} 
            onClose={() => setOpenDialog(false)}
            maxWidth="sm"
            fullWidth
            PaperComponent={GlassPaper}
          >
            <DialogTitle sx={{ fontFamily: "'JetBrains Mono', 'Noto Sans KR', sans-serif" }}>
              새 수업 추가
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="과목명"
                    value={newClass.name}
                    onChange={(e) => {
                      setNewClass({ ...newClass, name: e.target.value });
                      if (formErrors.courseName) setFormErrors({ ...formErrors, courseName: '' });
                    }}
                    placeholder="ex) C++ 프로그래밍"
                    helperText={formErrors.courseName || '과목 이름을 입력하세요 (ex: C++ 프로그래밍)'}
                    error={Boolean(formErrors.courseName)}
                  />
                </Grid>
                {user?.role === 'ADMIN' && <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="교수명"
                    value={newClass.professor}
                    onChange={(e) => {
                      setNewClass({ ...newClass, professor: e.target.value });
                      if (formErrors.professor) setFormErrors({ ...formErrors, professor: '' });
                    }}
                    placeholder="ex) 홍길동"
                    helperText={formErrors.professor || '담당 교수 성함을 입력하세요'}
                    error={Boolean(formErrors.professor)}
                  />
                </Grid>}
                <Grid item xs={12}>
                  <Box sx={{ 
                    display: 'flex', 
                    gap: 2,
                    alignItems: 'flex-start'
                  }}>
                    <FormControl sx={{ flex: 1 }}>
                      <InputLabel>연도</InputLabel>
                      <Select
                        value={newClass.year}
                        onChange={(e) => setNewClass({ ...newClass, year: e.target.value })}
                        label="연도"
                        size="medium"
                        fullWidth
                      >
                        {[new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1].map(year => (
                          <MenuItem key={year} value={year}>
                            {year}년
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl sx={{ flex: 1 }}>
                      <InputLabel>학기</InputLabel>
                      <Select
                        value={newClass.term}
                        onChange={(e) => setNewClass({ ...newClass, term: e.target.value })}
                        label="학기"
                        size="medium"
                        fullWidth
                      >
                        {[1, 2].map(term => (
                          <MenuItem key={term} value={term}>
                            {term}학기
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <TextField
                      label="분반"
                      value={newClass.clss}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        setNewClass({ ...newClass, clss: value });
                        if (formErrors.courseClss) {
                          setFormErrors({ ...formErrors, courseClss: '' });
                        }
                      }}
                      type="text"
                      inputProps={{
                        pattern: '[0-9]*',
                        inputMode: 'numeric',
                        style: { textAlign: 'center' }
                      }}
                      placeholder="1"
                      helperText={formErrors.courseClss || "숫자만 입력"}
                      error={Boolean(formErrors.courseClss)}
                      sx={{ flex: 1 }}
                    />
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      p: 2, 
                      mt: 1,
                      backgroundColor: (theme) => 
                        theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                      borderRadius: 2,
                      border: (theme) =>
                        `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                    }}
                  >
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={newClass.vnc}
                          onChange={(e) => setNewClass({ ...newClass, vnc: e.target.checked })}
                          sx={{
                            '&.Mui-checked': {
                              color: 'primary.main',
                            }
                          }}
                        />
                      }
                      label={
                        <Box>
                          <Typography 
                            sx={{ 
                              fontFamily: "'JetBrains Mono', 'Noto Sans KR', sans-serif",
                              fontWeight: 500,
                              mb: 0.5
                            }}
                          >
                            VNC 사용
                          </Typography>
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{ 
                              fontFamily: "'JetBrains Mono', 'Noto Sans KR', sans-serif",
                              fontSize: '0.8rem'
                            }}
                          >
                            VNC를 사용하여 Python GUI 환경을 설정합니다.
                          </Typography>
                        </Box>
                      }
                    />
                  </Paper>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenDialog(false)}>취소</Button>
              <Button onClick={handleAddClass} variant="contained" disabled={submitting}>추가</Button>
            </DialogActions>
          </Dialog>

          <Dialog
            open={courseKeyDialog.open}
            onClose={() => setCourseKeyDialog({ open: false, courseKey: '', courseId: null, operation: null })}
            maxWidth="sm"
            fullWidth
            PaperComponent={GlassPaper}
          >
            <DialogTitle sx={{ fontFamily: "'JetBrains Mono', 'Noto Sans KR', sans-serif" }}>
              {courseKeyDialog.operation === 'regenerate' ? '참가 코드 재발급 완료' : '강의 개설 요청 접수'}
            </DialogTitle>
            <DialogContent>
              <Box sx={{ mt: 2 }}>
                <Typography 
                  sx={{ 
                    mb: 2,
                    fontFamily: "'JetBrains Mono', 'Noto Sans KR', sans-serif",
                    color: 'warning.main',
                    textAlign: 'center',
                    whiteSpace: 'pre-line',
                    lineHeight: 1.6
                  }}
                >
                  ※ 이 참가 코드는 학생들의 수업 참여에 필요합니다. ※{'\n'}
                   반드시 저장해주세요. {'\n'} 저장을 안하고 이 창을 나가면 참가코드는 신규 발급 해야합니다. 
                </Typography>
                <Box sx={{ position: 'relative' }}>
                  <TextField
                    fullWidth
                    value={courseKeyDialog.courseKey}
                    InputProps={{
                      readOnly: true,
                      endAdornment: (
                        <Box sx={{ position: 'relative' }}>
                          <Button
                            onClick={handleCopy}
                            sx={{
                              minWidth: 'auto',
                              p: 1,
                              color: 'primary.main',
                              '&:hover': {
                                backgroundColor: 'transparent',
                                color: 'primary.dark',
                              }
                            }}
                          >
                            <ContentCopyIcon />
                          </Button>
                          <Box
                            sx={{
                              position: 'absolute',
                              bottom: 'calc(100% + 4px)',
                              right: 0,
                              backgroundColor: 'background.paper',
                              color: 'success.main',
                              fontSize: '0.75rem',
                              py: 0.5,
                              px: 1,
                              borderRadius: 1,
                              boxShadow: 1,
                              opacity: copied ? 1 : 0,
                              transform: copied ? 'translateY(-4px)' : 'translateY(0)',
                              transition: 'all 0.2s ease',
                              fontFamily: "'JetBrains Mono', 'Noto Sans KR', sans-serif",
                              zIndex: 1,
                            }}
                          >
                            Copied!
                          </Box>
                        </Box>
                      ),
                      sx: { 
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '1.1rem',
                        textAlign: 'center',
                        pr: 1,
                        '& input': {
                          textAlign: 'center',
                          pr: 5
                        }
                      }
                    }}
                  />
                </Box>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button 
                onClick={() => setCourseKeyDialog({ open: false, courseKey: '', courseId: null, operation: null })}
                variant="contained"
              >
                확인
              </Button>
            </DialogActions>
          </Dialog>
        </GlassPaper>
      </Container>
    </Fade>
  );
};

export default ClassList;
