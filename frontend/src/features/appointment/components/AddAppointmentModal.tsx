import React, { useEffect, useMemo, useState } from "react";
import { Loader2, CalendarClock, ClipboardList, Users } from "lucide-react";
import "./AddAppointmentModal.css";
import { createAppointment } from "../api/createAppointment";
import type { AppointmentRequestModel } from "../models/AppointmentRequestModel";
import type { AppointmentResponseModel } from "../models/AppointmentResponseModel";
import { getJobs } from "../../jobs/api/getAllJobs";
import type { JobResponseModel } from "../../jobs/models/JobResponseModel";
import { getEmployees } from "../../employee/api/getAllEmployees";
import type { EmployeeResponseModel } from "../../employee/models/EmployeeResponseModel";
import { getCustomers } from "../../customer/api/getAllCustomers";
import type { CustomerResponseModel } from "../../customer/models/CustomerResponseModel";
import { getCellars } from "../../cellar/api/getAllCellars";
import type { CellarResponseModel } from "../../cellar/models/CellarResponseModel";
import { getEmployeeScheduleForDate } from "../../employee/api/getEmployeeScheduleForDate";
import { getEmployeeSchedule } from "../../employee/api/getEmployeeSchedule";
import type { TimeSlotType } from "../../employee/models/EmployeeScheduleRequestModel";
import { getPostalCodeError } from "../../../utils/postalCodeValidator";
import { getMyJobs } from "../api/getMyJobs";

// Cache for shared data to reduce API calls when modal is opened/closed multiple times
const dataCache: {
  jobs: JobResponseModel[] | null;
  employees: EmployeeResponseModel[] | null;
  customers: CustomerResponseModel[] | null;
  cellars: CellarResponseModel[] | null;
  loadingPromise: Promise<[JobResponseModel[], EmployeeResponseModel[], CustomerResponseModel[], CellarResponseModel[]]> | null;
} = {
  jobs: null,
  employees: null,
  customers: null,
  cellars: null,
  loadingPromise: null,
};

function getCachedData(): Promise<[JobResponseModel[], EmployeeResponseModel[], CustomerResponseModel[], CellarResponseModel[]]> {
  // If all data is already cached, return it immediately
  if (dataCache.jobs && dataCache.employees && dataCache.customers && dataCache.cellars) {
    return Promise.resolve([dataCache.jobs, dataCache.employees, dataCache.customers, dataCache.cellars]);
  }

  // If a load is already in progress, return that promise
  if (dataCache.loadingPromise) {
    return dataCache.loadingPromise;
  }

  // Start a new load and cache the promise
  dataCache.loadingPromise = Promise.all([
    getJobs(),
    getEmployees(),
    getCustomers(),
    getCellars(),
  ] as const).then(([jobs, employees, customers, cellars]) => {
    // Cache the results
    dataCache.jobs = jobs;
    dataCache.employees = employees;
    dataCache.customers = customers;
    dataCache.cellars = cellars;
    dataCache.loadingPromise = null;
    return [jobs, employees, customers, cellars];
  }).catch((error) => {
    dataCache.loadingPromise = null;
    throw error;
  }) as Promise<[JobResponseModel[], EmployeeResponseModel[], CustomerResponseModel[], CellarResponseModel[]]>;

  return dataCache.loadingPromise;
}

type Mode = "customer" | "technician";

interface AddAppointmentModalProps {
  mode: Mode;
  customerId?: string;
  technicianId?: string;
  onClose: () => void;
  onCreated: (appointment: AppointmentResponseModel) => void;
}

const SLOT_ORDER: TimeSlotType[] = [
  "NINE_AM",
  "ELEVEN_AM",
  "ONE_PM",
  "THREE_PM",
  "FIVE_PM",
];

const SLOT_TO_TIME: Record<TimeSlotType, string> = {
  NINE_AM: "09:00",
  ELEVEN_AM: "11:00",
  ONE_PM: "13:00",
  THREE_PM: "15:00",
  FIVE_PM: "17:00",
};

