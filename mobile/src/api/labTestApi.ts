import { API_BASE_URL } from '../config/api';

export interface LabTest {
  id: number;
  name: string;
  description: string;
  parameters: string[];
  price: number;
  report_time: string;
  fasting_required: boolean;
  category: string;
  popular: boolean;
  is_active: boolean;
}

export interface LabBooking {
  id: number;
  user_id: number;
  lab_test_id: number;
  patient_name: string;
  patient_age: number;
  patient_phone: string;
  collection_date: string;
  collection_time: string;
  home_collection: boolean;
  address: string | null;
  center_name: string | null;
  test_price: number;
  status: string;
  created_at: string;
}

export interface LabBookingWithTest extends LabBooking {
  test_name: string;
  test_category: string;
  test_parameters: string[];
}

export interface LabBookingCreate {
  lab_test_id: number;
  patient_name: string;
  patient_age: number;
  patient_phone: string;
  collection_date: string;
  collection_time: string;
  home_collection: boolean;
  address?: string;
  center_name?: string;
}

/**
 * Fetch all active lab tests
 */
export async function getLabTests(): Promise<LabTest[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/lab-tests`);
    if (!response.ok) {
      throw new Error(`Failed to fetch lab tests: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching lab tests:", error);
    throw error;
  }
}

/**
 * Get a specific lab test by ID
 */
export async function getLabTest(testId: number): Promise<LabTest> {
  try {
    const response = await fetch(`${API_BASE_URL}/lab-tests/${testId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch lab test: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching lab test:", error);
    throw error;
  }
}

/**
 * Create a new lab test booking
 * Requires authentication token
 */
export async function createLabBooking(
  bookingData: LabBookingCreate,
  authToken: string
): Promise<LabBooking> {
  try {
    const response = await fetch(`${API_BASE_URL}/lab-tests/bookings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(bookingData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.detail || `Failed to create booking: ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating lab booking:", error);
    throw error;
  }
}

/**
 * Get all bookings for the current user
 * Requires authentication token
 */
export async function getMyLabBookings(
  authToken: string
): Promise<LabBookingWithTest[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/lab-tests/bookings/my`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch bookings: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching lab bookings:", error);
    throw error;
  }
}

/**
 * Cancel a lab booking
 * Requires authentication token
 */
export async function cancelLabBooking(
  bookingId: number,
  authToken: string
): Promise<{ message: string }> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/lab-tests/bookings/${bookingId}/cancel`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to cancel booking: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error cancelling lab booking:", error);
    throw error;
  }
}
