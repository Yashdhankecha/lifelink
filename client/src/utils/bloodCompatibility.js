// Blood Group Compatibility Utility
// Based on the MERN Stack blood request flow specifications

export const bloodCompatibility = {
  "O-": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
  "O+": ["O+", "A+", "B+", "AB+"],
  "A-": ["A-", "A+", "AB-", "AB+"],
  "A+": ["A+", "AB+"],
  "B-": ["B-", "B+", "AB-", "AB+"],
  "B+": ["B+", "AB+"],
  "AB-": ["AB-", "AB+"],
  "AB+": ["AB+"]
};

/**
 * Check if a donor's blood group is compatible with a request's blood group
 * @param {string} donorBloodGroup - The donor's blood group
 * @param {string} requestBloodGroup - The requested blood group
 * @returns {boolean} - True if compatible, false otherwise
 */
export const isCompatible = (donorBloodGroup, requestBloodGroup) => {
  if (!donorBloodGroup || !requestBloodGroup) return false;
  
  const compatibleGroups = bloodCompatibility[donorBloodGroup];
  return compatibleGroups ? compatibleGroups.includes(requestBloodGroup) : false;
};

/**
 * Get all compatible blood groups for a donor
 * @param {string} donorBloodGroup - The donor's blood group
 * @returns {Array} - Array of compatible blood groups
 */
export const getCompatibleGroups = (donorBloodGroup) => {
  return bloodCompatibility[donorBloodGroup] || [];
};

/**
 * Get compatibility status with styling
 * @param {string} donorBloodGroup - The donor's blood group
 * @param {string} requestBloodGroup - The requested blood group
 * @returns {Object} - Object with status, text, and className
 */
export const getCompatibilityStatus = (donorBloodGroup, requestBloodGroup) => {
  const compatible = isCompatible(donorBloodGroup, requestBloodGroup);
  
  if (compatible) {
    return {
      status: 'compatible',
      text: 'Compatible',
      className: 'bg-green-100 text-green-800 border-green-200'
    };
  } else {
    return {
      status: 'incompatible',
      text: 'Not Compatible',
      className: 'bg-red-100 text-red-800 border-red-200'
    };
  }
};

/**
 * Get blood group priority for display (universal donors first)
 * @param {string} bloodGroup - The blood group
 * @returns {number} - Priority number (lower = higher priority)
 */
export const getBloodGroupPriority = (bloodGroup) => {
  const priorities = {
    'O-': 1,  // Universal donor
    'O+': 2,
    'A-': 3,
    'B-': 4,
    'A+': 5,
    'B+': 6,
    'AB-': 7,
    'AB+': 8   // Universal recipient
  };
  
  return priorities[bloodGroup] || 9;
};
