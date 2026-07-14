import { useEffect } from 'react';

const usePageTitle = (title) => {
  useEffect(() => {
    document.title = `复习搭子 - ${title}`;
  }, [title]);
};

export default usePageTitle;
