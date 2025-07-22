// PaymentCalendar.jsx
import React, { useEffect, useState } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { supabase } from "../supabaseClient";

const localizer = momentLocalizer(moment);

const PaymentCalendar = () => {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    const { data, error } = await supabase.from("payments").select("*");

    if (error) {
      console.error("Error fetching payments:", error);
    } else {
      const formattedEvents = data.map((payment) => ({
        id: payment.id,
        title: `${payment.title} - ${payment.status}`,
        start: new Date(payment.due_date),
        end: new Date(payment.due_date),
        allDay: true,
        amount: payment.amount,
        status: payment.status,
      }));
      setEvents(formattedEvents);
    }
  };

  return (
    <div className="bg-white shadow rounded p-4 mb-6">
      <h2 className="text-lg font-bold mb-3">📅 Payment Calendar</h2>
      <Calendar
        localizer={localizer}
        events={events}
        style={{ height: 500 }}
        startAccessor="start"
        endAccessor="end"
        titleAccessor="title"
        eventPropGetter={(event) => {
          let bg = "#3b82f6"; // default blue
          if (event.status === "pending") bg = "#facc15"; // yellow
          if (event.status === "paid") bg = "#10b981"; // green
          if (event.status === "overdue") bg = "#ef4444"; // red
          return { style: { backgroundColor: bg } };
        }}
      />
    </div>
  );
};

export default PaymentCalendar;



