import { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import { createStringSort } from '../../../utils/sortHelpers';
import { getMemberCourseRole } from '../utils/coursePermissions';

export const useStudentManagement = (students = [], userRole = null, isDarkMode = false) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sort, setSort] = useState({
    field: 'name',
    order: 'asc'
  });

  // 정렬 토글 함수
  const toggleSort = (field) => {
    setSort(prev => ({
      field: field,
      order: prev.field === field ? (prev.order === 'asc' ? 'desc' : 'asc') : 'asc'
    }));
  };

  // 필터링 및 정렬된 학생 목록
  const filteredAndSortedStudents = useMemo(() => {
    // 학생만 필터링 (교수/조교/관리자 제외)
    const filtered = students.filter(student => {
      if (['PROFESSOR', 'ASSISTANT', 'ADMIN'].includes(getMemberCourseRole(student))) {
        return false;
      }
      
      // 검색어 필터링
      if (!searchQuery.trim()) return true;
      
      const searchLower = searchQuery.toLowerCase();
      return (
        (student.email && student.email.toLowerCase().includes(searchLower)) ||
        (student.name && student.name.toLowerCase().includes(searchLower)) ||
        (student.studentNum && String(student.studentNum).toLowerCase().includes(searchLower))
      );
    });
    
    // 정렬
    const fieldMapping = {
      'name': 'name',
      'email': 'email', 
      'studentNum': 'studentNum'
    };
    
    const fieldToSort = fieldMapping[sort.field] || 'name';
    const sortFunction = createStringSort(fieldToSort, sort.order === 'asc');
    
    return filtered.sort(sortFunction);
  }, [students, searchQuery, sort]);

  // Watcher 리다이렉션 핸들러
  const handleWatcherRedirect = (student, courseId, assignmentId) => {
    if (!student || !student.userId) {
      //console.error('학생 정보가 없어 Watcher로 이동할 수 없습니다.');
      toast.error('학생 정보가 불완전합니다.');
      return;
    }

    const watcherUrl = `/watcher/class/${courseId}/assignment/${assignmentId}/monitoring/${student.userId}`;
    window.open(watcherUrl, '_blank');
  };

  // 검색어 초기화
  const clearSearch = () => {
    setSearchQuery('');
  };

  // 정렬 초기화
  const resetSort = () => {
    setSort({
      field: 'name',
      order: 'asc'
    });
  };

  return {
    // 상태
    searchQuery,
    sort,
    
    // 계산된 값
    filteredAndSortedStudents,
    studentCount: filteredAndSortedStudents.length,
    
    // 액션
    setSearchQuery,
    toggleSort,
    handleWatcherRedirect,
    clearSearch,
    resetSort
  };
};
