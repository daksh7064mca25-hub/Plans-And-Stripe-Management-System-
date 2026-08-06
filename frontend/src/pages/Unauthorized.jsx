import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

const Unauthorized = () => {
  return (
    <div className="min-h-screen bg-slate-955 flex flex-col justify-center items-center px-4 text-center">
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl max-w-md w-full shadow-xl shadow-rose-950/10">
        <div className="bg-rose-500/10 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6 border border-rose-500/20">
          <ShieldAlert className="h-8 w-8 text-rose-500" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
        <p className="text-slate-400 mb-6 text-sm">
          You do not have the required permissions to view this resource. This area is restricted to Admin accounts only.
        </p>
        <Link
          to="/"
          className="inline-flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-100 hover:text-white px-5 py-2.5 rounded-lg text-sm font-semibold border border-slate-700 hover:border-slate-600 transition-all w-full justify-center"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Return Home</span>
        </Link>
      </div>
    </div>
  );
};

export default Unauthorized;
