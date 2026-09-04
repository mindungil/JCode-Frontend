export const getCourseRole = (course, user) => {
  if (user?.role === 'ADMIN') return 'ADMIN';
  return course?.courseRole || null;
};

export const canViewCourseStudents = (course, user) =>
  ['ADMIN', 'PROFESSOR', 'ASSISTANT'].includes(getCourseRole(course, user));

export const canManageCourse = (course, user) =>
  ['ADMIN', 'PROFESSOR'].includes(getCourseRole(course, user));

export const isCourseStudent = (course, user) =>
  getCourseRole(course, user) === 'STUDENT';

export const getMemberCourseRole = member =>
  member?.role === 'ADMIN' ? 'ADMIN' : member?.courseRole || null;
