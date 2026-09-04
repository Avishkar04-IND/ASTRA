import React from 'react';

export default function StateFeedback({ loading, error, successMessage, empty, emptyMessage, children }) {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-slate-500">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative my-4" role="alert">
        <strong className="font-bold">Error: </strong>
        <span className="block sm:inline">{error}</span>
      </div>
    );
  }

  if (empty) {
    return (
      <div className="text-center py-12 text-slate-500 italic">
        {emptyMessage || 'No data found.'}
      </div>
    );
  }

  return (
    <>
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded relative my-4 mb-6" role="alert">
          <span className="block sm:inline">{successMessage}</span>
        </div>
      )}
      {children}
    </>
  );
}
