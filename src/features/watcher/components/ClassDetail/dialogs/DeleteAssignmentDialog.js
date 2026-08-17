import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  TextField
} from '@mui/material';
import { FONT_FAMILY } from '../../../../../constants/uiConstants';
import { GlassPaper } from '../../../../../components/ui';

/**
 * 과제 삭제 확인 다이얼로그 컴포넌트
 */
const DeleteAssignmentDialog = ({ 
  open, 
  onClose, 
  onDeleteAssignment, 
  assignment = null 
}) => {
  
  // 다이얼로그 닫기
  const handleClose = () => {
    onClose();
  };

  const [loading, setLoading] = useState(false);
  const [retentionDays, setRetentionDays] = useState(90);

  useEffect(() => {
    setRetentionDays(assignment?.archiveRetentionDays || 90);
  }, [assignment]);

  // 과제 삭제 처리
  const handleDeleteAssignment = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await onDeleteAssignment({ ...assignment, archiveRetentionDays: retentionDays });
      handleClose();
    } catch (error) {
      //console.error('과제 삭제 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperComponent={GlassPaper}
    >
      <DialogTitle sx={{ 
        fontFamily: FONT_FAMILY,
        fontSize: '1.25rem',
        py: 3
      }}>
        과제 보관 확인
      </DialogTitle>
      
      <DialogContent>
        <Typography sx={{ fontFamily: FONT_FAMILY }}>
          "{assignment?.assignmentName}" 과제를 보관하시겠습니까?
          <br />
          신규 IDE 진입과 스타터 배포가 차단되고 학생 파일은 보관 경로로 이동합니다.
        </Typography>
        <TextField
          fullWidth
          type="number"
          label="보관 기간(일)"
          value={retentionDays}
          inputProps={{ min: 1, max: 3650 }}
          onChange={(e) => setRetentionDays(Math.max(1, Math.min(3650, Number(e.target.value))))}
          sx={{ mt: 2 }}
        />
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
          onClick={handleDeleteAssignment}
          variant="contained"
          color="error"
          size="small"
          disabled={loading}
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
          보관
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteAssignmentDialog;
