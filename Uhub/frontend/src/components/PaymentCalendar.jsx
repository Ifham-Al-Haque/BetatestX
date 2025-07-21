import { useEffect, useState } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { supabase } from "../supabaseClient";

const localizer = momentLocalizer(moment);

const PaymentCalendar = () => {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const fetchPayments = async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*");

      if (error) {
        console.error("Error fetching payments:", error);
      } else {
        const formatted = data.map((payment) => ({
          id: payment.id,
          title: `${payment.title} - ${payment.status.toUpperCase()}`,
          start: new Date(payment.due_date),
          end: new Date(payment.due_date),
          allDay: true,
          resource: payment,
        }));
        setEvents(formatted);
      }
    };

    fetchPayments();
  }, []);

  return (
    <div className="h-[500px] mt-6 bg-white p-4 rounded shadow">
      <h2 className="text-lg font-semibold mb-2">📅 Upcoming Payments</h2>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 450 }}
      />
    </div>
  );
};

export default PaymentCalendar;
