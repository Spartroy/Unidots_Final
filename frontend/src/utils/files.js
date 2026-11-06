import api from './api';
import { toast } from 'react-toastify';

// Downloads need a signed-in user. We ask the server for a short-lived link, then let the browser follow it.
// Use as a click handler (`onClick={(e) => openFile(e, id)}`) or directly (`openFile(null, id)`).
export const openFile = async (event, fileId) => {
  if (event && event.preventDefault) event.preventDefault();
  if (!fileId) return;
  try {
    const { data } = await api.get(`/api/files/${fileId}/link`);
    const a = document.createElement('a');
    a.href = data.url;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
  } catch (err) {
    toast.error(err.response?.status === 403 ? 'You do not have access to this file.' : 'We could not download this file. Please try again.');
  }
};
