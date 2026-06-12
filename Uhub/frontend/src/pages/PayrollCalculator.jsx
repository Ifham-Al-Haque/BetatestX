import { Navigate, useSearchParams } from 'react-router-dom';

/** Legacy route — redirects to merged Payroll page (Run Payroll tab). */
export default function PayrollCalculatorRedirect() {
  const [searchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'run';
  return <Navigate to={`/payroll?tab=${tab}`} replace />;
}
