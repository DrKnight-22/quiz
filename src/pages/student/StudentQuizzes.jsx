"use client"

import { useState, useEffect } from "react"
import { collection, query, where, getDocs } from "firebase/firestore"
import { toast } from "react-hot-toast"
import { db } from "../../firebase/config"
import { useAuth } from "../../context/AuthContext"
import DashboardLayout from "../../components/layout/DashboardLayout"
import Button from "../../components/ui/Button"
import { FileQuestion, Search, X, Calendar, AlertTriangle } from "lucide-react"
import { useNavigate } from "react-router-dom"

const StudentQuizzes = () => {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const [quizzes, setQuizzes] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredQuizzes, setFilteredQuizzes] = useState([])
  const [activeTab, setActiveTab] = useState("pending") // pending, completed

  // Fetch quizzes for the student
  useEffect(() => {
    const fetchQuizzes = async () => {
      if (!currentUser) return

      try {
        setLoading(true)

        // Get all courses the student is enrolled in
        const enrollmentsQuery = query(
          collection(db, "enrollments"),
          where("studentId", "==", currentUser.uid),
          where("status", "==", "approved"),
        )
        const enrollmentsSnapshot = await getDocs(enrollmentsQuery)
        const courseIds = enrollmentsSnapshot.docs.map((doc) => doc.data().courseId)

        if (courseIds.length === 0) {
          setQuizzes([])
          setLoading(false)
          return
        }

        // Get all quizzes for these courses
        const quizzesQuery = query(collection(db, "quizzes"), where("courseId", "in", courseIds))
        const quizzesSnapshot = await getDocs(quizzesQuery)

        // Get all quiz results for this student
        const resultsQuery = query(collection(db, "quizResults"), where("studentId", "==", currentUser.uid))
        const resultsSnapshot = await getDocs(resultsQuery)
        const completedQuizIds = resultsSnapshot.docs.map((doc) => doc.data().quizId)

        // Process quizzes
        const quizzesData = quizzesSnapshot.docs
          .map((doc) => {
            const quizData = doc.data()
            const isCompleted = completedQuizIds.includes(doc.id)
            const dueDate = quizData.dueDate ? new Date(quizData.dueDate) : null
            const isPastDue = dueDate ? dueDate < new Date() : false

            return {
              id: doc.id,
              ...quizData,
              dueDate,
              isCompleted,
              isPastDue,
              status: isCompleted ? "completed" : isPastDue ? "past-due" : "pending",
            }
          })
          .sort((a, b) => {
            // Sort by status (pending first), then by due date (earliest first)
            if (a.status !== b.status) {
              return a.status === "pending" ? -1 : 1
            }
            if (a.dueDate && b.dueDate) {
              return a.dueDate - b.dueDate
            }
            return 0
          })

        setQuizzes(quizzesData)
      } catch (error) {
        console.error("Error fetching quizzes:", error)
        toast.error("Failed to load quizzes")
      } finally {
        setLoading(false)
      }
    }

    fetchQuizzes()
  }, [currentUser])

  // Filter quizzes based on search term and active tab
  useEffect(() => {
    let filtered = [...quizzes]

    // Filter by tab
    if (activeTab === "pending") {
      filtered = filtered.filter((quiz) => !quiz.isCompleted && !quiz.isPastDue)
    } else if (activeTab === "completed") {
      filtered = filtered.filter((quiz) => quiz.isCompleted)
    } else if (activeTab === "past-due") {
      filtered = filtered.filter((quiz) => !quiz.isCompleted && quiz.isPastDue)
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (quiz) =>
          quiz.title?.toLowerCase().includes(term) ||
          quiz.description?.toLowerCase().includes(term) ||
          quiz.courseName?.toLowerCase().includes(term),
      )
    }

    setFilteredQuizzes(filtered)
  }, [quizzes, searchTerm, activeTab])

  // Format due date
  const formatDueDate = (date) => {
    if (!date) return "No due date"

    const now = new Date()
    const diffTime = date - now
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
      return "Past due"
    } else if (diffDays === 0) {
      return "Due today"
    } else if (diffDays === 1) {
      return "Due tomorrow"
    } else if (diffDays < 7) {
      return `Due in ${diffDays} days`
    } else {
      return `Due on ${date.toLocaleDateString()}`
    }
  }

  // Take quiz
  const takeQuiz = (quizId) => {
    navigate(`/student/quizzes/${quizId}`)
  }

  return (
    <DashboardLayout title="My Quizzes">
      <div className="animate-fade-in">
        {/* Search Bar */}
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search quizzes..."
            className="pl-10 pr-4 py-2 w-full rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="absolute inset-y-0 right-0 flex items-center pr-3" onClick={() => setSearchTerm("")}>
              <X size={18} className="text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="mb-6 flex border-b border-gray-200">
          <button
            className={`py-2 px-4 text-sm font-medium transition-colors ${
              activeTab === "pending"
                ? "text-primary-600 border-b-2 border-primary-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("pending")}
          >
            Pending
          </button>
          <button
            className={`py-2 px-4 text-sm font-medium transition-colors ${
              activeTab === "completed"
                ? "text-primary-600 border-b-2 border-primary-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("completed")}
          >
            Completed
          </button>
          <button
            className={`py-2 px-4 text-sm font-medium transition-colors ${
              activeTab === "past-due"
                ? "text-primary-600 border-b-2 border-primary-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("past-due")}
          >
            Past Due
          </button>
        </div>

        {/* Quizzes List */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-3 text-gray-600">Loading quizzes...</span>
          </div>
        ) : filteredQuizzes.length === 0 ? (
          <div className="bg-white rounded-lg shadow-soft p-8 text-center">
            <FileQuestion size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">No Quizzes Found</h3>
            <p className="text-gray-500">
              {activeTab === "pending"
                ? "You don't have any pending quizzes."
                : activeTab === "completed"
                  ? "You haven't completed any quizzes yet."
                  : "You don't have any past due quizzes."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredQuizzes.map((quiz) => (
              <div
                key={quiz.id}
                className={`bg-white rounded-lg shadow-soft overflow-hidden transition-transform duration-200 hover:translate-y-[-4px] ${
                  quiz.isCompleted
                    ? "border-l-4 border-success-500"
                    : quiz.isPastDue
                      ? "border-l-4 border-error-500"
                      : ""
                }`}
              >
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">{quiz.title}</h3>
                  <p className="text-sm text-gray-500 mb-1">
                    <span className="font-medium">Course:</span> {quiz.courseName}
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    <span className="font-medium">Questions:</span> {quiz.questions?.length || 0}
                  </p>

                  <div className="flex items-center mb-4">
                    {quiz.dueDate ? (
                      <div
                        className={`flex items-center text-sm ${
                          quiz.isPastDue ? "text-error-600" : "text-warning-600"
                        }`}
                      >
                        <Calendar size={14} className="mr-1" />
                        <span>{formatDueDate(quiz.dueDate)}</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar size={14} className="mr-1" />
                        <span>No due date</span>
                      </div>
                    )}
                  </div>

                  <p className="text-sm text-gray-600 mb-6 line-clamp-2">
                    {quiz.description || "No description available."}
                  </p>

                  {quiz.isCompleted ? (
                    <Button
                      variant="outline"
                      className="w-full flex items-center justify-center"
                      onClick={() => navigate(`/student/results`)}
                    >
                      View Results
                    </Button>
                  ) : quiz.isPastDue ? (
                    <div className="flex items-center text-error-600 justify-center p-2 bg-error-50 rounded-md">
                      <AlertTriangle size={16} className="mr-2" />
                      <span>Past due date</span>
                    </div>
                  ) : (
                    <Button
                      variant="primary"
                      className="w-full flex items-center justify-center"
                      onClick={() => takeQuiz(quiz.id)}
                    >
                      <FileQuestion size={16} className="mr-2" />
                      Take Quiz
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default StudentQuizzes
