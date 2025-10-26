import { useRouter } from 'next/router';
import { useEffect } from 'react';

const withAuth = (WrappedComponent) => (props) => {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.replace('/login');
    }
  }, []);

  return <WrappedComponent {...props} />;
};

export default withAuth;
