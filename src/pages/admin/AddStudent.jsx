import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { AuthContext } from '../../App';
import { db } from '../../utils/localStorageDB';
import { Save, UserPlus } from 'lucide-react';

const AddStudent = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.fullName || !formData.email || !formData.password) {
      setError('All fields are required');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Check if email already exists
      const existingUser = db.find('users', { email: formData.email });
      if (existingUser) {
        setError('Email already registered');
        return;
      }
      
      // Create user
      const { data: userData } = db.insert('users', {
        email: formData.email,
        password: formData.password,
        full_name: formData.fullName,
        role: 'student'
      });
      
      // Create profile
      db.insert('profiles', {
        id: userData.id,
        full_name: formData.fullName,
        email: formData.email,
        role: 'student'
      });
      
      // Success - redirect to students list
      navigate('/admin/students');
      
    } catch (error) {
      console.error('Error adding student:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Layout title="Add New Student" role="admin">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center mb-6">
          <UserPlus size={24} className="text-[#6E8B55] mr-2" />
          <h2 className="text-xl font-semibold">Add New Student</h2>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="fullName" className="block text-gray-700 mb-2">Full Name</label>
            <input
              type="text"
              id="fullName"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
              placeholder="Enter student's full name"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700 mb-2">Email Address</label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
              placeholder="Enter student's email"
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="password" className="block text-gray-700 mb-2">Password</label>
            <input
              type="password"
              id="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
              placeholder="Enter temporary password"
            />
            <p className="mt-1 text-sm text-gray-500">
              Student can change this password after first login
            </p>
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-[#6E8B55] text-white rounded-lg hover:bg-[#5A7648] transition-colors flex items-center"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                  Adding Student...
                </>
              ) : (
                <>
                  <Save size={18} className="mr-2" />
                  Add Student
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default AddStudent;