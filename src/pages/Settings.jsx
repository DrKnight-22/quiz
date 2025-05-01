import { useState, useContext, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { AuthContext } from '../App';
import { db } from '../utils/localStorageDB';
import { Save, User } from 'lucide-react';

const Settings = () => {
  const { user, userRole } = useContext(AuthContext);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  useEffect(() => {
    const fetchProfile = async () => {
      if (user?.id) {
        const profile = db.getById('profiles', user.id);
        if (profile) {
          setFullName(profile.full_name || '');
          setEmail(profile.email || user.email);
        }
      }
    };
    
    fetchProfile();
  }, [user]);

  const updateProfile = async (e) => {
    e.preventDefault();
    
    if (!fullName.trim()) {
      setMessage({ text: 'Full name is required', type: 'error' });
      return;
    }
    
    setLoading(true);
    setMessage({ text: '', type: '' });
    
    try {
      // Update profile in profiles table
      db.update('profiles', user.id, { full_name: fullName });
      
      // Also update in users table if exists
      const userData = db.getById('users', user.id);
      if (userData) {
        db.update('users', user.id, { full_name: fullName });
      }
      
      setMessage({ text: 'Profile updated successfully!', type: 'success' });
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ text: error.message || 'An error occurred', type: 'error' });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Layout title="Settings" role={userRole}>
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-6">Profile Settings</h2>
        
        {message.text && (
          <div className={`p-3 mb-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {message.text}
          </div>
        )}
        
        <div className="flex flex-col md:flex-row gap-6">
          {/* Profile picture section */}
          <div className="md:w-1/3 flex flex-col items-center mb-6 md:mb-0">
            <div className="w-32 h-32 bg-[#B7D3AC] rounded-full flex items-center justify-center mb-4">
              <User size={48} className="text-[#4A6741]" />
            </div>
            <p className="text-sm text-gray-500 text-center">
              Profile picture functionality coming soon
            </p>
          </div>
          
          {/* Profile form */}
          <div className="md:w-2/3">
            <form onSubmit={updateProfile}>
              <div className="mb-4">
                <label htmlFor="fullName" className="block text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                  placeholder="Enter your full name"
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="email" className="block text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  disabled
                  className="w-full px-4 py-2 border bg-gray-50 rounded-lg cursor-not-allowed"
                  placeholder="Your email address"
                />
                <p className="text-sm text-gray-500 mt-1">Email address cannot be changed</p>
              </div>
              
              <div className="flex items-center justify-between mt-6">
                <Link
                  to="/change-password"
                  className="text-[#6E8B55] hover:underline"
                >
                  Change Password
                </Link>
                
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#6E8B55] text-white rounded-lg hover:bg-[#5A7648] transition-colors flex items-center"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={16} className="mr-2" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Settings;