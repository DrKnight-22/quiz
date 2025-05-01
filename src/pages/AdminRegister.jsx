import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { db } from '../utils/localStorageDB';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { AuthContext } from '../App';
import { useContext } from 'react';

const AdminRegister = () => {
  const navigate = useNavigate();
  const { registerUser } = useContext(AuthContext);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    confirmPassword: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password || !formData.fullName || !formData.confirmPassword) {
      setError('All fields are required');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const { error } = await registerUser({
        email: formData.email,
        password: formData.password,
        full_name: formData.fullName,
        role: 'admin'
      });
      
      if (error) {
        setError(error.message);
        return;
      }
      
      // Redirect to login after successful registration
      navigate('/login/admin');
      
    } catch (error) {
      console.error('Registration error:', error);
      setError('An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-[#E6F0DA] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-purple-700 p-4 text-white text-center">
          <h1 className="text-2xl font-bold">Admin Registration</h1>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg">
              {error}
            </div>
          )}
          
          <div className="mb-4">
            <label htmlFor="fullName" className="block text-gray-700 mb-2">Full Name</label>
            <input
              type="text"
              id="fullName"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
              placeholder="Enter your full name"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700 mb-2">Email Address</label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
              placeholder="Enter your email"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="password" className="block text-gray-700 mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                placeholder="Enter your password"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          
          <div className="mb-6">
            <label htmlFor="confirmPassword" className="block text-gray-700 mb-2">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                placeholder="Confirm your password"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          
          <button
            type="submit"
            className="w-full bg-purple-700 text-white py-2 rounded-lg hover:bg-purple-800 transition-colors"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                Registering...
              </span>
            ) : (
              'Register'
            )}
          </button>
          
          <div className="mt-4 text-center">
            <Link to="/login/admin" className="inline-flex items-center text-purple-700 hover:underline">
              <ArrowLeft size={16} className="mr-1" />
              Back to Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminRegister;