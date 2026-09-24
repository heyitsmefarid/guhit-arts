// One status pipeline is shared by product orders and digital projects:
// Pending → Approved → In Progress → For Revision → Completed.
export const STATUS_FLOW = ['pending', 'approved', 'in_progress', 'for_revision', 'completed'];

const LABELS = {
  pending: 'Pending',
  approved: 'Approved',
  in_progress: 'In Progress',
  for_revision: 'For Revision',
  completed: 'Completed',
};

// What each step means for the customer, worded per kind of request.
const DESCRIPTIONS = {
  order: {
    pending: 'We received your order and are checking stock and payment.',
    approved: 'Your order is confirmed and queued for preparation.',
    in_progress: 'We are packing your items and printing any custom pieces.',
    for_revision: 'Final check. For custom items, approve the print proof we sent.',
    completed: 'Picked up or delivered. Thank you for ordering from Guhit.',
  },
  project: {
    pending: 'Your request is waiting for review by the Digital Help Hub team.',
    approved: 'Request accepted. The price and schedule are confirmed.',
    in_progress: 'A designer is working on your first draft.',
    for_revision: 'Draft sent. Review it and tell us what to change.',
    completed: 'Final files are ready to download or print.',
  },
};

export function statusLabel(status, kind = 'order') {
  if (status === 'pending' && kind === 'project') return 'Pending Review';
  return LABELS[status] ?? status;
}

export function statusDescription(status, kind = 'order') {
  return DESCRIPTIONS[kind]?.[status] ?? '';
}

export const nextStatus = (status) => {
  const i = STATUS_FLOW.indexOf(status);
  return i >= 0 && i < STATUS_FLOW.length - 1 ? STATUS_FLOW[i + 1] : null;
};

export const isActive = (status) => status !== 'completed';
