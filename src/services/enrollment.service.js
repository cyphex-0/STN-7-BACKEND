const mongoose = require("mongoose");
const Enrollment = require("../models/Enrollment");
const Course = require("../models/Course");

const enrollCourse = async (studentId, courseId, batchId = null) => {
  const course = await Course.findById(courseId);
  if (!course) throw new Error("Course not found");

  // Check if already enrolled
  let enrollment = await Enrollment.findOne({
    student: studentId,
    course: courseId,
  });

  if (enrollment) {
    throw new Error("Already enrolled in this course");
  }

  // Validate and resolve batchId safely
  let validBatchId = null;
  if (batchId !== null && batchId !== undefined && batchId !== "") {
    if (mongoose.Types.ObjectId.isValid(batchId)) {
      validBatchId = batchId;
    } else if (course.batches && !isNaN(batchId) && course.batches[Number(batchId)]) {
      validBatchId = course.batches[Number(batchId)]._id || null;
    }
  }

  // Create new enrollment
  enrollment = await Enrollment.create({
    student: studentId,
    course: courseId,
    batchId: validBatchId,
    progress: { completedLessons: [], percent: 0 },
  });

  return enrollment;
};

const getMyEnrollments = async (studentId) => {
  return Enrollment.find({ student: studentId })
    .populate("course", "title instructorName price category tags")
    .sort({ createdAt: -1 });
};

const completeLesson = async (enrollId, lessonId) => {
  const enrollment = await Enrollment.findById(enrollId);
  if (!enrollment) throw new Error("Enrollment not found");

  const course = await Course.findById(enrollment.course);
  if (!course) throw new Error("Course not found");

  // Validate that lessonId belongs to the course syllabus
  const allLessonIds = (course.syllabus || []).flatMap((mod) =>
    (mod.lessons || []).map((les) => String(les._id))
  );

  const isValidLesson = allLessonIds.includes(String(lessonId));
  if (!isValidLesson) {
    throw new Error("Lesson does not belong to this course syllabus");
  }

  // avoid duplicates
  const alreadyDone = enrollment.progress.completedLessons
    .map(String)
    .includes(String(lessonId));

  if (!alreadyDone) {
    enrollment.progress.completedLessons.push(lessonId);
  }

  // calculate percent, counting only valid syllabus lessons and capping at 100%
  const validCompletedCount = enrollment.progress.completedLessons.filter((id) =>
    allLessonIds.includes(String(id))
  ).length;

  const totalLessons = allLessonIds.length;
  enrollment.progress.percent =
    totalLessons === 0 ? 0 : Math.min(100, Math.round((validCompletedCount / totalLessons) * 100));

  await enrollment.save();
  return enrollment;
};

module.exports = { enrollCourse, getMyEnrollments, completeLesson };
