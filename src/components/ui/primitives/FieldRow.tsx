import styles from "./FieldRow.module.css";

interface Props {
  label: string;
  value: string;
}

export default function FieldRow({ label, value }: Props) {
  if (!value?.trim()) return null;
  return (
    <div className={styles.row}>
      <span className={styles.label}>{label}</span>
      <span className={styles.value}>{value}</span>
    </div>
  );
}