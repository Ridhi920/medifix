/**
 * Parse backend validation errors and return user-friendly messages
 */
export const parseBackendErrors = (error: any): string => {
  if (error.response?.data?.detail) {
    const detail = error.response.data.detail;
    
    // If detail is an array of validation errors
    if (Array.isArray(detail)) {
      const errorMessages = detail.map((err: any) => {
        const field = err.loc?.[err.loc.length - 1] || 'Field';
        const fieldName = field.toString().replace(/_/g, ' ');
        const msg = err.msg;
        
        // Simplify common error messages
        let simplifiedMsg = msg;
        if (msg.includes('String should have at least')) {
          const match = msg.match(/at least (\d+)/);
          if (match) {
            simplifiedMsg = `Must be at least ${match[1]} characters`;
          }
        } else if (msg.includes('String should have at most')) {
          const match = msg.match(/at most (\d+)/);
          if (match) {
            simplifiedMsg = `Must be less than ${match[1]} characters`;
          }
        } else if (msg.includes('Input should be a valid')) {
          simplifiedMsg = 'Invalid format';
        } else if (msg.includes('Field required')) {
          simplifiedMsg = 'Required';
        } else if (msg.includes('Value error')) {
          simplifiedMsg = 'Invalid value';
        }
        
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}: ${simplifiedMsg}`;
      });
      return errorMessages.join('\n');
    }
    
    // If detail is a string
    if (typeof detail === 'string') {
      return detail;
    }
  }
  
  // Network errors
  if (error.message === 'Network Error') {
    return 'Unable to connect to server. Please check your internet connection.';
  }
  
  // Timeout errors
  if (error.code === 'ECONNABORTED') {
    return 'Request timed out. Please try again.';
  }
  
  // Generic error
  return 'Something went wrong. Please try again.';
};

/**
 * Common validation patterns
 */
export const validators = {
  name: (value: string, minLength: number = 2): string | undefined => {
    if (!value.trim()) {
      return "Name is required";
    }
    if (value.trim().length < minLength) {
      return `Name must be at least ${minLength} characters`;
    }
    return undefined;
  },

  phone: (value: string, minLength: number = 10): string | undefined => {
    if (!value.trim()) {
      return "Phone number is required";
    }
    if (value.trim().length < minLength) {
      return `Phone number must be at least ${minLength} digits`;
    }
    if (!/^\d+$/.test(value.trim())) {
      return "Phone number must contain only digits";
    }
    return undefined;
  },

  age: (value: string): string | undefined => {
    if (!value.trim()) {
      return "Age is required";
    }
    const age = parseInt(value, 10);
    if (isNaN(age) || age <= 0) {
      return "Age must be a positive number";
    }
    if (age >= 150) {
      return "Please enter a valid age";
    }
    return undefined;
  },

  address: (value: string, minLength: number = 5): string | undefined => {
    if (!value.trim()) {
      return "Address is required";
    }
    if (value.trim().length < minLength) {
      return `Address must be at least ${minLength} characters`;
    }
    return undefined;
  },

  required: (value: string, fieldName: string = "Field"): string | undefined => {
    if (!value.trim()) {
      return `${fieldName} is required`;
    }
    return undefined;
  },

  date: (value: string, format: string = "DD/MM/YYYY"): string | undefined => {
    if (!value.trim()) {
      return "Date is required";
    }
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value.trim())) {
      return `Date must be in ${format} format`;
    }
    return undefined;
  }
};
