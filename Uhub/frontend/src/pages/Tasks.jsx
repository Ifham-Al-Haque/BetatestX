import { Navigate } from 'react-router-dom';

/** @deprecated Use /task-management?tab=my-tasks — kept for backwards compatibility */
const Tasks = () => <Navigate to="/task-management?tab=my-tasks" replace />;

export default Tasks;
