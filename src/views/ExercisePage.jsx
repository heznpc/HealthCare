import React from 'react';
import { Route, Routes } from 'react-router-dom';

import HealthMap from '../features/exercise/components/HealthMap';
import ExerciseRecord from '../features/exercise/components/ExerciseRecord';
import HomeTraining from '../features/exercise/components/HomeTraining';
import HealthListInfo from './../features/exercise/components/HealthListInfo';

const ExercisePage = () => {
    return (
        <Routes>
                 <Route
                    path="/healthmap"
                    element={ <HealthMap />}/>

                  <Route
                    path="/healthlistinfo/:ft_idx"
                    element={<HealthListInfo />}
                  />

                  <Route
                    path="/exercise-record"
                    element={<ExerciseRecord/>}
                  />
        
                  <Route
                    path="/home-training"
                    element={<HomeTraining/>}
                  />

        </Routes>
    );
};

export default ExercisePage;