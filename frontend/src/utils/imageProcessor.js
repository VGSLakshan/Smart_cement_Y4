// src/utils/imageValidator.js

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];

export const validateImage = (file) => {
  if (!file) {
    return {
      isValid: false,
      error: 'No file selected'
    };
  }

  // Check file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      isValid: false,
      error: 'Invalid file type. Please upload a JPG or PNG image.'
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `File size exceeds 10MB. Please upload a smaller image. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`
    };
  }

  return {
    isValid: true,
    error: null
  };
};

export const getFileSizeString = (bytes) => {
  if (bytes < 1024) {
    return `${bytes} B`;
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(2)} KB`;
  } else {
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  }
};