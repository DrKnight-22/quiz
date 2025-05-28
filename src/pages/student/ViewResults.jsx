"use client"

import { useState, useEffect } from "react"
import { collection, query, where, getDocs } from "firebase/firestore"
import { toast } from "react-hot-toast"
import { db } from "../../firebase/config"
import { useAuth } from "../../context/AuthContext"
import DashboardLayout from "../../components/layout/DashboardLayout"
import Button from "../../components/ui/Button"
import { Award, CheckCircle, XCircle, Clock, Eye, BookOpen, FileQuestion, X } from 'lucide-react'

const ViewResults = () => {
  const { currentUser } = useAuth()
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedResult, setSelectedResult] = useState(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    if (!currentUser) return

    const fetchResults = async () => {
      try {
        setLoading(true)
        // Remove orderBy to avoid index requirement, sort in JavaScript instead
        const resultsQuery = query(
          collection(db, "quizResults"),
          where("studentId", "==", currentUser.uid)
        )

        const resultsSnapshot = await getDocs(resultsQuery)
        const resultsData = resultsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))

        // Sort by submittedAt in descending order (most recent first)
        const sortedResults = resultsData.sort((a, b) => {
          const dateA = a.submittedAt ? new Date(a.submittedAt) : new Date(0)
          const dateB = b.submittedAt ? new Date(b.submittedAt) : new Date(0)
          return dateB - dateA
        })

        setResults(sortedResults)
        setLoading(false)
      } catch (error) {
        console.error("Error fetching results:", error)
        toast.error("Failed to load quiz results")
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

  const stats = {
    total: results.length,
    passed: results.filter((r) => r.score >= 70).length,
    failed: results.filter((r) => r.score < 70).length,
    average: results.length > 0 ? Math.round(results.reduce((sum, r) => sum + (r.score || 0), 0) / results.length) : 0,
  }

  return (
    <DashboardLayout title="My Results">
      <div className="animate-fade-in">
        <div className="flex items-center mb-6">
          <Award size={24} className="text-primary-600 mr-2" />
          <h2 className="text-xl font-semibold text-gray-700">My Quiz Results</h2>
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
                    <h3 className="text-sm font-medium text-gray-500">Total Quizzes</h3>
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
            {results.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow-soft">
                <Award size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No quiz results yet</h3>
                <p className="text-gray-500 mb-6">Take some quizzes to see your results here.</p>
                <Button variant="primary" onClick={() => (window.location.href = "/student/pending-quizzes")}>
                  Take a Quiz
                </Button>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-soft overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quiz
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Course
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Score
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
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
                      {results.map((result) => (
                        <tr key={result.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {result.quizTitle || "Untitled Quiz"}
                            </div>
                            <div className="text-sm text-gray-500">
                              {result.correctAnswers || 0}/{result.totalQuestions || 0} correct
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-sm text-gray-500">
                              <BookOpen size={16} className="mr-1" />
                              {result.courseName || "Unknown Course"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`text-lg font-bold ${getScoreColor(result.score || 0)}`}>
                              {result.score || 0}%
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {result.submittedAt ? new Date(result.submittedAt).toLocaleDateString() : "N/A"}
                            </div>
                            <div className="text-xs text-gray-400">
                              {result.submittedAt ? new Date(result.submittedAt).toLocaleTimeString() : ""}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getScoreBadge(
                                result.score || 0,
                              )}`}
                            >
                              {(result.score || 0) >= 70 ? "Passed" : "Failed"}
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
            )}
          </>
        )}

        {/* Modal */}
        {showModal && selectedResult && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-800">Quiz Result Details</h3>
                  <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                    <X size={24} />
                  </button>
                </div>
              </div>

              <div className="p-6">
                {/* Quiz Info */}
                <div className="mb-6">
                  <h4 className="text-xl font-semibold text-gray-800 mb-2">{selectedResult.quizTitle}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <BookOpen size={16} className="mr-2" />
                      <span>{selectedResult.courseName}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock size={16} className="mr-2" />
                      <span>
                        Submitted: {selectedResult.submittedAt ? new Date(selectedResult.submittedAt).toLocaleString() : "N/A"}
                      </span>
                    </div>
                    {selectedResult.timeSpent && (
                      <div className="flex items-center">
                        <Clock size={16} className="mr-2" />
                        <span>Time Spent: {Math.floor(selectedResult.timeSpent / 60)} minutes</span>
                      </div>
                    )}
                    <div className="flex items-center">
                      <FileQuestion size={16} className="mr-2" />
                      <span>
                        {selectedResult.correctAnswers || 0}/{selectedResult.totalQuestions || 0} correct
                      </span>
                    </div>
                  </div>
                </div>

                {/* Score Display */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className={`text-4xl font-bold mb-2 ${getScoreColor(selectedResult.score || 0)}`}>
                      {selectedResult.score || 0}%
                    </div>
                    <div
                      className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getScoreBadge(
                        selectedResult.score || 0,
                      )}`}
                    >
                      {(selectedResult.score || 0) >= 70 ? "Passed" : "Failed"}
                    </div>
                  </div>
                </div>

                {/* Questions and Answers */}
                <div className="space-y-6">
                  <h5 className="text-lg font-semibold text-gray-800">Questions & Answers</h5>
                  {selectedResult.questions && selectedResult.questions.length > 0 ? (
                    selectedResult.questions.map((question, qIndex) => {
                      const userAnswer = selectedResult.answers ? selectedResult.answers[qIndex] : null
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
                            {question.options && question.options.map((option, oIndex) => {
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
                                      <span className="ml-2 text-xs font-medium text-green-600">(Correct)</span>
                                    )}
                                    {isUserAnswer && !isCorrectAnswer && (
                                      <span className="ml-2 text-xs font-medium text-red-600">(Your Answer)</span>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No question details available for this quiz result.
                    </div>
                  )}
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

export default ViewResults