import React, { useState } from 'react';
import Login from './Login';
import Register from './Register';

export default function AuthWrapper() {
  const [isLogin, setIsLogin] = useState(true);

  if (isLogin) {
    return <Login onSwitch={() => setIsLogin(false)} />;
  }
  return <Register onSwitch={() => setIsLogin(true)} />;
}
