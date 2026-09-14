import React, { useState, useMemo } from 'react';
import {
  Box,
  TextField,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Chip,
  Stack,
  Button,
  Typography,
  Fade,
  Pagination,
  Paper
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import PeopleIcon from '@mui/icons-material/People';
import { FONT_FAMILY } from '../../../../constants/uiConstants';
// GlassPaper 중복 적용을 피하기 위해 이 탭 내부에서는 사용하지 않음

/**
 * 학생 목록 탭 컴포넌트
 * 학생 검색, 정렬, 관리 기능 제공
 */
const StudentsTab = ({
  students,
  searchQuery,
  onSearchChange,
  sort,
  onToggleSort,
  onWithdrawUser,
  onPromoteStudent,
  userRole
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // 페이지네이션 계산
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return students.slice(startIndex, endIndex);
  }, [students, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(students.length / itemsPerPage);

  // 페이지 변경 핸들러
  const handlePageChange = (event, page) => {
    setCurrentPage(page);
  };

  // 검색어 변경 시 첫 페이지로 리셋
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, students.length]);

  return (
    <Fade in={true} timeout={300}>
      <Box>
        {/* 검색 및 총 인원수 표시 */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <TextField
            size="small"
            placeholder="검색..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
            }}
            sx={{ width: '300px' }}
          />
          <Typography 
            variant="body2" 
            sx={{ 
              fontFamily: FONT_FAMILY,
              color: 'text.secondary',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            총 <strong>{students.length}명</strong>
            {searchQuery && (
              <>
                | 검색결과 <strong>{students.length}명</strong>
              </>
            )}
          </Typography>
        </Box>
        
        <TableContainer component={Paper} elevation={0} sx={{ border: 1, borderColor: 'divider', backgroundColor: 'transparent' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontFamily: FONT_FAMILY, fontWeight: 'bold', width: '60px' }}>
                  No.
                </TableCell>
                <TableCell sx={{ fontFamily: FONT_FAMILY, fontWeight: 'bold' }}>
                  학번
                  <IconButton size="small" onClick={() => onToggleSort('studentNum')} sx={{ ml: 1 }}>
                    <Box sx={{ 
                      transform: sort.field !== 'studentNum' ? 'rotate(0deg)' : (sort.order === 'asc' ? 'rotate(180deg)' : 'rotate(0deg)'),
                      transition: 'transform 0.2s ease-in-out',
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      <KeyboardArrowDownIcon fontSize="small" />
                    </Box>
                  </IconButton>
                </TableCell>
                <TableCell sx={{ fontFamily: FONT_FAMILY, fontWeight: 'bold' }}>
                  이름
                  <IconButton size="small" onClick={() => onToggleSort('name')} sx={{ ml: 1 }}>
                    <Box sx={{ 
                      transform: sort.field !== 'name' ? 'rotate(0deg)' : (sort.order === 'asc' ? 'rotate(180deg)' : 'rotate(0deg)'),
                      transition: 'transform 0.2s ease-in-out',
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      <KeyboardArrowDownIcon fontSize="small" />
                    </Box>
                  </IconButton>
                </TableCell>
                <TableCell sx={{ fontFamily: FONT_FAMILY, fontWeight: 'bold' }}>
                  이메일
                  <IconButton size="small" onClick={() => onToggleSort('email')} sx={{ ml: 1 }}>
                    <Box sx={{ 
                      transform: sort.field !== 'email' ? 'rotate(0deg)' : (sort.order === 'asc' ? 'rotate(180deg)' : 'rotate(0deg)'),
                      transition: 'transform 0.2s ease-in-out',
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      <KeyboardArrowDownIcon fontSize="small" />
                    </Box>
                  </IconButton>
                </TableCell>
                <TableCell align="right" sx={{ fontFamily: FONT_FAMILY, fontWeight: 'bold' }}>
                  작업
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedData.map((student, index) => {
                // 전체 목록에서의 실제 인덱스 계산
                const actualIndex = (currentPage - 1) * itemsPerPage + index;
                return (
                  <TableRow 
                    key={student.email}
                    sx={{ 
                      transition: 'all 0.3s ease',
                      animation: 'fadeIn 0.3s ease',
                      backgroundColor: theme => {
                        if (student.courseRole === 'PROFESSOR') {
                          return theme.palette.mode === 'dark' 
                            ? 'rgba(76, 175, 80, 0.08)' 
                            : 'rgba(76, 175, 80, 0.05)';
                        } else if (student.courseRole === 'ASSISTANT') {
                          return theme.palette.mode === 'dark' 
                            ? 'rgba(255, 167, 38, 0.08)' 
                            : 'rgba(255, 167, 38, 0.05)';
                        }
                        return 'transparent';
                      },
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
                    <TableCell sx={{ fontFamily: FONT_FAMILY, textAlign: 'center' }}>
                      {actualIndex + 1}
                    </TableCell>
                    <TableCell sx={{ fontFamily: FONT_FAMILY }}>
                      {student.studentNum}
                      {/* 교수 역할 표시 */}
                      {(student.courseRole === 'PROFESSOR') && (
                        <Chip
                          label="교수"
                          size="small"
                          sx={{ 
                            ml: 1,
                            height: '24px',
                            backgroundColor: '#4caf50',
                            color: '#fff',
                            fontWeight: 'bold',
                            '& .MuiChip-label': {
                              px: 1.5,
                              fontSize: '0.7rem',
                              fontFamily: FONT_FAMILY
                            }
                          }}
                        />
                      )}
                      {/* 조교 역할 표시 */}
                      {(student.courseRole === 'ASSISTANT') && (
                        <Chip
                          label="조교"
                          size="small"
                          sx={{ 
                            ml: 1,
                            height: '24px',
                            backgroundColor: '#ff9800',
                            color: '#fff',
                            fontWeight: 'bold',
                            '& .MuiChip-label': {
                              px: 1.5,
                              fontSize: '0.7rem',
                              fontFamily: FONT_FAMILY
                            }
                          }}
                        />
                      )}
                      {/* 관리자 역할 표시 */}
                      {(student.courseRole === 'ADMIN' || student.role === 'ADMIN') && (
                        <Chip
                          label="관리자"
                          size="small"
                          sx={{ 
                            ml: 1,
                            height: '24px',
                            backgroundColor: '#9c27b0',
                            color: '#fff',
                            fontWeight: 'bold',
                            '& .MuiChip-label': {
                              px: 1.5,
                              fontSize: '0.7rem',
                              fontFamily: FONT_FAMILY
                            }
                          }}
                        />
                      )}
                    </TableCell>
                    <TableCell sx={{ fontFamily: FONT_FAMILY }}>
                      {student.name}
                    </TableCell>
                    <TableCell sx={{ fontFamily: FONT_FAMILY }}>
                      {student.email}
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        {(userRole === 'PROFESSOR' || userRole === 'ADMIN') && 
                         student.courseRole !== 'PROFESSOR' && (
                          <Button
                            variant="outlined"
                            size="small"
                            color="error"
                            onClick={() => onWithdrawUser(student)}
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
                            탈퇴
                          </Button>
                        )}
                        
                        {(userRole === 'PROFESSOR' || userRole === 'ADMIN') && student.courseRole !== 'PROFESSOR' && (
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<PeopleIcon sx={{ fontSize: '1rem' }} />}
                            onClick={() => onPromoteStudent(student)}
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
                            권한 변경
                          </Button>
                        )}
                        
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {/* 페이지네이션 및 현재 페이지 정보 */}
        {totalPages > 1 && (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mt: 3,
            px: 1
          }}>
            <Typography 
              variant="body2" 
              sx={{ 
                fontFamily: FONT_FAMILY,
                color: 'text.secondary'
              }}
            >
              {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, students.length)} / {students.length}명
            </Typography>
            
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={handlePageChange}
              size="medium"
              showFirstButton
              showLastButton
              sx={{
                '& .MuiPaginationItem-root': {
                  fontFamily: FONT_FAMILY
                }
              }}
            />
          </Box>
        )}

        {students.length === 0 && (
          <Typography 
            sx={{ 
              mt: 2, 
              textAlign: 'center',
              fontFamily: FONT_FAMILY
            }}
          >
            {searchQuery ? '검색 결과가 없습니다.' : '등록된 사용자가 없습니다.'}
          </Typography>
        )}
      </Box>
    </Fade>
  );
};

export default StudentsTab;
