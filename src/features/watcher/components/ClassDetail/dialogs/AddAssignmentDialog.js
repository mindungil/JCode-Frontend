import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import { FONT_FAMILY } from '../../../../../constants/uiConstants';
import { GlassPaper } from '../../../../../components/ui';

/**
 * 과제 추가 다이얼로그 컴포넌트
 */
const AddAssignmentDialog = ({
  open,
  onClose,
  onAddAssignment,
  existingAssignments = []
}) => {
  const [loading, setLoading] = useState(false);
  const [starterFile, setStarterFile] = useState(null);
  const [newAssignment, setNewAssignment] = useState({
    assignmentName: '',
    assignmentDescription: '',
    kickoffDate: '',
    deadlineDate: '',
    archiveRetentionDays: 90,
    starterOverwritePolicy: 'PRESERVE_EXISTING',
    deployStarterNow: true
  });

  // 과제명 중복 체크
  const isAssignmentNameExists = (name) => {
    return existingAssignments.some(assignment =>
      assignment.assignmentName === name
    );
  };

  // 폼 초기화
  const resetForm = () => {
    setNewAssignment({
      assignmentName: '',
      assignmentDescription: '',
      kickoffDate: '',
      deadlineDate: '',
      archiveRetentionDays: 90,
      starterOverwritePolicy: 'PRESERVE_EXISTING',
      deployStarterNow: true
    });
    setStarterFile(null);
  };

  // 다이얼로그 닫기
  const handleClose = () => {
    resetForm();
    onClose();
  };

  // 과제 추가 처리
  const handleAddAssignment = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await onAddAssignment(newAssignment, starterFile);
      resetForm();
      onClose();
    } catch (error) {
      //console.error('과제 추가 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 폼 유효성 검사
  const isFormValid = () => {
    return (
      newAssignment.assignmentName.trim() &&
      newAssignment.kickoffDate &&
      newAssignment.deadlineDate &&
      new Date(newAssignment.kickoffDate) < new Date(newAssignment.deadlineDate) &&
      !isAssignmentNameExists(newAssignment.assignmentName)
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
        새 과제 추가
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mb: 3, p: 2, bgcolor: 'info.light', borderRadius: 1, color: 'info.contrastText' }}>
          <Typography sx={{
            fontFamily: FONT_FAMILY,
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            <Box component="span" sx={{ fontWeight: 'bold' }}>안내:</Box>
            과제 폴더는 변경되지 않는 내부 식별자로 관리되며, 과제명은 나중에 수정할 수 있습니다.
          </Typography>
        </Box>

        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="과제명"
              value={newAssignment.assignmentName}
              onChange={(e) => setNewAssignment({
                ...newAssignment,
                assignmentName: e.target.value
              })}
              error={isAssignmentNameExists(newAssignment.assignmentName)}
              helperText={isAssignmentNameExists(newAssignment.assignmentName) ?
                "이미 존재하는 과제명입니다" : ""}
              placeholder="예: 정렬 알고리즘, Linked List 구현"
              sx={{
                '& .MuiInputBase-root': {
                  height: '56px'
                }
              }}
            />
          </Grid>

          {starterFile && (
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>재배포 방식</InputLabel>
                <Select
                  label="재배포 방식"
                  value={newAssignment.starterOverwritePolicy}
                  onChange={(e) => setNewAssignment({ ...newAssignment, starterOverwritePolicy: e.target.value })}
                >
                  <MenuItem value="PRESERVE_EXISTING">학생 파일 유지</MenuItem>
                  <MenuItem value="REPLACE_ALL">과제 폴더 전체 교체 (학생 파일 삭제)</MenuItem>
                </Select>
              </FormControl>
              <FormControlLabel
                control={<Checkbox checked={newAssignment.deployStarterNow} onChange={(e) => setNewAssignment({ ...newAssignment, deployStarterNow: e.target.checked })} />}
                label="현재 학생에게 바로 배포"
              />
            </Grid>
          )}

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label="보관 기간(일)"
              value={newAssignment.archiveRetentionDays}
              inputProps={{ min: 1, max: 3650 }}
              onChange={(e) => setNewAssignment({ ...newAssignment, archiveRetentionDays: Number(e.target.value) })}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="과제 설명 (선택)"
              value={newAssignment.assignmentDescription}
              onChange={(e) => setNewAssignment({
                ...newAssignment,
                assignmentDescription: e.target.value
              })}
              multiline
              rows={4}
              placeholder="과제에 대한 설명을 입력하세요"
            />
          </Grid>

          <Grid item xs={12}>
            <Button
              variant="outlined"
              component="label"
              size="small"
              sx={{
                fontFamily: FONT_FAMILY,
                textTransform: 'none',
                borderRadius: '14px'
              }}
            >
              {starterFile ? `스타터 코드: ${starterFile.name}` : '스타터 코드 업로드 (선택, .zip)'}
              <input
                type="file"
                accept=".zip"
                hidden
                onChange={(e) => setStarterFile(e.target.files[0] || null)}
              />
            </Button>
            {starterFile && (
              <Button
                size="small"
                onClick={() => setStarterFile(null)}
                sx={{ ml: 1, fontSize: '0.7rem' }}
              >
                제거
              </Button>
            )}
          </Grid>

          <Grid item xs={6}>
            <TextField
              fullWidth
              label="시작 일시"
              type="datetime-local"
              value={newAssignment.kickoffDate}
              onChange={(e) => setNewAssignment({
                ...newAssignment,
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
              error={!newAssignment.kickoffDate && newAssignment.assignmentName.trim() !== ''}
              helperText={!newAssignment.kickoffDate && newAssignment.assignmentName.trim() !== '' ?
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
              value={newAssignment.deadlineDate}
              onChange={(e) => setNewAssignment({
                ...newAssignment,
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
                (!newAssignment.deadlineDate && newAssignment.assignmentName.trim() !== '') ||
                (newAssignment.kickoffDate && newAssignment.deadlineDate &&
                new Date(newAssignment.kickoffDate) >= new Date(newAssignment.deadlineDate))
              }
              helperText={
                !newAssignment.deadlineDate && newAssignment.assignmentName.trim() !== '' ?
                  "마감 일시를 선택해주세요" :
                  (newAssignment.kickoffDate && newAssignment.deadlineDate &&
                  new Date(newAssignment.kickoffDate) >= new Date(newAssignment.deadlineDate) ?
                  "마감일시는 시작일시보다 나중이어야 합니다" : "")
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
          onClick={handleAddAssignment}
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
          추가
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddAssignmentDialog;
