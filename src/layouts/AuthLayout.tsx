
import { Outlet } from 'react-router-dom';

const AuthLayout = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted">
      <div className="w-full">
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;