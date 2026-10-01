import React from "react";
import DailyTab from "./dashboard/DailyTab";
import WeeklyTab from "./dashboard/WeeklyTab";
import MonthlyTab from "./dashboard/MonthlyTab";
import Tabs from "./dashboard/Tabs";
import styles from "../css/DietDashboard.module.css";

function CalorieAnalysis() {
    return (
        <div className={styles.dietDashboard}>
            <Tabs tabs={["일간", "주간", "월간"]}>
                <DailyTab />
                <WeeklyTab />
                <MonthlyTab />
            </Tabs>
        </div>
    );
}

export default CalorieAnalysis;