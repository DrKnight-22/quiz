import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { AuthContext } from '../App';
import { db } from '../utils/localStorageDB';
import { Eye, EyeOff, Save } from 'lucide-react';

const ChangePassword = () => {
  const { user, userRole } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setMessage({ text: 'All fields are required', type: 'error' });
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setMessage({ text: 'New passwords do not match', type: 'error' });
      return;
    }
    
    if (newPassword.length < 6) {
      setMessage({ text: 'New password must be at least 6 characters', type: 'error' });
      return;
    }
    
    setLoading(true);
    setMessage({ text: '', type: '' });
    
    try {
      // Verify current password
      const userData = db.getById('users', user.id);
      if (!userData || userData.password !== currentPassword) {
        setMessage({ text: 'Current password is incorrect', type: 'error' });
        return;
      }
      
      // Update the password
      db.update('users', user.id, { password: newPassword });
      
      setMessage({ text: 'Password updated successfully!', type: 'success' });
      
      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      // Redirect to settings after 2 seconds
      setTimeout(() => {
        navigate('/settings');
      }, 2000);
      
    } catch (error) {
      console.error('Error changing password:', error);
      setMessage({ text: error.message || 'An error occurred', type: 'error' });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Layout title="Change Password" role={userRole}>
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-6">Change Your Password</h2>
        
        {message.text && (
          <div className={`p-3 mb-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {message.text}
          </div>
        )}
        
        <form onSubmit={handleChangePassword}>
          <div className="mb-4">
            <label htmlFor="currentPassword" className="block text-gray-700 mb-2">Current Password</label>
            <div className="relative">
              <input
                type={showCurrentPassword ? "text" : "password"}
                id="currentPassword"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                placeholder="Enter your current password"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          
          <div className="mb-4">
            <label htmlFor="newPassword" className="block text-gray-700 mb-2">New Password</label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                placeholder="Enter your new password"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          
          <div className="mb-6">
            <label htmlFor="confirmPassword" className="block text-gray-700 mb-2">Confirm New Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                placeholder="Confirm your new password"
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
            className="w-full px-4 py-2 bg-[#6E8B55] text-white rounded-lg hover:bg-[#5A7648] transition-colors flex items-center justify-center"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                Updating...
              </>
            ) : (
              <>
                <Save size={16} className="mr-2" />
                Update Password
              </>
            )}
          </button>
        </form>
      </div>
    </Layout>
  );
};

export default ChangePassword;