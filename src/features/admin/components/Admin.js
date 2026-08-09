import React, { useState, useEffect, useMemo } from 'react';
import {
  Container,
  Fade,
  Tabs,
  Tab,
  Box,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import { toast } from 'react-toastify';
import { useTheme } from '../../../contexts/ThemeContext';
import { adminService } from '../../../services/api';

// 새로운 컴포넌트들 import
import UserManagementTab from './UserManagement/UserManagementTab';
import CourseManagementTab from './CourseManagement/CourseManagementTab';
import { useAdminData } from '../hooks';
import { GlassPaper } from '../../../components/ui';

const Admin = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    studentNum: '',
    courseName: '',
    courseCode: '',
    term: '',
    year: new Date().getFullYear(),
    professor: '',
    clss: '',
    vnc: false,
    hwCount: 10,
    pracEnabled: false,
    pracCount: 0
  });

  const { isDarkMode } = useTheme();
  
  // 데이터 관리 훅 사용
  const { 
    loading, 
    users, 
    fetchUsers, 
    fetchCourses, 
    handleRoleChange 
  } = useAdminData();

  // 탭 섹션 정의 (조교 탭 제거 — 수업별로만 관리)
  const sections = useMemo(() => ({
    professors: {
      title: '교수 관리',
      items: users.professors
    },
    students: {
      title: '학생 관리',
      items: users.students
    },
    courses: {
      title: '수업 관리',
      items: users.courses
    }
  }), [users.professors, users.students, users.courses]);

  // 폼 데이터 초기화
  useEffect(() => {
    if (selectedItem) {
      setFormData({
        name: selectedItem.name || '',
        studentNum: selectedItem.studentId || '',
        courseName: selectedItem.courseName || '',
        courseCode: selectedItem.courseCode || '',
        term: selectedItem.term || '',
        year: selectedItem.year || new Date().getFullYear(),
        professor: selectedItem.professor || '',
        clss: selectedItem.clss || '',
        vnc: Boolean(selectedItem.vnc),
        hwCount: selectedItem.hwCount || 10,
        pracEnabled: selectedItem.pracEnabled || false,
        pracCount: selectedItem.pracCount || 0
      });
    } else {
      setFormData({
        name: '',
        studentNum: '',
        courseName: '',
        courseCode: '',
        term: '',
        year: new Date().getFullYear(),
        professor: '',
        clss: '',
        vnc: false,
        hwCount: 10,
        pracEnabled: false,
        pracCount: 0
      });
    }
  }, [selectedItem]);

  // 탭 변경 핸들러
  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  // 다이얼로그 관련 핸들러들
  const handleOpenDialog = (type, item = null) => {
    setDialogType(type);
    setSelectedItem(item);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedItem(null);
    setFormData({
      name: '',
      studentNum: '',
      courseName: '',
      courseCode: '',
      term: '',
      year: new Date().getFullYear(),
      professor: '',
      clss: '',
      vnc: false,
      hwCount: 10,
      pracEnabled: false,
      pracCount: 0
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const numericFields = ['year', 'term', 'clss', 'hwCount', 'pracCount'];
    let parsed = numericFields.includes(name) ? (parseInt(value) || 0) : value;
    if (name === 'hwCount') parsed = Math.max(10, Math.min(15, parsed));
    if (name === 'pracCount') parsed = Math.max(0, Math.min(10, parsed));
    setFormData(prev => ({
      ...prev,
      [name]: parsed
    }));
  };

  // 제출 핸들러
  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      if (currentTab === 2) { // 수업 관리 탭
        if (!formData.courseName || !formData.courseCode || !formData.term || !formData.year || !formData.professor || !formData.clss) {
          toast.error('모든 필드를 입력해주세요.');
          return;
        }

        if (dialogType === 'edit') {
          await adminService.updateCourse(selectedItem.courseId, {
            name: formData.courseName,
            code: formData.courseCode,
            term: formData.term,
            year: formData.year,
            professor: formData.professor,
            clss: formData.clss,
            vnc: formData.vnc,
            hwCount: formData.hwCount,
            pracEnabled: formData.pracEnabled,
            pracCount: formData.pracEnabled ? formData.pracCount : 0
          });
        } else if (dialogType === 'add') {
          await adminService.createCourse({
            name: formData.courseName,
            code: formData.courseCode,
            term: formData.term,
            year: formData.year,
            professor: formData.professor,
            clss: formData.clss,
            vnc: formData.vnc,
            hwCount: formData.hwCount,
            pracEnabled: formData.pracEnabled,
            pracCount: formData.pracEnabled ? formData.pracCount : 0
          });
        }
        fetchCourses();
      } else {
        if (!formData.name || !formData.studentNum) {
          toast.error('모든 필드를 입력해주세요.');
          return;
        }

        if (dialogType === 'edit') {
          // 백엔드 API 명세에 관리자가 다른 사용자 정보를 수정하는 API가 없음
          toast.error('사용자 정보 수정 기능은 현재 지원되지 않습니다.');
          return;
        }
        fetchUsers();
      }
      handleCloseDialog();
    } catch (error) {
      ////console.error('작업 실패:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // 삭제 핸들러
  const handleDelete = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      if (currentTab === 2) {
        await adminService.deleteCourse(selectedItem.courseId);
        toast.success(`${selectedItem.courseName} (${selectedItem.courseCode}) 수업이 삭제되었습니다.`);
        fetchCourses();
      } else {
        await adminService.deleteUser(selectedItem.id);
        toast.success(`${selectedItem.name} (${selectedItem.email}) 사용자가 삭제되었습니다.`);
        fetchUsers();
      }
      handleCloseDialog();
    } catch (error) {
      const errorMessage = error.response?.status === 404 ?
        (currentTab === 2 ? "존재하지 않는 수업입니다." : "존재하지 않는 사용자입니다.") :
        error.response?.status === 403 ? "삭제 권한이 없습니다." :
        (currentTab === 2 ? "수업 삭제 중 오류가 발생했습니다." : "사용자 삭제 중 오류가 발생했습니다.");
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // 강의 상태 변경 핸들러 (종료/아카이브/재개설)
  const handleCourseStatusChange = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const courseName = `${selectedItem.courseName} (${selectedItem.courseCode})`;
      if (dialogType === 'end') {
        await adminService.endCourse(selectedItem.courseId);
        toast.success(`${courseName} 강의가 종료되었습니다.`);
      } else if (dialogType === 'archive') {
        await adminService.archiveCourse(selectedItem.courseId);
        toast.success(`${courseName} 강의가 아카이브되었습니다.`);
      } else if (dialogType === 'reopen') {
        await adminService.reopenCourse(selectedItem.courseId);
        toast.success(`${courseName} 강의가 재개설되었습니다.`);
      }
      fetchCourses();
      handleCloseDialog();
    } catch (error) {
      toast.error(error.message || '강의 상태 변경에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  // 다이얼로그 렌더링
  const renderDialog = () => {
    const sectionKey = Object.keys(sections)[currentTab];
    const section = sections[sectionKey];

    if (!openDialog) return null;

    // 강의 상태 변경 다이얼로그 (종료/아카이브/재개설)
    if (['end', 'archive', 'reopen'].includes(dialogType)) {
      const statusMessages = {
        end: {
          title: '강의 종료',
          message: `${selectedItem?.courseName} (${selectedItem?.courseCode}) 강의를 종료하시겠습니까?\n\n모든 JCode 인스턴스가 삭제됩니다.`,
          color: 'warning',
          buttonText: '종료'
        },
        archive: {
          title: '강의 아카이브',
          message: `${selectedItem?.courseName} (${selectedItem?.courseCode}) 강의를 아카이브하시겠습니까?\n\n네임스페이스가 삭제됩니다.`,
          color: 'primary',
          buttonText: '아카이브'
        },
        reopen: {
          title: '강의 재개설',
          message: `${selectedItem?.courseName} (${selectedItem?.courseCode}) 강의를 재개설하시겠습니까?\n\n네임스페이스가 재생성됩니다.`,
          color: 'primary',
          buttonText: '재개설'
        }
      };
      const config = statusMessages[dialogType];

      return (
        <Dialog open={openDialog} onClose={handleCloseDialog}>
          <DialogTitle sx={{ fontFamily: "'JetBrains Mono', 'Noto Sans KR', sans-serif" }}>
            {config.title}
          </DialogTitle>
          <DialogContent>
            <Typography sx={{ fontFamily: "'JetBrains Mono', 'Noto Sans KR', sans-serif", whiteSpace: 'pre-line' }}>
              {config.message}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} sx={{ fontFamily: "'JetBrains Mono', 'Noto Sans KR', sans-serif" }}>
              취소
            </Button>
            <Button
              onClick={handleCourseStatusChange}
              variant="contained"
              color={config.color}
              disabled={submitting}
              sx={{ fontFamily: "'JetBrains Mono', 'Noto Sans KR', sans-serif" }}
            >
              {config.buttonText}
            </Button>
          </DialogActions>
        </Dialog>
      );
    }

    return (
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle sx={{ fontFamily: "'JetBrains Mono', 'Noto Sans KR', sans-serif" }}>
          {dialogType === 'add' ? `${section.title} 추가` :
           dialogType === 'edit' ? `${section.title} 수정` :
           `${section.title} 삭제`}
        </DialogTitle>
        <DialogContent>
          {dialogType !== 'delete' ? (
            <Box sx={{ pt: 2 }}>
              {currentTab === 2 ? (
                // 수업 관리 폼
                <>
                  <TextField
                    fullWidth
                    name="courseName"
                    label="수업명"
                    value={formData.courseName}
                    onChange={handleInputChange}
                    required
                    sx={{ mb: 2 }}
                    InputProps={{
                      sx: { fontFamily: "'JetBrains Mono', 'Noto Sans KR', sans-serif" }
                    }}
                    InputLabelProps={{
                      sx: { fontFamily: "'JetBrains Mono', 'Noto Sans KR', sans-serif" }
                    }}
                  />
                  <TextField
                    fullWidth
                    name="professor"
                    label="교수명"
                    value={formData.professor}
                    onChange={handleInputChange}
                    required
                    sx={{ mb: 2 }}
                    InputProps={{
                      sx: { fontFamily: "'JetBrains Mono', 'Noto Sans KR', sans-serif" }
                    }}
                    InputLabelProps={{
                      sx: { fontFamily: "'JetBrains Mono', 'Noto Sans KR', sans-serif" }
                    }}
                  />
                  <TextField
                    fullWidth
                    name="courseCode"
                    label="수업 코드"
                    value={formData.courseCode}
                    onChange={handleInputChange}
                    disabled={dialogType === 'edit'}
                    required
                    sx={{ mb: 2 }}
                    InputProps={{
                      sx: { fontFamily: "'JetBrains Mono', 'Noto Sans KR', sans-serif" }
                    }}
                    InputLabelProps={{
                      sx: { fontFamily: "'JetBrains Mono', 'Noto Sans KR', sans-serif" }
                    }}
                  />
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel id="term-label" sx={{ 
                      fontFamily: "'JetBrains Mono', 'Noto Sans KR', sans-serif",
                      '&.MuiInputLabel-shrink': {
                        backgroundColor: 'transparent'
                      }
                    }}>학기</InputLabel>
                    <Select
                      labelId="term-label"
                      label="학기"
                      name="term"
                      value={formData.term}
                      onChange={handleInputChange}
                      required
                      sx={{ 
                        fontFamily: "'JetBrains Mono', 'Noto Sans KR', sans-serif"
                      }}
                    >
                      <MenuItem value={1}>1학기</MenuItem>
                      <MenuItem value={2}>2학기</MenuItem>
                    </Select>
                  </FormControl>
                  <TextField
                    fullWidth
                    name="year"
                    label="년도"
                    type="number"
                    value={formData.year}
                    onChange={handleInputChange}
                    required
                    inputProps={{ 
                      min: 2000,
                      max: new Date().getFullYear() + 1
                    }}
                    sx={{ mb: 2 }}
                    InputProps={{
                      sx: { fontFamily: "'JetBrains Mono', 'Noto Sans KR', sans-serif" }
                    }}
                    InputLabelProps={{
                      sx: { fontFamily: "'JetBrains Mono', 'Noto Sans KR', sans-serif" }
                    }}
                  />
                  <TextField
                    fullWidth
                    name="clss"
                    label="분반"
                    type="number"
                    value={formData.clss}
                    onChange={handleInputChange}
                    disabled={dialogType === 'edit'}
                    required
                    inputProps={{ min: 1 }}
                    sx={{ mb: 2 }}
                    InputProps={{
                      sx: { fontFamily: "'JetBrains Mono', 'Noto Sans KR', sans-serif" }
                    }}
                    InputLabelProps={{
                      sx: { fontFamily: "'JetBrains Mono', 'Noto Sans KR', sans-serif" }
                    }}
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.vnc}
                        disabled={dialogType === 'edit'}
                        onChange={(e) => setFormData(prev => ({ ...prev, vnc: e.target.checked }))}
                      />
                    }
                    label="VNC 환경 사용 (생성 후 변경 불가)"
                    sx={{ mb: 2, fontFamily: "'JetBrains Mono', 'Noto Sans KR', sans-serif" }}
                  />
                  <TextField
                    fullWidth
                    name="hwCount"
                    label="과제(HW) 개수"
                    type="number"
                    value={formData.hwCount}
                    onChange={handleInputChange}
                    inputProps={{ min: 10, max: 15 }}
                    sx={{ mb: 2 }}
                    InputProps={{
                      sx: { fontFamily: "'JetBrains Mono', 'Noto Sans KR', sans-serif" }
                    }}
                    InputLabelProps={{
                      sx: { fontFamily: "'JetBrains Mono', 'Noto Sans KR', sans-serif" }
                    }}
                    helperText="10~15 사이의 값 (기본: 10)"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.pracEnabled}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          pracEnabled: e.target.checked,
                          pracCount: e.target.checked ? (prev.pracCount || 5) : 0
                        }))}
                      />
                    }
                    label="실습(Prac) 사용"
                    sx={{ mb: 1, fontFamily: "'JetBrains Mono', 'Noto Sans KR', sans-serif" }}
                  />
                  {formData.pracEnabled && (
                    <TextField
                      fullWidth
                      name="pracCount"
                      label="실습(Prac) 개수"
                      type="number"
                      value={formData.pracCount}
                      onChange={handleInputChange}
                      inputProps={{ min: 1, max: 10 }}
                      sx={{ mb: 2 }}
                      InputProps={{
                        sx: { fontFamily: "'JetBrains Mono', 'Noto Sans KR', sans-serif" }
                      }}
                      InputLabelProps={{
                        sx: { fontFamily: "'JetBrains Mono', 'Noto Sans KR', sans-serif" }
                      }}
                      helperText="1~10 사이의 값"
                    />
                  )}
                </>
              ) : (
                // 사용자 관리 폼
                <>
                  <TextField
                    fullWidth
                    name="name"
                    label="이름"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    sx={{ mb: 2 }}
                    InputProps={{
                      sx: { fontFamily: "'JetBrains Mono', 'Noto Sans KR', sans-serif" }
                    }}
                    InputLabelProps={{
                      sx: { fontFamily: "'JetBrains Mono', 'Noto Sans KR', sans-serif" }
                    }}
                  />
                  <TextField
                    fullWidth
                    name="studentNum"
                    label={Object.keys(sections)[currentTab] === 'professors' ? '교번' : '학번'}
                    value={formData.studentNum}
                    onChange={handleInputChange}
                    required
                    type="number"
                    InputProps={{
                      sx: { fontFamily: "'JetBrains Mono', 'Noto Sans KR', sans-serif" }
                    }}
                    InputLabelProps={{
                      sx: { fontFamily: "'JetBrains Mono', 'Noto Sans KR', sans-serif" }
                    }}
                  />
                </>
              )}
            </Box>
          ) : (
            <Typography sx={{ fontFamily: "'JetBrains Mono', 'Noto Sans KR', sans-serif" }}>
              {currentTab === 2 ? 
                `${selectedItem.courseName} (${selectedItem.courseCode}) 수업을 삭제하시겠습니까?` :
                `${selectedItem.name} (${selectedItem.email}) 사용자를 삭제하시겠습니까?`}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleCloseDialog}
            sx={{ fontFamily: "'JetBrains Mono', 'Noto Sans KR', sans-serif" }}
          >
            취소
          </Button>
          <Button
            onClick={dialogType === 'delete' ? handleDelete : handleSubmit}
            variant="contained"
            color={dialogType === 'delete' ? 'error' : 'primary'}
            disabled={submitting}
            sx={{ fontFamily: "'JetBrains Mono', 'Noto Sans KR', sans-serif" }}
          >
            {dialogType === 'add' ? '추가' :
             dialogType === 'edit' ? '수정' : '삭제'}
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  // 현재 탭에 따른 컴포넌트 렌더링
  const renderCurrentTab = () => {
    switch (currentTab) {
      case 0: // 교수 관리
        return (
          <UserManagementTab
            users={users.professors}
            loading={loading}
            onRoleChange={handleRoleChange}
            onOpenDialog={handleOpenDialog}
            rowsPerPage={10}
          />
        );
      case 1: // 학생 관리
        return (
          <UserManagementTab
            users={users.students}
            loading={loading}
            onRoleChange={handleRoleChange}
            onOpenDialog={handleOpenDialog}
            rowsPerPage={10}
          />
        );
      case 2: // 수업 관리
        return (
          <CourseManagementTab
            courses={users.courses}
            loading={loading}
            isDarkMode={isDarkMode}
            onOpenDialog={handleOpenDialog}
            rowsPerPage={10}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Fade in={true} timeout={300}>
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <GlassPaper>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs
              value={currentTab}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
            >
              {Object.values(sections).map((section) => (
                <Tab
                  key={section.title}
                  label={section.title}
                  sx={{ fontFamily: "'JetBrains Mono', 'Noto Sans KR', sans-serif" }}
                />
              ))}
            </Tabs>
          </Box>



          {renderCurrentTab()}
        </GlassPaper>
        {renderDialog()}
      </Container>
    </Fade>
  );
};

export default Admin;
