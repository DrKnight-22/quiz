import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { AuthContext } from '../../App';
import { db } from '../../utils/localStorageDB';
import { Clock, AlertCircle } from 'lucide-react';

const TakeQuiz = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setLoading(true);
        
        // Check if student has already taken this quiz
        const existingResult = db.find('quiz_results', { 
          quiz_id: id, 
          student_id: user.id 
        });
        
        if (existingResult) {
          navigate(`/student/results/${existingResult.id}`);
          return;
        }
        
        // Fetch quiz details
        const quizData = db.getById('quizzes', id);
        if (!quizData) {
          throw new Error('Quiz not found');
        }
        
        // Fetch questions and options
        const questionsData = db.get('questions')
          .filter(q => q.quiz_id === id)
          .map(question => ({
            ...question,
            options: db.get('options').filter(o => o.question_id === question.id)
          }));
        
        setQuiz(quizData);
        setQuestions(questionsData);
        setTimeLeft(quizData.time_limit * 60); // Convert minutes to seconds
        
      } catch (error) {
        console.error('Error fetching quiz:', error);
        navigate('/student/dashboard');
      } finally {
        setLoading(false);
      }
    };
    
    fetchQuiz();
  }, [id, user, navigate]);

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      
      // Calculate score
      let correctAnswers = 0;
      let totalPoints = 0;
      
      questions.forEach(question => {
        const selectedOption = answers[question.id];
        const correctOption = question.options.find(o => o.is_correct);
        
        if (selectedOption === correctOption?.id) {
          correctAnswers += question.points;
        }
        totalPoints += question.points;
      });
      
      const score = Math.round((correctAnswers / totalPoints) * 100);
      
      // Save result
      const { data } = db.insert('quiz_results', {
        quiz_id: id,
        student_id: user.id,
        score,
        time_taken: (quiz.time_limit * 60) - timeLeft,
        answers
      });
      
      // Navigate to results
      navigate(`/student/results/${data.id}`);
      
    } catch (error) {
      console.error('Error submitting quiz:', error);
    }
  };
  
  if (loading) {
    return (
      <Layout title="Taking Quiz" role="student">
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-700"></div>
        </div>
      </Layout>
    );
  }
  
  const currentQuestionData = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;
  
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  return (
    <Layout title={quiz?.title || 'Taking Quiz'} role="student">
      <div className="max-w-3xl mx-auto">
        {/* Timer and Progress */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Clock size={20} className="text-[#6E8B55] mr-2" />
              <span className="font-medium">Time Left: {formatTime(timeLeft)}</span>
            </div>
            <div className="text-sm text-gray-500">
              Question {currentQuestion + 1} of {questions.length}
            </div>
          </div>
          
          <div className="mt-3 h-2 bg-gray-200 rounded-full">
            <div
              className="h-full bg-[#6E8B55] rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        
        {/* Question */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-6">
            {currentQuestionData?.question_text}
          </h2>
          
          {/* Options */}
          <div className="space-y-3">
            {currentQuestionData?.options.map((option) => (
              <label
                key={option.id}
                className={`block p-4 border rounded-lg cursor-pointer transition-colors ${
                  answers[currentQuestionData.id] === option.id
                    ? 'bg-[#E6F0DA] border-[#6E8B55]'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center">
                  <input
                    type="radio"
                    name={`question_${currentQuestionData.id}`}
                    value={option.id}
                    checked={answers[currentQuestionData.id] === option.id}
                    onChange={() => handleAnswer(currentQuestionData.id, option.id)}
                    className="w-4 h-4 text-[#6E8B55]"
                  />
                  <span className="ml-3">{option.option_text}</span>
                </div>
              </label>
            ))}
          </div>
          
          {/* Navigation */}
          <div className="flex justify-between mt-6">
            <button
              onClick={() => setCurrentQuestion(prev => prev - 1)}
              disabled={currentQuestion === 0}
              className="px-4 py-2 text-[#6E8B55] border border-[#6E8B55] rounded-lg hover:bg-[#E6F0DA] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            {currentQuestion === questions.length - 1 ? (
              <button
                onClick={handleSubmit}
                disabled={submitting || Object.keys(answers).length !== questions.length}
                className="px-4 py-2 bg-[#6E8B55] text-white rounded-lg hover:bg-[#5A7648] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : 'Submit Quiz'}
              </button>
            ) : (
              <button
                onClick={() => setCurrentQuestion(prev => prev + 1)}
                disabled={!answers[currentQuestionData?.id]}
                className="px-4 py-2 bg-[#6E8B55] text-white rounded-lg hover:bg-[#5A7648] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            )}
          </div>
        </div>
        
        {/* Warning */}
        {!answers[currentQuestionData?.id] && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start">
            <AlertCircle size={20} className="text-yellow-600 mr-2 flex-shrink-0" />
            <p className="text-sm text-yellow-600">
              Please select an answer before proceeding to the next question.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default TakeQuiz;