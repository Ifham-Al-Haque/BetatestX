import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { format, parse, startOfWeek, getDay, endOfDay } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import { CalendarDays } from 'lucide-react';
import fleetService from '../services/fleetService';

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

const FleetDriverCalendar = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fleetService.getAllDriverAssignments();
        if (!cancelled) setAssignments(data);
      } catch (e) {
        console.error('Load driver assignments:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const events = useMemo(() => {
    return assignments.map((a) => {
      const start = new Date(a.assigned_date);
      let end = a.unassigned_date ? new Date(a.unassigned_date) : endOfDay(new Date());
      if (end < start) end = endOfDay(start);
      return {
        id: a.id,
        title: `${a.vehicle_label || 'Vehicle'} → ${a.driver_label || 'Driver'}`,
        start,
        end,
        resource: a,
      };
    });
  }, [assignments]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <CalendarDays className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Driver Assignment Calendar</h1>
            <p className="text-sm text-gray-600">View when drivers are assigned to vehicles</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4">
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              titleAccessor="title"
              views={['month', 'week', 'agenda']}
              defaultView="month"
              style={{ minHeight: 500 }}
              eventPropGetter={() => ({ style: { backgroundColor: '#2563eb', color: 'white' } })}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FleetDriverCalendar;
