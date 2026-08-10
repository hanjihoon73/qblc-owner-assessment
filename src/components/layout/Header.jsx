import logoImg from '../../assets/quebon_bi.png';
import styles from '../../styles/components/Header.module.css';

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={`container ${styles.nav}`}>
        <div className={styles.logo}>
          <img src={logoImg} alt="깨봉수학 BI" className={styles.logoIcon} height={22} />
          <span>러닝센터 원장 교육 평가</span>
        </div>
      </div>
    </header>
  );
}
