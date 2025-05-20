import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Plus, Trash2, FilePlus, Save } from 'lucide-react';

const CreateQuiz = () => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const { currentUser } = useAuth();
  const [courses, setCourses] = useState([]);
  const [questions, setQuestions] = useState([
    { text: '', options: ['', '', '', ''], correctAnswer: 0 }
  ]);
  const [loading, setLoading] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState('');

  // Fetch courses taught by the teacher
  useEffect(() => {
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
        
        // Set the first course as selected by default
        if (coursesData.length > 0) {
          setSelectedCourse(coursesData[0].id);
        }
      } catch (error) {
        console.error('Error fetching courses:', error);
        toast.error('Failed to load courses');
      }
    };
    
    fetchCourses();
  }, [currentUser]);

  // Handle question changes
  const handleQuestionChange = (index, field, value) => {
    const updatedQuestions = [...questions];
    
    if (field === 'text') {
      updatedQuestions[index].text = value;
    } else if (field.startsWith('option')) {
      const optionIndex = parseInt(field.replace('option', ''), 10);
      updatedQuestions[index].options[optionIndex] = value;
    } else if (field === 'correctAnswer') {
      updatedQuestions[index].correctAnswer = parseInt(value, 10);
    }
    
    setQuestions(updatedQuestions);
  };

  // Add a new question
  const addQuestion = () => {
    setQuestions([
      ...questions,
      { text: '', options: ['', '', '', ''], correctAnswer: 0 }
    ]);
  };

  // Remove a question
  const removeQuestion = (index) => {
    if (questions.length <= 1) {
      toast.error('At least one question is required');
      return;
    }
    
    const updatedQuestions = [...questions];
    updatedQuestions.splice(index, 1);
    setQuestions(updatedQuestions);
  };

  // Handle form submission
  const onSubmit = async (data) => {
    if (!selectedCourse) {
      toast.error('Please select a course');
      return;
    }
    
    // Validate that all questions have text and options
    const invalidQuestions = questions.some(question => 
      !question.text.trim() || 
      question.options.some(option => !option.trim())
    );
    
    if (invalidQuestions) {
      toast.error('All questions and options must be filled out');
      return;
    }
    
    setLoading(true);
    
    try {
      // Find the selected course
      const selectedCourseData = courses.find(course => course.id === selectedCourse);
      
      // Create quiz document
      const quizData = {
        title: data.title,
        description: data.description,
        courseId: selectedCourse,
        courseName: selectedCourseData?.name || 'Unknown Course',
        teacherId: currentUser.uid,
        questions: questions.map(question => ({
          text: question.text,
          options: question.options,
          correctAnswer: question.correctAnswer
        })),
        createdAt: new Date().toISOString(),
        dueDate: data.dueDate || null
      };
      
      await addDoc(collection(db, 'quizzes'), quizData);
      
      toast.success('Quiz created successfully!');
      
      // Reset form
      reset();
      setQuestions([{ text: '', options: ['', '', '', ''], correctAnswer: 0 }]);
    } catch (error) {
      console.error('Error creating quiz:', error);
      toast.error('Failed to create quiz');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="Create Quiz">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-soft p-6 animate-fade-in">
        <div className="flex items-center mb-6">
          <FilePlus size={24} className="text-primary-600 mr-2" />
          <h2 className="text-xl font-semibold text-gray-800">Create New Quiz</h2>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Input
              label="Quiz Title"
              placeholder="Introduction to Mathematics"
              {...register('title', { required: 'Quiz title is required' })}
              error={errors.title?.message}
            />
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Course
              </label>
              <select
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
              >
                <option value="" disabled>Select a course</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name || 'Untitled Course'}
                  </option>
                ))}
              </select>
              {courses.length === 0 && (
                <p className="mt-1 text-sm text-warning-600">
                  No courses found. Please create a course first.
                </p>
              )}
            </div>
          </div>
          
          <div className="mb-6">
            <Input
              label="Quiz Description (Optional)"
              placeholder="This quiz covers the basics of algebra and geometry"
              {...register('description')}
            />
          </div>
          
          <div className="mb-6">
            <Input
              label="Due Date (Optional)"
              type="date"
              {...register('dueDate')}
            />
          </div>
          
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-700">Quiz Questions</h3>
              <Button
                type="button"
                variant="outline"
                onClick={addQuestion}
                className="flex items-center"
              >
                <Plus size={18} className="mr-1" />
                Add Question
              </Button>
            </div>
            
            {questions.map((question, qIndex) => (
              <div 
                key={qIndex} 
                className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200"
              >
                <div className="flex justify-between items-start mb-4">
                  <h4 className="text-md font-medium text-gray-700">Question {qIndex + 1}</h4>
                  <button
                    type="button"
                    onClick={() => removeQuestion(qIndex)}
                    className="text-error-600 hover:text-error-800"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                
                <div className="mb-4">
                  <Input
                    label="Question Text"
                    placeholder="What is 2 + 2?"
                    value={question.text}
                    onChange={(e) => handleQuestionChange(qIndex, 'text', e.target.value)}
                  />
                </div>
                
                <div className="mb-4">
                  <p className="block text-sm font-medium text-gray-700 mb-2">Answer Options</p>
                  {question.options.map((option, oIndex) => (
                    <div key={oIndex} className="flex items-center mb-2">
                      <input
                        type="radio"
                        name={`question-${qIndex}-correct`}
                        id={`question-${qIndex}-option-${oIndex}`}
                        checked={question.correctAnswer === oIndex}
                        onChange={() => handleQuestionChange(qIndex, 'correctAnswer', oIndex)}
                        className="mr-2"
                      />
                      <Input
                        placeholder={`Option ${oIndex + 1}`}
                        value={option}
                        onChange={(e) => handleQuestionChange(qIndex, `option${oIndex}`, e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex justify-end">
            <Button
              type="submit"
              variant="primary"
              className="flex items-center"
              disabled={loading || courses.length === 0}
            >
              {loading ? (
                <>Creating...</>
              ) : (
                <>
                  <Save size={18} className="mr-2" />
                  Create Quiz
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default CreateQuiz;