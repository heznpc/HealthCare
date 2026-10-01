import React from "react";
import Tabs from "./dashboard/Tabs";
import DailyTab from "./dashboard/DailyTab";
import WeeklyTab from "./dashboard/WeeklyTab";
import MonthlyTab from "./dashboard/MonthlyTab";
import DummyDataLoader from "./DummyDataLoader";
import styles from "./css/DietAnalysis.module.css";


function DietAnalysis() {

    return(
        <div className={styles.dietAnalysisWrap}>
            <DummyDataLoader />
            <div className={styles.tabContainer}>
                <Tabs tabs={["일간", "주간", "월간"]}>
                    <DailyTab />
                    <WeeklyTab />
                    <MonthlyTab />
                </Tabs>
            </div>
        </div>
        
    );



}

export default DietAnalysis;