import React from 'react';
import { Route, Routes } from 'react-router-dom';
import ChatDietRecommender from '../features/diet/components/ChatDietRecommender';
import CalorieAnalysis from '../features/diet/components/CalorieAnalysis';
import DietRecord from '../features/diet/components/DietRecord';
import DietShare from '../features/diet/components/DietShare';

const DietPage = () => {
    return (
        <Routes>
             <Route
          path="diet-record"
          element={
                <DietRecord/>
          }
        />
        <Route
          path="recommendations"
          element={<ChatDietRecommender />}
        />
        <Route
          path="diet-share"
          element={<DietShare />}
          />

        <Route
          path="calorie-analysis"
          element={<CalorieAnalysis />}
        />
        </Routes>
    );
};

export default DietPage;