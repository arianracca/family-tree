"use client";

interface Props {
  value:    boolean;
  onChange: (value: boolean) => void;
  label?:   string;
}

import styles from "./Toggle.module.css";

export default function Toggle({ value, onChange, label }: Props) {
  return (
    <div className={styles.row}>
      <button
        type="button"
        className={styles.toggle}
        data-active={value}
        onClick={() => onChange(!value)}
      >
        <span className={styles.knob} />
      </button>
      {label && <span className={styles.label}>{label}</span>}
    </div>
  );
}