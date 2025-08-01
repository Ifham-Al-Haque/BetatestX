// PaymentCalendar.jsx
import React, { useEffect, useState } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { supabase } from "../supabaseClient";

const localizer = momentLocalizer(moment);

const PaymentCalendar = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPaymentEvents();
  }, []);

  const fetchPaymentEvents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("payment_events")
        .select("*")
        .order("due_date", { ascending: true });

      if (error) {
        console.error("Error fetching payment events:", error);
        return;
      }

      const formattedEvents = (data || []).map((event) => ({
        id: event.id,
        title: `${event.title} - ${event.status}`,
        start: new Date(event.due_date),
        end: new Date(event.due_date),
        allDay: true,
        amount: event.amount,
        status: event.status,
        priority: event.priority,
        category: event.category,
        service_provider: event.service_provider
      }));
      
      setEvents(formattedEvents);
    } catch (error) {
      console.error("Error in fetchPaymentEvents:", error);
    } finally {
      setLoading(false);
    }
  };

  const eventStyleGetter = (event) => {
    let backgroundColor = "#3b82f6"; // default blue
    let borderColor = "#2563eb";
    
    // Color based on priority
    switch (event.priority) {
      case "urgent":
        backgroundColor = "#ef4444"; // red
        borderColor = "#dc2626";
        break;
      case "high":
        backgroundColor = "#f59e0b"; // amber
        borderColor = "#d97706";
        break;
      case "medium":
        backgroundColor = "#3b82f6"; // blue
        borderColor = "#2563eb";
        break;
      case "low":
        backgroundColor = "#10b981"; // green
        borderColor = "#059669";
        break;
      default:
        backgroundColor = "#6b7280"; // gray
        borderColor = "#4b5563";
    }

    // Override with status-based colors
    switch (event.status) {
      case "paid":
        backgroundColor = "#10b981"; // green
        borderColor = "#059669";
        break;
      case "overdue":
        backgroundColor = "#ef4444"; // red
        borderColor = "#dc2626";
        break;
      case "pending":
        // Keep priority-based color
        break;
      default:
        backgroundColor = "#6b7280"; // gray
        borderColor = "#4b5563";
    }

    return {
      style: {
        backgroundColor,
        border: `2px solid ${borderColor}`,
        borderRadius: "4px",
        color: "white",
        fontWeight: "500",
        fontSize: "12px"
      }
    };
  };

  const CustomEvent = ({ event }) => (
    <div className="p-1">
      <div className="font-semibold text-xs">{event.title}</div>
      <div className="text-xs opacity-90">
        AED {parseFloat(event.amount).toLocaleString()}
      </div>
      {event.service_provider && (
        <div className="text-xs opacity-75">
          {event.service_provider}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="bg-white shadow rounded p-4 mb-6">
        <h2 className="text-lg font-bold mb-3">📅 Payment Calendar</h2>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded p-4 mb-6">
      <h2 className="text-lg font-bold mb-3">📅 Payment Calendar</h2>
      <div className="mb-4">
        <div className="flex flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>Urgent/Overdue</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-amber-500 rounded"></div>
            <span>High Priority</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span>Medium Priority</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Low Priority/Paid</span>
          </div>
        </div>
      </div>
      <Calendar
        localizer={localizer}
        events={events}
        style={{ height: 500 }}
        startAccessor="start"
        endAccessor="end"
        titleAccessor="title"
        eventPropGetter={eventStyleGetter}
        components={{
          event: CustomEvent
        }}
        views={['month', 'week', 'day']}
        defaultView="month"
        selectable
        popup
        onSelectEvent={(event) => {
          console.log('Selected event:', event);
          // You can add a modal here to show event details
        }}
      />
    </div>
  );
};

export default PaymentCalendar;



