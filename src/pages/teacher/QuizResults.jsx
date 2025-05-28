"use client"

import { useState, useEffect } from "react"
import { collection, query, where, getDocs } from "firebase/firestore"
import { toast } from "react-hot-toast"
import { db } from "../../firebase/config"
import { useAuth } from "../../context/AuthContext"
import DashboardLayout from "../../components/layout/DashboardLayout"
import Button from "../../components/ui/Button"
import { Award, CheckCircle, XCircle, Clock, Eye, BookOpen, FileQuestion, Users, X } from "lucide-react"

const QuizResults = () => {
  const { currentUser } = useAuth()
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedResult, setSelectedResult] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [activeFilter, setActiveFilter] = useState("all")

  useEffect(() => {
    if (!currentUser) return

    const fetchResults = async () => {
      try {
        setLoading(true)

        // First, get all quiz results for this teacher without orderBy to avoid index requirement
        const resultsQuery = query(collection(db, "quizResults"), where("teacherId", "==", currentUser.uid))

        const resultsSnapshot = await getDocs(resultsQuery)
        const resultsData = resultsSnapshot.docs.map((doc) => {
          const data = doc.data()
          return {
            id: doc.id,
            ...data,
            submittedAt: data.submittedAt
              ? typeof data.submittedAt === "string"
                ? new Date(data.submittedAt)
                : data.submittedAt.toDate()
              : new Date(),
            // Calculate correct answers if not already present
            correctAnswers:
              data.correctAnswers ||
              (data.answers && data.questions
                ? Object.values(data.answers).filter((answer, index) => answer === data.questions[index]?.correctAnswer)
                    .length
                : 0),
          }
        })

        // Sort by submittedAt in JavaScript (most recent first)
        resultsData.sort((a, b) => b.submittedAt - a.submittedAt)

        setResults(resultsData)
        setLoading(false)
      } catch (error) {
        console.error("Error fetching results:", error)

        // Handle the specific Firebase index error
        if (error.code === "failed-precondition" && error.message.includes("requires an index")) {
          const indexUrl = error.message.match(/https:\/\/console\.firebase\.google\.com[^\s]*/)
          if (indexUrl) {
            toast.error(
              <div>
                <p>This query requires a Firestore index.</p>
                <a href={indexUrl[0]} target="_blank" rel="noopener noreferrer" className="underline text-blue-600">
                  Click here to create it
                </a>
              </div>,
              { duration: 10000 },
            )
          } else {
            toast.error("Database index required. Please contact administrator.")
          }
        } else {
          toast.error("Failed to load quiz results")
        }

        setLoading(false)
      }
    }

    fetchResults()
  }, [currentUser])

  const openModal = (result) => {
    setSelectedResult(result)
    setShowModal(true)
  }

  const closeModal = () => {
    setSelectedResult(null)
    setShowModal(false)
  }

  const getScoreColor = (score) => {
    if (score >= 90) return "text-green-600"
    if (score >= 80) return "text-blue-600"
    if (score >= 70) return "text-yellow-600"
    return "text-red-600"
  }

  const getScoreBadge = (score) => {
    if (score >= 90) return "bg-green-100 text-green-800"
    if (score >= 80) return "bg-blue-100 text-blue-800"
    if (score >= 70) return "bg-yellow-100 text-yellow-800"
    return "bg-red-100 text-red-800"
  }

  const filteredResults = results.filter((result) => {
    if (activeFilter === "all") return true
    if (activeFilter === "passed") return result.score >= 70
    if (activeFilter === "failed") return result.score < 70
    return true
  })

  const stats = {
    total: results.length,
    passed: results.filter((r) => (r.score || 0) >= 70).length,
    failed: results.filter((r) => (r.score || 0) < 70).length,
    average: results.length > 0 ? Math.round(results.reduce((sum, r) => sum + (r.score || 0), 0) / results.length) : 0,
  }

  // Group results by quiz
  const quizGroups = filteredResults.reduce((groups, result) => {
    const quizId = result.quizId
    if (!groups[quizId]) {
      groups[quizId] = {
        quizTitle: result.quizTitle,
        courseName: result.courseName,
        results: [],
      }
    }
    groups[quizId].results.push(result)
    return groups
  }, {})

  return (
    <DashboardLayout title="Quiz Results">
      <div className="animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div className="flex items-center mb-4 md:mb-0">
            <Users size={24} className="text-primary-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-700">Student Quiz Results</h2>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveFilter("all")}
              className={`px-3 py-1 rounded-md text-sm ${
                activeFilter === "all" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"
              }`}
            >
              All ({stats.total})
            </button>
            <button
              onClick={() => setActiveFilter("passed")}
              className={`px-3 py-1 rounded-md text-sm ${
                activeFilter === "passed" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
              }`}
            >
              Passed ({stats.passed})
            </button>
            <button
              onClick={() => setActiveFilter("failed")}
              className={`px-3 py-1 rounded-md text-sm ${
                activeFilter === "failed" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800"
              }`}
            >
              Failed ({stats.failed})
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-3 text-gray-600">Loading results...</span>
          </div>
        ) : (
          <>
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white p-6 rounded-lg shadow-soft">
                <div className="flex items-center">
                  <div className="bg-blue-100 p-3 rounded-full mr-4">
                    <FileQuestion className="text-blue-600" size={24} />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Total Submissions</h3>
                    <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-soft">
                <div className="flex items-center">
                  <div className="bg-green-100 p-3 rounded-full mr-4">
                    <CheckCircle className="text-green-600" size={24} />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Passed</h3>
                    <p className="text-2xl font-bold text-gray-800">{stats.passed}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-soft">
                <div className="flex items-center">
                  <div className="bg-red-100 p-3 rounded-full mr-4">
                    <XCircle className="text-red-600" size={24} />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Failed</h3>
                    <p className="text-2xl font-bold text-gray-800">{stats.failed}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-soft">
                <div className="flex items-center">
                  <div className="bg-purple-100 p-3 rounded-full mr-4">
                    <Award className="text-purple-600" size={24} />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Average Score</h3>
                    <p className="text-2xl font-bold text-gray-800">{stats.average}%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Results List */}
            {filteredResults.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow-soft">
                <Users size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No quiz results yet</h3>
                <p className="text-gray-500 mb-6">Students haven't submitted any quizzes yet.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(quizGroups).map(([quizId, group]) => (
                  <div key={quizId} className="bg-white rounded-lg shadow-soft overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-800">{group.quizTitle}</h3>
                      <p className="text-sm text-gray-600">{group.courseName}</p>
                      <p className="text-sm text-gray-500">{group.results.length} submission(s)</p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Student
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Score
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Submitted
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {group.results.map((result) => (
                            <tr key={result.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {result.studentName || "Unknown Student"}
                                </div>
                                <div className="text-sm text-gray-500">{result.studentEmail}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className={`text-lg font-bold ${getScoreColor(result.score)}`}>
                                  {result.score}%
                                </div>
                                <div className="text-sm text-gray-500">
                                  {result.correctAnswers || 0}/{result.totalQuestions || 0} correct
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500">
                                  {new Date(result.submittedAt).toLocaleDateString()}
                                </div>
                                <div className="text-xs text-gray-400">
                                  {new Date(result.submittedAt).toLocaleTimeString()}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getScoreBadge(
                                    result.score,
                                  )}`}
                                >
                                  {result.score >= 70 ? "Passed" : "Failed"}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <Button variant="ghost" size="sm" onClick={() => openModal(result)}>
                                  <Eye size={16} className="mr-1" />
                                  View Details
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Modal */}
        {showModal && selectedResult && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-800">Student Quiz Result</h3>
                  <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                    <X size={24} />
                  </button>
                </div>
              </div>

              <div className="p-6">
                {/* Student & Quiz Info */}
                <div className="mb-6">
                  <h4 className="text-xl font-semibold text-gray-800 mb-2">{selectedResult.quizTitle}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Users size={16} className="mr-2" />
                      <span>{selectedResult.studentName}</span>
                    </div>
                    <div className="flex items-center">
                      <BookOpen size={16} className="mr-2" />
                      <span>{selectedResult.courseName}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock size={16} className="mr-2" />
                      <span>Submitted: {new Date(selectedResult.submittedAt).toLocaleString()}</span>
                    </div>
                    {selectedResult.timeSpent && (
                      <div className="flex items-center">
                        <Clock size={16} className="mr-2" />
                        <span>Time Spent: {Math.floor(selectedResult.timeSpent / 60)} minutes</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Score Display */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className={`text-4xl font-bold mb-2 ${getScoreColor(selectedResult.score)}`}>
                      {selectedResult.score}%
                    </div>
                    <div
                      className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getScoreBadge(
                        selectedResult.score,
                      )}`}
                    >
                      {selectedResult.score >= 70 ? "Passed" : "Failed"}
                    </div>
                    <div className="text-sm text-gray-600 mt-2">
                      {selectedResult.correctAnswers} out of {selectedResult.totalQuestions} questions correct
                    </div>
                  </div>
                </div>

                {/* Questions and Answers */}
                <div className="space-y-6">
                  <h5 className="text-lg font-semibold text-gray-800">Questions & Answers</h5>
                  {selectedResult.questions?.map((question, qIndex) => {
                    const userAnswer = selectedResult.answers[qIndex]
                    const isCorrect = userAnswer === question.correctAnswer
                    return (
                      <div key={qIndex} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <h6 className="font-medium text-gray-800">Question {qIndex + 1}</h6>
                          <div className="flex items-center">
                            {isCorrect ? (
                              <CheckCircle size={20} className="text-green-600" />
                            ) : (
                              <XCircle size={20} className="text-red-600" />
                            )}
                          </div>
                        </div>
                        <p className="text-gray-700 mb-4">{question.text}</p>
                        <div className="space-y-2">
                          {question.options.map((option, oIndex) => {
                            const isUserAnswer = userAnswer === oIndex
                            const isCorrectAnswer = question.correctAnswer === oIndex
                            return (
                              <div
                                key={oIndex}
                                className={`p-3 rounded-md border ${
                                  isCorrectAnswer
                                    ? "border-green-500 bg-green-50"
                                    : isUserAnswer
                                      ? "border-red-500 bg-red-50"
                                      : "border-gray-200 bg-gray-50"
                                }`}
                              >
                                <div className="flex items-center">
                                  <div
                                    className={`w-4 h-4 rounded-full border mr-3 flex items-center justify-center ${
                                      isCorrectAnswer
                                        ? "border-green-500 bg-green-500"
                                        : isUserAnswer
                                          ? "border-red-500 bg-red-500"
                                          : "border-gray-300"
                                    }`}
                                  >
                                    {(isCorrectAnswer || isUserAnswer) && (
                                      <div className="w-2 h-2 bg-white rounded-full"></div>
                                    )}
                                  </div>
                                  <span className="text-gray-700">{option}</span>
                                  {isCorrectAnswer && (
                                    <span className="ml-2 text-xs font-medium text-green-600">(Correct Answer)</span>
                                  )}
                                  {isUserAnswer && !isCorrectAnswer && (
                                    <span className="ml-2 text-xs font-medium text-red-600">(Student's Answer)</span>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end">
                <Button variant="outline" onClick={closeModal}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default QuizResults
