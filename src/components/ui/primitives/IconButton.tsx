"use client";

import styles from "./IconButton.module.css";

interface Props {
  onClick:    () => void;
  label:      string;
  title?:     string;
  variant?:   "default" | "danger" | "close";
  children:   React.ReactNode;
}

export default function IconButton({
  onClick,
  label,
  title,
  variant = "default",
  children,
}: Props) {
  return (
    <button
      type="button"
      className={styles.btn}
      data-variant={variant}
      onClick={onClick}
      aria-label={label}
      title={title ?? label}
    >
      {children}
    </button>
  );
}