import React from 'react';
import { Route, Routes } from 'react-router-dom';
import ExercisePage from '../views/ExercisePage';
import WeightPage from '../views/WeightPage';
import LoginForm from '../components/commons/member/LoginForm';
import SignUpForm from '../components/commons/member/SignUpForm';
import DietPage from './../views/DietPage';
import HomePage from '../views/HomePage';
import CalendarWrapper from '../components/commons/calendarBoard/CalendarWrapper';
import DietRecord from '../features/diet/components/DietRecord';
import ChatDietRecommender from '../features/diet/components/ChatDietRecommender';
import DietRanking from '../features/diet/components/DietRanking';
import CalorieAnalysis from '../features/diet/components/CalorieAnalysis';
import DashBoard from '../features/main/pages/DashBoard';
import Home from 'components/Home';
import FindPasswordForm from 'components/commons/member/FindPasswordForm';
import FooterPage from 'views/FooterPage';

const PublicRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="dashboard" element={<DashBoard />} />
            <Route path="login/*" element={<LoginForm />} />
            <Route path="/login/find-password" element={<FindPasswordForm />} />
        <Route path="signup/*" element={<SignUpForm />} />
            <Route path="weight/*" element={<WeightPage />} />
            <Route path="exercise/*" element={<ExercisePage />} />
            <Route path="footer/*" element={<FooterPage />} />
            <Route path="calendar/*" element={<CalendarWrapper />} />
            <Route path="diet/*" element={<DietPage />} />

        </Routes>
    );
};

export default PublicRoutes;
