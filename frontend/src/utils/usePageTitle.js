import { useEffect } from 'react';

// Sets the browser tab title for a page and restores the previous one on leave.
const usePageTitle = (title) => {
  useEffect(() => {
    const previous = document.title;
    if (title) document.title = title;
    return () => {
      document.title = previous;
    };
  }, [title]);
};

export default usePageTitle;
