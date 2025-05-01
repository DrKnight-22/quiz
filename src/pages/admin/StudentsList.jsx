import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import { AuthContext } from '../../App';
import { db } from '../../utils/localStorageDB';
import { Plus, Search, UserPlus } from 'lucide-react';

const StudentsList = () => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        
        const students = db.get('profiles')
          .filter(p => p.role === 'student')
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        setStudents(students);
      } catch (error) {
        console.error('Error fetching students:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStudents();
  }, []);
  
  const filteredStudents = students.filter(student =>
    student.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  if (loading) {
    return (
      <Layout title="Students List" role="admin">
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-700"></div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout title="Students List" role="admin">
      <div className="bg-white rounded-lg shadow-sm p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6">
          <div className="relative w-full md:w-64 mb-4 md:mb-0">
            <input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          </div>
          
          <Link
            to="/admin/add-student"
            className="w-full md:w-auto px-4 py-2 bg-[#6E8B55] text-white rounded-lg hover:bg-[#5A7648] transition-colors flex items-center justify-center"
          >
            <UserPlus size={18} className="mr-2" />
            Add New Student
          </Link>
        </div>
        
        {/* Students Table */}
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
                  Joined Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{student.full_name || 'No name'}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-gray-500">{student.email}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Active
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-gray-500">
                    {new Date(student.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredStudents.length === 0 && (
            <div className="text-center py-12">
              <UserPlus size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 mb-4">No students found</p>
              <Link
                to="/admin/add-student"
                className="inline-flex items-center px-4 py-2 bg-[#6E8B55] text-white rounded-lg hover:bg-[#5A7648] transition-colors"
              >
                <Plus size={18} className="mr-2" />
                Add First Student
              </Link>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default StudentsList;