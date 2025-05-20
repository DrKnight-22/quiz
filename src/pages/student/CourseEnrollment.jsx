import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, where, addDoc, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Button from '../../components/ui/Button';
import { BookOpen, Search, X, Check, Clock } from 'lucide-react';

const CourseEnrollment = () => {
  const { currentUser } = useAuth();
  const [courses, setCourses] = useState([]);
  const [userEnrollments, setUserEnrollments] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [userName, setUserName] = useState('');
  const [activeTab, setActiveTab] = useState('available');

  // Fetch available courses and user enrollments
  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;
      
      try {
        // Get user details
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          setUserName(userDoc.data().name || userDoc.data().email || 'Student');
        }
        
        // Get all courses
        const coursesSnapshot = await getDocs(collection(db, 'courses'));
        const coursesData = coursesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Get user enrollments
        const enrollmentsQuery = query(
          collection(db, 'enrollments'),
          where('studentId', '==', currentUser.uid)
        );
        const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
        const enrollmentsData = enrollmentsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Combine enrollments with course data
        const enrichedEnrollments = await Promise.all(
          enrollmentsData.map(async (enrollment) => {
            const courseDoc = await getDoc(doc(db, 'courses', enrollment.courseId));
            return {
              ...enrollment,
              course: courseDoc.exists() ? { id: courseDoc.id, ...courseDoc.data() } : null
            };
          })
        );
        
        setCourses(coursesData);
        setUserEnrollments(enrichedEnrollments);
        setFilteredCourses(coursesData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching courses:', error);
        toast.error('Failed to load courses');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [currentUser]);

  // Filter courses based on search and enrollment status
  useEffect(() => {
    if (!courses.length) return;
    
    let result = [...courses];
    
    // Filter out already enrolled courses when on "available" tab
    if (activeTab === 'available') {
      const enrolledCourseIds = userEnrollments.map(enrollment => enrollment.courseId);
      result = result.filter(course => !enrolledCourseIds.includes(course.id));
    }
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(course => 
        course.name?.toLowerCase().includes(term) || 
        course.description?.toLowerCase().includes(term) ||
        course.teacherName?.toLowerCase().includes(term) ||
        course.gradeLevel?.toLowerCase().includes(term)
      );
    }
    
    setFilteredCourses(result);
  }, [courses, userEnrollments, searchTerm, activeTab]);

  // Enroll in a course
  const enrollInCourse = async (courseId, courseName, teacherId, teacherName) => {
    try {
      // Check if already enrolled
      const existingEnrollment = userEnrollments.find(
        enrollment => enrollment.courseId === courseId
      );
      
      if (existingEnrollment) {
        toast.error('You are already enrolled in this course');
        return;
      }
      
      // Create enrollment document
      const enrollmentData = {
        courseId,
        courseName,
        studentId: currentUser.uid,
        studentName: userName,
        studentEmail: currentUser.email,
        teacherId,
        courseTeacherId: teacherId, // This is for Firestore rules
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      
      await addDoc(collection(db, 'enrollments'), enrollmentData);
      
      // Update local state
      setUserEnrollments([
        ...userEnrollments,
        {
          ...enrollmentData,
          course: { id: courseId, name: courseName, teacherName }
        }
      ]);
      
      toast.success('Enrollment request sent successfully!');
    } catch (error) {
      console.error('Error enrolling in course:', error);
      toast.error('Failed to enroll in course');
    }
  };

  // Cancel enrollment
  const cancelEnrollment = async (enrollmentId) => {
    try {
      await deleteDoc(doc(db, 'enrollments', enrollmentId));
      
      // Update local state
      setUserEnrollments(userEnrollments.filter(enrollment => enrollment.id !== enrollmentId));
      
      toast.success('Enrollment canceled successfully!');
    } catch (error) {
      console.error('Error canceling enrollment:', error);
      toast.error('Failed to cancel enrollment');
    }
  };

  return (
    <DashboardLayout title="Course Enrollment">
      <div className="animate-fade-in">
        {/* Tabs */}
        <div className="mb-6 flex border-b border-gray-200">
          <button
            className={`py-2 px-4 text-sm font-medium transition-colors ${
              activeTab === 'available'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('available')}
          >
            Available Courses
          </button>
          <button
            className={`py-2 px-4 text-sm font-medium transition-colors ${
              activeTab === 'enrolled'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('enrolled')}
          >
            My Enrollments
          </button>
        </div>
        
        {/* Search Bar */}
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search courses..."
            className="pl-10 pr-4 py-2 w-full rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              className="absolute inset-y-0 right-0 flex items-center pr-3"
              onClick={() => setSearchTerm('')}
            >
              <X size={18} className="text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : activeTab === 'available' ? (
          // Available Courses Grid
          <>
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Available Courses</h2>
            
            {filteredCourses.length === 0 ? (
              <div className="bg-white rounded-lg shadow-soft p-8 text-center">
                <BookOpen size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">No Courses Available</h3>
                <p className="text-gray-500">
                  {searchTerm ? 'No courses match your search criteria.' : 'There are no available courses at the moment.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.map((course) => (
                  <div key={course.id} className="bg-white rounded-lg shadow-soft overflow-hidden transition-transform duration-200 hover:translate-y-[-4px]">
                    <div className="p-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">{course.name}</h3>
                      <p className="text-sm text-gray-500 mb-1">
                        <span className="font-medium">Teacher:</span> {course.teacherName || 'Unknown Teacher'}
                      </p>
                      <p className="text-sm text-gray-500 mb-4">
                        <span className="font-medium">Grade:</span> {course.gradeLevel || 'N/A'}
                      </p>
                      <p className="text-sm text-gray-600 mb-6 line-clamp-3">
                        {course.description || 'No description available.'}
                      </p>
                      <Button
                        variant="primary"
                        className="w-full"
                        onClick={() => enrollInCourse(
                          course.id,
                          course.name,
                          course.teacherId,
                          course.teacherName
                        )}
                      >
                        Enroll in Course
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          // My Enrollments Table
          <>
            <h2 className="text-xl font-semibold text-gray-700 mb-4">My Enrollments</h2>
            
            {userEnrollments.length === 0 ? (
              <div className="bg-white rounded-lg shadow-soft p-8 text-center">
                <BookOpen size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">No Enrollments Yet</h3>
                <p className="text-gray-500 mb-4">
                  You haven't enrolled in any courses yet.
                </p>
                <Button
                  variant="primary"
                  onClick={() => setActiveTab('available')}
                >
                  Browse Available Courses
                </Button>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-soft overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Course
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Teacher
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
                    {userEnrollments.map((enrollment) => (
                      <tr key={enrollment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {enrollment.courseName || 'Unknown Course'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {enrollment.course?.gradeLevel || 'Unknown Grade'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-500">
                            {enrollment.course?.teacherName || 'Unknown Teacher'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                            ${enrollment.status === 'approved' 
                              ? 'bg-success-100 text-success-800' 
                              : enrollment.status === 'rejected'
                              ? 'bg-error-100 text-error-800'
                              : 'bg-warning-100 text-warning-800'
                            }`}>
                            {enrollment.status === 'approved' ? (
                              <><Check size={12} className="mr-1" /> Approved</>
                            ) : enrollment.status === 'rejected' ? (
                              <><X size={12} className="mr-1" /> Rejected</>
                            ) : (
                              <><Clock size={12} className="mr-1" /> Pending</>
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {enrollment.status !== 'approved' && (
                            <Button
                              variant="ghost"
                              onClick={() => cancelEnrollment(enrollment.id)}
                              className="text-gray-500 hover:text-error-600"
                            >
                              Cancel
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CourseEnrollment;