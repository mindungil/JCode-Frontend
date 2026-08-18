import React, { useEffect, useState } from 'react';
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Typography
} from '@mui/material';
import { GlassPaper } from '../../../../../components/ui';

const StarterCodeDialog = ({ open, assignment, onClose, onUpload }) => {
  const [file, setFile] = useState(null);
  const [overwritePolicy, setOverwritePolicy] = useState('PRESERVE_EXISTING');
  const [deployNow, setDeployNow] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setFile(null);
    setOverwritePolicy('PRESERVE_EXISTING');
    setDeployNow(true);
  }, [assignment]);

  const submit = async () => {
    if (!file || loading) return;
    setLoading(true);
    try {
      await onUpload(assignment, file, overwritePolicy, deployNow);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" PaperComponent={GlassPaper}>
      <DialogTitle>새 스타터 버전</DialogTitle>
      <DialogContent>
        <Typography sx={{ mb: 2 }}>
          {assignment?.assignmentName}의 현재 버전은 v{assignment?.starterVersion || 0}입니다.
        </Typography>
        <Button component="label" variant="outlined" fullWidth sx={{ mb: 2 }}>
          {file ? file.name : 'ZIP 파일 선택'}
          <input hidden type="file" accept=".zip,application/zip" onChange={(event) => setFile(event.target.files?.[0] || null)} />
        </Button>
        <FormControl fullWidth sx={{ mb: 1 }}>
          <InputLabel>배포 방식</InputLabel>
          <Select value={overwritePolicy} label="배포 방식" onChange={(event) => setOverwritePolicy(event.target.value)}>
            <MenuItem value="PRESERVE_EXISTING">학생 파일 유지</MenuItem>
            <MenuItem value="REPLACE_ALL">과제 폴더 전체 교체 (학생 파일 삭제)</MenuItem>
          </Select>
        </FormControl>
        <FormControlLabel
          control={<Checkbox checked={deployNow} onChange={(event) => setDeployNow(event.target.checked)} />}
          label="현재 학생에게 바로 배포"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>취소</Button>
        <Button variant="contained" disabled={!file || loading} onClick={submit}>저장</Button>
      </DialogActions>
    </Dialog>
  );
};

export default StarterCodeDialog;
