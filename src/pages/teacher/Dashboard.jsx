import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { BookOpen, FileQuestion, Users, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

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

const TeacherDashboard = () => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState({
    courses: 0,
    quizzes: 0,
    students: 0,
    pendingEnrollments: 0
  });
  const [recentEnrollments, setRecentEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quizResultsData, setQuizResultsData] = useState({ labels: [], datasets: [] });

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!currentUser) return;
      
      try {
        // Get courses taught by the teacher
        const coursesQuery = query(
          collection(db, 'courses'), 
          where('teacherId', '==', currentUser.uid)
        );
        const coursesSnapshot = await getDocs(coursesQuery);
        const courses = coursesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Get course IDs
        const courseIds = courses.map(course => course.id);
        
        // Get quizzes created by the teacher
        const quizzesQuery = query(
          collection(db, 'quizzes'), 
          where('teacherId', '==', currentUser.uid)
        );
        const quizzesSnapshot = await getDocs(quizzesQuery);
        
        // Get enrollments for teacher's courses
        let studentsCount = 0;
        let pendingCount = 0;
        let recentEnrollmentsList = [];
        
        if (courseIds.length > 0) {
          // Query enrollments for all courses in one go
          const enrollmentsQuery = query(
            collection(db, 'enrollments'),
            where('courseId', 'in', courseIds.slice(0, 10)) // Firestore limits "in" queries to 10 values
          );
          const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
          
          const enrollments = enrollmentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          
          // Count approved and pending enrollments
          studentsCount = enrollments.filter(enrollment => enrollment.status === 'approved').length;
          pendingCount = enrollments.filter(enrollment => enrollment.status === 'pending').length;
          
          // Get most recent enrollments for quick access
          recentEnrollmentsList = enrollments
            .filter(enrollment => enrollment.status === 'pending')
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5);
        }
        
        // Get quiz results data for visualization
        const quizLabels = [];
        const quizScores = [];
        
        if (quizzesSnapshot.size > 0) {
          const quizIds = quizzesSnapshot.docs.map(doc => doc.id);
          
          // Get only the first 5 quizzes for the chart
          const displayQuizzes = quizzesSnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .slice(0, 5);
          
          // Prepare labels
          quizLabels.push(...displayQuizzes.map(quiz => quiz.title || 'Untitled Quiz'));
          
          // For each quiz, calculate average score
          for (const quiz of displayQuizzes) {
            const resultsQuery = query(
              collection(db, 'quizResults'),
              where('quizId', '==', quiz.id)
            );
            const resultsSnapshot = await getDocs(resultsQuery);
            
            if (resultsSnapshot.size > 0) {
              const results = resultsSnapshot.docs.map(doc => doc.data());
              const totalScore = results.reduce((sum, result) => sum + (result.score || 0), 0);
              const avgScore = totalScore / results.length;
              quizScores.push(avgScore);
            } else {
              quizScores.push(0);
            }
          }
        }
        
        // Set quiz results chart data
        setQuizResultsData({
          labels: quizLabels,
          datasets: [
            {
              label: 'Average Score (%)',
              data: quizScores,
              backgroundColor: '#2563EB',
            }
          ]
        });
        
        // Update stats
        setStats({
          courses: coursesSnapshot.size,
          quizzes: quizzesSnapshot.size,
          students: studentsCount,
          pendingEnrollments: pendingCount
        });
        
        // Update recent enrollments
        setRecentEnrollments(recentEnrollmentsList);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [currentUser]);

  return (
    <DashboardLayout title="Teacher Dashboard">
      <div className="animate-fade-in">
        <h2 className="text-xl font-semibold text-gray-700 mb-6">Dashboard Overview</h2>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard 
                title="Courses" 
                value={stats.courses} 
                icon={<BookOpen size={24} className="text-white" />} 
                bgColor="bg-primary-600"
                linkTo="/teacher/course-details" 
              />
              <StatCard 
                title="Quizzes" 
                value={stats.quizzes} 
                icon={<FileQuestion size={24} className="text-white" />} 
                bgColor="bg-secondary-600"
                linkTo="/teacher/create-quiz" 
              />
              <StatCard 
                title="Students" 
                value={stats.students} 
                icon={<Users size={24} className="text-white" />} 
                bgColor="bg-accent-600" 
              />
              <StatCard 
                title="Pending Enrollments" 
                value={stats.pendingEnrollments} 
                icon={<Clock size={24} className="text-white" />} 
                bgColor="bg-warning-600"
                linkTo="/teacher/course-details" 
              />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Quiz Performance Chart */}
              <div className="bg-white p-6 rounded-lg shadow-soft lg:col-span-2">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Quiz Performance</h3>
                <div className="h-64">
                  {quizResultsData.labels.length > 0 ? (
                    <Bar 
                      data={quizResultsData} 
                      options={{ 
                        maintainAspectRatio: false,
                        scales: {
                          y: {
                            beginAtZero: true,
                            max: 100,
                            title: {
                              display: true,
                              text: 'Average Score (%)'
                            }
                          }
                        }
                      }} 
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      No quiz data available yet.
                    </div>
                  )}
                </div>
              </div>
              
              {/* Recent Enrollment Requests */}
              <div className="bg-white p-6 rounded-lg shadow-soft">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Recent Enrollment Requests</h3>
                {recentEnrollments.length > 0 ? (
                  <ul className="divide-y divide-gray-200">
                    {recentEnrollments.map((enrollment) => (
                      <li key={enrollment.id} className="py-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{enrollment.studentName || 'Unknown Student'}</p>
                            <p className="text-sm text-gray-500">{enrollment.courseName || 'Unknown Course'}</p>
                          </div>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning-100 text-warning-800">
                            Pending
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="py-4 text-center text-gray-500">
                    No pending enrollment requests.
                  </div>
                )}
                
                <div className="mt-4">
                  <Link to="/teacher/course-details" className="text-primary-600 hover:text-primary-800 text-sm font-medium">
                    View all enrollment requests →
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TeacherDashboard;