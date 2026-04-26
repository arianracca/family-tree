
import styles from "./SectionTitle.module.css";

interface Props {
  children: React.ReactNode;
}

export default function SectionTitle({ children }: Props) {
  return <h3 className={styles.title}>{children}</h3>;
}