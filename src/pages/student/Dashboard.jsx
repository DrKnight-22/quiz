import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { BookOpen, Award, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title } from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(ArcElement, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const StatCard = ({ title, value, icon, bgColor, linkTo }) => {
  const Card = linkTo ? Link : 'div';
  
  return (
    <Card 
      to={linkTo}
      className={`${bgColor} rounded-lg shadow-soft p-6 flex items-center transition-transform duration-200 hover:scale-105`}
    >
      <div className="rounded-full bg-white bg-opacity-30 p-3 mr-4">
        {icon}
      </div>
      <div>
        <h3 className="text-white text-lg font-semibold">{title}</h3>
        <p className="text-white text-2xl font-bold">{value}</p>
      </div>
    </Card>
  );
};

const StudentDashboard = () => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState({
    enrolledCourses: 0,
    completedQuizzes: 0,
    pendingQuizzes: 0,
    averageScore: 0
  });
  const [upcomingQuizzes, setUpcomingQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [performanceData, setPerformanceData] = useState({ labels: [], datasets: [] });
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!currentUser) return;
      
      try {
        // Get user details
        const userQuery = query(collection(db, 'users'), where('uid', '==', currentUser.uid));
        const userSnapshot = await getDocs(userQuery);
        
        if (!userSnapshot.empty) {
          const userData = userSnapshot.docs[0].data();
          setUserName(userData.name || 'Student');
        }
        
        // Get student enrollments
        const enrollmentsQuery = query(
          collection(db, 'enrollments'),
          where('studentId', '==', currentUser.uid)
        );
        const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
        
        // Filter approved enrollments
        const approvedEnrollments = enrollmentsSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(enrollment => enrollment.status === 'approved');
        
        // Get enrolled course IDs
        const courseIds = approvedEnrollments.map(enrollment => enrollment.courseId);
        
        // Initialize quizzes arrays
        let completedQuizzes = [];
        let pendingQuizzes = [];
        let totalScore = 0;
        
        // Get quiz results for the student
        const quizResultsQuery = query(
          collection(db, 'quizResults'),
          where('studentId', '==', currentUser.uid)
        );
        const quizResultsSnapshot = await getDocs(quizResultsQuery);
        
        if (quizResultsSnapshot.size > 0) {
          const quizResults = quizResultsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          completedQuizzes = quizResults;
          totalScore = quizResults.reduce((sum, result) => sum + (result.score || 0), 0);
        }
        
        // Get available quizzes for enrolled courses
        if (courseIds.length > 0) {
          // Due to Firestore limitations on "in" queries, we might need to chunk this if there are many courses
          const availableQuizzesQuery = query(
            collection(db, 'quizzes'),
            where('courseId', 'in', courseIds.slice(0, 10)) // Firestore limits "in" queries to 10 values
          );
          const availableQuizzesSnapshot = await getDocs(availableQuizzesQuery);
          
          if (availableQuizzesSnapshot.size > 0) {
            const allAvailableQuizzes = availableQuizzesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            // Filter out quizzes that the student has already completed
            const completedQuizIds = completedQuizzes.map(quiz => quiz.quizId);
            pendingQuizzes = allAvailableQuizzes.filter(quiz => !completedQuizIds.includes(quiz.id));
            
            // Sort pending quizzes by due date
            pendingQuizzes.sort((a, b) => {
              if (a.dueDate && b.dueDate) {
                return new Date(a.dueDate) - new Date(b.dueDate);
              }
              return 0;
            });
            
            // Set upcoming quizzes (only show first 5)
            setUpcomingQuizzes(pendingQuizzes.slice(0, 5));
          }
        }
        
        // Calculate average score
        const averageScore = completedQuizzes.length > 0 ? 
          Math.round(totalScore / completedQuizzes.length) : 0;
        
        // Set stats
        setStats({
          enrolledCourses: courseIds.length,
          completedQuizzes: completedQuizzes.length,
          pendingQuizzes: pendingQuizzes.length,
          averageScore
        });
        
        // Prepare performance data for chart
        if (completedQuizzes.length > 0) {
          // Sort by date
          completedQuizzes.sort((a, b) => new Date(a.submittedAt) - new Date(b.submittedAt));
          
          // Only show last 10 quiz results
          const recentQuizzes = completedQuizzes.slice(-10);
          
          setPerformanceData({
            labels: recentQuizzes.map(quiz => quiz.quizTitle || 'Quiz'),
            datasets: [{
              label: 'Quiz Score (%)',
              data: recentQuizzes.map(quiz => quiz.score || 0),
              borderColor: '#2563EB',
              backgroundColor: 'rgba(37, 99, 235, 0.1)',
              tension: 0.3,
              fill: true,
            }]
          });
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [currentUser]);

  return (
    <DashboardLayout title="Student Dashboard">
      <div className="animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-700">Welcome, {userName}</h2>
          <p className="text-gray-500 mt-1 sm:mt-0">
            Current Average: <span className="font-semibold text-primary-600">{stats.averageScore}%</span>
          </p>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard 
                title="Enrolled Courses" 
                value={stats.enrolledCourses} 
                icon={<BookOpen size={24} className="text-white" />} 
                bgColor="bg-primary-600"
                linkTo="/student/courses" 
              />
              <StatCard 
                title="Completed Quizzes" 
                value={stats.completedQuizzes} 
                icon={<CheckCircle size={24} className="text-white" />} 
                bgColor="bg-success-600"
                linkTo="/student/results" 
              />
              <StatCard 
                title="Pending Quizzes" 
                value={stats.pendingQuizzes} 
                icon={<Clock size={24} className="text-white" />} 
                bgColor="bg-warning-600" 
              />
              <StatCard 
                title="Average Score" 
                value={`${stats.averageScore}%`} 
                icon={<Award size={24} className="text-white" />} 
                bgColor="bg-accent-600" 
              />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Performance Chart */}
              <div className="bg-white p-6 rounded-lg shadow-soft lg:col-span-2">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Performance History</h3>
                <div className="h-64">
                  {performanceData.labels.length > 0 ? (
                    <Line 
                      data={performanceData} 
                      options={{ 
                        maintainAspectRatio: false,
                        scales: {
                          y: {
                            beginAtZero: true,
                            max: 100,
                            title: {
                              display: true,
                              text: 'Score (%)'
                            }
                          }
                        }
                      }} 
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      No quiz history available yet.
                    </div>
                  )}
                </div>
              </div>
              
              {/* Upcoming Quizzes */}
              <div className="bg-white p-6 rounded-lg shadow-soft">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Upcoming Quizzes</h3>
                {upcomingQuizzes.length > 0 ? (
                  <ul className="divide-y divide-gray-200">
                    {upcomingQuizzes.map((quiz) => (
                      <li key={quiz.id} className="py-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{quiz.title || 'Untitled Quiz'}</p>
                            <p className="text-sm text-gray-500">{quiz.courseName || 'Unknown Course'}</p>
                            {quiz.dueDate && (
                              <p className="text-xs text-gray-500">
                                Due: {new Date(quiz.dueDate).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          <Link 
                            to={`/student/take-quiz/${quiz.id}`}
                            className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-primary-600 hover:bg-primary-700"
                          >
                            Take Quiz
                          </Link>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="py-4 text-center text-gray-500">
                    No upcoming quizzes.
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;