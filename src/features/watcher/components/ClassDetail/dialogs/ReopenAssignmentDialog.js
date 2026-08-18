import React, { useEffect, useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography } from '@mui/material';
import { GlassPaper } from '../../../../../components/ui';

const ReopenAssignmentDialog = ({ open, assignment, onClose, onReopen }) => {
  const [deadlineDate, setDeadlineDate] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setDeadlineDate('');
  }, [assignment]);

  const submit = async () => {
    if (!deadlineDate || new Date(deadlineDate) <= new Date()) return;
    setLoading(true);
    try {
      await onReopen(assignment, deadlineDate);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" PaperComponent={GlassPaper}>
      <DialogTitle>과제 다시 열기</DialogTitle>
      <DialogContent>
        <Typography sx={{ mb: 2 }}>
          최종 보관본을 학생 Workspace로 복원하고 새 마감 시각까지 쓰기를 허용합니다.
        </Typography>
        <TextField
          fullWidth
          type="datetime-local"
          label="새 마감 시각"
          value={deadlineDate}
          onChange={(event) => setDeadlineDate(event.target.value)}
          InputLabelProps={{ shrink: true }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>취소</Button>
        <Button variant="contained" disabled={loading || !deadlineDate || new Date(deadlineDate) <= new Date()} onClick={submit}>
          다시 열기
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReopenAssignmentDialog;
