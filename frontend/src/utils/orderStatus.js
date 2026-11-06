// Maps the app's order statuses to the design system's status keys and stepper positions.
const KEYS = {
  Submitted: 'submitted',
  'In Review': 'submitted',
  'Awaiting Approval': 'awaiting-approval',
  Designing: 'designing',
  'Design Done': 'design-done',
  'In Prepress': 'in-prepress',
  'Ready for Delivery': 'ready',
  Delivering: 'delivering',
  Completed: 'completed',
  Delivered: 'completed',
  'On Hold': 'on-hold',
  Cancelled: 'cancelled',
};

export const statusKey = (status) => KEYS[status] || 'submitted';

// Position on the five-step order stepper: Submission, Design, Ripping, Prepress, Delivery.
// 5 means every step is done.
export const stepperIndex = (status) => {
  switch (status) {
    case 'Designing':
      return 1;
    case 'Design Done':
      return 2;
    case 'In Prepress':
      return 3;
    case 'Ready for Delivery':
    case 'Delivering':
      return 4;
    case 'Completed':
    case 'Delivered':
      return 5;
    default:
      return 0;
  }
};
