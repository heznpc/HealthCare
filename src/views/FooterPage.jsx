import React from 'react';
import { Route, Routes } from 'react-router-dom';

import HealthMap from '../features/exercise/components/HealthMap';
import ExerciseRecord from '../features/exercise/components/ExerciseRecord';
import HomeTraining from '../features/exercise/components/HomeTraining';
import HealthListInfo from './../features/exercise/components/HealthListInfo';
import CompanyAbout from './footer/CompanyAbout';
import SupportCenter from './footer/SupportCenter';
import PrivacyPolicy from './footer/PrivacyPolicy';
import FAQ from './footer/FAQ';
import Terms from './footer/Terms';

const FooterPage = () => {
    return (
        <Routes>
                 <Route
                    path="/companyabout"
                    element={ <CompanyAbout />}/>

                <Route
                    path="/support"
                    element={ <SupportCenter />}/>

                <Route
                    path="/privarypolicy"
                    element={ <PrivacyPolicy />}/>

                <Route
                    path="/FAQ"
                    element={ <FAQ />}/>

                <Route
                    path="/terms"
                    element={ <Terms />}/>
        </Routes>
    );
};

export default FooterPage;