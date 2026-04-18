import FamilyTree from "@/components/tree/FamilyTree";

export default function TreePage() {
  return (
    <main className="tree-page">
      <FamilyTree />
      <style>{`
        .tree-page {
          width: 100%;
          height: 100vh;
          overflow: hidden;
          background: #080808;
        }
      `}</style>
    </main>
  );
}