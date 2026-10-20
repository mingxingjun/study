import { useEffect } from 'react';

const usePageTitle = (title) => {
  useEffect(() => {
    document.title = `折角 · ${title}`;
  }, [title]);
};

export default usePageTitle;
