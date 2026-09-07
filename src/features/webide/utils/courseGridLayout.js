const ACTION_SLOT_INDEX = 2;

export const canCreateCourseForRole = (role) => ['PROFESSOR', 'ADMIN'].includes(role);

export const getCourseGridOrder = (courseIndex) => (
  courseIndex < ACTION_SLOT_INDEX ? courseIndex : courseIndex + 1
);

export const getCourseActionGridOrder = (courseCount) => (
  Math.min(Math.max(courseCount, 0), ACTION_SLOT_INDEX)
);
