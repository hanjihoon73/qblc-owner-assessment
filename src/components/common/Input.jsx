import styles from '../../styles/components/Input.module.css';

export default function Input({ 
  label, 
  id, 
  type = 'text', 
  error, 
  className = '', 
  ...props 
}) {
  return (
    <div className={`${styles.container} ${className}`}>
      {label && <label htmlFor={id} className={styles.label}>{label}</label>}
      <input 
        id={id} 
        type={type} 
        className={`${styles.input} ${error ? styles.inputError : ''}`} 
        {...props} 
      />
      {error && <span className={styles.errorMessage}>{error}</span>}
    </div>
  );
}
