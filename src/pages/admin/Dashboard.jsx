import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import { AuthContext } from '../../App';
import { db } from '../../utils/localStorageDB';
import { Users, BookOpen, CheckCircle2, FileQuestion, Plus } from 'lucide-react';

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalQuizzes: 0,
    totalCourses: 0
  });
  
  const [recentStudents, setRecentStudents] = useState([]);
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Fetch statistics
        const studentsCount = db.get('profiles').filter(p => p.role === 'student').length;
        const teachersCount = db.get('profiles').filter(p => p.role === 'teacher').length;
        const quizzesCount = db.get('quizzes').length;
        const coursesCount = db.get('courses').length;
        
        // Fetch recent students
        const recentStudentsData = db.get('profiles')
          .filter(p => p.role === 'student')
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 5);
        
        setStats({
          totalStudents: studentsCount,
          totalTeachers: teachersCount,
          totalQuizzes: quizzesCount,
          totalCourses: coursesCount
        });
        
        setRecentStudents(recentStudentsData);
        
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
      <Layout title="Admin Dashboard" role="admin">
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-700"></div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout title="Admin Dashboard" role="admin">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm flex items-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
            <Users size={24} className="text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Students</p>
            <p className="text-2xl font-semibold">{stats.totalStudents}</p>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm flex items-center">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
            <Users size={24} className="text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Teachers</p>
            <p className="text-2xl font-semibold">{stats.totalTeachers}</p>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm flex items-center">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
            <FileQuestion size={24} className="text-purple-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Quizzes</p>
            <p className="text-2xl font-semibold">{stats.totalQuizzes}</p>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm flex items-center">
          <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mr-4">
            <BookOpen size={24} className="text-indigo-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Courses</p>
            <p className="text-2xl font-semibold">{stats.totalCourses}</p>
          </div>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Link 
          to="/admin/add-student"
          className="bg-white p-4 rounded-lg shadow-sm flex items-center hover:bg-gray-50 transition-colors"
        >
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-4">
            <Plus size={20} className="text-green-600" />
          </div>
          <div>
            <p className="font-medium">Add Student</p>
            <p className="text-sm text-gray-500">Register a new student</p>
          </div>
        </Link>
        
        <Link 
          to="/admin/add-teacher"
          className="bg-white p-4 rounded-lg shadow-sm flex items-center hover:bg-gray-50 transition-colors"
        >
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
            <Plus size={20} className="text-blue-600" />
          </div>
          <div>
            <p className="font-medium">Add Teacher</p>
            <p className="text-sm text-gray-500">Register a new teacher</p>
          </div>
        </Link>
        
        <Link 
          to="/admin/questions"
          className="bg-white p-4 rounded-lg shadow-sm flex items-center hover:bg-gray-50 transition-colors"
        >
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-4">
            <FileQuestion size={20} className="text-purple-600" />
          </div>
          <div>
            <p className="font-medium">Manage Questions</p>
            <p className="text-sm text-gray-500">View and edit quiz questions</p>
          </div>
        </Link>
      </div>
      
      {/* Recent Students */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Recent Students</h2>
          <Link to="/admin/students" className="text-sm text-[#6E8B55] hover:underline">
            View All
          </Link>
        </div>
        
        {recentStudents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date Added
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{student.full_name || 'No name'}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-gray-500">{student.email || 'No email'}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Active
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                      {new Date(student.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 py-4 text-center">No students registered yet.</p>
        )}
      </div>
    </Layout>
  );
};

export default AdminDashboard;