const SLOT_TO_LABEL: Record<TimeSlotType, string> = {
  NINE_AM: "9:00 AM",
  ELEVEN_AM: "11:00 AM",
  ONE_PM: "1:00 PM",
  THREE_PM: "3:00 PM",
  FIVE_PM: "5:00 PM",
};

function getRequiredSlots(job?: JobResponseModel): number {
  if (!job) return 1;
  if (job.jobType === "INSTALLATION") return 4;
  if (job.jobType === "QUOTATION") return 1;
  // MAINTENANCE/REPARATION default to 2 slots (60-90 mins)
  return 2;
}

function slotAllowedForJob(job: JobResponseModel | undefined, slot: TimeSlotType): boolean {
  if (!job) return true;
  if (job.jobType === "INSTALLATION" && !["NINE_AM", "ELEVEN_AM", "ONE_PM"].includes(slot)) {
    return false;
  }
  const required = getRequiredSlots(job);
  const startIdx = SLOT_ORDER.indexOf(slot);
  return startIdx + required <= SLOT_ORDER.length;
}

function isWeekend(date: string): boolean {
  if (!date) return false;
  // Parse date parts to avoid timezone issues
  const [year, month, day] = date.split('-').map(Number);
  const localDate = new Date(year, month - 1, day);
  const dayOfWeek = localDate.getDay();
  return dayOfWeek === 0 || dayOfWeek === 6;
}

function isPast(date: string, time: string): boolean {
  if (!date || !time) return false;
  const candidate = new Date(`${date}T${time}:00`);
  return candidate.getTime() <= Date.now();
}

function passesBookingDeadline(date: string, time: string): boolean {
  if (!date || !time) return true;
  const appointment = new Date(`${date}T${time}:00`);
  const hour = appointment.getHours();
  const deadline = new Date(appointment);

  if (hour === 9 || hour === 11) {
    deadline.setDate(deadline.getDate() - 1);
    deadline.setHours(17, 0, 0, 0);
  } else {
    deadline.setHours(9, 0, 0, 0);
  }

  return Date.now() <= deadline.getTime();
}

function getActualCustomerId(id: string | object | undefined): string {
  if (!id) return "";
  if (typeof id === "string") return id;
  if (typeof id === "object" && id !== null && "customerId" in id) {
    const obj = id as Record<string, unknown>;
    return typeof obj.customerId === "string" ? obj.customerId : "";
  }
  return "";
}

function labelForTime(time: string): string {
  const entry = Object.entries(SLOT_TO_TIME).find(([, value]) => value === time);
  if (!entry) return time;
  const slot = entry[0] as TimeSlotType;
  return SLOT_TO_LABEL[slot];
}

