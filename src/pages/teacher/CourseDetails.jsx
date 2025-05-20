import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { BookOpen, Plus, Edit, Trash2, Check, X, Users } from 'lucide-react';

const CourseDetails = () => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const { currentUser } = useAuth();
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [activeTab, setActiveTab] = useState('courses');
  const [selectedCourse, setSelectedCourse] = useState(null);

  // Fetch teacher's courses
  const fetchCourses = async () => {
    if (!currentUser) return;
    
    try {
      const coursesQuery = query(
        collection(db, 'courses'),
        where('teacherId', '==', currentUser.uid)
      );
      const coursesSnapshot = await getDocs(coursesQuery);
      const coursesData = coursesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setCourses(coursesData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast.error('Failed to load courses');
      setLoading(false);
    }
  };

  // Fetch enrollments for a specific course
  const fetchEnrollments = async (courseId) => {
    try {
      const enrollmentsQuery = query(
        collection(db, 'enrollments'),
        where('courseId', '==', courseId)
      );
      const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
      const enrollmentsData = enrollmentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setEnrollments(enrollmentsData);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      toast.error('Failed to load enrollments');
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [currentUser]);

  // Create a new course
  const createCourse = async (data) => {
    setLoading(true);
    
    try {
      const courseData = {
        name: data.name,
        description: data.description,
        gradeLevel: data.gradeLevel,
        teacherId: currentUser.uid,
        teacherName: currentUser.displayName || 'Unknown Teacher',
        createdAt: new Date().toISOString()
      };
      
      await addDoc(collection(db, 'courses'), courseData);
      
      toast.success('Course created successfully!');
      reset();
      setIsCreating(false);
      fetchCourses();
    } catch (error) {
      console.error('Error creating course:', error);
      toast.error('Failed to create course');
    } finally {
      setLoading(false);
    }
  };

  // Update a course
  const updateCourse = async (data) => {
    if (!editingCourse) return;
    
    setLoading(true);
    
    try {
      const courseRef = doc(db, 'courses', editingCourse.id);
      await updateDoc(courseRef, {
        name: data.name,
        description: data.description,
        gradeLevel: data.gradeLevel,
        updatedAt: new Date().toISOString()
      });
      
      toast.success('Course updated successfully!');
      reset();
      setEditingCourse(null);
      fetchCourses();
    } catch (error) {
      console.error('Error updating course:', error);
      toast.error('Failed to update course');
    } finally {
      setLoading(false);
    }
  };

  // Delete a course
  const deleteCourse = async (courseId) => {
    if (window.confirm('Are you sure you want to delete this course? This will also delete all associated quizzes and enrollments.')) {
      setLoading(true);
      
      try {
        await deleteDoc(doc(db, 'courses', courseId));
        
        // Note: In a production app, you would also want to delete or update related data 
        // (quizzes, enrollments, etc.) either here or with a Firestore trigger
        
        toast.success('Course deleted successfully!');
        fetchCourses();
      } catch (error) {
        console.error('Error deleting course:', error);
        toast.error('Failed to delete course');
      } finally {
        setLoading(false);
      }
    }
  };

  // Handle enrollment approval/rejection
  const updateEnrollmentStatus = async (enrollmentId, status) => {
    try {
      const enrollmentRef = doc(db, 'enrollments', enrollmentId);
      await updateDoc(enrollmentRef, {
        status,
        updatedAt: new Date().toISOString()
      });
      
      // Update the UI
      setEnrollments(enrollments.map(enrollment => 
        enrollment.id === enrollmentId ? { ...enrollment, status } : enrollment
      ));
      
      toast.success(`Enrollment ${status === 'approved' ? 'approved' : 'rejected'}`);
    } catch (error) {
      console.error('Error updating enrollment:', error);
      toast.error('Failed to update enrollment status');
    }
  };

  // Handle form submission
  const onSubmit = async (data) => {
    if (editingCourse) {
      await updateCourse(data);
    } else {
      await createCourse(data);
    }
  };

  return (
    <DashboardLayout title="Course Management">
      <div className="animate-fade-in">
        {/* Tabs */}
        <div className="mb-6 flex border-b border-gray-200">
          <button
            className={`py-2 px-4 text-sm font-medium transition-colors ${
              activeTab === 'courses'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => {
              setActiveTab('courses');
              setSelectedCourse(null);
            }}
          >
            <BookOpen size={16} className="inline mr-2" />
            My Courses
          </button>
          {selectedCourse && (
            <button
              className={`py-2 px-4 text-sm font-medium transition-colors ${
                activeTab === 'enrollments'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('enrollments')}
            >
              <Users size={16} className="inline mr-2" />
              Enrollments
            </button>
          )}
        </div>
        
        {/* Courses Tab */}
        {activeTab === 'courses' && (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-700">Your Courses</h2>
              {!isCreating && !editingCourse && (
                <Button
                  variant="primary"
                  onClick={() => setIsCreating(true)}
                  className="flex items-center"
                >
                  <Plus size={18} className="mr-1" />
                  Create Course
                </Button>
              )}
            </div>
            
            {/* Course Form */}
            {(isCreating || editingCourse) && (
              <div className="bg-white rounded-lg shadow-soft p-6 mb-6">
                <h3 className="text-lg font-medium text-gray-700 mb-4">
                  {editingCourse ? 'Edit Course' : 'Create New Course'}
                </h3>
                
                <form onSubmit={handleSubmit(onSubmit)}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Course Name"
                      placeholder="e.g., Introduction to Mathematics"
                      defaultValue={editingCourse?.name || ''}
                      {...register('name', { required: 'Course name is required' })}
                      error={errors.name?.message}
                    />
                    
                    <Input
                      label="Grade Level"
                      placeholder="e.g., 9th Grade"
                      defaultValue={editingCourse?.gradeLevel || ''}
                      {...register('gradeLevel', { required: 'Grade level is required' })}
                      error={errors.gradeLevel?.message}
                    />
                  </div>
                  
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Course Description
                    </label>
                    <textarea
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      rows={4}
                      placeholder="Describe what students will learn in this course"
                      defaultValue={editingCourse?.description || ''}
                      {...register('description', { required: 'Description is required' })}
                    ></textarea>
                    {errors.description && (
                      <p className="mt-1 text-sm text-error-500">{errors.description.message}</p>
                    )}
                  </div>
                  
                  <div className="mt-6 flex justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        reset();
                        setIsCreating(false);
                        setEditingCourse(null);
                      }}
                      className="mr-2"
                    >
                      Cancel
                    </Button>
                    <Button type="submit" variant="primary" disabled={loading}>
                      {loading ? 'Saving...' : editingCourse ? 'Update Course' : 'Create Course'}
                    </Button>
                  </div>
                </form>
              </div>
            )}
            
            {/* Courses List */}
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : courses.length === 0 ? (
              <div className="bg-white rounded-lg shadow-soft p-8 text-center">
                <BookOpen size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">No Courses Yet</h3>
                <p className="text-gray-500 mb-4">
                  You haven't created any courses yet. Get started by creating your first course.
                </p>
                {!isCreating && (
                  <Button
                    variant="primary"
                    onClick={() => setIsCreating(true)}
                    className="flex items-center mx-auto"
                  >
                    <Plus size={18} className="mr-1" />
                    Create Your First Course
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course) => (
                  <div key={course.id} className="bg-white rounded-lg shadow-soft overflow-hidden">
                    <div className="p-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">{course.name}</h3>
                      <p className="text-sm text-gray-500 mb-4">Grade Level: {course.gradeLevel}</p>
                      <p className="text-sm text-gray-600 mb-6 line-clamp-3">
                        {course.description}
                      </p>
                      <div className="flex justify-between">
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            onClick={() => {
                              setEditingCourse(course);
                              setIsCreating(false);
                              // Pre-fill the form
                              reset({
                                name: course.name,
                                description: course.description,
                                gradeLevel: course.gradeLevel
                              });
                            }}
                            className="text-gray-600 p-2"
                          >
                            <Edit size={18} />
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => deleteCourse(course.id)}
                            className="text-error-600 p-2"
                          >
                            <Trash2 size={18} />
                          </Button>
                        </div>
                        <Button
                          variant="primary"
                          onClick={() => {
                            setSelectedCourse(course);
                            setActiveTab('enrollments');
                            fetchEnrollments(course.id);
                          }}
                        >
                          Manage
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
        
        {/* Enrollments Tab */}
        {activeTab === 'enrollments' && selectedCourse && (
          <>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-700">
                {selectedCourse.name} - Enrollments
              </h2>
              <p className="text-gray-500">{selectedCourse.gradeLevel}</p>
            </div>
            
            <div className="bg-white rounded-lg shadow-soft overflow-hidden">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-700 mb-4">Student Enrollment Requests</h3>
                
                {enrollments.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-gray-500">No enrollment requests yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Student
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Request Date
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {enrollments.map((enrollment) => (
                          <tr key={enrollment.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {enrollment.studentName || 'Unknown Student'}
                              </div>
                              <div className="text-sm text-gray-500">{enrollment.studentEmail}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">
                                {enrollment.createdAt ? new Date(enrollment.createdAt).toLocaleDateString() : 'Unknown'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                ${enrollment.status === 'approved' 
                                  ? 'bg-success-100 text-success-800' 
                                  : enrollment.status === 'rejected'
                                  ? 'bg-error-100 text-error-800'
                                  : 'bg-warning-100 text-warning-800'
                                }`}>
                                {enrollment.status === 'approved' 
                                  ? 'Approved' 
                                  : enrollment.status === 'rejected'
                                  ? 'Rejected'
                                  : 'Pending'
                                }
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              {enrollment.status === 'pending' && (
                                <div className="flex justify-end space-x-2">
                                  <Button
                                    variant="ghost"
                                    onClick={() => updateEnrollmentStatus(enrollment.id, 'approved')}
                                    className="text-success-600 p-2"
                                  >
                                    <Check size={18} />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    onClick={() => updateEnrollmentStatus(enrollment.id, 'rejected')}
                                    className="text-error-600 p-2"
                                  >
                                    <X size={18} />
                                  </Button>
                                </div>
                              )}
                              {enrollment.status !== 'pending' && (
                                <span className="text-gray-500">-</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CourseDetails;