import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, addDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Button from '../../components/ui/Button';
import { FileQuestion, Clock, AlertTriangle, CheckCircle } from 'lucide-react';

const TakeQuiz = () => {
  const { quizId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // Fetch quiz data
  useEffect(() => {
    const fetchQuiz = async () => {
      if (!quizId || !currentUser) return;
      
      try {
        const quizDoc = await getDoc(doc(db, 'quizzes', quizId));
        
        if (!quizDoc.exists()) {
          toast.error('Quiz not found');
          navigate('/student');
          return;
        }
        
        const quizData = { id: quizDoc.id, ...quizDoc.data() };
        setQuiz(quizData);
        
        // Initialize answers object
        const initialAnswers = {};
        quizData.questions.forEach((_, index) => {
          initialAnswers[index] = null;
        });
        setAnswers(initialAnswers);
        
        // Set time limit if applicable
        if (quizData.timeLimit) {
          setTimeRemaining(quizData.timeLimit * 60); // Convert minutes to seconds
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching quiz:', error);
        toast.error('Failed to load quiz');
        navigate('/student');
      }
    };
    
    fetchQuiz();
  }, [quizId, currentUser, navigate]);

  // Timer countdown
  useEffect(() => {
    let timer;
    if (timeRemaining !== null && timeRemaining > 0 && !quizSubmitted) {
      timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            submitQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => clearInterval(timer);
  }, [timeRemaining, quizSubmitted]);

  // Handle answer selection
  const handleAnswerSelect = (questionIndex, optionIndex) => {
    setAnswers({
      ...answers,
      [questionIndex]: optionIndex
    });
  };

  // Format time remaining
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  // Calculate score
  const calculateScore = () => {
    if (!quiz) return 0;
    
    let correctAnswers = 0;
    
    quiz.questions.forEach((question, index) => {
      if (answers[index] === question.correctAnswer) {
        correctAnswers += 1;
      }
    });
    
    return (correctAnswers / quiz.questions.length) * 100;
  };

  // Submit quiz
  const submitQuiz = async () => {
    if (quizSubmitted) return;
    
    setSubmitting(true);
    
    try {
      const score = calculateScore();
      
      // Save quiz result
      const quizResultData = {
        quizId: quiz.id,
        quizTitle: quiz.title,
        studentId: currentUser.uid,
        teacherId: quiz.teacherId,
        courseId: quiz.courseId,
        score,
        answers,
        submittedAt: new Date().toISOString()
      };
      
      await addDoc(collection(db, 'quizResults'), quizResultData);
      
      setQuizSubmitted(true);
      toast.success('Quiz submitted successfully!');
    } catch (error) {
      console.error('Error submitting quiz:', error);
      toast.error('Failed to submit quiz');
    } finally {
      setSubmitting(false);
    }
  };

  // Check if all questions are answered
  const allQuestionsAnswered = () => {
    if (!quiz) return false;
    return Object.keys(answers).length === quiz.questions.length && 
           Object.values(answers).every(answer => answer !== null);
  };

  return (
    <DashboardLayout title="Take Quiz">
      <div className="animate-fade-in">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : quizSubmitted ? (
          <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-soft p-8 text-center">
            <div className="text-success-500 mb-4">
              <CheckCircle size={64} className="mx-auto" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Quiz Completed!</h2>
            <p className="text-xl text-gray-700 mb-4">
              Your score: <span className="font-bold text-primary-600">{calculateScore().toFixed(1)}%</span>
            </p>
            <p className="text-gray-600 mb-6">
              Thank you for completing the quiz. Your results have been recorded.
            </p>
            <div className="flex justify-center space-x-4">
              <Button
                variant="outline"
                onClick={() => navigate('/student/results')}
              >
                View All Results
              </Button>
              <Button
                variant="primary"
                onClick={() => navigate('/student')}
              >
                Back to Dashboard
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Quiz Header */}
            <div className="bg-white rounded-lg shadow-soft p-6 mb-6">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-2">{quiz.title}</h2>
                  <p className="text-gray-600 mb-2">{quiz.description}</p>
                  <p className="text-sm text-gray-500">
                    <span className="font-medium">Course:</span> {quiz.courseName}
                  </p>
                </div>
                
                {timeRemaining && (
                  <div className="mt-4 md:mt-0 flex items-center bg-gray-100 px-4 py-2 rounded-md">
                    <Clock size={18} className="text-primary-600 mr-2" />
                    <span className="text-gray-700 font-medium">Time: {formatTime(timeRemaining)}</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Quiz Questions */}
            <div className="bg-white rounded-lg shadow-soft p-6 mb-6">
              <h3 className="text-lg font-medium text-gray-700 mb-6 flex items-center">
                <FileQuestion size={20} className="text-primary-600 mr-2" />
                Questions
              </h3>
              
              <div className="space-y-8">
                {quiz.questions.map((question, qIndex) => (
                  <div key={qIndex} className="pb-6 border-b border-gray-200 last:border-b-0">
                    <h4 className="text-md font-medium text-gray-800 mb-4">
                      Question {qIndex + 1}: {question.text}
                    </h4>
                    
                    <div className="space-y-2">
                      {question.options.map((option, oIndex) => (
                        <div 
                          key={oIndex}
                          className={`
                            p-3 border rounded-md cursor-pointer transition-colors
                            ${answers[qIndex] === oIndex 
                              ? 'border-primary-500 bg-primary-50' 
                              : 'border-gray-300 hover:border-gray-400'
                            }
                          `}
                          onClick={() => handleAnswerSelect(qIndex, oIndex)}
                        >
                          <div className="flex items-start">
                            <div className={`
                              w-5 h-5 rounded-full border flex-shrink-0 flex items-center justify-center mr-3 mt-0.5
                              ${answers[qIndex] === oIndex 
                                ? 'border-primary-500 bg-primary-500' 
                                : 'border-gray-400'
                              }
                            `}>
                              {answers[qIndex] === oIndex && (
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                              )}
                            </div>
                            <span className="text-gray-700">{option}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Submit Button */}
            <div className="flex justify-between items-center">
              <div>
                {!allQuestionsAnswered() && (
                  <div className="flex items-center text-warning-600">
                    <AlertTriangle size={18} className="mr-2" />
                    <span>Please answer all questions before submitting</span>
                  </div>
                )}
              </div>
              
              <Button
                variant="primary"
                onClick={submitQuiz}
                disabled={submitting || (!allQuestionsAnswered() && !timeRemaining)}
                className="flex items-center"
              >
                {submitting ? 'Submitting...' : 'Submit Quiz'}
              </Button>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TakeQuiz;