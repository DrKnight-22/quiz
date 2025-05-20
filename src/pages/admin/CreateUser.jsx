import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { UserPlus, GraduationCap, School, ChevronDown } from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase/config';

const CreateUser = () => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const [userType, setUserType] = useState('student');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { register: registerUser } = useAuth();

  const [adminCreds, setAdminCreds] = useState({ email: '', password: '' });

  useEffect(() => {
    const email = localStorage.getItem('adminEmail');
    const password = localStorage.getItem('adminPassword');
    if (email && password) {
      setAdminCreds({ email, password });
    } else {
      toast.error('Admin credentials not found. Please log in again.');
    }
  }, []);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const userData = {
        name: data.name,
        address: data.address,
        phone: data.phone,
      };

      if (userType === 'student') {
        userData.yearLevel = data.yearLevel;
        userData.studentId = data.studentId;
      } else {
        userData.gradeLevel = data.gradeLevel;
        userData.subject = data.subject;
        userData.employeeId = data.employeeId;
      }

      await registerUser(data.email, data.password, userType, userData);

      await signInWithEmailAndPassword(auth, adminCreds.email, adminCreds.password);

      toast.success(`${userType.charAt(0).toUpperCase() + userType.slice(1)} account created successfully!`, {
        icon: userType === 'student' ? <GraduationCap size={20} /> : <School size={20} />,
        style: {
          background: '#f0fdf4',
          color: '#166534',
          border: '1px solid #bbf7d0',
        }
      });

      reset();
    } catch (error) {
      console.error('Create user error:', error);
      let errorMessage = `Failed to create ${userType} account.`;

      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Email is already in use.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Email address is not valid.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password must be at least 6 characters.';
      }

      toast.error(errorMessage, {
        style: {
          background: '#fef2f2',
          color: '#b91c1c',
          border: '1px solid #fecaca',
        }
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="Create User Account">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-medium p-8 animate-fade-in">
        <h1 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
          <UserPlus size={28} />
          Create a New {userType === 'student' ? 'Student' : 'Teacher'} Account
        </h1>

        <div className="flex items-center mb-6">
          <span className="text-sm font-medium text-gray-600 mr-3">Account Type:</span>
          <button
            onClick={() => setUserType('student')}
            className={`px-4 py-2 rounded-full text-sm font-semibold focus:outline-none transition-all duration-200 ${userType === 'student' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}
          >
            Student
          </button>
          <button
            onClick={() => setUserType('teacher')}
            className={`ml-2 px-4 py-2 rounded-full text-sm font-semibold focus:outline-none transition-all duration-200 ${userType === 'teacher' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}
          >
            Teacher
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Full Name"
            {...register('name', { required: 'Name is required' })}
            error={errors.name?.message}
          />
          <Input
            label="Email"
            type="email"
            {...register('email', { required: 'Email is required' })}
            error={errors.email?.message}
          />
          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters',
                },
              })}
              error={errors.password?.message}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-9 text-sm text-gray-500 focus:outline-none"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>

          <Input
            label="Phone Number"
            type="tel"
            {...register('phone', { required: 'Phone number is required' })}
            error={errors.phone?.message}
          />
          <Input
            label="Address"
            {...register('address', { required: 'Address is required' })}
            error={errors.address?.message}
          />

          {userType === 'student' ? (
            <>
              <Input
                label="Year Level"
                {...register('yearLevel', { required: 'Year level is required' })}
                error={errors.yearLevel?.message}
              />
              <Input
                label="Student ID"
                {...register('studentId', { required: 'Student ID is required' })}
                error={errors.studentId?.message}
              />
            </>
          ) : (
            <>
              <Input
                label="Grade Level"
                {...register('gradeLevel', { required: 'Grade level is required' })}
                error={errors.gradeLevel?.message}
              />
              <Input
                label="Subject"
                {...register('subject', { required: 'Subject is required' })}
                error={errors.subject?.message}
              />
              <Input
                label="Employee ID"
                {...register('employeeId', { required: 'Employee ID is required' })}
                error={errors.employeeId?.message}
              />
            </>
          )}

          <div className="sm:col-span-2 mt-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating...' : `Create ${userType === 'student' ? 'Student' : 'Teacher'} Account`}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default CreateUser;
