import { formatDate, formatDateTime } from '../utils/dateUtils';

const TaskList = () => {
  // ... existing code ...

  return (
    // ... existing JSX ...
    <Typography variant="body2" color="text.secondary">
      Due: {formatDate(task.due_date)}
    </Typography>
    // ... more JSX ...
    <Typography variant="body2" color="text.secondary">
      Created: {formatDateTime(task.created_at)}
    </Typography>
    // ... rest of the component
  );
};

export default TaskList; 