"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { doc, getDoc, collection, addDoc, updateDoc, query, where, getDocs } from "firebase/firestore"
import { toast } from "react-hot-toast"
import { db } from "../../firebase/config"
import { useAuth } from "../../context/AuthContext"
import DashboardLayout from "../../components/layout/DashboardLayout"
import Button from "../../components/ui/Button"
import { FileQuestion, Clock, AlertTriangle, CheckCircle, ArrowLeft } from "lucide-react"

const TakeQuiz = () => {
  const { quizId } = useParams()
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const [quiz, setQuiz] = useState(null)
  const [answers, setAnswers] = useState({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(null)
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const [error, setError] = useState(null)

  // Fetch quiz data
  useEffect(() => {
    const fetchQuiz = async () => {
      if (!quizId || !currentUser) return

      try {
        setLoading(true)
        setError(null)

        console.log("Fetching quiz with ID:", quizId)

        // Get the quiz document
        const quizDoc = await getDoc(doc(db, "quizzes", quizId))

        if (!quizDoc.exists()) {
          console.log("Quiz not found")
          setError("Quiz not found")
          toast.error("Quiz not found")
          navigate("/student/quizzes")
          return
        }

        const quizData = quizDoc.data()
        console.log("Quiz data:", quizData)

        // Check if quiz is published
        if (!quizData.isPublished) {
          console.log("Quiz not published")
          setError("This quiz is not available")
          toast.error("This quiz is not available")
          navigate("/student/quizzes")
          return
        }

        // Check if student has already completed this quiz
        const resultsQuery = query(
          collection(db, "quizResults"),
          where("quizId", "==", quizId),
          where("studentId", "==", currentUser.uid),
        )
        const resultsSnapshot = await getDocs(resultsQuery)

        if (!resultsSnapshot.empty) {
          console.log("Quiz already completed")
          setError("You have already completed this quiz")
          toast.error("You have already completed this quiz")
          navigate("/student/results")
          return
        }

        // Check if quiz has due date and if it's passed
        const dueDate = quizData.dueDate ? new Date(quizData.dueDate) : null
        if (dueDate && dueDate < new Date()) {
          console.log("Quiz past due")
          setError("The due date for this quiz has passed")
          toast.error("The due date for this quiz has passed")
          navigate("/student/quizzes")
          return
        }

        // Check if student is enrolled in the course or quiz
        const enrollmentsQuery = query(
          collection(db, "enrollments"),
          where("studentId", "==", currentUser.uid),
          where("courseId", "==", quizData.courseId),
          where("status", "==", "approved"),
        )
        const enrollmentsSnapshot = await getDocs(enrollmentsQuery)

        const isEnrolledInCourse = !enrollmentsSnapshot.empty
        const isInQuizEnrollment = quizData.enrolledStudents?.includes(currentUser.uid)

        if (!isEnrolledInCourse && !isInQuizEnrollment) {
          console.log("Student not enrolled")
          setError("You are not enrolled in this course or quiz")
          toast.error("You are not enrolled in this course or quiz")
          navigate("/student/quizzes")
          return
        }

        // Set up the quiz
        const processedQuiz = {
          id: quizDoc.id,
          ...quizData,
          dueDate: dueDate,
        }

        console.log("Processed quiz:", processedQuiz)
        setQuiz(processedQuiz)

        // Initialize answers object
        const initialAnswers = {}
        if (quizData.questions && Array.isArray(quizData.questions)) {
          quizData.questions.forEach((_, index) => {
            initialAnswers[index] = null
          })
        }
        setAnswers(initialAnswers)

        // Set time limit if applicable
        if (quizData.timeLimit && quizData.timeLimit > 0) {
          setTimeRemaining(quizData.timeLimit * 60) // Convert minutes to seconds
        }

        setLoading(false)
      } catch (error) {
        console.error("Error fetching quiz:", error)
        setError("Failed to load quiz")
        toast.error("Failed to load quiz")
        setLoading(false)
      }
    }

    fetchQuiz()
  }, [quizId, currentUser, navigate])

  // Timer countdown
  useEffect(() => {
    let timer
    if (timeRemaining !== null && timeRemaining > 0 && !quizSubmitted) {
      timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            handleAutoSubmit()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => clearInterval(timer)
  }, [timeRemaining, quizSubmitted])

  // Handle auto-submit when time runs out
  const handleAutoSubmit = async () => {
    if (quizSubmitted) return

    toast("Time is up! Submitting your quiz...", { icon: "⏱️" })
    await submitQuiz()
  }

  // Handle answer selection
  const handleAnswerSelect = (questionIndex, optionIndex) => {
    setAnswers((prev) => ({
      ...prev,
      [questionIndex]: optionIndex,
    }))
  }

  // Format time remaining
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`
  }

  // Calculate score
  const calculateScore = () => {
    if (!quiz?.questions) return 0

    let correctAnswers = 0
    const totalQuestions = quiz.questions.length

    quiz.questions.forEach((question, index) => {
      if (answers[index] === question.correctAnswer) {
        correctAnswers += 1
      }
    })

    return Math.round((correctAnswers / totalQuestions) * 100)
  }

  // Submit quiz
  const submitQuiz = async () => {
    if (quizSubmitted || !quiz || !currentUser) return

    setSubmitting(true)

    try {
      const score = calculateScore()
      const correctAnswers = quiz.questions.filter(
        (question, index) => answers[index] === question.correctAnswer,
      ).length

      const quizResultData = {
        quizId: quiz.id,
        quizTitle: quiz.title,
        studentId: currentUser.uid,
        studentName: currentUser.displayName || currentUser.email,
        studentEmail: currentUser.email,
        teacherId: quiz.teacherId,
        courseId: quiz.courseId,
        courseName: quiz.courseName,
        score,
        answers,
        correctAnswers,
        totalQuestions: quiz.questions.length,
        questions: quiz.questions, // Store questions for detailed review
        submittedAt: new Date().toISOString(),
        timeSpent: quiz.timeLimit ? quiz.timeLimit * 60 - (timeRemaining || 0) : null,
      }

      await addDoc(collection(db, "quizResults"), quizResultData)

      setQuizSubmitted(true)
      toast.success("Quiz submitted successfully!")

      // Update the quiz with the student's ID if not already included
      if (!quiz.enrolledStudents?.includes(currentUser.uid)) {
        const quizRef = doc(db, "quizzes", quiz.id)
        await updateDoc(quizRef, {
          enrolledStudents: [...new Set([...(quiz.enrolledStudents || []), currentUser.uid])],
        })
      }
    } catch (error) {
      console.error("Error submitting quiz:", error)
      toast.error("Failed to submit quiz. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  // Check if all questions are answered
  const allQuestionsAnswered = () => {
    if (!quiz?.questions) return false
    return (
      Object.keys(answers).length === quiz.questions.length && Object.values(answers).every((answer) => answer !== null)
    )
  }

  // Render question options
  const renderOptions = (question, qIndex) => {
    if (!question.options || !Array.isArray(question.options)) {
      return <div className="text-red-500">Invalid question options</div>
    }

    return question.options.map((option, oIndex) => (
      <div
        key={oIndex}
        className={`
          p-3 border rounded-md cursor-pointer transition-colors mb-2
          ${answers[qIndex] === oIndex ? "border-primary-500 bg-primary-50" : "border-gray-300 hover:border-gray-400"}
        `}
        onClick={() => handleAnswerSelect(qIndex, oIndex)}
      >
        <div className="flex items-start">
          <div
            className={`
            w-5 h-5 rounded-full border flex-shrink-0 flex items-center justify-center mr-3 mt-0.5
            ${answers[qIndex] === oIndex ? "border-primary-500 bg-primary-500" : "border-gray-400"}
          `}
          >
            {answers[qIndex] === oIndex && <div className="w-2 h-2 bg-white rounded-full"></div>}
          </div>
          <span className="text-gray-700">{option}</span>
        </div>
      </div>
    ))
  }

  if (loading) {
    return (
      <DashboardLayout title="Take Quiz">
        <div className="flex justify-center items-center h-64">
          <div className="h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-3 text-gray-600">Loading quiz...</span>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout title="Take Quiz">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-soft p-8 text-center">
          <div className="text-error-500 mb-4">
            <AlertTriangle size={64} className="mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Unable to Load Quiz</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex justify-center space-x-4">
            <Button variant="outline" onClick={() => navigate("/student/quizzes")}>
              <ArrowLeft size={16} className="mr-2" />
              Back to Quizzes
            </Button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (quizSubmitted) {
    return (
      <DashboardLayout title="Quiz Completed">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-soft p-8 text-center">
          <div className="text-success-500 mb-4">
            <CheckCircle size={64} className="mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Quiz Completed!</h2>
          <p className="text-xl text-gray-700 mb-4">
            Your score: <span className="font-bold text-primary-600">{calculateScore()}%</span>
          </p>
          <p className="text-gray-600 mb-6">
            {calculateScore() >= 70 ? "Great job!" : "Keep practicing!"} Your results have been recorded.
          </p>
          <div className="flex justify-center space-x-4">
            <Button variant="outline" onClick={() => navigate("/student/results")}>
              View Results
            </Button>
            <Button variant="primary" onClick={() => navigate("/student/quizzes")}>
              Back to Quizzes
            </Button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Take Quiz">
      <div className="animate-fade-in max-w-4xl mx-auto">
        {/* Quiz Header */}
        <div className="bg-white rounded-lg shadow-soft p-6 mb-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center">
            <div className="mb-4 md:mb-0">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">{quiz?.title}</h2>
              {quiz?.description && <p className="text-gray-600 mb-2">{quiz.description}</p>}
              <div className="flex flex-wrap gap-4 mt-2">
                <p className="text-sm text-gray-500">
                  <span className="font-medium">Course:</span> {quiz?.courseName}
                </p>
                <p className="text-sm text-gray-500">
                  <span className="font-medium">Questions:</span> {quiz?.questions?.length || 0}
                </p>
                {quiz?.dueDate && (
                  <p className="text-sm text-gray-500">
                    <span className="font-medium">Due:</span> {quiz.dueDate.toLocaleString()}
                  </p>
                )}
              </div>
            </div>

            {timeRemaining !== null && (
              <div className="mt-4 md:mt-0 flex items-center bg-gray-100 px-4 py-2 rounded-md">
                <Clock size={18} className="text-primary-600 mr-2" />
                <span className="text-gray-700 font-medium">Time: {formatTime(timeRemaining)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Quiz Questions */}
        <div className="bg-white rounded-lg shadow-soft p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-700 mb-6 flex items-center">
            <FileQuestion size={20} className="text-primary-600 mr-2" />
            Questions ({quiz?.questions?.length || 0})
          </h3>

          {quiz?.questions && quiz.questions.length > 0 ? (
            <div className="space-y-8">
              {quiz.questions.map((question, qIndex) => (
                <div key={qIndex} className="pb-6 border-b border-gray-200 last:border-b-0">
                  <h4 className="text-md font-medium text-gray-800 mb-4">
                    Question {qIndex + 1}: {question.text}
                  </h4>
                  <div className="space-y-2">{renderOptions(question, qIndex)}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileQuestion size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No questions available for this quiz.</p>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white rounded-lg shadow-soft p-4">
          <div className="w-full sm:w-auto">
            {!allQuestionsAnswered() && quiz?.questions && quiz.questions.length > 0 && (
              <div className="flex items-center text-warning-600">
                <AlertTriangle size={18} className="mr-2" />
                <span>Please answer all questions before submitting</span>
              </div>
            )}
          </div>

          <div className="flex space-x-4 w-full sm:w-auto">
            <Button variant="outline" onClick={() => navigate("/student/quizzes")} className="flex-1 sm:flex-none">
              <ArrowLeft size={16} className="mr-2" />
              Back
            </Button>
            <Button
              variant="primary"
              onClick={submitQuiz}
              disabled={submitting || !allQuestionsAnswered() || !quiz?.questions?.length}
              className="flex-1 sm:flex-none"
            >
              {submitting ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Submitting...
                </span>
              ) : (
                "Submit Quiz"
              )}
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default TakeQuiz
