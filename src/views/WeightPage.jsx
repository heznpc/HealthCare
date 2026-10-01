import React from 'react';
import WeightRecord from '../features/weight/components/WeightRecord';
import { Route, Routes } from 'react-router-dom';
import WeightAnalysis from '../features/weight/components/WeightAnalysis';

const WeightPage = () => {
    return (      
        <Routes>
            <Route
            path="/weight-record"
            element={<WeightRecord/>}
            />
            <Route
            path="/weight-analysis"
            element={<WeightAnalysis/>}
            />

        </Routes>
    );
};

export default WeightPage;