import {
  canManageCourse,
  canViewCourseStudents,
  getCourseRole,
  getMemberCourseRole,
} from './coursePermissions';

describe('course permissions', () => {
  const studentUser = { role: 'STUDENT', assistantCourses: [39] };

  test('uses the current course membership instead of any assistant course hint', () => {
    const studentCourse = { courseId: 52, courseRole: 'STUDENT' };

    expect(getCourseRole(studentCourse, studentUser)).toBe('STUDENT');
    expect(canViewCourseStudents(studentCourse, studentUser)).toBe(false);
  });

  test('grants assistant capabilities only in the assistant course', () => {
    const assistantCourse = { courseId: 39, courseRole: 'ASSISTANT' };

    expect(canViewCourseStudents(assistantCourse, studentUser)).toBe(true);
    expect(canManageCourse(assistantCourse, studentUser)).toBe(false);
  });

  test('prefers a member course role over the global account role', () => {
    expect(getMemberCourseRole({ role: 'PROFESSOR', courseRole: 'STUDENT' })).toBe('STUDENT');
    expect(getMemberCourseRole({ role: 'PROFESSOR' })).toBeNull();
  });

  test('keeps global admin as an explicit system-wide override', () => {
    expect(getCourseRole({ courseRole: 'STUDENT' }, { role: 'ADMIN' })).toBe('ADMIN');
  });
});
