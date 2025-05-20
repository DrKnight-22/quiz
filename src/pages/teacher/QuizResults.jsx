import React from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';

const QuizResults = () => {
  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Quiz Results</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600">Quiz results will be displayed here.</p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default QuizResults;