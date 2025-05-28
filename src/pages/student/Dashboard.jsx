"use client"

import { useState, useEffect } from "react"
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore"
import { Link } from "react-router-dom"
import { db } from "../../firebase/config"
import { useAuth } from "../../context/AuthContext"
import DashboardLayout from "../../components/layout/DashboardLayout"
import { BookOpen, Award, Clock, CheckCircle } from "lucide-react"
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
} from "chart.js"
import { Line } from "react-chartjs-2"

// Register Chart.js components
ChartJS.register(ArcElement, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

const StatCard = ({ title, value, icon, bgColor, linkTo }) => {
  const Card = linkTo ? Link : "div"

  return (
    <Card
      to={linkTo}
      className={`${bgColor} rounded-lg shadow-md p-6 flex items-center transition-transform duration-200 hover:scale-105 ${
        linkTo ? "cursor-pointer" : ""
      }`}
    >
      <div className="rounded-full bg-white bg-opacity-30 p-3 mr-4">{icon}</div>
      <div>
        <h3 className="text-white text-lg font-semibold">{title}</h3>
        <p className="text-white text-2xl font-bold">{value}</p>
      </div>
    </Card>
  )
}

const StudentDashboard = () => {
  const { currentUser } = useAuth()
  const [dashboardData, setDashboardData] = useState({
    userName: "Student",
    enrolledCourses: 0,
    completedQuizzes: 0,
    pendingQuizzes: 0,
    averageScore: 0,
    upcomingQuizzes: [],
    performanceData: {
      labels: [],
      datasets: [
        {
          label: "Quiz Score (%)",
          data: [],
          borderColor: "#3B82F6",
          backgroundColor: "rgba(59, 130, 246, 0.1)",
          tension: 0.3,
          fill: true,
        },
      ],
    },
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!currentUser) return

      try {
        setLoading(true)

        // 1. Fetch user data
        const userDoc = await getDoc(doc(db, "users", currentUser.uid))
        const userName = userDoc.exists() ? userDoc.data().name || currentUser.email : "Student"

        // 2. Fetch enrolled courses (approved enrollments)
        const enrollmentsQuery = query(
          collection(db, "enrollments"),
          where("studentId", "==", currentUser.uid),
          where("status", "==", "approved"),
        )
        const enrollmentsSnapshot = await getDocs(enrollmentsQuery)
        const courseIds = enrollmentsSnapshot.docs.map((doc) => doc.data().courseId)

        let enrolledCourses = 0
        let allQuizzes = []
        let completedQuizzes = []
        let pendingQuizzes = []

        if (courseIds.length > 0) {
          enrolledCourses = courseIds.length

          // 3. Fetch all quizzes for enrolled courses
          const quizzesQuery = query(collection(db, "quizzes"), where("courseId", "in", courseIds))
          const quizzesSnapshot = await getDocs(quizzesQuery)

          allQuizzes = quizzesSnapshot.docs
            .map((doc) => ({
              id: doc.id,
              ...doc.data(),
              dueDate: doc.data().dueDate ? new Date(doc.data().dueDate) : null,
            }))
            .filter((quiz) => quiz.isPublished) // Only published quizzes

          // 4. Fetch completed quiz results
          const resultsQuery = query(collection(db, "quizResults"), where("studentId", "==", currentUser.uid))
          const resultsSnapshot = await getDocs(resultsQuery)

          completedQuizzes = resultsSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            submittedAt: doc.data().submittedAt ? new Date(doc.data().submittedAt) : new Date(),
          }))

          const completedQuizIds = completedQuizzes.map((q) => q.quizId)
          const now = new Date()

          // 5. Calculate pending quizzes (not completed and not past due)
          pendingQuizzes = allQuizzes.filter((quiz) => {
            const isCompleted = completedQuizIds.includes(quiz.id)
            const isPastDue = quiz.dueDate ? quiz.dueDate < now : false
            return !isCompleted && !isPastDue
          })
        }

        // Calculate average score
        const totalScore = completedQuizzes.reduce((sum, quiz) => sum + (quiz.score || 0), 0)
        const averageScore = completedQuizzes.length > 0 ? Math.round(totalScore / completedQuizzes.length) : 0

        // Prepare performance chart data (last 10 quizzes)
        const recentQuizzes = [...completedQuizzes].sort((a, b) => a.submittedAt - b.submittedAt).slice(-10)

        const performanceData = {
          labels: recentQuizzes.map((q, index) => `Quiz ${index + 1}`),
          datasets: [
            {
              label: "Quiz Score (%)",
              data: recentQuizzes.map((q) => q.score || 0),
              borderColor: "#3B82F6",
              backgroundColor: "rgba(59, 130, 246, 0.1)",
              tension: 0.3,
              fill: true,
            },
          ],
        }

        // Sort upcoming quizzes by due date (earliest first)
        const sortedUpcoming = [...pendingQuizzes]
          .sort((a, b) => {
            if (!a.dueDate && !b.dueDate) return 0
            if (!a.dueDate) return 1
            if (!b.dueDate) return -1
            return a.dueDate - b.dueDate
          })
          .slice(0, 5)

        // Update dashboard data
        setDashboardData({
          userName,
          enrolledCourses,
          completedQuizzes: completedQuizzes.length,
          pendingQuizzes: pendingQuizzes.length,
          averageScore,
          upcomingQuizzes: sortedUpcoming,
          performanceData,
        })
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [currentUser])

  return (
    <DashboardLayout title="Student Dashboard">
      <div className="animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-700">Welcome, {dashboardData.userName}</h2>
          <p className="text-gray-500 mt-1 sm:mt-0">
            Current Average: <span className="font-semibold text-blue-600">{dashboardData.averageScore}%</span>
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                title="Enrolled Courses"
                value={dashboardData.enrolledCourses}
                icon={<BookOpen size={24} className="text-white" />}
                bgColor="bg-blue-600"
                linkTo="/student/courses"
              />
              <StatCard
                title="Completed Quizzes"
                value={dashboardData.completedQuizzes}
                icon={<CheckCircle size={24} className="text-white" />}
                bgColor="bg-green-600"
                linkTo="/student/results"
              />
              <StatCard
                title="Pending Quizzes"
                value={dashboardData.pendingQuizzes}
                icon={<Clock size={24} className="text-white" />}
                bgColor="bg-yellow-600"
                linkTo="/student/quizzes"
              />
              <StatCard
                title="Average Score"
                value={`${dashboardData.averageScore}%`}
                icon={<Award size={24} className="text-white" />}
                bgColor="bg-purple-600"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-md lg:col-span-2">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Performance History</h3>
                <div className="h-64">
                  {dashboardData.completedQuizzes > 0 ? (
                    <Line
                      data={dashboardData.performanceData}
                      options={{
                        maintainAspectRatio: false,
                        responsive: true,
                        scales: {
                          y: {
                            beginAtZero: true,
                            max: 100,
                            ticks: {
                              stepSize: 20,
                            },
                            title: {
                              display: true,
                              text: "Score (%)",
                            },
                          },
                          x: {
                            grid: {
                              display: false,
                            },
                          },
                        },
                        plugins: {
                          legend: {
                            position: "top",
                          },
                        },
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      No quiz history available yet.
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-700">Upcoming Quizzes</h3>
                  <Link to="/student/quizzes" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                    View All
                  </Link>
                </div>
                {dashboardData.upcomingQuizzes.length > 0 ? (
                  <ul className="divide-y divide-gray-200">
                    {dashboardData.upcomingQuizzes.map((quiz) => (
                      <li key={quiz.id} className="py-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {quiz.title || "Untitled Quiz"}
                            </p>
                            <p className="text-sm text-gray-500 truncate">{quiz.courseName}</p>
                            {quiz.dueDate && (
                              <p className="text-xs text-gray-500">Due: {quiz.dueDate.toLocaleDateString()}</p>
                            )}
                          </div>
                          <Link
                            to={`/student/quizzes/${quiz.id}`}
                            className="ml-2 inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                          >
                            Take Quiz
                          </Link>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="py-4 text-center text-gray-500">
                    {dashboardData.enrolledCourses > 0
                      ? "No upcoming quizzes found"
                      : "Enroll in courses to see upcoming quizzes"}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}

export default StudentDashboard
