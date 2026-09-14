import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid
} from '@mui/material';
import { FONT_FAMILY } from '../../../../../constants/uiConstants';
import { GlassPaper } from '../../../../../components/ui';

/**
 * 과제 수정 다이얼로그 컴포넌트
 */
const EditAssignmentDialog = ({
  open,
  onClose,
  onEditAssignment,
  assignment = null,
  existingAssignments = []
}) => {
  const [loading, setLoading] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const reopenMode = assignment?.editMode === 'REOPEN';

  // assignment가 변경될 때마다 editingAssignment 업데이트
  useEffect(() => {
    if (assignment) {
      setEditingAssignment({
        ...assignment,
        originalAssignmentName: assignment.assignmentName
      });
    } else {
      setEditingAssignment(null);
    }
  }, [assignment]);

  // 과제명 중복 체크 함수
  const isAssignmentNameExists = (name) => {
    return existingAssignments.some(existingAssignment =>
      existingAssignment.assignmentName === name
    );
  };

  // 다이얼로그 닫기
  const handleClose = () => {
    setEditingAssignment(null);
    onClose();
  };

  // 과제 수정 처리
  const handleEditAssignment = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await onEditAssignment(editingAssignment);
      handleClose();
    } catch (error) {
      //console.error('과제 수정 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 폼 유효성 검사
  const isFormValid = () => {
    if (!editingAssignment) return false;

    if (reopenMode) {
      return editingAssignment.deadlineDate &&
        new Date(editingAssignment.deadlineDate) > new Date();
    }
    return (
      editingAssignment.assignmentName?.trim() &&
      editingAssignment.kickoffDate &&
      editingAssignment.deadlineDate &&
      new Date(editingAssignment.kickoffDate) < new Date(editingAssignment.deadlineDate) &&
      !(isAssignmentNameExists(editingAssignment.assignmentName) &&
        editingAssignment.assignmentName !== editingAssignment.originalAssignmentName)
    );
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperComponent={GlassPaper}
      PaperProps={{
        sx: {
          minHeight: '500px'
        }
      }}
    >
      <DialogTitle
        sx={{
          fontFamily: FONT_FAMILY,
          fontSize: '1.5rem',
          py: 3
        }}
      >
        {reopenMode ? '과제 다시 열기' : '과제 수정'}
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="과제명"
              value={editingAssignment?.assignmentName || ''}
              disabled={reopenMode}
              onChange={(e) => setEditingAssignment({
                ...editingAssignment,
                assignmentName: e.target.value
              })}
              error={isAssignmentNameExists(editingAssignment?.assignmentName) &&
                     editingAssignment?.assignmentName !== editingAssignment?.originalAssignmentName}
              helperText={isAssignmentNameExists(editingAssignment?.assignmentName) &&
                         editingAssignment?.assignmentName !== editingAssignment?.originalAssignmentName ?
                "이미 존재하는 과제명입니다" : ""}
              sx={{
                '& .MuiInputBase-root': {
                  height: '56px'
                }
              }}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="과제 설명 (선택)"
              value={editingAssignment?.assignmentDescription || ''}
              disabled={reopenMode}
              onChange={(e) => setEditingAssignment({
                ...editingAssignment,
                assignmentDescription: e.target.value
              })}
              multiline
              rows={4}
              placeholder="과제에 대한 설명을 입력하세요"
            />
          </Grid>

          <Grid item xs={6}>
            <TextField
              fullWidth
              label="시작 일시"
              type="datetime-local"
              value={editingAssignment?.kickoffDate || ''}
              disabled={reopenMode}
              onChange={(e) => setEditingAssignment({
                ...editingAssignment,
                kickoffDate: e.target.value
              })}
              InputLabelProps={{
                shrink: true,
              }}
              inputProps={{
                step: 60,
                style: {
                  height: '24px',
                  padding: '12px'
                }
              }}
              error={!editingAssignment?.kickoffDate}
              helperText={!editingAssignment?.kickoffDate ?
                "시작 일시를 선택해주세요" : ""}
              sx={{
                '& .MuiInputBase-root': {
                  height: '56px'
                }
              }}
            />
          </Grid>

          <Grid item xs={6}>
            <TextField
              fullWidth
              label="마감 일시"
              type="datetime-local"
              value={editingAssignment?.deadlineDate || ''}
              onChange={(e) => setEditingAssignment({
                ...editingAssignment,
                deadlineDate: e.target.value
              })}
              InputLabelProps={{
                shrink: true,
              }}
              inputProps={{
                step: 60,
                style: {
                  height: '24px',
                  padding: '12px'
                }
              }}
              error={
                (!editingAssignment?.deadlineDate) ||
                (reopenMode
                  ? new Date(editingAssignment?.deadlineDate) <= new Date()
                  : (editingAssignment?.kickoffDate && editingAssignment?.deadlineDate &&
                    new Date(editingAssignment.kickoffDate) >= new Date(editingAssignment.deadlineDate)))
              }
              helperText={
                !editingAssignment?.deadlineDate ?
                  "마감 일시를 선택해주세요" :
                  (reopenMode && new Date(editingAssignment.deadlineDate) <= new Date() ?
                    "새 마감일시는 현재보다 나중이어야 합니다" :
                    (editingAssignment?.kickoffDate && editingAssignment?.deadlineDate &&
                    new Date(editingAssignment.kickoffDate) >= new Date(editingAssignment.deadlineDate) ?
                    "마감일시는 시작일시보다 나중이어야 합니다" : ""))
              }
              sx={{
                '& .MuiInputBase-root': {
                  height: '56px'
                }
              }}
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button
          onClick={handleClose}
          variant="outlined"
          size="small"
          sx={{
            fontFamily: FONT_FAMILY,
            fontSize: '0.75rem',
            py: 0.5,
            px: 1.5,
            minHeight: '28px',
            borderRadius: '14px',
            textTransform: 'none'
          }}
        >
          취소
        </Button>
        <Button
          onClick={handleEditAssignment}
          variant="contained"
          size="small"
          disabled={loading || !isFormValid()}
          sx={{
            fontFamily: FONT_FAMILY,
            fontSize: '0.75rem',
            py: 0.5,
            px: 1.5,
            minHeight: '28px',
            borderRadius: '14px',
            textTransform: 'none'
          }}
        >
          {reopenMode ? '다시 열기' : '수정'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditAssignmentDialog;
