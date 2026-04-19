"use client";

import { useState } from "react";
import styles from "./ChipInput.module.css";

interface Props {
  values:      string[];
  onAdd:       (value: string) => void;
  onRemove:    (index: number) => void;
  placeholder?: string;
  inputClassName?: string;
}

export default function ChipInput({
  values,
  onAdd,
  onRemove,
  placeholder = "Enter para agregar",
  inputClassName,
}: Props) {
  const [input, setInput] = useState("");

  function handleAdd() {
    if (!input.trim()) return;
    onAdd(input.trim());
    setInput("");
  }

  return (
    <div>
      {values.length > 0 && (
        <div className={styles.chips}>
          {values.map((v, i) => (
            <span key={i} className={styles.chip}>
              {v}
              <button
                type="button"
                className={styles.chipRemove}
                onClick={() => onRemove(i)}
              >×</button>
            </span>
          ))}
        </div>
      )}
      <div className={styles.inputRow}>
        <input
          className={inputClassName}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); handleAdd(); }
          }}
          placeholder={placeholder}
        />
        <button type="button" className={styles.addBtn} onClick={handleAdd}>+</button>
      </div>
    </div>
  );
}