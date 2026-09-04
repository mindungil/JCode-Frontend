import React, { useState, useEffect, useCallback } from 'react';
import { 
  Container, 
  Paper, 
  Typography, 
  Fade
} from '@mui/material';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../../../../api/axios';
import { useTheme } from '../../../../contexts/ThemeContext';
import { toast } from 'react-toastify';
import { LoadingSpinner, GlassPaper } from '../../../../components/ui';
import { jcodeService } from '../../../../services/api';
import { FONT_FAMILY } from '../../../../constants/uiConstants';
import { getErrorMessage } from '../../../../services/errorHandler';
import { useCourseData } from '../../hooks';
import { getMemberCourseRole } from '../../utils/coursePermissions';
import ClassHeader from './ClassHeader';
import ClassTabs from './ClassTabs';
import StudentsTab from './StudentsTab';
import AssignmentsTab from './AssignmentsTab';
import AddAssignmentDialog from './dialogs/AddAssignmentDialog';
import EditAssignmentDialog from './dialogs/EditAssignmentDialog';
import DeleteAssignmentDialog from './dialogs/DeleteAssignmentDialog';
import PromoteStudentDialog from './dialogs/PromoteStudentDialog';
import WithdrawUserDialog from './dialogs/WithdrawUserDialog';

const wait = (milliseconds) => new Promise(resolve => window.setTimeout(resolve, milliseconds));

