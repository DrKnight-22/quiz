import React from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';

const ViewResults = () => {
  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Your Quiz Results</h1>
        {/* Add quiz results content here */}
      </div>
    </DashboardLayout>
  );
};

export default ViewResults;