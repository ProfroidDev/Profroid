package com.profroid.profroidapp.EmployeeTesting.dataAccessLayer.employeeScheduleDataAccessLayer;

import com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeScheduleDataAccessLayer.ScheduleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@ActiveProfiles("test")
public class EmployeeScheduleRepositoryIntegrationTest {

    @Autowired
    private ScheduleRepository scheduleRepository;

    @Test
    void contextLoads_andRepositoryIsAvailable() {
        assertNotNull(scheduleRepository);
    }

    @Test
    void whenNoSchedules_thenCountIsZero() {
        long count = scheduleRepository.count();
        assertEquals(0L, count);
    }
}
