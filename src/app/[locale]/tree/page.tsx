import FamilyTree from "@/components/tree/FamilyTree";
import styles from "./page.module.css";

export default function TreePage() {
  return (
    <main className={styles.page}>
      <FamilyTree />
    </main>
  );
}