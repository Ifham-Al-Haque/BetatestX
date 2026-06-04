import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { format, parse, startOfWeek, getDay, endOfDay } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import { CalendarDays } from 'lucide-react';
import fleetService from '../services/fleetService';
import FleetioLayout from '../components/operation/FleetioLayout';
import OperationEmptyState from '../components/operation/OperationEmptyState';

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
      <FleetioLayout title="Driver Assignments" description="Loading calendar…" icon={CalendarDays}>
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      </FleetioLayout>
    );
  }

  return (
    <FleetioLayout
      title="Driver Assignment Calendar"
      description="View when drivers are assigned to vehicles. Manage drivers under Operation Team Records."
      icon={CalendarDays}
    >
      {events.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200">
          <OperationEmptyState
            icon={CalendarDays}
            title="No assignments scheduled"
            description="Driver–vehicle assignments will appear on this calendar once recorded in the system."
          />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
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
              eventPropGetter={() => ({ style: { backgroundColor: '#2563eb', color: 'white', borderRadius: 6 } })}
            />
          </div>
        </div>
      )}
    </FleetioLayout>
  );
};

export default FleetDriverCalendar;
