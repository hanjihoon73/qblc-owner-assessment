import styles from '../../styles/components/Button.module.css';

export default function Button({ 
  children, 
  variant = 'primary', 
  disabled = false, 
  onClick, 
  type = 'button',
  className = ''
}) {
  const buttonClass = `
    ${styles.button} 
    ${styles[variant]} 
    ${disabled ? styles.disabled : ''} 
    ${className}
  `.trim();

  return (
    <button 
      type={type} 
      className={buttonClass} 
      onClick={onClick} 
      disabled={disabled}
    >
      {children}
    </button>
  );
}
