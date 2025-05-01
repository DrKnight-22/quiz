import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import { AuthContext } from '../../App';
import { db } from '../../utils/localStorageDB';
import { FileQuestion, Users, BarChart2, Plus, BookOpen } from 'lucide-react';

const TeacherDashboard = () => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalQuizzes: 0,
    activeQuizzes: 0,
    totalStudents: 0,
    averageScore: 0
  });
  
  const [recentQuizzes, setRecentQuizzes] = useState([]);
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Fetch quizzes created by teacher
        const quizzesData = db.filter('quizzes', { teacher_id: user.id });
        
        // Get recent quizzes
        const sortedQuizzes = [...quizzesData].sort((a, b) => 
          new Date(b.created_at) - new Date(a.created_at)
        ).slice(0, 5);
        
        // Fetch total students
        const studentsCount = db.get('profiles').filter(p => p.role === 'student').length;
        
        // Fetch quiz results for average score calculation
        const quizIds = quizzesData.map(q => q.id);
        const resultsData = db.get('quiz_results').filter(r => quizIds.includes(r.quiz_id));
        
        // Calculate average score
        const totalScores = resultsData.reduce((sum, item) => sum + (item.score || 0), 0);
        const avgScore = resultsData.length > 0 ? Math.round(totalScores / resultsData.length) : 0;
        
        // Set states
        setRecentQuizzes(sortedQuizzes);
        setStats({
          totalQuizzes: quizzesData.length,
          activeQuizzes: quizzesData.filter(q => q.is_active).length,
          totalStudents: studentsCount,
          averageScore: avgScore
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
      <Layout title="Teacher Dashboard" role="teacher">
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-700"></div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout title="Teacher Dashboard" role="teacher">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm flex items-center">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
            <FileQuestion size={24} className="text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Quizzes</p>
            <p className="text-2xl font-semibold">{stats.totalQuizzes}</p>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm flex items-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
            <FileQuestion size={24} className="text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Active Quizzes</p>
            <p className="text-2xl font-semibold">{stats.activeQuizzes}</p>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm flex items-center">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
            <Users size={24} className="text-purple-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Students</p>
            <p className="text-2xl font-semibold">{stats.totalStudents}</p>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm flex items-center">
          <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mr-4">
            <BarChart2 size={24} className="text-yellow-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Average Score</p>
            <p className="text-2xl font-semibold">{stats.averageScore}%</p>
          </div>
        </div>
      </div>
      
      {/* Create Quiz and Courses Buttons */}
      <div className="mb-6 flex space-x-4">
        <Link 
          to="/teacher/create-quiz"
          className="inline-flex items-center bg-[#6E8B55] text-white px-4 py-2 rounded-lg hover:bg-[#5A7648] transition-colors"
        >
          <Plus size={18} className="mr-2" />
          Create New Quiz
        </Link>
        
        <Link 
          to="/teacher/courses"
          className="inline-flex items-center bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
        >
          <BookOpen size={18} className="mr-2" />
          Manage Courses
        </Link>
      </div>
      
      {/* Recent Quizzes */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Recent Quizzes</h2>
          <Link to="/teacher/create-quiz" className="text-sm text-[#6E8B55] hover:underline">
            Create New
          </Link>
        </div>
        
        {recentQuizzes.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Questions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentQuizzes.map((quiz) => (
                  <tr key={quiz.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{quiz.title}</div>
                      <div className="text-sm text-gray-500">{quiz.description || 'No description'}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                      {new Date(quiz.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        quiz.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {quiz.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                      {quiz.question_count || '0'} Questions
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-6">
            <FileQuestion size={48} className="mx-auto text-gray-400 mb-2" />
            <p className="text-gray-500 mb-4">You haven't created any quizzes yet</p>
            <Link 
              to="/teacher/create-quiz"
              className="inline-flex items-center bg-[#6E8B55] text-white px-4 py-2 rounded-lg hover:bg-[#5A7648] transition-colors"
            >
              <Plus size={18} className="mr-2" />
              Create Your First Quiz
            </Link>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default TeacherDashboard;