import styles from "./PanelHeader.module.css";

interface Props {
  label:    string;
  title:    string;
  children?: React.ReactNode; // acciones: IconButtons
}

export default function PanelHeader({ label, title, children }: Props) {
  return (
    <div className={styles.header}>
      <div className={styles.titleGroup}>
        <span className={styles.label}>{label}</span>
        <h2 className={styles.title}>{title}</h2>
      </div>
      {children && (
        <div className={styles.actions}>
          {children}
        </div>
      )}
    </div>
  );
}