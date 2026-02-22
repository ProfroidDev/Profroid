import React, { useEffect, useId, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, CalendarClock, ClipboardList, Users } from 'lucide-react';
import './AddAppointmentModal.css';
import '../../../components/ConfirmationModal.css';
import { createAppointment } from '../api/createAppointment';
import { updateAppointment } from '../api/updateAppointment';
import type { AppointmentRequestModel } from '../models/AppointmentRequestModel';
import type { AppointmentResponseModel } from '../models/AppointmentResponseModel';
import { getJobs } from '../../jobs/api/getAllJobs';
import type { JobResponseModel } from '../../jobs/models/JobResponseModel';
import { getEmployees } from '../../employee/api/getAllEmployees';
import { translateAppointmentError } from '../../../utils/appointmentErrorTranslator';
import type { EmployeeResponseModel } from '../../employee/models/EmployeeResponseModel';
import { getCustomers } from '../../customer/api/getAllCustomers';
import type { CustomerResponseModel } from '../../customer/models/CustomerResponseModel';
import { getCellars } from '../../cellar/api/getAllCellars';
import type { CellarResponseModel } from '../../cellar/models/CellarResponseModel';
import { getEmployeeScheduleForDate } from '../../employee/api/getEmployeeScheduleForDate';
import { getEmployeeSchedule } from '../../employee/api/getEmployeeSchedule';
import type { TimeSlotType } from '../../employee/models/EmployeeScheduleRequestModel';
import { getProvincePostalCodeError } from '../../../utils/postalCodeValidator';
import { getMyJobs } from '../api/getMyJobs';
import { getTechnicianBookedSlots, type BookedSlot } from '../api/getTechnicianBookedSlots';
import { getAggregatedAvailability } from '../api/getAggregatedAvailability';
import useAuthStore from '../../authentication/store/authStore';
import {
  sanitizeAddress,
  sanitizeCity,
  sanitizeInput,
  sanitizePostalCode,
} from '../../../utils/sanitizer';

// Cache for shared data to reduce API calls when modal is opened/closed multiple times
const dataCache: {
  jobs: JobResponseModel[] | null;
  employees: EmployeeResponseModel[] | null;
  customers: CustomerResponseModel[] | null;
  cellars: CellarResponseModel[] | null;
  loadingPromise: Promise<
    [JobResponseModel[], EmployeeResponseModel[], CustomerResponseModel[], CellarResponseModel[]]
  > | null;
} = {
  jobs: null,
  employees: null,
  customers: null,
  cellars: null,
  loadingPromise: null,
};

// Clear cache on error or when data might be stale
function clearAppointmentDataCache() {
  dataCache.jobs = null;
  dataCache.employees = null;
  dataCache.customers = null;
  dataCache.cellars = null;
  dataCache.loadingPromise = null;
}

function getCachedData(): Promise<
  [JobResponseModel[], EmployeeResponseModel[], CustomerResponseModel[], CellarResponseModel[]]
> {
  // If all data is already cached AND has actual data, return it immediately
  // Don't use cache if any array is empty (might be from a failed fetch)
  if (
    dataCache.jobs &&
    dataCache.jobs.length > 0 &&
    dataCache.employees &&
    dataCache.customers &&
    dataCache.cellars
  ) {
    return Promise.resolve([
      dataCache.jobs,
      dataCache.employees,
      dataCache.customers,
      dataCache.cellars,
    ]);
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
  ] as const)
    .then(([jobs, employees, customers, cellars]) => {
      // Only cache if we got actual data (jobs should never be empty)
      if (jobs.length > 0) {
        dataCache.jobs = jobs;
        dataCache.employees = employees;
        dataCache.customers = customers;
        dataCache.cellars = cellars;
      }
      dataCache.loadingPromise = null;
      return [jobs, employees, customers, cellars];
    })
    .catch((error) => {
      dataCache.loadingPromise = null;
      // Clear cache on error so next attempt will refetch
      clearAppointmentDataCache();
      throw error;
    }) as Promise<
    [JobResponseModel[], EmployeeResponseModel[], CustomerResponseModel[], CellarResponseModel[]]
  >;

  return dataCache.loadingPromise;
}

type Mode = 'customer' | 'technician';

interface AddAppointmentModalProps {
  mode: Mode;
  onClose: () => void;
  onCreated: (appointment: AppointmentResponseModel) => void;
  editAppointment?: AppointmentResponseModel; // If provided, modal is in edit mode
}

const SLOT_ORDER: TimeSlotType[] = ['NINE_AM', 'ELEVEN_AM', 'ONE_PM', 'THREE_PM', 'FIVE_PM'];

const SLOT_TO_TIME: Record<TimeSlotType, string> = {
  NINE_AM: '09:00',
  ELEVEN_AM: '11:00',
  ONE_PM: '13:00',
  THREE_PM: '15:00',
  FIVE_PM: '17:00',
};

const SLOT_TO_LABEL: Record<TimeSlotType, string> = {
  NINE_AM: '9:00 AM',
  ELEVEN_AM: '11:00 AM',
  ONE_PM: '1:00 PM',
  THREE_PM: '3:00 PM',
  FIVE_PM: '5:00 PM',
};

function getRequiredSlots(job?: JobResponseModel): number {
  if (!job) return 1;

  // Calculate slots based on estimated duration from job response
  // Each slot is 2 hours (120 minutes)
  const MINUTES_PER_SLOT = 120;
  const duration = job.estimatedDurationMinutes || 120;
  const requiredSlots = Math.ceil(duration / MINUTES_PER_SLOT);

  // Cap at maximum available slots (5 slots from 9 AM to 5 PM)
  return Math.min(requiredSlots, 5);
}

function slotAllowedForJob(job: JobResponseModel | undefined, slot: TimeSlotType): boolean {
  if (!job) return true;

  const required = getRequiredSlots(job);
  const startIdx = SLOT_ORDER.indexOf(slot);

  // Check if there are enough consecutive slots available for this job duration
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
  if (!id) return '';
  if (typeof id === 'string') return id;
  if (typeof id === 'object' && id !== null && 'customerId' in id) {
    const obj = id as Record<string, unknown>;
    return typeof obj.customerId === 'string' ? obj.customerId : '';
  }
  return '';
}

function labelForTime(time: string): string {
  const entry = Object.entries(SLOT_TO_TIME).find(([, value]) => value === time);
  if (!entry) return time;
  const slot = entry[0] as TimeSlotType;
  return SLOT_TO_LABEL[slot];
}

// Type for technician data used in appointment requests
type TechnicianData = {
  technicianFirstName: string;
  technicianLastName: string;
};

