import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import { AuthContext } from '../../App';
import { db } from '../../utils/localStorageDB';
import { BookOpen, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

const StudentDashboard = () => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [recentQuizzes, setRecentQuizzes] = useState([]);
  const [upcomingQuizzes, setUpcomingQuizzes] = useState([]);
  const [stats, setStats] = useState({
    completedQuizzes: 0,
    averageScore: 0,
    totalCourses: 0
  });
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Fetch completed quizzes
        const completedData = db.filter('quiz_results', { student_id: user.id })
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 5)
          .map(result => ({
            ...result,
            quizzes: db.getById('quizzes', result.quiz_id)
          }));
        
        // Fetch upcoming quizzes (not completed by this student)
        const completedQuizIds = completedData.map(item => item.quiz_id);
        const upcomingData = db.get('quizzes')
          .filter(q => q.is_active && !completedQuizIds.includes(q.id))
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 5);
        
        // Fetch statistics
        const statsData = db.filter('quiz_results', { student_id: user.id });
        
        // Fetch total courses
        const coursesCount = db.get('courses').length;
        
        // Set states
        setRecentQuizzes(completedData);
        setUpcomingQuizzes(upcomingData);
        
        const totalQuizzes = statsData.length;
        const totalScore = statsData.reduce((sum, item) => sum + (item.score || 0), 0);
        const avgScore = totalQuizzes > 0 ? Math.round(totalScore / totalQuizzes) : 0;
        
        setStats({
          completedQuizzes: totalQuizzes,
          averageScore: avgScore,
          totalCourses: coursesCount
        });
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [user]);
  
  if (loading) {
    return (
      <Layout title="Student Dashboard" role="student">
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-700"></div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout title="Student Dashboard" role="student">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm flex items-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
            <CheckCircle2 size={24} className="text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Completed Quizzes</p>
            <p className="text-2xl font-semibold">{stats.completedQuizzes}</p>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm flex items-center">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
            <AlertCircle size={24} className="text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Average Score</p>
            <p className="text-2xl font-semibold">{stats.averageScore}%</p>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm flex items-center">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
            <BookOpen size={24} className="text-purple-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Available Courses</p>
            <p className="text-2xl font-semibold">{stats.totalCourses}</p>
          </div>
        </div>
      </div>
      
      {/* Recent and Upcoming Quizzes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Quizzes */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Recent Quizzes</h2>
            <Link to="/student/courses" className="text-sm text-[#6E8B55] hover:underline">
              View All
            </Link>
          </div>
          
          {recentQuizzes.length > 0 ? (
            <div className="space-y-3">
              {recentQuizzes.map((item) => (
                <Link 
                  key={item.id} 
                  to={`/student/results/${item.id}`}
                  className="block p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">{item.quizzes?.title || 'Quiz'}</h3>
                      <p className="text-sm text-gray-500">
                        Score: <span className="font-medium">{item.score}%</span>
                      </p>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs ${
                      item.score >= 70 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {item.score >= 70 ? 'Passed' : 'Failed'}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 py-4 text-center">You haven't completed any quizzes yet.</p>
          )}
        </div>
        
        {/* Upcoming Quizzes */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Available Quizzes</h2>
            <Link to="/student/courses" className="text-sm text-[#6E8B55] hover:underline">
              View All
            </Link>
          </div>
          
          {upcomingQuizzes.length > 0 ? (
            <div className="space-y-3">
              {upcomingQuizzes.map((quiz) => (
                <Link 
                  key={quiz.id} 
                  to={`/student/quiz/${quiz.id}`}
                  className="block p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">{quiz.title}</h3>
                      <p className="text-sm text-gray-500">{quiz.description || 'No description'}</p>
                    </div>
                    <div className="flex items-center text-[#6E8B55]">
                      <Clock size={16} className="mr-1" />
                      <span className="text-sm">Take Quiz</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 py-4 text-center">No quizzes available at the moment.</p>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default StudentDashboard;