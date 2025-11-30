package com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeScheduleDataAccessLayer;

public enum TimeSlotType {


    NINE_AM("9:00 AM"),
    ELEVEN_AM("11:00 AM"),
    ONE_PM("1:00 PM"),
    THREE_PM("3:00 PM"),
    FIVE_PM("5:00 PM");

    private final String displayTime; // Field to hold the human-readable time

    TimeSlotType(String displayTime) {
        this.displayTime = displayTime;
    }

    // New getter method for the time string
    public String getDisplayTime() {
        return displayTime;
    }
}
