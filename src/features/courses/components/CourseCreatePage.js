import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Chip,
  Container,
  Divider,
  Fade,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CodeIcon from '@mui/icons-material/Code';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DesktopWindowsOutlinedIcon from '@mui/icons-material/DesktopWindowsOutlined';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import ReplayIcon from '@mui/icons-material/Replay';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Button } from '../../../components/ui';
import { FONT_FAMILY } from '../../../constants/uiConstants';
import { useAuth } from '../../../contexts/AuthContext';
import { userService } from '../../../services/api';
import { useClassList } from '../../watcher/hooks';

const courseStatus = {
  PROVISIONING: { label: '환경 준비 중', color: 'info', icon: HourglassTopIcon },
  ACTIVE: { label: '개설 완료', color: 'success', icon: CheckCircleOutlineIcon },
  ERROR: { label: '준비 오류', color: 'error', icon: ErrorOutlineIcon },
};

const createInitialForm = () => ({
  name: '',
  professor: '',
  year: new Date().getFullYear(),
  term: new Date().getMonth() + 1 >= 9 ? 2 : 1,
  clss: '',
  vnc: false,
});

const CourseCreatePage = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const navigate = useNavigate();
  const { addClass, classes, validateClassForm } = useClassList();
  const [form, setForm] = useState(createInitialForm);
  const [errors, setErrors] = useState({ courseName: '', courseClss: '', professor: '' });
  const [profileName, setProfileName] = useState('');
  const [profileError, setProfileError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const submissionLock = useRef(false);

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return [currentYear - 1, currentYear, currentYear + 1];
  }, []);

  useEffect(() => {
    if (isAdmin) {
      setProfileName('');
      setProfileError('');
      return undefined;
    }

    let active = true;

    userService.getCurrentUser({ showToast: false })
      .then((profile) => {
        if (!active) return;
        const professorName = profile?.name || '';
        setProfileName(professorName);
        setForm((current) => ({ ...current, professor: professorName }));
        setProfileError(professorName ? '' : '프로필에서 교수명을 확인할 수 없습니다.');
      })
      .catch(() => {
        if (!active) return;
        setProfileError('교수 프로필을 불러오지 못했습니다.');
      });

    return () => {
      active = false;
    };
  }, [isAdmin]);

  const createdCourse = result
    ? classes.find((course) => Number(course.courseId) === Number(result.courseId))
    : null;
  const currentStatus = createdCourse?.status || result?.status || 'PROVISIONING';
  const status = courseStatus[currentStatus] || courseStatus.PROVISIONING;
  const StatusIcon = status.icon;

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    if (field === 'name' && errors.courseName) {
      setErrors((current) => ({ ...current, courseName: '' }));
    }
    if (field === 'clss' && errors.courseClss) {
      setErrors((current) => ({ ...current, courseClss: '' }));
    }
    if (field === 'professor' && errors.professor) {
      setErrors((current) => ({ ...current, professor: '' }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validation = validateClassForm(form);
    setErrors(validation.errors);
    if (!validation.isValid || submissionLock.current || profileError) return;

    submissionLock.current = true;
    setSubmitting(true);

    try {
      const response = await addClass(form);
      if (!response.success) {
        toast.error(response.error || '수업 개설 요청에 실패했습니다.');
        return;
      }

      setResult({
        courseId: response.courseId,
        courseKey: response.courseKey,
        status: response.status || 'PROVISIONING',
      });
    } finally {
      submissionLock.current = false;
      setSubmitting(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result.courseKey);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('참가 코드를 복사하지 못했습니다.');
    }
  };

  const resetForm = () => {
    setForm({ ...createInitialForm(), professor: isAdmin ? '' : profileName });
    setErrors({ courseName: '', courseClss: '', professor: '' });
    setResult(null);
    setCopied(false);
  };

  if (result) {
    return (
      <Fade in timeout={250}>
        <Container maxWidth="md" sx={{ mt: { xs: 2, md: 4 } }}>
          <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Box sx={{ p: { xs: 2.5, md: 4 } }}>
              <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1.5, flexWrap: 'wrap', rowGap: 1 }}>
                <StatusIcon color={status.color} />
                <Typography variant="h5" sx={{ fontFamily: FONT_FAMILY, fontWeight: 700 }}>
                  수업 개설 요청
                </Typography>
                <Chip label={status.label} color={status.color} size="small" variant="outlined" />
              </Stack>
              <Typography color="text.secondary" sx={{ fontFamily: FONT_FAMILY }}>
                {form.year}년 {form.term}학기 · {form.name} · {form.clss}분반
              </Typography>
            </Box>

            {result.courseKey && <>
              <Divider />
              <Box sx={{ p: { xs: 2.5, md: 4 } }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontFamily: FONT_FAMILY }}>
                  학생 참가 코드
                </Typography>
                <TextField
                  fullWidth
                  value={result.courseKey}
                  inputProps={{ readOnly: true, 'aria-label': '학생 참가 코드' }}
                  InputProps={{
                    endAdornment: (
                      <Tooltip title={copied ? '복사됨' : '복사'}>
                        <IconButton onClick={handleCopy} edge="end" aria-label="참가 코드 복사">
                          <ContentCopyIcon />
                        </IconButton>
                      </Tooltip>
                    ),
                  }}
                  sx={{ '& input': { fontFamily: "'JetBrains Mono', monospace" } }}
                />
              </Box>
            </>}

            {!result.courseKey && (
              <Alert severity="info" sx={{ mx: { xs: 2.5, md: 4 }, mb: 1 }}>
                참가 코드는 수업 목록에서 재발급할 수 있습니다.
              </Alert>
            )}

            <Divider />
            <Stack direction={{ xs: 'column-reverse', sm: 'row' }} justifyContent="flex-end" spacing={1} sx={{ p: 2 }}>
              <Button variant="outlined" startIcon={<ReplayIcon />} onClick={resetForm}>
                다른 수업 개설
              </Button>
              <Button variant="contained" onClick={() => navigate('/watcher')}>
                수업 목록
              </Button>
            </Stack>
          </Paper>
        </Container>
      </Fade>
    );
  }

  return (
    <Fade in timeout={250}>
      <Container maxWidth="md" sx={{ mt: { xs: 2, md: 4 } }}>
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
          <Tooltip title="수업 목록">
            <IconButton onClick={() => navigate('/watcher')} aria-label="수업 목록으로 돌아가기">
              <ArrowBackIcon />
            </IconButton>
          </Tooltip>
          <Box>
            <Typography variant="h5" sx={{ fontFamily: FONT_FAMILY, fontWeight: 700 }}>
              수업 개설
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontFamily: FONT_FAMILY }}>
              {user?.email}
            </Typography>
          </Box>
        </Stack>

        <Paper component="form" onSubmit={handleSubmit} variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <Box sx={{ p: { xs: 2.5, md: 4 } }}>
            {profileError && <Alert severity="error" sx={{ mb: 3 }}>{profileError}</Alert>}
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={7}>
                <TextField
                  fullWidth
                  autoFocus
                  label="과목명"
                  value={form.name}
                  onChange={(event) => updateField('name', event.target.value)}
                  placeholder="예: 자료구조"
                  error={Boolean(errors.courseName)}
                  helperText={errors.courseName}
                  inputProps={{ maxLength: 100 }}
                />
              </Grid>
              <Grid item xs={12} sm={5}>
                <TextField
                  fullWidth
                  label="담당 교수"
                  value={isAdmin ? form.professor : profileName}
                  onChange={isAdmin ? (event) => updateField('professor', event.target.value) : undefined}
                  error={isAdmin && Boolean(errors.professor)}
                  helperText={isAdmin ? errors.professor : ''}
                  InputProps={{ readOnly: !isAdmin }}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>연도</InputLabel>
                  <Select value={form.year} label="연도" onChange={(event) => updateField('year', event.target.value)}>
                    {yearOptions.map((year) => <MenuItem key={year} value={year}>{year}년</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>학기</InputLabel>
                  <Select value={form.term} label="학기" onChange={(event) => updateField('term', event.target.value)}>
                    <MenuItem value={1}>1학기</MenuItem>
                    <MenuItem value={2}>2학기</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="분반"
                  value={form.clss}
                  onChange={(event) => updateField('clss', event.target.value.replace(/[^0-9]/g, ''))}
                  error={Boolean(errors.courseClss)}
                  helperText={errors.courseClss}
                  inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', maxLength: 3 }}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontFamily: FONT_FAMILY }}>
                  실행 환경
                </Typography>
                <ToggleButtonGroup
                  exclusive
                  fullWidth
                  value={form.vnc ? 'vnc' : 'ide'}
                  onChange={(_, value) => value && updateField('vnc', value === 'vnc')}
                  aria-label="실행 환경"
                >
                  <ToggleButton value="ide"><CodeIcon sx={{ mr: 1 }} />기본 IDE</ToggleButton>
                  <ToggleButton value="vnc"><DesktopWindowsOutlinedIcon sx={{ mr: 1 }} />VNC</ToggleButton>
                </ToggleButtonGroup>
              </Grid>
            </Grid>
          </Box>

          <Divider />
          <Stack direction="row" justifyContent="flex-end" spacing={1} sx={{ p: 2 }}>
            <Button variant="text" onClick={() => navigate('/watcher')}>취소</Button>
            <Button
              type="submit"
              variant="contained"
              startIcon={<AddIcon />}
              disabled={submitting || Boolean(profileError) || (!isAdmin && !profileName)}
            >
              {submitting ? '요청 중' : '수업 개설'}
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Fade>
  );
};

export default CourseCreatePage;