export default function AddAppointmentModal({
  mode,
  customerId,
  technicianId,
  onClose,
  onCreated,
}: AddAppointmentModalProps): React.ReactElement {
  const [jobs, setJobs] = useState<JobResponseModel[]>([]);
  const [employees, setEmployees] = useState<EmployeeResponseModel[]>([]);
  const [customers, setCustomers] = useState<CustomerResponseModel[]>([]);
  const [cellars, setCellars] = useState<CellarResponseModel[]>([]);
  const [scheduleSlots, setScheduleSlots] = useState<TimeSlotType[]>([]);

  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<string>(technicianId || "");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customerId || "");
  const [selectedCellarId, setSelectedCellarId] = useState<string>("");

  const [appointmentDate, setAppointmentDate] = useState<string>("");
  const [appointmentTime, setAppointmentTime] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [address, setAddress] = useState({
    streetAddress: "",
    city: "",
    province: "",
    country: "Canada",
    postalCode: "",
  });
  const [customerSearch, setCustomerSearch] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(true);
  const [scheduleLoading, setScheduleLoading] = useState<boolean>(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [allAppointments, setAllAppointments] = useState<AppointmentResponseModel[]>([]);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setLoading(true);
        const [jobData, employeeData, customerData, cellarData] = await getCachedData();

        if (!isMounted) return;

        const activeJobs = jobData.filter((j) => j.active);
        const technicians = employeeData.filter(
          (e) => e.isActive && e.employeeRole?.employeeRoleType === "TECHNICIAN"
        );

        setJobs(activeJobs);
        setEmployees(technicians);
        setCustomers(customerData);
        setCellars(cellarData);

        if (mode === "customer" && customerId) {
          setSelectedCustomerId(customerId);
        }

        if (mode === "customer" && !selectedTechnicianId && technicians.length > 0) {
          setSelectedTechnicianId(technicians[0].employeeIdentifier.employeeId || "");
        }

        if (mode === "technician" && technicianId) {
          setSelectedTechnicianId(technicianId);
        }

        if (mode === "technician" && customerData.length > 0) {
          // Find first customer with cellars
          const customerWithCellar = customerData.find((cust) =>
            cellarData.some((cel) => getActualCustomerId(cel.ownerCustomerId) === getActualCustomerId(cust.customerId))
          );
          
          if (customerWithCellar) {
            setSelectedCustomerId(customerWithCellar.customerId);
          } else if (customerData.length > 0) {
            setSelectedCustomerId(customerData[0].customerId);
          }
        }
      } catch {
        setError("Unable to load appointment data. Please try again.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [mode, customerId, technicianId, selectedTechnicianId]);

  // Fetch all appointments to check for conflicts
  useEffect(() => {
    async function fetchAppointments() {
      // In customer mode, we need to fetch appointments for the selected technician to check their availability
      // In technician mode, we fetch appointments for the technician
      const targetId = mode === "customer" ? selectedTechnicianId : technicianId;
      if (!targetId) return;

      try {
        // Use the correct API endpoint - getMyJobs for technician's appointments
        const appointments = await getMyJobs(targetId);
        setAllAppointments(appointments);
      } catch (err) {
        console.error('Failed to fetch appointments:', err);
        // If fetch fails, continue without filtering (backend will validate)
        setAllAppointments([]);
      }
    }

    fetchAppointments();
  }, [mode, customerId, technicianId, selectedTechnicianId, appointmentDate]);

  const jobOptions = useMemo(() => {
    if (mode === "customer") {
      return jobs.filter((j) => j.jobType === "QUOTATION");
    }
    return jobs;
  }, [jobs, mode]);

  const selectedJob = useMemo(() => jobOptions.find((j) => j.jobId === selectedJobId), [jobOptions, selectedJobId]);

  const selectedTechnician = useMemo(
    () => employees.find((e) => e.employeeIdentifier.employeeId === selectedTechnicianId),
    [employees, selectedTechnicianId]
  );

  const selectedCustomer = useMemo(() => {
    const actualCustomerId = getActualCustomerId(selectedCustomerId);
    return customers.find((c) => getActualCustomerId(c.customerId) === actualCustomerId);
  }, [customers, selectedCustomerId]);

  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers;
    const term = customerSearch.toLowerCase();
    return customers.filter(
      (c) => `${c.firstName} ${c.lastName}`.toLowerCase().includes(term)
    );
  }, [customers, customerSearch]);

  // Keep customer selection in sync with the filtered list only if current selection is filtered out
  useEffect(() => {
    if (mode === "technician" && filteredCustomers.length > 0 && selectedCustomerId) {
      const actualCustomerId = getActualCustomerId(selectedCustomerId);
      
      // Only update if the current selection is not in the filtered list
      const isCurrentInFiltered = filteredCustomers.some((c) => getActualCustomerId(c.customerId) === actualCustomerId);
      
      if (!isCurrentInFiltered) {
        // Current customer was filtered out, select first from filtered list
        setSelectedCustomerId(filteredCustomers[0].customerId);
      }
    }
  }, [filteredCustomers, mode, selectedCustomerId]);

  const customerCellars = useMemo(() => {
    const actualCustomerId = getActualCustomerId(selectedCustomerId);
    if (!actualCustomerId) {
      return [];
    }
    
    const filtered = cellars.filter((c) => {
      const actualOwnerCustomerId = getActualCustomerId(c.ownerCustomerId);
      return actualOwnerCustomerId === actualCustomerId;
    });
    
    return filtered;
  }, [cellars, selectedCustomerId]);

  useEffect(() => {
    if (!selectedJobId && jobOptions.length > 0) {
      setSelectedJobId(jobOptions[0].jobId);
    }
  }, [jobOptions, selectedJobId]);

  useEffect(() => {
    if (selectedCustomer) {
      setAddress({
        streetAddress: selectedCustomer.streetAddress || "",
        city: selectedCustomer.city || "",
        province: selectedCustomer.province || "",
        country: selectedCustomer.country || "Canada",
        postalCode: selectedCustomer.postalCode || "",
      });
    }
  }, [selectedCustomer]);

  useEffect(() => {
    if (customerCellars.length > 0) {
      setSelectedCellarId(customerCellars[0].cellarId);
    } else {
      setSelectedCellarId("");
    }
  }, [customerCellars]);

  useEffect(() => {
    async function loadSchedule() {
      if (!selectedTechnicianId || !appointmentDate) {
        setScheduleSlots([]);
        setScheduleError(null);
        return;
      }
      try {
        setScheduleLoading(true);
        setScheduleError(null);

        // 1) Date-specific schedule
        const dateSchedule = await getEmployeeScheduleForDate(selectedTechnicianId, appointmentDate);
        let slots = dateSchedule.flatMap((s) => s.timeSlots || []);

        // 2) Fallback to weekly schedule for the weekday if no slots
        if (slots.length === 0) {
          const weekly = await getEmployeeSchedule(selectedTechnicianId);
          const weekday = new Date(appointmentDate).toLocaleDateString("en-US", { weekday: "long" }).toUpperCase();
          const daySlots = weekly
            .filter((s: { dayOfWeek?: string }) => s.dayOfWeek?.toUpperCase() === weekday)
            .flatMap((s: { timeSlots?: string[] }) => s.timeSlots || []);
          slots = daySlots;
        }

        // Convert time strings to TimeSlotType enums
        const timeToEnum: Record<string, TimeSlotType> = {
          "9:00 AM": "NINE_AM",
          "11:00 AM": "ELEVEN_AM",
          "1:00 PM": "ONE_PM",
          "3:00 PM": "THREE_PM",
          "5:00 PM": "FIVE_PM",
        };
        
        const normalized = slots
          .map((slot) => timeToEnum[slot] || slot.toUpperCase())
          .filter((slot): slot is TimeSlotType => SLOT_ORDER.includes(slot as TimeSlotType));
        const uniqueSlots = Array.from(new Set(normalized));
        setScheduleSlots(uniqueSlots);

        if (uniqueSlots.length === 0) {
          setScheduleError("No schedule returned for this technician on the selected date.");
        }
      } catch (e) {
        setScheduleSlots([]);

        // Try to surface a clearer message from backend
        let message = "Unable to load technician schedule. Try another date or technician.";
        if (typeof e === "object" && e && "response" in e) {
          const resp = (e as { response?: { status?: number; data?: unknown } }).response;
          if (resp?.data) {
            if (typeof resp.data === "string") {
              message = resp.data;
            } else if (typeof resp.data === "object") {
              const data = resp.data as Record<string, unknown>;
              message = (data.message as string) || (data.error as string) || message;
            }
          }
        }
        setScheduleError(message);
      } finally {
        setScheduleLoading(false);
      }
    }

    loadSchedule();
  }, [selectedTechnicianId, appointmentDate]);

  const availableSlots = useMemo(() => {
    if (!selectedJob || !appointmentDate || isWeekend(appointmentDate)) return [];
    if (!selectedTechnician) return [];
    
    const slotSet = new Set(scheduleSlots);
    const slots: string[] = [];

    SLOT_ORDER.forEach((slot) => {
      if (!slotSet.has(slot)) return;
      if (!slotAllowedForJob(selectedJob, slot)) return;

      const required = getRequiredSlots(selectedJob);
      const startIdx = SLOT_ORDER.indexOf(slot);
      const needed = SLOT_ORDER.slice(startIdx, startIdx + required);
      if (needed.length < required || !needed.every((s) => slotSet.has(s))) return;

      const time = SLOT_TO_TIME[slot];
      if (isPast(appointmentDate, time)) return;
      if (!passesBookingDeadline(appointmentDate, time)) return;

      // Filter out times when technician already has an appointment
      const slotHour = parseInt(time.split(':')[0]);
      
      const hasConflict = allAppointments.some((apt) => {
        const aptDate = new Date(apt.appointmentDate).toISOString().split('T')[0];
        if (aptDate !== appointmentDate) return false;
        if (apt.status === "CANCELLED") return false;
        
        // Check if it's the same technician by name
        const isSameTechnician = 
          apt.technicianFirstName === selectedTechnician.firstName &&
          apt.technicianLastName === selectedTechnician.lastName;
        if (!isSameTechnician) return false;
        
        const aptTime = new Date(apt.appointmentDate).toTimeString().split(':')[0];
        const aptHour = parseInt(aptTime);
        
        // Calculate which slots are occupied by existing appointment
        const aptJobType = apt.jobType;
        let aptRequiredSlots = 1;
        if (aptJobType === "INSTALLATION") aptRequiredSlots = 4;
        else if (aptJobType === "MAINTENANCE" || aptJobType === "REPARATION") aptRequiredSlots = 2;
        
        // Check if the time slots overlap
        // Convert hours to slot indices (9=0, 11=1, 13=2, 15=3, 17=4)
        const hourToIndex = (h: number) => {
          if (h === 9) return 0;
          if (h === 11) return 1;
          if (h === 13) return 2;
          if (h === 15) return 3;
          if (h === 17) return 4;
          return -1;
        };
        
        const myStartIndex = hourToIndex(slotHour);
        const aptStartIndex = hourToIndex(aptHour);
        
        if (myStartIndex === -1 || aptStartIndex === -1) return false;
        
        // Check if any of the required slots overlap
        for (let i = 0; i < required; i++) {
          const mySlotIndex = myStartIndex + i;
          for (let j = 0; j < aptRequiredSlots; j++) {
            const aptSlotIndex = aptStartIndex + j;
            if (mySlotIndex === aptSlotIndex) {
              return true; // Overlap found
            }
          }
        }
        
        return false;
      });

      if (hasConflict) return;

      slots.push(time);
    });

    return slots;
  }, [appointmentDate, scheduleSlots, selectedJob, allAppointments, selectedTechnician]);

  useEffect(() => {
    if (!appointmentTime && availableSlots.length > 0) {
      setAppointmentTime(availableSlots[0]);
    } else if (appointmentTime && !availableSlots.includes(appointmentTime)) {
      setAppointmentTime(availableSlots[0] || "");
    }
  }, [availableSlots, appointmentTime]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!selectedJob) {
      setError("Select a service to continue.");
      return;
    }

    if (mode === "customer" && !selectedTechnician) {
      setError("Select a technician.");
      return;
    }

    if (mode === "technician" && !selectedCustomerId) {
      setError("Pick a customer for this job.");
      return;
    }

    if (!appointmentDate || !appointmentTime) {
      setError("Choose a date and time.");
      return;
    }

    if (isWeekend(appointmentDate)) {
      setError("Weekend bookings are not allowed.");
      return;
    }

    if (!passesBookingDeadline(appointmentDate, appointmentTime)) {
      setError("This slot is past the booking deadline.");
      return;
    }

    const postalError = getPostalCodeError(address.postalCode, address.city, address.province);
    if (postalError) {
      setError(postalError);
      return;
    }

    const headerId = mode === "customer" ? customerId : getActualCustomerId(selectedTechnicianId);
    if (!headerId) {
      setError("Missing user identifier for the request.");
      return;
    }

    const technician = mode === "customer" ? selectedTechnician : selectedTechnician || employees.find((e) => e.employeeIdentifier.employeeId === headerId);
    if (!technician) {
      setError("Unable to resolve technician information.");
      return;
    }

    const cellar = customerCellars.find((c) => c.cellarId === selectedCellarId);
    if (!cellar) {
      setError("Select a cellar for this appointment.");
      return;
    }

    const appointmentDateTime = `${appointmentDate}T${appointmentTime}:00`;

    // Extract actual customer ID in case it's nested
    const actualCustomerId = mode === "technician" ? getActualCustomerId(selectedCustomerId) : undefined;

    const request: AppointmentRequestModel = {
      customerId: actualCustomerId,
      technicianFirstName: technician.firstName,
      technicianLastName: technician.lastName,
      jobName: selectedJob.jobName,
      cellarName: cellar.name,
      appointmentDate: appointmentDateTime,
      description,
      appointmentAddress: { ...address },
    };

    try {
      setSubmitting(true);
      const created = await createAppointment(request, {
        userId: headerId,
        role: mode === "customer" ? "CUSTOMER" : "TECHNICIAN",
      });
      onCreated(created);
      onClose();
    } catch (e: unknown) {
      let message = "Failed to create appointment.";
      if (typeof e === "object" && e && "response" in e) {
        const resp = (e as { response?: { data?: unknown } }).response;
        if (resp?.data) {
          if (typeof resp.data === "string") {
            message = resp.data;
          } else if (typeof resp.data === "object") {
            const data = resp.data as Record<string, unknown>;
            message = (data.message as string) || (data.error as string) || message;
          }
        }
      }
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const disableCustomerSearch = mode === "technician" && !selectedJobId;
  const disableDatePicker = mode === "customer" ? !selectedTechnicianId : false;
  const disableTimePicker = disableDatePicker || !appointmentDate;

  return (
    <div className="appointment-modal-backdrop" role="dialog" aria-modal="true">
      <div className="appointment-modal">
        <header className="appointment-modal__header">
          <div>
            <p className="eyebrow">{mode === "customer" ? "Customer Booking" : "Technician Scheduling"}</p>
            <h2>Add Appointment</h2>
          </div>
          <button className="ghost" onClick={onClose} aria-label="Close">×</button>
        </header>

        {loading ? (
          <div className="state state--inline">
            <Loader2 className="spin" size={22} />
            <span>Loading options…</span>
          </div>
        ) : (
          <form className="appointment-form" onSubmit={handleSubmit}>
            <div className="grid two">
              <label className="field">
                <span>Service</span>
                <div className="input-with-icon">
                  <ClipboardList size={16} />
                  <select
                    value={selectedJobId}
                    onChange={(e) => setSelectedJobId(e.target.value)}
                    required
                  >
                    <option value="" disabled>Select a service</option>
                    {jobOptions.map((job) => (
                      <option key={job.jobId} value={job.jobId}>
                        {job.jobName} ({job.jobType})
                      </option>
                    ))}
                  </select>
                </div>
              </label>

              <label className="field">
                <span>{mode === "customer" ? "Technician" : "Customer"}</span>
                <div className="input-with-icon">
                  <Users size={16} />
                  {mode === "customer" ? (
                    <select
                      value={selectedTechnicianId}
                      onChange={(e) => setSelectedTechnicianId(e.target.value)}
                      required
                    >
                      {employees.map((tech) => (
                        <option key={tech.employeeIdentifier.employeeId} value={tech.employeeIdentifier.employeeId}>
                          {tech.firstName} {tech.lastName}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder={disableCustomerSearch ? "Select a service first" : "Search customer by name"}
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      disabled={disableCustomerSearch}
                    />
                  )}
                </div>
                {mode === "technician" && (
                  <div className="customer-results">
                    {disableCustomerSearch ? (
                      <small className="hint">Pick a service before choosing a customer.</small>
                    ) : (
                      filteredCustomers.slice(0, 8).map((cust, idx) => {
                        const custId = getActualCustomerId(cust.customerId);
                        const selectedId = getActualCustomerId(selectedCustomerId);
                        
                        return (
                          <button
                            key={`${custId || `${cust.firstName}-${cust.lastName}`}-${idx}`}
                            type="button"
                            className={`pill ${selectedId === custId ? "pill--active" : ""}`}
                            onClick={() => setSelectedCustomerId(cust.customerId)}
                          >
                            {cust.firstName} {cust.lastName}
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </label>
            </div>

            <div className="grid two">
              <label className="field">
                <span>Date</span>
                <div className="input-with-icon">
                  <CalendarClock size={16} />
                  <input
                    type="date"
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    disabled={disableDatePicker}
                    required
                  />
                </div>
                <small className="hint">Weekdays only. Slots depend on technician schedule.</small>
              </label>

              <label className="field">
                <span>Time Slot</span>
                <div className="input-with-icon">
                  <CalendarClock size={16} />
                  <select
                    value={appointmentTime}
                    onChange={(e) => setAppointmentTime(e.target.value)}
                    disabled={disableTimePicker || scheduleLoading || availableSlots.length === 0}
                    required
                  >
                    <option value="" disabled>
                      {scheduleLoading ? "Checking schedule…" : "Select a time"}
                    </option>
                    {availableSlots.map((slot) => (
                      <option key={slot} value={slot}>
                        {labelForTime(slot)}
                      </option>
                    ))}
                  </select>
                </div>
                {appointmentDate && isWeekend(appointmentDate) && (
                  <small className="error">Weekend bookings are blocked.</small>
                )}
                {availableSlots.length === 0 && appointmentDate && !isWeekend(appointmentDate) && (
                  <small className="error">
                    {scheduleError || "No valid slots for this date/service with the selected technician."}
                  </small>
                )}
              </label>
            </div>

            <label className="field">
              <span>Cellar</span>
              <select
                value={selectedCellarId}
                onChange={(e) => setSelectedCellarId(e.target.value)}
                disabled={customerCellars.length === 0}
                required
              >
                {customerCellars.length === 0 && <option value="">No cellars for this customer</option>}
                {customerCellars.map((cellar) => (
                  <option key={cellar.cellarId} value={cellar.cellarId}>
                    {cellar.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid two">
              <label className="field">
                <span>Street Address</span>
                <input
                  type="text"
                  value={address.streetAddress}
                  onChange={(e) => setAddress({ ...address, streetAddress: e.target.value })}
                  required
                />
              </label>
              <label className="field">
                <span>City</span>
                <input
                  type="text"
                  value={address.city}
                  onChange={(e) => setAddress({ ...address, city: e.target.value })}
                  required
                />
              </label>
            </div>

            <div className="grid three">
              <label className="field">
                <span>Province</span>
                <input
                  type="text"
                  value={address.province}
                  onChange={(e) => setAddress({ ...address, province: e.target.value })}
                  required
                />
              </label>
              <label className="field">
                <span>Country</span>
                <input
                  type="text"
                  value={address.country}
                  onChange={(e) => setAddress({ ...address, country: e.target.value })}
                  required
                />
              </label>
              <label className="field">
                <span>Postal Code</span>
                <input
                  type="text"
                  value={address.postalCode}
                  onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
                  required
                />
              </label>
            </div>

            <label className="field">
              <span>Description</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Describe the issue or work to be done"
                required
              />
            </label>

            {error && <div className="banner banner--error">{error}</div>}

            <footer className="modal-actions">
              <button type="button" className="ghost" onClick={onClose} disabled={submitting}>Cancel</button>
              <button type="submit" className="primary" disabled={submitting || loading}>
                {submitting ? <Loader2 className="spin" size={16} /> : "Create Appointment"}
              </button>
            </footer>
          </form>
        )}
      </div>
    </div>
  );
}
