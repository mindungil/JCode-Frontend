export const findAcceptedCourse = (courses, knownCourseIds, classData) => courses.find(course =>
  !knownCourseIds.has(course.courseId)
  && (course.name || course.courseName)?.trim() === classData.name.trim()
  && Number(course.clss ?? course.courseClss) === Number(classData.clss)
  && Number(course.year ?? course.courseYear) === Number(classData.year)
  && Number(course.term ?? course.courseTerm) === Number(classData.term)
  && course.status !== 'ARCHIVED'
);
