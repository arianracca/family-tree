📋 PLAN DE REFACTOR CONSOLIDADO Y EN CURSO
El plan queda en tres fases con catorce pasos, incorporando todas las correcciones válidas.

🎯 Fase 1 — Base limpia
1️⃣ El Paso 1 es crear src/lib/layoutConstants.ts con todas las constantes de dimensión compartidas entre elkLayout.ts y graphTransform.ts. Ambos archivos importan desde ahí. Elimina permanentemente la clase de bug de desincronización silenciosa.
2️⃣ El Paso 2 es eliminar const zoom = useStore(...) de CoupleNode.tsx. Una línea que genera re-renders en cada frame de pan/zoom sin aportar nada al render actual.
3️⃣ El Paso 3 es reemplazar createLocalRepository por activeRepository en usePersonForm y FamilyNucleusPanel, eliminar las suscripciones reactivas a persons y relations en usePersonForm, y eliminar la suscripción a relations en PersonForm. Elimina el useMemo del repository en ambos componentes.
4️⃣ El Paso 4 es eliminar los archivos muertos: src/lib/dataProvider.ts y src/data/familyData.ts. Un grep previo confirma que no tienen importadores activos.
5️⃣ El Paso 5 es definir los design tokens como variables CSS en src/app/globals.css. Todos los valores que se repiten — #c9a84c, #0d0d0d, #222, #1a1a1a, la familia tipográfica, los radios de borde, las duraciones de transición — pasan a ser variables --color-gold, --color-bg-primary, --color-border, etc. Este paso es el prerequisito del siguiente.
6️⃣ El Paso 6 es migrar todos los estilos de template strings a archivos .module.css por componente, consumiendo las variables del paso anterior. Los archivos afectados son PersonNode.module.css, CoupleNode.module.css, FamilyNucleusPanel.module.css, PersonForm.module.css, FamilyTree.module.css. Esto elimina la duplicación de .nucleus-panel entre FamilyTree y FamilyNucleusPanel, que hoy son dos definiciones independientes del mismo componente visual.
7️⃣ El Paso 7 es extraer los primitivos de UI reutilizables a src/components/ui/primitives/: Toggle, ChipInput, FieldRow, SectionTitle, PanelHeader, IconButton. Cada uno tiene su propio .module.css. PersonForm y FamilyNucleusPanel los consumen en lugar de reimplementarlos.
8️⃣ El Paso 8 es migrar las claves de RelationshipType a inglés (child_of, parent_of, partner_of, same_generation, nephew_of, uncle_of, cousin_of) y crear un objeto RELATIONSHIP_LABELS separado que mapea clave a label en español. GenerationPicker usa las claves internamente y los labels solo en el render. El sistema queda listo para next-intl sin trabajo adicional.
9️⃣ El Paso 9 — incorporado por la observación de tu amigo — es crear src/services/FamilyService.ts. Este servicio encapsula toda la lógica de negocio que hoy vive dispersa en usePersonForm: construir el payload de persona, manejar la sincronización de relaciones, validar integridad referencial. Expone métodos createPerson(formData) y updatePerson(id, formData) que internamente coordinan con activeRepository. usePersonForm pasa a ser un hook puramente de estado de formulario que delega al service para las operaciones.

🏛️ Fase 2 — Patrones de arquitectura
🔟 El Paso 10 es implementar el Command Pattern con una interfaz FamilyCommand que tiene execute() y undo(). Los comandos concretos operan sobre FamilyService (no directamente sobre el repository), lo que garantiza que la lógica de negocio se aplica consistentemente tanto en ejecución directa como en redo. Una pila de comandos en useFamilyStore expone undo() y canUndo. La UI agrega un botón de deshacer con Ctrl+Z.
1️⃣1️⃣ El Paso 11 es implementar el Strategy Pattern para el layout con una interfaz LayoutStrategy. La implementación actual de ELK se encapsula en ElkLayoutStrategy. El hook useLayout recibe la estrategia como parámetro, lo que habilita estrategias alternativas como una vista circular de núcleo familiar.

🌍 Fase 3 — Internacionalización y backend
1️⃣2️⃣ El Paso 12 es instalar next-intl con un namespace tree inicial. Con las claves ya en inglés del Paso 8, la migración es mecánica: RELATIONSHIP_LABELS se reemplaza por useTranslations('tree') y los mensajes de error de validación pasan al archivo de traducciones.
1️⃣3️⃣ El Paso 13 es migrar apiRepository a un backend REST real. El contrato de FamilyRepository no cambia. Solo cambia la URL base y potencialmente los headers de autenticación.
1️⃣4️⃣ El Paso 14 es adoptar React Query para reemplazar el fetch manual, agregando caché con invalidación automática y optimistic updates para las operaciones CRUD.


___________________________________________________________
Backlog — para guardar

Soft-delete y restauración por ID. El endpoint POST /api/family/persons debe aceptar un campo id opcional. Cuando se recibe, el backend intenta restaurar el registro inactivo (borrado lógico) en lugar de insertar uno nuevo, garantizando integridad referencial con las relaciones del snapshot. En base de datos, el borrado físico se delega a un proceso batch configurable (default: 30 días), implementable como un cron job o una función serverless programada. Esto hace que DeletePersonCommand.undo() sea siempre reversible sin ventana de pérdida, y mantiene la trazabilidad completa del árbol familiar en el tiempo.