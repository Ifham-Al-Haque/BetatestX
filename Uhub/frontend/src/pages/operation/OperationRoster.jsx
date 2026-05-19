import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Users, Car, Clock } from 'lucide-react';

const OperationRoster = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="inline-flex p-4 bg-indigo-100 rounded-2xl mb-6">
          <Calendar className="w-10 h-10 text-indigo-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Team Schedule & Roster</h1>
        <p className="text-gray-600 mb-8 max-w-lg mx-auto">
          Shift planning, team rosters, and driver schedules will be available here. Driver and team
          data is already managed under Operation Team Records.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left mb-10">
          <Link
            to="/operation/drivers"
            className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
          >
            <Users className="w-8 h-8 text-blue-600 shrink-0" />
            <div>
              <p className="font-medium text-gray-900">Driver & Team Records</p>
              <p className="text-sm text-gray-500">View and manage drivers and teams</p>
            </div>
          </Link>
          <Link
            to="/operation/fleetio/assignments"
            className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
          >
            <Car className="w-8 h-8 text-green-600 shrink-0" />
            <div>
              <p className="font-medium text-gray-900">Driver–Vehicle Calendar</p>
              <p className="text-sm text-gray-500">Fleet assignment calendar (interim)</p>
            </div>
          </Link>
        </div>

        <div className="inline-flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
          <Clock className="w-4 h-4" />
          Full roster scheduling — coming in a future release
        </div>
      </div>
    </div>
  );
};

export default OperationRoster;