export default function AddAppointmentModal({
  mode,
  onClose,
  onCreated,
  editAppointment,
}: AddAppointmentModalProps): React.ReactElement {
  const appointmentDialogTitleId = useId();
  const bufferDialogTitleId = useId();
  const { t, i18n } = useTranslation();
  const { customerData } = useAuthStore();

  // Language detection helper
  const isFrench = i18n.language === 'fr';

  // Helper function to get localized job name
  const getJobName = (job: JobResponseModel): string => {
    if (isFrench && job.jobNameFr) {
      return job.jobNameFr;
    }
    return job.jobName;
  };

  // Helper function to get localized job type
  const getJobType = (job: JobResponseModel): string => {
    const typeMap: Record<string, string> = {
      QUOTATION: isFrench ? t('pages.services.quotation') : 'Quotation',
      INSTALLATION: isFrench ? t('pages.services.installation') : 'Installation',
      REPARATION: isFrench ? t('pages.services.reparation') : 'Reparation',
      MAINTENANCE: isFrench ? t('pages.services.maintenance') : 'Maintenance',
    };
    return typeMap[job.jobType] || job.jobType;
  };

  // Determine if we're in edit mode
  const isEditMode = !!editAppointment;

  // Get customerId or employeeId from auth store
  const customerId = customerData?.customerId;
  const technicianId = customerData?.employeeId;

  const [jobs, setJobs] = useState<JobResponseModel[]>([]);
  const [employees, setEmployees] = useState<EmployeeResponseModel[]>([]);
  const [customers, setCustomers] = useState<CustomerResponseModel[]>([]);
  const [cellars, setCellars] = useState<CellarResponseModel[]>([]);
  const [scheduleSlots, setScheduleSlots] = useState<TimeSlotType[]>([]);

  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<string>(technicianId || '');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customerId || '');
  const [selectedCellarId, setSelectedCellarId] = useState<string>('');

  const [appointmentDate, setAppointmentDate] = useState<string>('');
  const [appointmentTime, setAppointmentTime] = useState<string>('');
  const appointmentTimeRef = React.useRef<string>('');
  // Remember if the user selected a valid slot from the dropdown
  const [timeWasAvailable, setTimeWasAvailable] = useState<boolean>(false);
  const [description, setDescription] = useState<string>('');
  const [address, setAddress] = useState({
    streetAddress: '',
    city: '',
    province: '',
    country: 'Canada',
    postalCode: '',
  });
  const [customerSearch, setCustomerSearch] = useState<string>('');
  const [searchedUsers, setSearchedUsers] = useState<Array<{ id: string; email: string }>>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [scheduleLoading, setScheduleLoading] = useState<boolean>(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [postalCodeValidationError, setPostalCodeValidationError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [allAppointments, setAllAppointments] = useState<AppointmentResponseModel[]>([]);
  const [technicianBookedSlots, setTechnicianBookedSlots] = useState<BookedSlot[]>([]);
  // Track whether we've fetched aggregated availability to distinguish between "no slots" and "not fetched yet"
  const [hasAggregatedData, setHasAggregatedData] = useState<boolean>(false);
  const [customerBusySlots, setCustomerBusySlots] = useState<BookedSlot[]>([]);
  const [showBufferWarning, setShowBufferWarning] = useState<boolean>(false);
  const [pendingRequest, setPendingRequest] = useState<AppointmentRequestModel | null>(null);

  // When selecting a customer, also snap to their first cellar (if any) and clear errors
  const handleSelectCustomer = (cust: CustomerResponseModel) => {
    setSelectedCustomerId(cust.customerId);
    const actualId = getActualCustomerId(cust.customerId);
    const matchingCellars = cellars.filter(
      (c) => getActualCustomerId(c.ownerCustomerId) === actualId
    );

    if (matchingCellars.length > 0) {
      setSelectedCellarId(matchingCellars[0].cellarId);
    } else {
      setSelectedCellarId('');
    }

    setError(null);
  };

  // Search users by email
  useEffect(() => {
    if (!customerSearch || customerSearch.trim().length < 2) {
      setSearchedUsers([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };

        const authToken = useAuthStore.getState().token;
        if (authToken) {
          headers['Authorization'] = `Bearer ${authToken}`;
        }

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/search-users?q=${encodeURIComponent(customerSearch)}&limit=50`,
          {
            method: 'GET',
            headers,
          }
        );

        if (!response.ok) {
          console.error(
            `User search request failed with status ${response.status} (${response.statusText}).`
          );
          setSearchedUsers([]);
          setError('Failed to search users. Please try again.');
          return;
        }

        const result = await response.json();
        const users = (result.data || []).map((u: { userId: string; email: string }) => ({
          id: u.userId,
          email: u.email,
        }));
        setSearchedUsers(users);
      } catch (error) {
        console.error('Error searching users:', error);
        setSearchedUsers([]);
        setError('Failed to search users. Please try again.');
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [customerSearch]);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setLoading(true);
        // Clear cache to ensure fresh data is fetched when modal opens
        clearAppointmentDataCache();
        const [jobData, employeeData, customerData, cellarData] = await getCachedData();

        if (!isMounted) return;

        const activeJobs = jobData.filter((j) => j.active);
        const technicians = employeeData.filter(
          (e) => e.isActive && e.employeeRole?.employeeRoleType === 'TECHNICIAN'
        );

        setJobs(activeJobs);
        setEmployees(technicians);
        setCustomers(customerData);
        setCellars(cellarData);

        // If in edit mode, initialize form with existing appointment data
        if (isEditMode && editAppointment) {
          // Set job
          const job = activeJobs.find((j) => j.jobName === editAppointment.jobName);
          if (job) {
            setSelectedJobId(job.jobId);
          }

          // Set technician ONLY for technician mode edits
          // In customer mode, don't set a specific technician to enable aggregated availability
          if (mode === 'technician' && editAppointment.technicianId) {
            const tech = technicians.find(
              (e) => e.employeeIdentifier.employeeId === editAppointment.technicianId
            );
            if (tech) {
              setSelectedTechnicianId(tech.employeeIdentifier.employeeId || '');
            } else {
              // Technician not found - handle gracefully
              const technicianName = `${editAppointment.technicianFirstName} ${editAppointment.technicianLastName}`;

              // Fallback: select first available technician if any exist
              if (technicians.length > 0) {
                setSelectedTechnicianId(technicians[0].employeeIdentifier.employeeId || '');
                setError(
                  `Technician ${technicianName} is no longer available. Selected first available technician instead.`
                );
              } else {
                // No technicians available at all
                setError(
                  `Unable to find technician ${technicianName} and no other technicians are available.`
                );
              }
            }
          } else if (mode === 'customer') {
            // In customer mode edits, explicitly clear technician to enable aggregated availability
            setSelectedTechnicianId('');
          }

          // Set customer (for technician mode)
          if (editAppointment.customerId) {
            const cust = customerData.find(
              (c) => getActualCustomerId(c.customerId) === editAppointment.customerId
            );
            if (cust) {
              setSelectedCustomerId(cust.customerId);
              // Fetch the user email for this customer's userId
              try {
                const token = useAuthStore.getState().token;
                const response = await fetch(
                  `${import.meta.env.VITE_API_URL}/users/${cust.userId}`,
                  {
                    method: 'GET',
                    headers: {
                      Authorization: `Bearer ${token}`,
                      'Content-Type': 'application/json',
                    },
                  }
                );
                if (response.ok) {
                  const result = await response.json();
                  if (result.user?.email) {
                    setCustomerSearch(result.user.email);
                  }
                }
              } catch (error) {
                console.error('Error fetching user email:', error);
              }
            }
          }

          // Set date and time
          const appointmentDateTime = new Date(editAppointment.appointmentDate);
          const dateStr = appointmentDateTime.toISOString().split('T')[0];
          setAppointmentDate(dateStr);

          // Extract time from appointmentStartTime or parse from date
          if (editAppointment.appointmentStartTime) {
            const timeParts = editAppointment.appointmentStartTime.split(':');
            const time = `${timeParts[0]}:${timeParts[1]}`;
            setAppointmentTime(time);
          } else {
            const hours = appointmentDateTime.getHours().toString().padStart(2, '0');
            const minutes = appointmentDateTime.getMinutes().toString().padStart(2, '0');
            setAppointmentTime(`${hours}:${minutes}`);
          }

          // Set cellar
          const cellar = cellarData.find((c) => c.name === editAppointment.cellarName);
          if (cellar) {
            setSelectedCellarId(cellar.cellarId);
          }

          // Set description
          setDescription(editAppointment.description);

          // Set address
          setAddress({
            streetAddress: editAppointment.appointmentAddress.streetAddress,
            city: editAppointment.appointmentAddress.city,
            province: editAppointment.appointmentAddress.province,
            country: editAppointment.appointmentAddress.country,
            postalCode: editAppointment.appointmentAddress.postalCode,
          });
        } else {
          // Original logic for non-edit mode
          if (mode === 'customer' && customerId) {
            setSelectedCustomerId(customerId);
          }

          if (mode === 'customer' && !selectedTechnicianId && technicians.length > 0) {
            setSelectedTechnicianId(technicians[0].employeeIdentifier.employeeId || '');
          }

          if (mode === 'technician' && technicianId) {
            setSelectedTechnicianId(technicianId);
          }

          if (mode === 'technician' && customerData.length > 0) {
            // Find first customer with cellars
            const customerWithCellar = customerData.find((cust) =>
              cellarData.some(
                (cel) =>
                  getActualCustomerId(cel.ownerCustomerId) === getActualCustomerId(cust.customerId)
              )
            );

            if (customerWithCellar) {
              setSelectedCustomerId(customerWithCellar.customerId);
            } else if (customerData.length > 0) {
              setSelectedCustomerId(customerData[0].customerId);
            }
          }
        }
      } catch {
        setError('Unable to load appointment data. Please try again.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [mode, customerId, technicianId, selectedTechnicianId, isEditMode, editAppointment]);

  // Define computed values BEFORE useEffects that depend on them
  const jobOptions = useMemo(() => {
    if (mode === 'customer') {
      return jobs.filter((j) => j.jobType === 'QUOTATION');
    }
    return jobs;
  }, [jobs, mode]);

  const selectedJob = useMemo(
    () => jobOptions.find((j) => j.jobId === selectedJobId),
    [jobOptions, selectedJobId]
  );

  const selectedTechnician = useMemo(
    () => employees.find((e) => e.employeeIdentifier.employeeId === selectedTechnicianId),
    [employees, selectedTechnicianId]
  );

  const selectedCustomer = useMemo(() => {
    const actualCustomerId = getActualCustomerId(selectedCustomerId);
    return customers.find((c) => getActualCustomerId(c.customerId) === actualCustomerId);
  }, [customers, selectedCustomerId]);

  // Fetch aggregated availability for customer mode (when no technician is selected)
  useEffect(() => {
    async function fetchAggregatedSlots() {
      // Only fetch in customer mode when we have a date and job selected
      if (mode !== 'customer' || !appointmentDate || !selectedJobId) {
        setTechnicianBookedSlots([]);
        setHasAggregatedData(false);
        return;
      }

      try {
        const selectedJobToUse = jobOptions.find((j) => j.jobId === selectedJobId);
        if (!selectedJobToUse) {
          return;
        }

        const response = await getAggregatedAvailability(
          appointmentDate,
          selectedJobToUse.jobName,
          isEditMode && editAppointment ? editAppointment.appointmentId : undefined
        );
        setTechnicianBookedSlots(response.bookedSlots || []);
        // Mark that we have fetched aggregated data (even if empty)
        setHasAggregatedData(true);
      } catch (err) {
        console.error('Failed to fetch aggregated availability:', err);
        setTechnicianBookedSlots([]);
        // Still mark as fetched even on error to show "no available slots" message
        setHasAggregatedData(true);
      }
    }

    fetchAggregatedSlots();
  }, [mode, appointmentDate, selectedJobId, jobOptions, isEditMode, editAppointment]);

  // Fetch technician's booked slots for technician mode
  useEffect(() => {
    async function fetchBookedSlots() {
      // Only fetch in technician mode when we have a technician and date selected
      if (mode !== 'technician' || !selectedTechnicianId || !appointmentDate) {
        setTechnicianBookedSlots([]);
        return;
      }

      try {
        const response = await getTechnicianBookedSlots(
          selectedTechnicianId,
          appointmentDate,
          isEditMode && editAppointment ? editAppointment.appointmentId : undefined
        );
        setTechnicianBookedSlots(response.bookedSlots || []);
      } catch (err) {
        console.error('Failed to fetch technician booked slots:', err);
        setTechnicianBookedSlots([]);
      }
    }

    fetchBookedSlots();
  }, [mode, selectedTechnicianId, appointmentDate, isEditMode, editAppointment]);

  // Fetch appointments to check for buffer conflicts
  useEffect(() => {
    async function fetchAppointments() {
      try {
        if (mode === 'technician') {
          const appointments = await getMyJobs();
          setAllAppointments(appointments);
          return;
        }

        // Customer mode: availability is driven by aggregated slots, no need to fetch all appointments
        // Just set empty array to avoid unnecessary API calls and 403 errors
        setAllAppointments([]);
      } catch {
        setAllAppointments([]);
      }
    }

    fetchAppointments();
  }, [mode, appointmentDate]);

  // Fetch customer's busy slots when in technician mode and customer is selected
  useEffect(() => {
    async function fetchCustomerBusySlots() {
      if (mode !== 'technician' || !selectedCustomerId || !appointmentDate || !allAppointments) {
        setCustomerBusySlots([]);
        return;
      }

      try {
        // Filter appointments for the selected customer on the selected date that are SCHEDULED or COMPLETED
        const actualCustomerId = getActualCustomerId(selectedCustomerId);
        const customerAppts = allAppointments.filter((apt) => {
          if (!apt.customerId) return false;

          // Check if this appointment belongs to the selected customer
          const apptCustomerId = getActualCustomerId(apt.customerId);
          if (apptCustomerId !== actualCustomerId) return false;

          // Get the appointment date (handle both date string and full timestamp)
          let apptDate: string;
          if (apt.appointmentDate) {
            // If it's a timestamp like "2025-01-07T09:00:00", extract just the date
            apptDate =
              typeof apt.appointmentDate === 'string'
                ? apt.appointmentDate.split('T')[0]
                : new Date(apt.appointmentDate).toISOString().split('T')[0];
          } else {
            return false;
          }

          const selectedDate = appointmentDate; // already in YYYY-MM-DD format

          return (
            apptDate === selectedDate && (apt.status === 'SCHEDULED' || apt.status === 'COMPLETED')
          );
        });

        // Convert appointments to booked slots format
        const busySlots: BookedSlot[] = customerAppts.map((apt) => {
          const startTime = apt.appointmentStartTime || '09:00:00';
          const endTime = apt.appointmentEndTime || '10:00:00';

          return {
            startTime: startTime,
            endTime: endTime,
          };
        });

        setCustomerBusySlots(busySlots);
      } catch (err) {
        console.error('Failed to fetch customer busy slots:', err);
        setCustomerBusySlots([]);
      }
    }

    fetchCustomerBusySlots();
  }, [mode, selectedCustomerId, appointmentDate, allAppointments]);

  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return [];
    if (searchedUsers.length === 0) return [];
    // Match customers whose userId matches any of the searched user IDs
    const userIds = searchedUsers.map((u) => u.id);
    return customers.filter((c) => c.isActive !== false && userIds.includes(c.userId));
  }, [customers, customerSearch, searchedUsers]);

  // Keep customer selection in sync with the filtered list only if current selection is filtered out
  useEffect(() => {
    if (mode === 'technician' && filteredCustomers.length > 0 && selectedCustomerId) {
      const actualCustomerId = getActualCustomerId(selectedCustomerId);

      // Only update if the current selection is not in the filtered list
      const isCurrentInFiltered = filteredCustomers.some(
        (c) => getActualCustomerId(c.customerId) === actualCustomerId
      );

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
        streetAddress: selectedCustomer.streetAddress || '',
        city: selectedCustomer.city || '',
        province: selectedCustomer.province || '',
        country: selectedCustomer.country || 'Canada',
        postalCode: selectedCustomer.postalCode || '',
      });
    }
  }, [selectedCustomer]);

  useEffect(() => {
    if (customerCellars.length > 0) {
      setSelectedCellarId(customerCellars[0].cellarId);
      // Clear error when cellar is auto-selected
      setError(null);
    } else {
      setSelectedCellarId('');
    }
  }, [customerCellars]);

  // Clear error when customer selection changes
  useEffect(() => {
    setError(null);
  }, [selectedCustomerId, customerSearch]);

  // Validate postal code when address changes
  useEffect(() => {
    const validationError = getProvincePostalCodeError(address.postalCode, address.province);
    setPostalCodeValidationError(validationError);
  }, [address.postalCode, address.province]);

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
        const dateSchedule = await getEmployeeScheduleForDate(
          selectedTechnicianId,
          appointmentDate
        );
        let slots = dateSchedule.flatMap((s) => s.timeSlots || []);

        // 2) Fallback to weekly schedule for the weekday if no slots
        if (slots.length === 0) {
          const weekly = await getEmployeeSchedule(selectedTechnicianId);
          const weekday = new Date(appointmentDate)
            .toLocaleDateString('en-US', { weekday: 'long' })
            .toUpperCase();
          const daySlots = weekly
            .filter((s: { dayOfWeek?: string }) => s.dayOfWeek?.toUpperCase() === weekday)
            .flatMap((s: { timeSlots?: string[] }) => s.timeSlots || []);
          slots = daySlots;
        }

        // Convert time strings to TimeSlotType enums
        const timeToEnum: Record<string, TimeSlotType> = {
          '9:00 AM': 'NINE_AM',
          '11:00 AM': 'ELEVEN_AM',
          '1:00 PM': 'ONE_PM',
          '3:00 PM': 'THREE_PM',
          '5:00 PM': 'FIVE_PM',
        };

        const normalized = slots
          .map((slot) => timeToEnum[slot] || slot.toUpperCase())
          .filter((slot): slot is TimeSlotType => SLOT_ORDER.includes(slot as TimeSlotType));
        const uniqueSlots = Array.from(new Set(normalized));
        setScheduleSlots(uniqueSlots);

        if (uniqueSlots.length === 0) {
          setScheduleError('No schedule returned for this technician on the selected date.');
        }
      } catch (e) {
        setScheduleSlots([]);

        // Try to surface a clearer message from backend
        let message = 'Unable to load technician schedule. Try another date or technician.';
        if (typeof e === 'object' && e && 'response' in e) {
          const resp = (e as { response?: { status?: number; data?: unknown } }).response;
          if (resp?.data) {
            if (typeof resp.data === 'string') {
              message = resp.data;
            } else if (typeof resp.data === 'object') {
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

    const editingAppointmentId =
      isEditMode && editAppointment && editAppointment.appointmentId != null
        ? editAppointment.appointmentId
        : null;

    // Extract the ORIGINAL appointment time (not the currently selected one)
    // This ensures we always keep the original slot available, regardless of dropdown changes
    let editStartTime: string | null = null;
    if (editAppointment) {
      if (editAppointment.appointmentStartTime) {
        editStartTime = editAppointment.appointmentStartTime.substring(0, 5);
      } else {
        try {
          const dt = new Date(editAppointment.appointmentDate);
          editStartTime = dt.toISOString().substring(11, 16);
        } catch {
          editStartTime = null;
        }
      }
    }

    // For customer mode: prefer aggregated availability (bookedSlots returned as available starts); fallback to standard slots
    if (mode === 'customer') {
      const slots: string[] = [];
      const jobDuration = selectedJob.estimatedDurationMinutes || 120;

      // Only use aggregated data if we've fetched it (even if empty array means no availability)
      const useAggregated = hasAggregatedData;
      const baseSlots = useAggregated
        ? technicianBookedSlots
        : SLOT_ORDER.map(
            (s) =>
              ({
                startTime: `${SLOT_TO_TIME[s]}:00`,
                endTime: `${SLOT_TO_TIME[s]}:00`,
              }) as BookedSlot
          );

      baseSlots.forEach((slot: BookedSlot) => {
        const startTimeRaw = slot.startTime;
        if (!startTimeRaw) return;

        const time = startTimeRaw.substring(0, 5);

        if (isPast(appointmentDate, time)) return;
        if (!passesBookingDeadline(appointmentDate, time)) return;

        const slotStart = new Date(`${appointmentDate}T${time}:00`);
        const slotEnd = new Date(slotStart.getTime() + jobDuration * 60 * 1000);

        const lastSlotEnd = new Date(`${appointmentDate}T17:00:00`);
        if (slotEnd > lastSlotEnd) return;

        slots.push(time);
      });

      // Always keep the original edit time visible
      if (editingAppointmentId && editStartTime && !slots.includes(editStartTime)) {
        slots.push(editStartTime);
      }

      return Array.from(new Set(slots));
    }

    // For technician mode: use schedule slots and check for conflicts
    if (!selectedTechnician) return [];

    const slotSet = new Set(scheduleSlots);
    const slots: string[] = [];
    const jobDuration = selectedJob.estimatedDurationMinutes || 120;

    SLOT_ORDER.forEach((slot) => {
      if (!slotSet.has(slot)) return;
      if (!slotAllowedForJob(selectedJob, slot)) return;

      const time = SLOT_TO_TIME[slot];
      if (isPast(appointmentDate, time)) return;
      if (!passesBookingDeadline(appointmentDate, time)) return;

      // Calculate end time for this slot
      const slotStart = new Date(`${appointmentDate}T${time}:00`);
      const slotEnd = new Date(slotStart.getTime() + jobDuration * 60 * 1000);

      // Check if slotEnd goes past the last slot (5:00 PM)
      // Allow appointments to end at exactly 17:00 (5:00 PM), not after
      const lastSlotEnd = new Date(`${appointmentDate}T17:00:00`);
      if (slotEnd > lastSlotEnd) return;

      // Check for conflicts with booked slots (for technician mode when checking against specific tech)
      const hasBookedConflict = technicianBookedSlots.some((bookedSlot) => {
        if (!bookedSlot.startTime || !bookedSlot.endTime) return false;

        // Allow the existing appointment's slot when editing
        if (editingAppointmentId && bookedSlot.startTime.substring(0, 5) === editStartTime) {
          return false;
        }

        const bookedStart = new Date(`${appointmentDate}T${bookedSlot.startTime}`);
        const bookedEnd = new Date(`${appointmentDate}T${bookedSlot.endTime}`);

        // Overlap check: slotStart < bookedEnd AND slotEnd > bookedStart
        return slotStart < bookedEnd && slotEnd > bookedStart;
      });

      if (hasBookedConflict) return;

      // Check for conflicts with customer's existing appointments
      const hasCustomerConflict = customerBusySlots.some((busySlot) => {
        if (!busySlot.startTime || !busySlot.endTime) return false;

        // Allow the existing appointment's slot when editing
        if (isEditMode && editStartTime && busySlot.startTime.substring(0, 5) === editStartTime) {
          return false;
        }

        const busyStart = new Date(`${appointmentDate}T${busySlot.startTime}`);
        const busyEnd = new Date(`${appointmentDate}T${busySlot.endTime}`);

        // Overlap check: slotStart < busyEnd AND slotEnd > busyStart
        return slotStart < busyEnd && slotEnd > busyStart;
      });

      if (hasCustomerConflict) return;

      // Overlap detection with allAppointments (for technician mode)
      const hasConflict = allAppointments.some((apt) => {
        if (editingAppointmentId && apt.appointmentId === editingAppointmentId) {
          return false;
        }
        const aptDate = new Date(apt.appointmentDate).toISOString().split('T')[0];
        if (aptDate !== appointmentDate) return false;
        if (apt.status === 'CANCELLED') return false;

        // Check if it's the same technician by ID (not by name to avoid conflicts with same-named technicians)
        const isSameTechnician =
          apt.technicianId === selectedTechnician.employeeIdentifier.employeeId;
        if (!isSameTechnician) return false;

        // Use start/end time from backend if available
        const aptStart = apt.appointmentStartTime
          ? new Date(`${appointmentDate}T${apt.appointmentStartTime}`)
          : new Date(apt.appointmentDate);
        const aptEnd = new Date(aptStart);
        if (apt.appointmentStartTime && apt.appointmentEndTime) {
          // Parse times as minutes since midnight
          const [startHour, startMin] = apt.appointmentStartTime.split(':').map(Number);
          const [endHour, endMin] = apt.appointmentEndTime.split(':').map(Number);
          const startMinutes = startHour * 60 + startMin;
          const endMinutes = endHour * 60 + endMin;
          const durationMs = (endMinutes - startMinutes) * 60 * 1000;
          aptEnd.setTime(aptStart.getTime() + durationMs);
        } else {
          aptEnd.setTime(aptStart.getTime() + 60 * 60 * 1000); // fallback 1 hour
        }

        // Overlap check
        return slotStart < aptEnd && slotEnd > aptStart;
      });

      if (hasConflict) return;

      slots.push(time);
    });

    return slots;
  }, [
    appointmentDate,
    scheduleSlots,
    selectedJob,
    allAppointments,
    selectedTechnician,
    technicianBookedSlots,
    hasAggregatedData,
    customerBusySlots,
    mode,
    isEditMode,
    editAppointment,
  ]);

  useEffect(() => {
    // Keep the ref in sync with the controlled value
    if (appointmentTime) {
      appointmentTimeRef.current = appointmentTime;
    }
  }, [appointmentTime]);

  // Reset the confirmation flag when key inputs change
  useEffect(() => {
    setTimeWasAvailable(false);
  }, [appointmentDate, selectedJobId, selectedTechnicianId, mode]);

  // Reset aggregated data flag when entering customer mode or when dependencies change
  useEffect(() => {
    if (mode !== 'customer') {
      setHasAggregatedData(false);
    }
  }, [mode]);

  // Fallback durations by job type when end time is missing
  // Check for 30-minute buffer gap with technician's own appointments
  const checkTechnicianBufferGap = (
    newStartTime: Date,
    newEndTime: Date,
    appointments: AppointmentResponseModel[],
    technicianId?: string
  ): boolean => {
    if (!technicianId) return false;

    const BUFFER_MINUTES = 30;
    const newDateKey = appointmentDate;

    const withinBuffer = (otherStart: Date, otherEnd: Date): boolean => {
      const hasOverlap = newStartTime < otherEnd && newEndTime > otherStart;
      if (hasOverlap) return false; // overlaps are handled elsewhere

      const gapBefore = otherStart.getTime() - newEndTime.getTime();
      if (gapBefore >= 0 && gapBefore < BUFFER_MINUTES * 60 * 1000) {
        return true;
      }

      const gapAfter = newStartTime.getTime() - otherEnd.getTime();
      if (gapAfter >= 0 && gapAfter < BUFFER_MINUTES * 60 * 1000) {
        return true;
      }

      return false;
    };

    for (const appointment of appointments) {
      if (appointment.status === 'CANCELLED') continue;
      if (appointment.technicianId !== technicianId) continue;

      const appointmentDateIso =
        typeof appointment.appointmentDate === 'string'
          ? appointment.appointmentDate
          : new Date(appointment.appointmentDate).toISOString();
      const appointmentDateOnly = appointmentDateIso.split('T')[0];

      if (appointmentDateOnly !== newDateKey) continue;

      const timeFromDate = appointmentDateIso.includes('T')
        ? appointmentDateIso.split('T')[1].substring(0, 5)
        : null;
      const rawStart = appointment.appointmentStartTime || timeFromDate;
      if (!rawStart) continue;

      const startTimeStr = rawStart.substring(0, 5);
      const existingStart = new Date(`${appointmentDateOnly}T${startTimeStr}:00`);

      let existingEnd: Date;
      if (appointment.appointmentEndTime) {
        const endTimeStr = appointment.appointmentEndTime.substring(0, 5);
        existingEnd = new Date(`${appointmentDateOnly}T${endTimeStr}:00`);
      } else {
        const matchedJob = jobs.find((j) => j.jobName === appointment.jobName);
        const durationMinutes = matchedJob?.estimatedDurationMinutes ?? 60;
        existingEnd = new Date(existingStart.getTime() + durationMinutes * 60 * 1000);
      }

      if (Number.isNaN(existingStart.getTime()) || Number.isNaN(existingEnd.getTime())) {
        continue;
      }

      if (isEditMode && editAppointment?.appointmentId === appointment.appointmentId) {
        continue;
      }

      if (withinBuffer(existingStart, existingEnd)) return true;
    }

    return false;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!selectedJobId) {
      setError('Select a service to continue.');
      return;
    }

    // In customer mode, technician is auto-assigned from available staff, so don't require selection
    // In technician mode creating new, technician is the current user
    if (mode === 'customer' && !selectedTechnician && !isEditMode) {
      setError('Select a technician.');
      return;
    }

    if (mode === 'technician' && !selectedCustomerId) {
      setError('Pick a customer for this job.');
      return;
    }

    if (!appointmentDate || !appointmentTime) {
      setError('Choose a date and time.');
      return;
    }

    if (isWeekend(appointmentDate)) {
      setError('Weekend bookings are not allowed.');
      return;
    }

    if (!passesBookingDeadline(appointmentDate, appointmentTime)) {
      setError('This slot is past the booking deadline.');
      return;
    }

    // Check province and postal code match using the new validation
    const provincePostalErrorKey = getProvincePostalCodeError(address.postalCode, address.province);
    if (provincePostalErrorKey) {
      const translatedError = t(provincePostalErrorKey, {
        province: address.province,
      });
      setError(translatedError);
      setPostalCodeValidationError(provincePostalErrorKey);
      return;
    }

    const cellar = customerCellars.find((c) => c.cellarId === selectedCellarId);
    if (!cellar) {
      // If cellars are available but selection lagged, snap to the first one and retry
      if (customerCellars.length > 0) {
        const firstCellar = customerCellars[0];
        setSelectedCellarId(firstCellar.cellarId);
        setError(null);
        return;
      }
      setError('Select a cellar for this appointment.');
      return;
    }

    // Use the controlled value directly to avoid stale ref selections
    const timeToUse = appointmentTime;
    // Debug: log selected time at submit
    try {
      console.debug('[AddAppointmentModal] Submit time', {
        timeToUse,
        appointmentTime,
        ref: appointmentTimeRef.current,
      });
    } catch {
      void 0;
    }
    const appointmentDateTime = `${appointmentDate}T${timeToUse}:00`;

    // Safety: ensure selected time is valid
    // Allow submission if current list includes it OR user previously chose from a valid list
    if (!availableSlots.includes(appointmentTime) && !timeWasAvailable) {
      // Non-blocking warning; proceed to let backend validate
      try {
        console.warn('[AddAppointmentModal] Proceeding despite transient slot list drop', {
          appointmentTime,
          availableSlots,
          timeWasAvailable,
        });
      } catch {
        void 0;
      }
    }

    // Debug: guard against mismatches between selected time and derived string
    try {
      const derived = appointmentDateTime.split('T')[1].substring(0, 5);
      if (derived !== timeToUse) {
        console.warn('[AddAppointmentModal] Time mismatch', {
          appointmentTime: timeToUse,
          derived,
          appointmentDateTime,
          availableSlots,
        });
      }
    } catch {
      void 0;
    }

    // Extract actual customer ID in case it's nested - only needed for technician mode
    // However, when editing a customer-created quotation, don't send customerId as customer cannot be changed
    const actualCustomerId =
      mode === 'technician' && !isEditingQuotationCreatedByCustomer
        ? getActualCustomerId(selectedCustomerId)
        : undefined;

    // For customer mode edits, validate that the original technician still exists and is active
    let validatedTechnicianData: TechnicianData | undefined;
    if (mode === 'customer' && isEditMode && editAppointment) {
      // Find the original technician by ID (not by name to avoid conflicts with same-named technicians)
      const originalTechnician = employees.find(
        (e) => e.employeeIdentifier.employeeId === editAppointment.technicianId
      );

      if (!originalTechnician) {
        setError(t('pages.appointments.technicianNoLongerAvailable'));
        return;
      }

      validatedTechnicianData = {
        technicianFirstName: originalTechnician.firstName,
        technicianLastName: originalTechnician.lastName,
      };
    }

    // Compute explicit start/end times to send alongside appointmentDate
    const startTimeStr = `${timeToUse}:00`;
    const endTimeStr = (() => {
      const appointmentStart = new Date(`${appointmentDate}T${timeToUse}:00`);
      const durationMinutes = selectedJob?.estimatedDurationMinutes ?? 60;
      const end = new Date(appointmentStart.getTime() + durationMinutes * 60 * 1000);
      const hh = end.getHours().toString().padStart(2, '0');
      const mm = end.getMinutes().toString().padStart(2, '0');
      return `${hh}:${mm}:00`;
    })();

    const request: AppointmentRequestModel = {
      customerId: actualCustomerId,
      ...(mode === 'technician' && selectedTechnician
        ? {
            technicianId: selectedTechnician.employeeIdentifier.employeeId,
            technicianFirstName: selectedTechnician.firstName,
            technicianLastName: selectedTechnician.lastName,
          }
        : {}),
      // For customer mode edits, include the validated technician data
      ...(validatedTechnicianData ? validatedTechnicianData : {}),
      jobName: selectedJob ? selectedJob.jobName : '',
      cellarName: cellar.name,
      appointmentDate: appointmentDateTime,
      appointmentStartTime: startTimeStr,
      appointmentEndTime: endTimeStr,
      description,
      appointmentAddress: { ...address },
    };

    // Ensure we have fresh appointments for buffer check (in case initial fetch wasn't ready)
    let appointmentsForCheck = allAppointments;
    if (appointmentsForCheck.length === 0) {
      try {
        if (mode === 'technician') {
          appointmentsForCheck = await getMyJobs();
          setAllAppointments(appointmentsForCheck);
        }
        // For customer mode, no need to fetch appointments - availability is from aggregated slots
      } catch {
        // If fetch fails, fall back to existing (possibly empty) list; backend will still accept
        appointmentsForCheck = allAppointments;
      }
    }

    if (!selectedJob) {
      setError('Select a service to continue.');
      return;
    }

    // Check for 30-minute buffer gap with technician's own appointments
    const appointmentStart = new Date(appointmentDateTime);
    const appointmentDurationMinutes = selectedJob.estimatedDurationMinutes ?? 60;
    const appointmentEnd = new Date(
      appointmentStart.getTime() + appointmentDurationMinutes * 60 * 1000
    );

    // Get the technicianId to check - for technician mode, use auth technicianId or selectedTechnicianId
    const techIdForCheck =
      mode === 'technician' ? technicianId || selectedTechnicianId : selectedTechnicianId;

    const hasBufferConflict = checkTechnicianBufferGap(
      appointmentStart,
      appointmentEnd,
      appointmentsForCheck,
      techIdForCheck
    );

    // Show warning modal if buffer gap < 30 minutes, but allow user to continue
    if (hasBufferConflict && !isEditMode && techIdForCheck) {
      setPendingRequest(request);
      setShowBufferWarning(true);
      setSubmitting(false);
      return;
    }

    // Proceed with normal submission
    submitAppointment(request);
  };

  const submitAppointment = async (request: AppointmentRequestModel) => {
    try {
      setSubmitting(true);
      let result: AppointmentResponseModel;

      if (isEditMode && editAppointment) {
        // Update existing appointment
        result = await updateAppointment(editAppointment.appointmentId, request);
      } else {
        // Create new appointment
        result = await createAppointment(request);
      }

      onCreated(result);
      onClose();
    } catch (e: unknown) {
      let message = isEditMode ? 'Failed to update appointment.' : 'Failed to create appointment.';
      if (typeof e === 'object' && e && 'response' in e) {
        const resp = (e as { response?: { data?: unknown } }).response;
        if (resp?.data) {
          if (typeof resp.data === 'string') {
            message = resp.data;
          } else if (typeof resp.data === 'object') {
            const data = resp.data as Record<string, unknown>;
            message = (data.message as string) || (data.error as string) || message;
          }
        }
      }
      // Translate appointment-specific error codes
      const translatedMessage = translateAppointmentError(message);
      setError(translatedMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const disableCustomerSearch = mode === 'technician' && !selectedJobId;
  const disableDatePicker = mode === 'customer' ? !selectedJobId : false;
  const disableTimePicker = disableDatePicker || !appointmentDate;

  // Prevent job changes only for customer-created quotations (not technician-created ones)
  const isEditingCustomerCreatedQuotation =
    isEditMode &&
    editAppointment &&
    editAppointment.createdByRole === 'CUSTOMER' &&
    editAppointment.jobType === 'QUOTATION';

  // Disable job selection if TECHNICIAN is editing customer-created quotation
  const disableJobChange = isEditingCustomerCreatedQuotation && mode === 'technician';

  // Restrict form fields when TECHNICIAN is editing customer-created quotation
  const isEditingQuotationCreatedByCustomer = disableJobChange;

  return (
    <div
      className="appointment-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby={appointmentDialogTitleId}
    >
      <div className="appointment-modal">
        <header className="appointment-modal__header">
          <div>
            <p className="eyebrow">
              {mode === 'customer'
                ? t('pages.appointments.customerBooking')
                : t('pages.appointments.technicianScheduling')}
            </p>
            <p id={appointmentDialogTitleId} className="appointment-modal-title">
              {isEditMode
                ? t('pages.appointments.editAppointment')
                : t('pages.appointments.addAppointment')}
            </p>
          </div>
          <button type="button" className="ghost" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        {loading ? (
          <div className="state state--inline">
            <Loader2 className="spin" size={22} />
            <span>{t('pages.appointments.loadingOptions')}</span>
          </div>
        ) : (
          <form className="appointment-form" onSubmit={handleSubmit}>
            <div className="grid two">
              <label className="field">
                <span>
                  {t('pages.appointments.service')} ({isFrench ? t('common.language') : 'English'})
                </span>
                <div className="input-with-icon">
                  <ClipboardList size={16} />
                  <select
                    value={selectedJobId}
                    onChange={(e) => setSelectedJobId(e.target.value)}
                    disabled={disableJobChange}
                    required
                  >
                    <option value="" disabled>
                      {t('pages.appointments.selectService')}
                    </option>
                    {jobOptions.map((job) => (
                      <option key={job.jobId} value={job.jobId}>
                        {getJobName(job)} ({getJobType(job)})
                      </option>
                    ))}
                  </select>
                </div>
                {disableJobChange && (
                  <small className="hint" style={{ color: '#92400e' }}>
                    {t('pages.appointments.cannotChangeCustomerQuotation')}
                  </small>
                )}
              </label>

              <label className="field">
                <span>
                  {mode === 'customer'
                    ? t('pages.appointments.availableTechnicians')
                    : t('pages.appointments.customer')}
                </span>
                <div className="input-with-icon">
                  <Users size={16} />
                  {mode === 'customer' ? (
                    <input
                      type="text"
                      placeholder={t('pages.appointments.autoAssignedTechnician')}
                      disabled
                      value="Auto-assigned"
                      maxLength={100}
                    />
                  ) : (
                    <input
                      type="text"
                      placeholder={
                        disableCustomerSearch
                          ? t('pages.appointments.selectServiceFirst')
                          : t('pages.appointments.searchCustomerByName')
                      }
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      maxLength={100}
                      disabled={disableCustomerSearch || isEditingQuotationCreatedByCustomer}
                    />
                  )}
                </div>
                {mode === 'technician' && (
                  <div className="customer-results">
                    {disableCustomerSearch ? (
                      <small className="hint">{t('pages.appointments.pickServiceFirst')}</small>
                    ) : isEditingQuotationCreatedByCustomer ? (
                      <small className="hint" style={{ color: '#92400e' }}>
                        {t('pages.appointments.cannotChangeCustomerForQuotation')}
                      </small>
                    ) : filteredCustomers.length === 0 && customerSearch.trim().length >= 2 ? (
                      <small className="hint">{t('pages.appointments.noCustomersFound')}</small>
                    ) : filteredCustomers.length === 0 ? (
                      <small className="hint">{t('pages.appointments.typeEmailToSearch')}</small>
                    ) : (
                      filteredCustomers.slice(0, 8).map((cust, idx) => {
                        const custId = getActualCustomerId(cust.customerId);
                        const selectedId = getActualCustomerId(selectedCustomerId);

                        // Find the email for this customer from searched users
                        const userEmail =
                          searchedUsers.find((u) => u.id === cust.userId)?.email || cust.userId;

                        return (
                          <button
                            key={`${custId || `${cust.firstName}-${cust.lastName}`}-${idx}`}
                            type="button"
                            className={`pill ${selectedId === custId ? 'pill--active' : ''}`}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleSelectCustomer(cust);
                            }}
                          >
                            {cust.firstName} {cust.lastName} ({userEmail})
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
                {mode === 'customer' && (
                  <small className="hint">{t('pages.appointments.autoAssignedFromStaff')}</small>
                )}
              </label>
            </div>

            <div className="grid two">
              <label className="field">
                <span>{t('pages.appointments.date')}</span>
                <div className="input-with-icon">
                  <CalendarClock size={16} />
                  <input
                    type="date"
                    lang={i18n.language === 'fr' ? 'fr-FR' : 'en-US'}
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    disabled={disableDatePicker}
                    required
                  />
                </div>
                <small className="hint">
                  {t('pages.appointments.weekdaysOnly')}{' '}
                  {mode === 'customer'
                    ? t('pages.appointments.slotsFromAnyTechnician')
                    : t('pages.appointments.slotsDependOnSchedule')}
                </small>
              </label>

              <label className="field">
                <span>{t('pages.appointments.timeSlot')}</span>
                <div className="input-with-icon">
                  <CalendarClock size={16} />
                  <select
                    value={appointmentTime}
                    onChange={(e) => {
                      setAppointmentTime(e.target.value);
                      appointmentTimeRef.current = e.target.value;
                      // The dropdown options come from availableSlots, so this was valid at selection time
                      setTimeWasAvailable(true);
                    }}
                    disabled={disableTimePicker || scheduleLoading || availableSlots.length === 0}
                    required
                  >
                    <option value="" disabled>
                      {scheduleLoading
                        ? t('pages.appointments.checkingSchedule')
                        : t('pages.appointments.selectTime')}
                    </option>
                    {availableSlots.map((slot) => (
                      <option key={slot} value={slot}>
                        {labelForTime(slot)}
                      </option>
                    ))}
                  </select>
                </div>
                {appointmentDate && isWeekend(appointmentDate) && (
                  <small className="error">{t('pages.appointments.weekendBookingsBlocked')}</small>
                )}
                {availableSlots.length === 0 && appointmentDate && !isWeekend(appointmentDate) && (
                  <small className="error">
                    {scheduleError ||
                      (mode === 'customer'
                        ? t('pages.appointments.noAvailableSlotsCustomer')
                        : t('pages.appointments.noAvailableSlotsEmployee'))}
                  </small>
                )}
              </label>
            </div>

            <label className="field">
              <span>{t('pages.appointments.cellar')}</span>
              <select
                value={selectedCellarId}
                onChange={(e) => setSelectedCellarId(e.target.value)}
                disabled={customerCellars.length === 0}
                required
              >
                {customerCellars.length === 0 && (
                  <option value="">{t('pages.appointments.noCellarsForCustomer')}</option>
                )}
                {customerCellars.map((cellar) => (
                  <option key={cellar.cellarId} value={cellar.cellarId}>
                    {cellar.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid two">
              <label className="field">
                <span>
                  {t('pages.appointments.streetAddress')}
                  <span style={{ fontSize: '0.85rem', color: '#666', marginLeft: '8px' }}>
                    {address.streetAddress.length}/256
                  </span>
                </span>
                <input
                  type="text"
                  value={address.streetAddress}
                  onChange={(e) =>
                    setAddress({ ...address, streetAddress: sanitizeAddress(e.target.value) })
                  }
                  maxLength={256}
                  required
                />
              </label>
              <label className="field">
                <span>
                  {t('pages.appointments.city')}
                  <span style={{ fontSize: '0.85rem', color: '#666', marginLeft: '8px' }}>
                    {address.city.length}/100
                  </span>
                </span>
                <input
                  type="text"
                  value={address.city}
                  onChange={(e) => setAddress({ ...address, city: sanitizeCity(e.target.value) })}
                  maxLength={100}
                  required
                />
              </label>
            </div>

            <div className="grid three">
              <label className="field">
                <span>{t('pages.appointments.province')}</span>
                <select
                  value={address.province}
                  onChange={(e) => {
                    const newProvince = e.target.value;
                    setAddress({ ...address, province: newProvince });

                    // Re-validate postal code when province changes
                    const validationError = getProvincePostalCodeError(
                      address.postalCode,
                      newProvince
                    );
                    setPostalCodeValidationError(validationError);
                  }}
                  required
                >
                  <option value="">{t('pages.appointments.selectProvince')}</option>
                  <option value="QC">{t('pages.appointments.quebec')}</option>
                  <option value="ON">{t('pages.appointments.ontario')}</option>
                </select>
                <small style={{ color: '#6b7280', marginTop: '4px', display: 'block' }}>
                  {t('pages.appointments.operationalAreaMessage')}
                </small>
              </label>
              <label className="field">
                <span>{t('pages.appointments.country')}</span>
                <input
                  type="text"
                  value={address.country}
                  onChange={(e) =>
                    setAddress({ ...address, country: sanitizeInput(e.target.value) })
                  }
                  maxLength={100}
                  placeholder={t('pages.appointments.country')}
                  title={`${address.country.length}/100`}
                  required
                />
              </label>
              <label className="field">
                <span>{t('pages.appointments.postalCode')}</span>
                <input
                  type="text"
                  value={address.postalCode}
                  onChange={(e) => {
                    const newPostalCode = sanitizePostalCode(e.target.value);
                    setAddress({ ...address, postalCode: newPostalCode });

                    // Real-time validation
                    const validationError = getProvincePostalCodeError(
                      newPostalCode,
                      address.province
                    );
                    setPostalCodeValidationError(validationError);
                  }}
                  maxLength={10}
                  placeholder={t('pages.appointments.postalCode')}
                  title={`${address.postalCode.length}/10`}
                  required
                  style={{
                    borderColor: postalCodeValidationError ? '#ef4444' : undefined,
                  }}
                />
                {postalCodeValidationError && (
                  <small style={{ color: '#b91c1c', marginTop: '4px' }}>
                    {t(postalCodeValidationError, {
                      province: address.province,
                    })}
                  </small>
                )}
              </label>
            </div>

            <label className="field">
              <span>
                {t('pages.appointments.description')}
                <span className="char-count">{description.length}/500</span>
              </span>
              <textarea
                value={description}
                onChange={(e) => setDescription(sanitizeInput(e.target.value))}
                rows={3}
                placeholder={t('pages.appointments.description')}
                maxLength={500}
                required
              />
            </label>

            {error && <div className="banner banner--error">{error}</div>}

            <footer className="modal-actions">
              <button type="button" className="ghost" onClick={onClose} disabled={submitting}>
                {t('common.cancel')}
              </button>
              <button type="submit" className="primary" disabled={submitting || loading}>
                {submitting ? (
                  <Loader2 className="spin" size={16} />
                ) : isEditMode ? (
                  t('pages.appointments.updateAppointment')
                ) : (
                  t('pages.appointments.createAppointment')
                )}
              </button>
            </footer>
          </form>
        )}
      </div>

      {/* Buffer Warning Confirmation Dialog - renders at root level with high z-index */}
      {/* Buffer Warning Confirmation Dialog */}
      {showBufferWarning && pendingRequest && (
        <div
          className="confirmation-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby={bufferDialogTitleId}
        >
          <div className="confirmation-modal-container">
            <div className="confirmation-modal-header">
              <p id={bufferDialogTitleId} className="confirmation-modal-title">
                {t('pages.appointments.bufferWarningTitle')}
              </p>
              <button
                type="button"
                className="confirmation-modal-close"
                onClick={() => {
                  setShowBufferWarning(false);
                  setPendingRequest(null);
                }}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="confirmation-modal-content">
              <p className="confirmation-modal-message">
                {t('pages.appointments.bufferWarningMessage')}
              </p>
            </div>
            <div className="confirmation-modal-footer">
              <button
                type="button"
                className="confirmation-btn-cancel"
                onClick={() => {
                  setShowBufferWarning(false);
                  setPendingRequest(null);
                }}
              >
                {t('pages.appointments.cancelScheduling')}
              </button>
              <button
                type="button"
                className="confirmation-btn-confirm"
                onClick={() => {
                  setShowBufferWarning(false);
                  if (pendingRequest) {
                    submitAppointment(pendingRequest);
                    setPendingRequest(null);
                  }
                }}
              >
                {t('pages.appointments.continueScheduling')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
