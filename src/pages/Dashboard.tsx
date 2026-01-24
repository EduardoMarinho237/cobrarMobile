import React, { useEffect } from 'react';
import { Redirect, useHistory } from 'react-router-dom';
import { getCurrentUser } from '../services/api';
import {
  IonContent,
  IonRefresher,
  IonRefresherContent
} from '@ionic/react';
import { refresh } from 'ionicons/icons';

const Dashboard: React.FC = () => {
  const history = useHistory();
  
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      history.replace('/login');
    }
  }, [history]);

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  if (!user) {
    return <Redirect to="/login" />;
  }

  switch (user.role) {
    case 'ADMIN':
      return <Redirect to="/admin" />;
    case 'MANAGER':
      return <Redirect to="/manager" />;
    case 'ROUTE':
      return <Redirect to="/route" />;
    default:
      return <Redirect to="/login" />;
  }
};

export default Dashboard;
