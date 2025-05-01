import { useState, useEffect, useContext } from 'react';
import Layout from '../../components/Layout';
import { AuthContext } from '../../App';
import { db } from '../../utils/localStorageDB';
import { Search, FileText, Download } from 'lucide-react';

const ScoreRecords = () => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [scores, setScores] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    const fetchScores = async () => {
      try {
        setLoading(true);
        
        // Get all scores with related data
        const scoresData = db.get('quiz_results').map(score => ({
          ...score,
          profiles: db.getById('profiles', score.student_id),
          quizzes: db.getById('quizzes', score.quiz_id)
        }));
        
        setScores(scoresData);
      } catch (error) {
        console.error('Error fetching scores:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchScores();
  }, []);
  
  const filteredScores = scores.filter(score =>
    score.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    score.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    score.quizzes?.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const exportToCSV = () => {
    const headers = ['Student Name', 'Email', 'Quiz', 'Score', 'Date'];
    const csvData = filteredScores.map(score => [
      score.profiles?.full_name || 'N/A',
      score.profiles?.email || 'N/A',
      score.quizzes?.title || 'N/A',
      `${score.score}%`,
      new Date(score.created_at).toLocaleDateString()
    ]);
    
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'score_records.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };
  
  if (loading) {
    return (
      <Layout title="Score Records" role="admin">
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-700"></div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout title="Score Records" role="admin">
      <div className="bg-white rounded-lg shadow-sm p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6">
          <div className="relative w-full md:w-64 mb-4 md:mb-0">
            <input
              type="text"
              placeholder="Search records..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          </div>
          
          <button
            onClick={exportToCSV}
            className="w-full md:w-auto px-4 py-2 bg-[#6E8B55] text-white rounded-lg hover:bg-[#5A7648] transition-colors flex items-center justify-center"
          >
            <Download size={18} className="mr-2" />
            Export to CSV
          </button>
        </div>
        
        {/* Scores Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quiz
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Score
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredScores.map((score) => (
                <tr key={score.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">
                      {score.profiles?.full_name || 'No name'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {score.profiles?.email}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-gray-900">{score.quizzes?.title || 'Unknown Quiz'}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      score.score >= 70 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {score.score}%
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-gray-500">
                    {new Date(score.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredScores.length === 0 && (
            <div className="text-center py-12">
              <FileText size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No score records found</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ScoreRecords;