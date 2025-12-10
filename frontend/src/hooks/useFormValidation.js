import { useState } from 'react';

const useFormValidation = (initialValues, validationRules) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues(prevValues => ({
      ...prevValues,
      [name]: value
    }));
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));
    validateField(name, values[name]);
  };

  const validateField = (fieldName, value) => {
    const rules = validationRules[fieldName];
    if (!rules) return true;

    let isValid = true;
    let errorMessage = '';

    if (rules.required && !value) {
      isValid = false;
      errorMessage = rules.message || `${fieldName} is required`;
    } else if (rules.minLength && value.length < rules.minLength) {
      isValid = false;
      errorMessage = rules.message || `${fieldName} must be at least ${rules.minLength} characters`;
    } else if (rules.maxLength && value.length > rules.maxLength) {
      isValid = false;
      errorMessage = rules.message || `${fieldName} must be no more than ${rules.maxLength} characters`;
    } else if (rules.pattern && !rules.pattern.test(value)) {
      isValid = false;
      errorMessage = rules.message || `${fieldName} is invalid`;
    }

    setErrors(prev => ({
      ...prev,
      [fieldName]: isValid ? '' : errorMessage
    }));

    return isValid;
  };

  const validate = () => {
    let isValid = true;
    const newErrors = {};
    const newTouched = {};

    Object.keys(validationRules).forEach(fieldName => {
      newTouched[fieldName] = true;
      const fieldIsValid = validateField(fieldName, values[fieldName]);
      if (!fieldIsValid) {
        isValid = false;
        newErrors[fieldName] = errors[fieldName];
      }
    });

    setTouched(newTouched);
    setErrors(newErrors);
    return isValid;
  };

  const resetForm = () => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  };

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validate,
    resetForm,
    setValues
  };
};

export default useFormValidation;