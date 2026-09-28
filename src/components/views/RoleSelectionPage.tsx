import React from 'react';
import { Role } from '../../types';
import { HeartPulse, Stethoscope, ShieldPlus, ChevronRight } from 'lucide-react';

interface RoleSelectionPageProps {
  onSelectRole: (role: Role) => void;
}

export default function RoleSelectionPage({ onSelectRole }: RoleSelectionPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Header Section */}
      <div className="max-w-3xl w-full text-center space-y-8 mb-12">
        <div className="flex justify-center">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full blur opacity-50 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative bg-white rounded-full p-4 shadow-xl ring-1 ring-gray-900/5">
              <div className="flex space-x-1">
                <HeartPulse className="w-8 h-8 text-indigo-600" />
                <Stethoscope className="w-8 h-8 text-purple-600" />
                <ShieldPlus className="w-8 h-8 text-indigo-600" />
              </div>
            </div>
          </div>
        </div>
        
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl">
            SynCura AI
          </h1>
          <p className="mt-2 text-lg font-medium text-indigo-600 tracking-wide uppercase">
            Autonomous Healthcare System
          </p>
        </div>

        <div className="pt-4">
          <h2 className="text-2xl font-bold text-gray-900">
            Welcome to SynCura AI
          </h2>
          <p className="mt-2 text-gray-600">
            Select your profile to continue
          </p>
        </div>
      </div>

      {/* Cards Section */}
      <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 px-4">
        
        {/* ASHA Worker Card */}
        <button 
          onClick={() => onSelectRole('ASHA_WORKER')}
          className="group relative bg-white rounded-2xl p-6 sm:p-8 text-left shadow-md hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 flex flex-col h-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          aria-label="Continue as ASHA Worker"
        >
          <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-indigo-500">
             <ChevronRight className="w-6 h-6" />
          </div>
          <div className="bg-indigo-50 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 text-indigo-600 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
            <HeartPulse className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors">
            ASHA Worker
          </h3>
          <p className="text-sm font-medium text-indigo-600 mb-8 flex-grow">
            Community Health Coordination
          </p>
          <div className="mt-auto w-full flex items-center justify-center py-2.5 px-4 rounded-lg bg-gray-50 text-indigo-600 font-medium group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
            Continue as ASHA Worker
          </div>
        </button>

        {/* Doctor Card */}
        <button 
          onClick={() => onSelectRole('DOCTOR')}
          className="group relative bg-white rounded-2xl p-6 sm:p-8 text-left shadow-md hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 flex flex-col h-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          aria-label="Continue as Doctor"
        >
          <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-purple-500">
             <ChevronRight className="w-6 h-6" />
          </div>
          <div className="bg-purple-50 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 text-purple-600 group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300">
            <Stethoscope className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-purple-600 transition-colors">
            Doctor / Medical Officer
          </h3>
          <p className="text-sm font-medium text-purple-600 mb-8 flex-grow">
            Clinical Care & Consultation
          </p>
          <div className="mt-auto w-full flex items-center justify-center py-2.5 px-4 rounded-lg bg-gray-50 text-purple-600 font-medium group-hover:bg-purple-600 group-hover:text-white transition-colors duration-300">
            Continue as Doctor
          </div>
        </button>

        {/* Supervisor Card */}
        <button 
          onClick={() => onSelectRole('SUPERVISOR')}
          className="group relative bg-white rounded-2xl p-6 sm:p-8 text-left shadow-md hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 flex flex-col h-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label="Continue as Supervisor"
        >
          <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-blue-500">
             <ChevronRight className="w-6 h-6" />
          </div>
          <div className="bg-blue-50 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 text-blue-600 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
            <ShieldPlus className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
            Health Extension Supervisor
          </h3>
          <p className="text-sm font-medium text-blue-600 mb-8 flex-grow">
            Healthcare Operations & Oversight
          </p>
          <div className="mt-auto w-full flex items-center justify-center py-2.5 px-4 rounded-lg bg-gray-50 text-blue-600 font-medium group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
            Continue as Supervisor
          </div>
        </button>

      </div>
      
      {/* Footer text */}
      <div className="mt-16 text-center text-sm font-medium text-gray-500 flex items-center justify-center space-x-2">
        <span>Secure</span>
        <span>•</span>
        <span>Role-Based</span>
        <span>•</span>
        <span>Healthcare Coordination</span>
      </div>
      
    </div>
  );
}