const ClassDetail = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // 커스텀 훅 사용
  const {
    course,
    loading: courseLoading,
    error: courseError,
    canViewStudents,
    userRole
  } = useCourseData(courseId);

  const [students, setStudents] = useState([]);
  
  // 직접 필터링 및 정렬 로직 (모든 사용자 포함)
  const [searchQuery, setSearchQuery] = useState('');
  const [sort, setSort] = useState({
    field: 'email',
    order: 'asc'
  });

  // 정렬 토글 함수
  const toggleSort = (field) => {
    setSort(prev => ({
      field: field,
      order: prev.field === field ? (prev.order === 'asc' ? 'desc' : 'asc') : 'asc'
    }));
  };

  // 필터링 및 정렬된 사용자 목록 (교수, 조교, 학생 모두 포함)
  const getFilteredAndSortedStudents = () => {
    // 검색 조건에 맞는 사용자들만 필터링
    const filtered = students.filter(student => {
      const searchLower = searchQuery.toLowerCase();
      const emailMatch = student.email?.toLowerCase().includes(searchLower);
      const nameMatch = student.name?.toLowerCase().includes(searchLower);
      const studentNumMatch = String(student.studentNum || '').toLowerCase().includes(searchLower);
      return emailMatch || nameMatch || studentNumMatch;
    });

    // 정렬: 교수 > 조교 > 학생 > 관리자 순서로 정렬
    return filtered.sort((a, b) => {
      // 역할 우선순위 정의
      const roleOrder = {
        'PROFESSOR': 0,
        'ASSISTANT': 1,
        'STUDENT': 2,
        'ADMIN': 3
      };

      const aRole = getMemberCourseRole(a);
      const bRole = getMemberCourseRole(b);

      if (roleOrder[aRole] !== roleOrder[bRole]) {
        return roleOrder[aRole] - roleOrder[bRole];
      }
      
      // 역할이 같은 경우 선택된 정렬 기준으로 정렬
      let aValue = '';
      let bValue = '';
      
      switch(sort.field) {
        case 'email':
          aValue = a.email || '';
          bValue = b.email || '';
          break;
        case 'name':
          aValue = a.name || '';
          bValue = b.name || '';
          break;
        case 'studentNum':
          aValue = String(a.studentNum || '');
          bValue = String(b.studentNum || '');
          break;
        default:
          aValue = a.email || '';
          bValue = b.email || '';
          break;
      }
      
      return sort.order === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    });
  };

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [openAssignmentDialog, setOpenAssignmentDialog] = useState(false);
  const [currentTab, setCurrentTab] = useState(() => {
    const params = new URLSearchParams(location.search);
    return params.get('tab') || 'assignments';
  });
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deletingAssignment, setDeletingAssignment] = useState(null);
  const [promotingStudent, setPromotingStudent] = useState(null);
  const [openPromoteDialog, setOpenPromoteDialog] = useState(false);
  const { isDarkMode } = useTheme();
  const [withdrawDialog, setWithdrawDialog] = useState({
    open: false,
    userId: null,
    userName: '',
    confirmText: ''
  });

  // 탭 변경 핸들러
  const handleTabChange = (event, newValue) => {
    if (newValue === 'students' && !canViewStudents) return;
    
    setCurrentTab(newValue);
    // URL 업데이트
    const params = new URLSearchParams(location.search);
    params.set('tab', newValue);
    navigate(`${location.pathname}?${params.toString()}`, { replace: true });
  };

  useEffect(() => {
    const requestedTab = new URLSearchParams(location.search).get('tab');
    if (requestedTab === 'students' && !canViewStudents) {
      setCurrentTab('assignments');
    } else if (!requestedTab && canViewStudents) {
      setCurrentTab('students');
    }
  }, [canViewStudents, location.search]);

  const fetchData = useCallback(async () => {
    try {
      // 학생 목록 로드 (교수/조교/관리자만)
      if (canViewStudents) {
        const studentsResponse = await api.get(`/api/courses/${courseId}/users`);
        setStudents(studentsResponse.data);
      }
      
      // 과제 목록은 course 데이터에서 가져오기
      if (course?.assignments) {
        setAssignments(course.assignments);
      }
      
      setLoading(false);
    } catch (error) {
      setError('데이터를 불러오는데 실패했습니다.');
      setLoading(false);
    }
  }, [courseId, canViewStudents, course]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refreshAssignments = useCallback(async () => {
    const response = await api.get(`/api/courses/${courseId}/assignments`);
    setAssignments(response.data);
    return response.data;
  }, [courseId]);

  const waitForAssignmentReady = async (assignmentId) => {
    const deadline = Date.now() + 3 * 60 * 1000;
    while (Date.now() < deadline) {
      const currentAssignments = await refreshAssignments();
      const current = currentAssignments.find(item => item.assignmentId === assignmentId);
      if (current?.lifecycleStatus === 'ACTIVE') return;
      if (current?.lifecycleStatus === 'PROVISION_FAILED') {
        throw new Error('과제 환경을 준비하지 못해 스타터 코드를 배포할 수 없습니다.');
      }
      await wait(2000);
    }
    throw new Error('과제 환경 준비가 지연되어 스타터 코드 업로드를 중단했습니다.');
  };

  useEffect(() => {
    const transitional = new Set(['PROVISIONING', 'DELETING']);
    if (!assignments.some(assignment => transitional.has(assignment.lifecycleStatus))) return undefined;
    const timer = window.setInterval(() => {
      refreshAssignments().catch(() => undefined);
    }, 3000);
    return () => window.clearInterval(timer);
  }, [assignments, refreshAssignments]);

  // 통합 로딩 상태
  const isLoading = courseLoading || loading;
  const finalError = courseError || error;

  const handleAddAssignment = async (assignmentData, starterFile = null) => {
    try {
      // 사용자 입력 시간을 Date 객체로 변환
      const kickoffDateInput = new Date(assignmentData.kickoffDate);
      const deadlineDateInput = new Date(assignmentData.deadlineDate);

      const kickoffDateISO = new Date(
        Date.UTC(
          kickoffDateInput.getFullYear(),
          kickoffDateInput.getMonth(),
          kickoffDateInput.getDate(),
          kickoffDateInput.getHours(),
          kickoffDateInput.getMinutes()
        )
      ).toISOString();

      const deadlineDateISO = new Date(
        Date.UTC(
          deadlineDateInput.getFullYear(),
          deadlineDateInput.getMonth(),
          deadlineDateInput.getDate(),
          deadlineDateInput.getHours(),
          deadlineDateInput.getMinutes()
        )
      ).toISOString();

      const response = await api.post(`/api/courses/${course.courseId}/assignments`, {
        ...assignmentData,
        kickoffDate: kickoffDateISO,
        deadlineDate: deadlineDateISO
      });

      toast.info('과제 생성을 요청했습니다. 환경 준비 상태가 자동으로 갱신됩니다.');
      // Generator 완료를 기다리지 않고 생성 창을 닫고, 목록 상태는 polling으로 갱신한다.
      void refreshAssignments();

      // 스타터 코드 업로드 (선택)
      if (starterFile && response.data?.assignmentId) {
        void (async () => {
          try {
            if (response.data.lifecycleStatus !== 'ACTIVE') {
              await waitForAssignmentReady(response.data.assignmentId);
            }
            const formData = new FormData();
            formData.append('file', starterFile);
            await api.post(
              `/api/courses/${course.courseId}/assignments/${response.data.assignmentId}/starter-code`,
              formData,
              { headers: { 'Content-Type': 'multipart/form-data' } }
            );
            await refreshAssignments();
          } catch (starterError) {
            const reason = getErrorMessage(starterError, '잠시 후 다시 시도해주세요.');
            toast.warning(`과제는 생성되었지만 스타터 코드를 등록하지 못했습니다. ${reason}`);
          }
        })();
      }
    } catch (error) {
      setError('과제 추가에 실패했습니다.');
      toast.error(getErrorMessage(error, '과제 생성 요청에 실패했습니다.'));
      throw error;
    }
  };

  const handleEditAssignment = async (assignmentData) => {
    try {
      // 사용자 입력 시간을 Date 객체로 변환
      const kickoffDateInput = new Date(assignmentData.kickoffDate);
      const deadlineDateInput = new Date(assignmentData.deadlineDate);
      
      // 사용자가 입력한 시간을 그대로 ISO 문자열로 만들기
      const kickoffDateISO = new Date(
        Date.UTC(
          kickoffDateInput.getFullYear(),
          kickoffDateInput.getMonth(),
          kickoffDateInput.getDate(),
          kickoffDateInput.getHours(),
          kickoffDateInput.getMinutes()
        )
      ).toISOString();
      
      const deadlineDateISO = new Date(
        Date.UTC(
          deadlineDateInput.getFullYear(),
          deadlineDateInput.getMonth(),
          deadlineDateInput.getDate(),
          deadlineDateInput.getHours(),
          deadlineDateInput.getMinutes()
        )
      ).toISOString();
      
      await api.put(`/api/courses/${courseId}/assignments/${assignmentData.assignmentId}`, {
        assignmentName: assignmentData.assignmentName,
        assignmentDescription: assignmentData.assignmentDescription,
        kickoffDate: kickoffDateISO,
        deadlineDate: deadlineDateISO
      });

      const assignmentsResponse = await api.get(`/api/courses/${courseId}/assignments`);
      setAssignments(assignmentsResponse.data);
      
      toast.success('과제가 성공적으로 수정되었습니다.');
    } catch (error) {
      toast.error('과제 수정에 실패했습니다. 다시 시도해주세요.');
      throw error; // EditAssignmentDialog에서 오류를 처리할 수 있도록 다시 throw
    }
  };

  const handleDeleteAssignment = async (assignment) => {
    try {
      await api.delete(`/api/courses/${courseId}/assignments/${assignment.assignmentId}`);
      await refreshAssignments();
      toast.info('과제 보관을 요청했습니다. 완료되면 목록에서 자동으로 정리됩니다.');
    } catch (error) {
      toast.error(getErrorMessage(error, '과제 보관 요청에 실패했습니다. 다시 시도해주세요.'));
      throw error; // DeleteAssignmentDialog에서 오류를 처리할 수 있도록 다시 throw
    }
  };

  const handlePromoteToTA = async (selectedPromotingStudent) => {
    try {
      await api.put(`/api/users/${selectedPromotingStudent.userId}/role`, {
        newRole: selectedPromotingStudent.newRole,
        courseId: course.courseId
      });

      // 강의 권한이 수정될 시 스냅샷 컨테이너 생성/삭제 처리
      if (selectedPromotingStudent.newRole !== 'STUDENT') {
        try {
          await jcodeService.createJCode(course.courseId, {
            userEmail: selectedPromotingStudent.email,
            snapshot: true
          });
          //console.log('강의 참가 후 JCode 생성 성공');
        } catch (jcodeError) {
          // 학생에서 권한이 상승 되는 경우가 아니면 이미 존재할 수 있음
          // 따라서 403 에러는 무시
        }
      }
      else {
        try {
          await jcodeService.deleteJCode(course.courseId, {
            userEmail: selectedPromotingStudent.email,
            snapshot: true
          });
        } catch (jcodeError) {
          //console.error('JCode 삭제 중 오류:', jcodeError);
          // JCode 삭제 실패 시에도 권한 변경은 계속 진행
        }
      }
      
      const roleText = {
        'STUDENT': '학생',
        'ASSISTANT': '조교',
        'PROFESSOR': '교수'
      }[selectedPromotingStudent.newRole];
      
      toast.success(`${selectedPromotingStudent.name}님의 권한을 ${roleText}(으)로 변경했습니다.`);
      
      const studentsResponse = await api.get(`/api/courses/${courseId}/users`);
      setStudents(studentsResponse.data);
      
      setOpenPromoteDialog(false);
      setPromotingStudent(null);
    } catch (error) {
      toast.error('권한 변경에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const handleWithdrawUser = async (withdrawData) => {
    if (withdrawData.confirmText !== '사용자를 탈퇴시키겠습니다') {
      toast.error('정확한 확인 문구를 입력해주세요.');
      return;
    }

    try {
      await api.delete(`/api/users/${withdrawData.userId}/courses/${courseId}`);
      
      // 학생 목록 새로고침
      const studentsResponse = await api.get(`/api/courses/${courseId}/users`);
      setStudents(studentsResponse.data);
      
      setWithdrawDialog({
        open: false,
        userId: null,
        userName: '',
        confirmText: ''
      });
      
      toast.success('사용자가 성공적으로 탈퇴되었습니다.');
    } catch (error) {
      toast.error('사용자 탈퇴 중 오류가 발생했습니다.');
      throw error; // WithdrawUserDialog에서 오류를 처리할 수 있도록 다시 throw
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (finalError) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography 
            color="error" 
            align="center"
            sx={{ fontFamily: FONT_FAMILY }}
          >
            {finalError}
          </Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Fade in={true} timeout={300}>
      <Container 
        maxWidth={false}
        sx={{ 
          mt: 2,
          px: 2,
        }}
      >
        <GlassPaper>
          <ClassHeader 
            course={course}
            courseId={courseId}
          />

          <ClassTabs
            currentTab={currentTab}
            onTabChange={handleTabChange}
            userRole={userRole}
          />

          {/* 학생 목록 탭 */}
          {currentTab === 'students' && (
            <StudentsTab
              students={getFilteredAndSortedStudents()}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              sort={sort}
              onToggleSort={toggleSort}
              onWithdrawUser={(student) => {
                setWithdrawDialog({
                  open: true,
                  userId: student.userId,
                  userName: student.name,
                  confirmText: ''
                });
              }}
              onPromoteStudent={(student) => {
                setPromotingStudent({
                  ...student,
                  newRole: getMemberCourseRole(student) || 'STUDENT'
                });
                setOpenPromoteDialog(true);
              }}
              userRole={userRole}
              courseId={courseId}
              isDarkMode={isDarkMode}
            />
          )}

          {/* 과제 관리 탭 */}
          {currentTab === 'assignments' && (
            <AssignmentsTab
              assignments={assignments}
              onAddAssignment={() => setOpenAssignmentDialog(true)}
              onEditAssignment={(formattedAssignment) => {
                setEditingAssignment(formattedAssignment);
                setOpenEditDialog(true);
              }}
              onDeleteAssignment={(assignment) => {
                setDeletingAssignment(assignment);
                setOpenDeleteDialog(true);
              }}
              userRole={userRole}
              courseId={courseId}
            />
          )}

          <AddAssignmentDialog
            open={openAssignmentDialog}
            onClose={() => setOpenAssignmentDialog(false)}
            onAddAssignment={handleAddAssignment}
            existingAssignments={assignments}
          />

          <EditAssignmentDialog
            open={openEditDialog}
            onClose={() => {
              setOpenEditDialog(false);
              setEditingAssignment(null);
            }}
            onEditAssignment={handleEditAssignment}
            assignment={editingAssignment}
            existingAssignments={assignments}
          />

          <DeleteAssignmentDialog
            open={openDeleteDialog}
            onClose={() => {
              setOpenDeleteDialog(false);
              setDeletingAssignment(null);
            }}
            onDeleteAssignment={handleDeleteAssignment}
            assignment={deletingAssignment}
          />

          <PromoteStudentDialog
            open={openPromoteDialog}
            onClose={() => {
              setOpenPromoteDialog(false);
              setPromotingStudent(null);
            }}
            onPromoteStudent={handlePromoteToTA}
            student={promotingStudent}
            currentUserRole={userRole}
          />

          {/* 사용자 탈퇴 다이얼로그 */}
          <WithdrawUserDialog
            open={withdrawDialog.open}
            onClose={() => setWithdrawDialog({ ...withdrawDialog, open: false })}
            onWithdrawUser={handleWithdrawUser}
            user={{
              userId: withdrawDialog.userId,
              name: withdrawDialog.userName
            }}
          />
        </GlassPaper>
      </Container>
    </Fade>
  );
};

export default ClassDetail;
