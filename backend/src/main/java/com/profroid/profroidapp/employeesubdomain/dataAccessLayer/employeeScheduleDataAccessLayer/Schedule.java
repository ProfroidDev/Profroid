package com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeScheduleDataAccessLayer;

import com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.Employee;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;


@Entity
@Table(name = "schedules")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Schedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_fk", nullable = false)
    private Employee employee;

    @Embedded
    @AttributeOverride(name = "dayOfWeek", column = @Column(name = "day_of_week"))
    private DayOfWeek dayOfWeek;

    @Embedded
    @AttributeOverride(name = "timeslot", column = @Column(name = "time_slot"))
    private TimeSlot timeSlot;

}
