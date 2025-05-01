import { useState, useContext, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../App';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const { role } = useParams();
  const { user, userRole, signIn } = useContext(AuthContext); // Properly destructure signIn
  const navigate = useNavigate();
  

  // Redirect if already logged in
  useEffect(() => {
    if (user && userRole) {
      navigate(`/${userRole}/dashboard`);
    }
  }, [user, userRole, navigate]);
  
  // Get role title and color
  const getRoleInfo = () => {
    switch(role) {
      case 'student':
        return { title: 'Student Login', color: 'bg-green-700' };
      case 'teacher':
        return { title: 'Teacher Login', color: 'bg-blue-700' };
      case 'admin':
        return { title: 'Admin Login', color: 'bg-purple-700' };
      default:
        return { title: 'Login', color: 'bg-[#6E8B55]' };
    }
  };
  
  const { title, color } = getRoleInfo();
  
  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Use await to ensure signIn completes
      const { data, error } = await signIn(email, password);
      
      if (error) {
        setError(error.message);
        return;
      }
  
      // Get the updated userRole from context after signIn
      const { userRole: currentRole } = useContext(AuthContext);
      
      // Ensure we have a role before navigating
      if (!currentRole) {
        throw new Error('User role not found');
      }
      
      // Navigate using the current role
      navigate(`/${currentRole}/dashboard`);
      
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-[#E6F0DA] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg overflow-hidden">
        <div className={`${color} p-4 text-white text-center`}>
          <h1 className="text-2xl font-bold">{title}</h1>
        </div>
        
        <form onSubmit={handleLogin} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg">
              {error}
            </div>
          )}
          
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700 mb-2">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
              placeholder="Enter your email"
              required
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="password" className="block text-gray-700 mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                placeholder="Enter your password"
                required
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
          
          <button
            type="submit"
            className={`w-full ${color} text-white py-2 rounded-lg hover:opacity-90 transition-opacity`}
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                Logging in...
              </span>
            ) : (
              'Login'
            )}
          </button>
          
          <div className="mt-4 text-center space-y-2">
            {role === 'admin' && (
              <Link to="/register/admin" className="block text-purple-700 hover:underline">
                Register as Admin
              </Link>
            )}
            <Link to="/" className="inline-flex items-center text-[#6E8B55] hover:underline">
              <ArrowLeft size={16} className="mr-1" />
              Back to Role Selection
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;