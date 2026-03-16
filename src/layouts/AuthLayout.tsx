"use client";

import React from 'react';
import { Outlet } from 'react-router-dom';
import { MadeWithDyad } from '@/components/made-with-dyad';

const AuthLayout = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md">
        <Outlet />
      </div>
      <div className="mt-8">
        <MadeWithDyad />
      </div>
    </div>
  );
};

export default AuthLayout;