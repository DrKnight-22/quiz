"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { collection, addDoc, getDocs, query, where, doc, updateDoc, deleteDoc } from "firebase/firestore"
import { toast } from "react-hot-toast"
import { db } from "../../firebase/config"
import { useAuth } from "../../context/AuthContext"
import DashboardLayout from "../../components/layout/DashboardLayout"
import Button from "../../components/ui/Button"
import Input from "../../components/ui/Input"
import { Plus, Trash2, FilePlus, Save, Eye, Clock, BookOpen, Edit, X, Users, RefreshCw } from "lucide-react"

const CreateQuiz = () => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm()
  const { currentUser } = useAuth()
  const [courses, setCourses] = useState([])
  const [questions, setQuestions] = useState([{ text: "", options: ["", "", "", ""], correctAnswer: 0 }])
  const [loading, setLoading] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState("")
  const [createdQuizzes, setCreatedQuizzes] = useState([])
  const [activeTab, setActiveTab] = useState("create") // 'create' or 'view'
  const [editingQuiz, setEditingQuiz] = useState(null)
  const [deletingQuiz, setDeletingQuiz] = useState(null)

  // Fetch courses taught by the teacher and existing quizzes
  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return

      try {
        // Fetch courses
        const coursesQuery = query(collection(db, "courses"), where("teacherId", "==", currentUser.uid))
        const coursesSnapshot = await getDocs(coursesQuery)
        const coursesData = coursesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))

        setCourses(coursesData)

        // Set the first course as selected by default
        if (coursesData.length > 0 && !selectedCourse) {
          setSelectedCourse(coursesData[0].id)
        }

        // Fetch quizzes created by this teacher
        const quizzesQuery = query(collection(db, "quizzes"), where("teacherId", "==", currentUser.uid))
        const quizzesSnapshot = await getDocs(quizzesQuery)
        const quizzesData = quizzesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))

        setCreatedQuizzes(quizzesData)
      } catch (error) {
        console.error("Error fetching data:", error)
        toast.error("Failed to load data")
      }
    }

    fetchData()
  }, [currentUser])

  // Update existing quiz to include enrolled students
  const updateQuizEnrollment = async (quizId) => {
    try {
      const quiz = createdQuizzes.find((q) => q.id === quizId)
      if (!quiz) return

      // Get enrolled students for this course
      const enrollmentsQuery = query(
        collection(db, "enrollments"),
        where("courseId", "==", quiz.courseId),
        where("status", "==", "approved"),
      )
      const enrollmentsSnapshot = await getDocs(enrollmentsQuery)
      const enrolledStudents = enrollmentsSnapshot.docs.map((doc) => doc.data().studentId)

      // Update quiz with enrolled students
      const quizRef = doc(db, "quizzes", quizId)
      await updateDoc(quizRef, {
        enrolledStudents: enrolledStudents,
        updatedAt: new Date().toISOString(),
      })

      // Update local state
      setCreatedQuizzes((prev) => prev.map((q) => (q.id === quizId ? { ...q, enrolledStudents: enrolledStudents } : q)))

      toast.success(`Quiz updated with ${enrolledStudents.length} enrolled students!`)
    } catch (error) {
      console.error("Error updating quiz enrollment:", error)
      toast.error("Failed to update quiz enrollment")
    }
  }

  // Handle question changes
  const handleQuestionChange = (index, field, value) => {
    const updatedQuestions = [...questions]

    if (field === "text") {
      updatedQuestions[index].text = value
    } else if (field.startsWith("option")) {
      const optionIndex = Number.parseInt(field.replace("option", ""), 10)
      updatedQuestions[index].options[optionIndex] = value
    } else if (field === "correctAnswer") {
      updatedQuestions[index].correctAnswer = Number.parseInt(value, 10)
    }

    setQuestions(updatedQuestions)
  }

  // Add a new question
  const addQuestion = () => {
    setQuestions([...questions, { text: "", options: ["", "", "", ""], correctAnswer: 0 }])
  }

  // Remove a question
  const removeQuestion = (index) => {
    if (questions.length <= 1) {
      toast.error("At least one question is required")
      return
    }

    const updatedQuestions = [...questions]
    updatedQuestions.splice(index, 1)
    setQuestions(updatedQuestions)
  }

  // Start editing a quiz
  const startEditingQuiz = (quiz) => {
    setEditingQuiz(quiz)
    setActiveTab("create")
    setSelectedCourse(quiz.courseId)
    setQuestions(quiz.questions || [{ text: "", options: ["", "", "", ""], correctAnswer: 0 }])

    // Reset form with quiz data
    reset({
      title: quiz.title,
      description: quiz.description || "",
      dueDate: quiz.dueDate ? quiz.dueDate.split("T")[0] : "",
      timeLimit: quiz.timeLimit || "",
    })
  }

  // Cancel editing
  const cancelEditing = () => {
    setEditingQuiz(null)
    reset()
    setQuestions([{ text: "", options: ["", "", "", ""], correctAnswer: 0 }])
    setSelectedCourse(courses.length > 0 ? courses[0].id : "")
  }

  // Delete quiz
  const deleteQuiz = async (quizId) => {
    if (!quizId) return

    setDeletingQuiz(quizId)

    try {
      await deleteDoc(doc(db, "quizzes", quizId))

      // Remove from local state
      setCreatedQuizzes((prev) => prev.filter((quiz) => quiz.id !== quizId))

      toast.success("Quiz deleted successfully!")
    } catch (error) {
      console.error("Error deleting quiz:", error)
      toast.error("Failed to delete quiz")
    } finally {
      setDeletingQuiz(null)
    }
  }

  // Handle form submission (create or update)
  const onSubmit = async (data) => {
    if (!selectedCourse) {
      toast.error("Please select a course")
      return
    }

    // Validate that all questions have text and options
    const invalidQuestions = questions.some(
      (question) => !question.text.trim() || question.options.some((option) => !option.trim()),
    )

    if (invalidQuestions) {
      toast.error("All questions and options must be filled out")
      return
    }

    setLoading(true)

    try {
      // Find the selected course
      const selectedCourseData = courses.find((course) => course.id === selectedCourse)

      // Get enrolled students for this course
      const enrollmentsQuery = query(
        collection(db, "enrollments"),
        where("courseId", "==", selectedCourse),
        where("status", "==", "approved"),
      )
      const enrollmentsSnapshot = await getDocs(enrollmentsQuery)
      const enrolledStudents = enrollmentsSnapshot.docs.map((doc) => doc.data().studentId)

      console.log(`Found ${enrolledStudents.length} enrolled students for course ${selectedCourse}`)

      // Create quiz document
      const quizData = {
        title: data.title,
        description: data.description,
        courseId: selectedCourse,
        courseName: selectedCourseData?.name || "Unknown Course",
        teacherId: currentUser.uid,
        teacherName: currentUser.displayName || currentUser.email,
        questions: questions.map((question) => ({
          text: question.text,
          options: question.options,
          correctAnswer: question.correctAnswer,
        })),
        dueDate: data.dueDate || null,
        timeLimit: data.timeLimit ? Number.parseInt(data.timeLimit) : null,
        isPublished: true,
        enrolledStudents: enrolledStudents,
      }

      if (editingQuiz) {
        // Update existing quiz
        quizData.updatedAt = new Date().toISOString()
        await updateDoc(doc(db, "quizzes", editingQuiz.id), quizData)

        // Update local state
        setCreatedQuizzes((prev) =>
          prev.map((quiz) =>
            quiz.id === editingQuiz.id ? { id: editingQuiz.id, ...quizData, createdAt: quiz.createdAt } : quiz,
          ),
        )

        toast.success("Quiz updated successfully!")
        setEditingQuiz(null)
      } else {
        // Create new quiz
        quizData.createdAt = new Date().toISOString()
        const docRef = await addDoc(collection(db, "quizzes"), quizData)

        // Add the new quiz to the createdQuizzes state
        setCreatedQuizzes((prev) => [
          {
            id: docRef.id,
            ...quizData,
          },
          ...prev,
        ])

        toast.success(`Quiz created successfully with ${enrolledStudents.length} enrolled students!`)
      }

      // Reset form
      reset()
      setQuestions([{ text: "", options: ["", "", "", ""], correctAnswer: 0 }])
      setSelectedCourse(courses.length > 0 ? courses[0].id : "")
    } catch (error) {
      console.error("Error saving quiz:", error)
      toast.error(`Failed to ${editingQuiz ? "update" : "create"} quiz`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout title="Manage Quizzes">
      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-soft p-6 animate-fade-in">
        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            className={`py-2 px-4 font-medium ${activeTab === "create" ? "text-primary-600 border-b-2 border-primary-600" : "text-gray-500"}`}
            onClick={() => setActiveTab("create")}
          >
            {editingQuiz ? "Edit Quiz" : "Create New Quiz"}
          </button>
          <button
            className={`py-2 px-4 font-medium ${activeTab === "view" ? "text-primary-600 border-b-2 border-primary-600" : "text-gray-500"}`}
            onClick={() => setActiveTab("view")}
          >
            My Quizzes ({createdQuizzes.length})
          </button>
        </div>

        {activeTab === "create" ? (
          <>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <FilePlus size={24} className="text-primary-600 mr-2" />
                <h2 className="text-xl font-semibold text-gray-800">{editingQuiz ? "Edit Quiz" : "Create New Quiz"}</h2>
              </div>
              {editingQuiz && (
                <Button type="button" variant="outline" onClick={cancelEditing} className="flex items-center">
                  <X size={18} className="mr-1" />
                  Cancel Edit
                </Button>
              )}
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <Input
                  label="Quiz Title"
                  placeholder="Introduction to Mathematics"
                  {...register("title", { required: "Quiz title is required" })}
                  error={errors.title?.message}
                />

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Course</label>
                  <select
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                  >
                    <option value="" disabled>
                      Select a course
                    </option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.name || "Untitled Course"}
                      </option>
                    ))}
                  </select>
                  {courses.length === 0 && (
                    <p className="mt-1 text-sm text-warning-600">No courses found. Please create a course first.</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <Input
                  label="Quiz Description (Optional)"
                  placeholder="This quiz covers the basics of algebra and geometry"
                  {...register("description")}
                />

                <Input
                  label="Time Limit (minutes)"
                  type="number"
                  placeholder="30"
                  {...register("timeLimit")}
                  min="1"
                  max="180"
                />
              </div>

              <div className="mb-6">
                <Input label="Due Date (Optional)" type="date" {...register("dueDate")} />
              </div>

              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-700">Quiz Questions</h3>
                  <Button type="button" variant="outline" onClick={addQuestion} className="flex items-center">
                    <Plus size={18} className="mr-1" />
                    Add Question
                  </Button>
                </div>

                {questions.map((question, qIndex) => (
                  <div key={qIndex} className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="text-md font-medium text-gray-700">Question {qIndex + 1}</h4>
                      <button
                        type="button"
                        onClick={() => removeQuestion(qIndex)}
                        className="text-error-600 hover:text-error-800"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    <div className="mb-4">
                      <Input
                        label="Question Text"
                        placeholder="What is 2 + 2?"
                        value={question.text}
                        onChange={(e) => handleQuestionChange(qIndex, "text", e.target.value)}
                      />
                    </div>

                    <div className="mb-4">
                      <p className="block text-sm font-medium text-gray-700 mb-2">Answer Options</p>
                      {question.options.map((option, oIndex) => (
                        <div key={oIndex} className="flex items-center mb-2">
                          <input
                            type="radio"
                            name={`question-${qIndex}-correct`}
                            id={`question-${qIndex}-option-${oIndex}`}
                            checked={question.correctAnswer === oIndex}
                            onChange={() => handleQuestionChange(qIndex, "correctAnswer", oIndex)}
                            className="mr-2"
                          />
                          <Input
                            placeholder={`Option ${oIndex + 1}`}
                            value={option}
                            onChange={(e) => handleQuestionChange(qIndex, `option${oIndex}`, e.target.value)}
                            className="flex-1"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  className="flex items-center"
                  disabled={loading || courses.length === 0}
                >
                  {loading ? (
                    <>{editingQuiz ? "Updating..." : "Creating..."}</>
                  ) : (
                    <>
                      <Save size={18} className="mr-2" />
                      {editingQuiz ? "Update Quiz" : "Create Quiz"}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </>
        ) : (
          <div>
            <div className="flex items-center mb-6">
              <Eye size={24} className="text-primary-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-800">My Created Quizzes</h2>
            </div>

            {createdQuizzes.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500 mb-4">You haven't created any quizzes yet.</p>
                <Button variant="primary" onClick={() => setActiveTab("create")} className="flex items-center mx-auto">
                  <Plus size={18} className="mr-1" />
                  Create Your First Quiz
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {createdQuizzes.map((quiz) => (
                  <div
                    key={quiz.id}
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-800 flex-1 mr-2">{quiz.title}</h3>
                      <span
                        className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ${quiz.isPublished ? "bg-success-100 text-success-800" : "bg-warning-100 text-warning-800"}`}
                      >
                        {quiz.isPublished ? "Published" : "Draft"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{quiz.description || "No description"}</p>

                    <div className="flex items-center text-sm text-gray-500 mb-2">
                      <BookOpen size={14} className="mr-1" />
                      <span className="truncate">{quiz.courseName}</span>
                    </div>

                    <div className="flex items-center text-sm text-gray-500 mb-2">
                      <Users size={14} className="mr-1" />
                      <span>{quiz.enrolledStudents?.length || 0} enrolled students</span>
                    </div>

                    {quiz.timeLimit && (
                      <div className="flex items-center text-sm text-gray-500 mb-2">
                        <Clock size={14} className="mr-1" />
                        <span>{quiz.timeLimit} minutes</span>
                      </div>
                    )}

                    {quiz.dueDate && (
                      <div className="flex items-center text-sm text-gray-500 mb-3">
                        <Clock size={14} className="mr-1" />
                        <span>Due: {new Date(quiz.dueDate).toLocaleDateString()}</span>
                      </div>
                    )}

                    <div className="flex justify-between items-center text-sm mb-4">
                      <span className="text-gray-500">{quiz.questions?.length || 0} questions</span>
                      <span className="text-gray-500">{new Date(quiz.createdAt).toLocaleDateString()}</span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col space-y-2 pt-3 border-t border-gray-200">
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEditingQuiz(quiz)}
                          className="flex-1 flex items-center justify-center"
                          disabled={loading}
                        >
                          <Edit size={14} className="mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuizEnrollment(quiz.id)}
                          className="flex-1 flex items-center justify-center"
                          disabled={loading}
                        >
                          <RefreshCw size={14} className="mr-1" />
                          Update Students
                        </Button>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (
                            window.confirm("Are you sure you want to delete this quiz? This action cannot be undone.")
                          ) {
                            deleteQuiz(quiz.id)
                          }
                        }}
                        className="w-full flex items-center justify-center text-error-600 hover:text-error-800 border-error-200 hover:border-error-300"
                        disabled={deletingQuiz === quiz.id}
                      >
                        {deletingQuiz === quiz.id ? (
                          <>Deleting...</>
                        ) : (
                          <>
                            <Trash2 size={14} className="mr-1" />
                            Delete
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default CreateQuiz
