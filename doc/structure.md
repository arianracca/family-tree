🔧 STACK TECNOLÓGICO
Categoría	Herramienta	Versión
Framework	Next.js	16.2.4
React	React	19.2.4
Lenguaje	TypeScript	^5
Estilos	Tailwind CSS	^4
Grafo	@xyflow/react	^12.10.2
Layout	ELK.js	^0.11.1
Estado	Zustand	^5.0.12
Inmutabilidad	Immer	^11.1.4
Linter	ESLint	^9
Compilador	React Compiler	1.0.0
IDs	uuid	^13.0.0
Imágenes	sharp	^0.34.5

_______________________________________________________________________
📊 SCAFFOLD DEL PROYECTO - FAMILY TREE

family-tree/
│
├── 📄 Configuración raíz
│   ├── package.json              # npm deps: Next.js 16.2.4, React 19, Zustand, ELK.js, Tailwind v4, next-intl
│   ├── package-lock.json         # Lock reproducible
│   ├── tsconfig.json             # TypeScript estricto, baseUrl, paths alias @/*
│   ├── next.config.ts            # React Compiler, Server Actions 10mb
│   ├── postcss.config.mjs        # PostCSS: Tailwind v4 plugin
│   ├── eslint.config.mjs         # ESLint: next/core-web-vitals
│   ├── .gitignore                # node_modules, .next, .env*, dist/
│   ├── next-env.d.ts             # Auto-generated Next.js types
│   ├── README.md                 # Documentación proyecto
│   ├── AGENTS.md                 # Advertencia: Next.js v16 breaking changes
│   ├── CLAUDE.md                 # Referencias a AGENTS.md
│   └── .git/                     # Git repository
│
├── 📁 src/
│   │
│   ├── 📁 app/                   # [Next.js 16 App Router con i18n]
│   │   ├── layout.tsx            # Root: meta, providers (Zustand), i18n context
│   │   ├── page.tsx              # /: redirect a /tree
│   │   ├── globals.css           # Design tokens: --color-*, --spacing-*, --font-*
│   │   ├── favicon.ico           # Ícono app
│   │   ├── 📁 tree/
│   │   │   ├── page.tsx          # /[locale]/tree: renders FamilyTree
│   │   │   └── page.module.css   # Estilos página
│   │   └── 📁 api/               # [Backend routes]
│   │       ├── 📁 family/
│   │       │   ├── route.ts      # GET /api/family: lee familyData.json
│   │       │   ├── 📁 persons/
│   │       │   │   ├── route.ts  # POST: crear persona
│   │       │   │   └── 📁 entity/
│   │       │   │       └── route.ts # PUT/DELETE: actualizar/eliminar
│   │       │   └── 📁 relations/
│   │       │       └── route.ts  # POST/DELETE: agregar/eliminar
│   │       └── 📁 upload-avatar/
│   │           └── route.ts      # POST: subir avatar
│   │
│   ├── 📁 commands/              # [Command Pattern: Undo/Redo] (PASO 10)
│   │   ├── FamilyCommand.ts      # Interfaz base + CommandResult union type
│   │   ├── CreatePersonCommand.ts # Crear persona + undo
│   │   ├── UpdatePersonCommand.ts # Actualizar + undo
│   │   └── DeletePersonCommand.ts # Eliminar + undo (cascada)
│   │
│   ├── 📁 components/            # [React Components]
│   │   ├── 📁 tree/              # [Visualización árbol familiar]
│   │   │   ├── FamilyTree.tsx    # Orchestrator: panels, selectedPerson
│   │   │   ├── FamilyTree.module.css # Layout 2 columnas
│   │   │   ├── TreeCanvas.tsx    # React Flow container + handlers
│   │   │   ├── TreeCanvas.module.css # Estilos canvas
│   │   │   ├── 📁 nodes/
│   │   │   │   ├── PersonNode.tsx # Custom node: persona individual
│   │   │   │   ├── PersonNode.module.css
│   │   │   │   ├── CoupleNode.tsx # Compound node: pareja
│   │   │   │   ├── CoupleNode.module.css
│   │   │   │   └── index.ts
│   │   │   └── 📁 edges/
│   │   │       ├── ParentChildEdge.tsx
│   │   │       └── CoupleEdge.tsx
│   │   └── 📁 ui/                # [Shared UI]
│   │       ├── PersonForm.tsx    # Formulario create/edit
│   │       ├── PersonForm.module.css
│   │       ├── FamilyNucleusPanel.tsx # Sidebar panel
│   │       ├── FamilyNucleusPanel.module.css
│   │       ├── GenerationPicker.tsx # Select relación
│   │       ├── GenerationPicker.module.css
│   │       ├── PersonCard.tsx    # Card persona
│   │       ├── GenerationBadge.tsx # Badge generación
│   │       ├── AvatarUpload.tsx  # Upload avatar
│   │       ├── AvatarUpload.module.css
│   │       ├── panel.module.css  # Estilos comunes
│   │       └── 📁 primitives/    # [Componentes base]
│   │           ├── Toggle.tsx    # Switch on/off
│   │           ├── Toggle.module.css
│   │           ├── ChipInput.tsx
│   │           ├── ChipInput.module.css
│   │           ├── FieldRow.tsx
│   │           ├── FieldRow.module.css
│   │           ├── SectionTitle.tsx
│   │           ├── SectionTitle.module.css
│   │           ├── PanelHeader.tsx
│   │           ├── PanelHeader.module.css
│   │           ├── IconButton.tsx
│   │           └── IconButton.module.css
│   │
│   ├── 📁 lib/                   # [Lógica negocio + utilities]
│   │   ├── familyRepository.ts   # Interfaz + local in-memory impl
│   │   ├── familyNucleus.ts      # getCouples, getParents, getChildren
│   │   ├── generationUtils.ts    # calcGeneration, getRelationType
│   │   ├── graphTransform.ts     # Person[] → React Flow nodes/edges
│   │   ├── elkLayout.ts          # ELK.js hierarchical layout
│   │   ├── layoutConstants.ts    # Constantes dimensiones
│   │   ├── layoutStrategy.ts     # Interfaz LayoutStrategy (PASO 11)
│   │   ├── errorMessages.ts      # Constantes errores (keys i18n-ready)
│   │   └── 📁 strategies/        # [Layout strategies] (PASO 11)
│   │       └── ElkLayoutStrategy.ts # Implementación ELK
│   │
│   ├── 📁 i18n/                  # [Internacionalización] (PASO 12)
│   │   ├── request.ts            # getRequestConfig para next-intl
│   │   └── routing.ts            # routing config: locales, defaultLocale
│   │
│   ├── 📁 services/              # [Business logic]
│   │   ├── FamilyService.ts      # createPerson, updatePerson, deletePerson
│   │   └── FamilyErrors.ts       # ValidationError, IntegrityError
│   │
│   ├── 📁 hooks/                 # [React hooks]
│   │   ├── usePersonForm.ts      # Form state + validation
│   │   ├── useElkLayout.ts       # Layout computation
│   │   └── useFamilyNucleus.ts   # Family nucleus calc
│   │
│   ├── 📁 store/                 # [Zustand state]
│   │   ├── useFamilyStore.ts     # Global state: familyData, commands
│   │   └── useTreeStore.ts       # Visualization: nodes, edges, transform
│   │
│   └── 📁 types/                 # [TypeScript interfaces]
│       ├── family.ts             # Person, Relation, FamilyData, FamilyNucleus
│       └── graph.ts              # Node, Edge, LayoutResult
│
├── 📁 public/                    # [Assets estáticos]
│   ├── persons/                  # Avatars: [personId]/
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
│
├── 📁 data/                      # [Persistencia]
│   └── familyData.json           # Dataset: { persons, relations }
│
├── 📁 doc/                       # [Documentación]
│   └── structure.md              # Scaffold + flujo de datos + endpoints
│
└── 📁 node_modules/              # Dependencias instaladas

_____________________________________________________________
Patron de arquitectura Layout Strategy:
Para agregar una estrategia nueva en el futuro (ej: vista circular de núcleo familiar), el patrón es exactamente este:
ts// src/lib/strategies/CircularLayoutStrategy.ts
export class CircularLayoutStrategy implements LayoutStrategy {
  readonly name = "circular";
  async compute(familyData: FamilyData): Promise<LayoutResult> { /* ... */ }
  getCacheKey(familyData: FamilyData): string { /* ... */ }
}
Y en el componente que la necesite: useLayout(circularLayoutStrategy). El store, los nodos y los edges no se tocan.

_____________________________________________________________
Patron de arquitectura: Command - Service - Repository - Route:
UI Component
    ↓
Command
    ↓
Service
    ↓
Repository
    ↓
API Route (Next.js)
    ↓
Persistencia (JSON / futura DB)

Capa 1 — UI Component ------------------------------------
Responsabilidad: capturar intención del usuario, mostrar estado visual.
Lo que hace:

Lee estado del store vía selectores
Construye el comando con los datos del formulario/acción
Llama executeCommand(new XCommand(...)) del store
Maneja estados locales de UI: loading, error, success

Capa 2 — Command ------------------------------------
Responsabilidad: encapsular una operación reversible. Es la única capa que sabe cómo deshacer algo.
Lo que hace:

Captura snapshot del estado ANTES de execute() — leyendo del store con import dinámico
Llama al Service en execute()
Devuelve CommandResult para que el store actualice optimistamente
Restaura el snapshot en undo()

Capa 3 — Service ------------------------------------
Responsabilidad: lógica de negocio. Es la única capa que sabe las reglas del dominio.
Lo que hace:

Valida los datos antes de persistir
Coordina múltiples operaciones del repositorio en una transacción lógica (ej: crear persona + sincronizar relaciones)
Lanza errores tipados (ValidationError, IntegrityError) que la UI puede distinguir

Capa 4 — Repository ------------------------------------
Responsabilidad: hablar con la API. Es la única capa que sabe la URL y el protocolo HTTP.
Lo que hace:

Implementa la interfaz FamilyRepository
Hace fetch a los endpoints
Lanza errores genéricos si la respuesta no es ok

Capa 5 — Store (Zustand) ------------------------------------
El store no es una capa de negocio — es el bus que conecta todo.
Sus dos responsabilidades:

executeCommand — ejecuta el comando, aplica el resultado optimistamente al estado, sincroniza con el servidor, pushea a la pila
undo — extrae el último comando, llama command.undo(), recarga, actualiza la pila

El store nunca importa comandos concretos — solo conoce la interfaz FamilyCommand. Agregar un comando nuevo no requiere tocar el store.

-----------------------------------------------------------
Checklist para implementar un servicio nuevo
Cuando tengas que agregar una operación nueva seguís este orden:

API Route — el endpoint en src/app/api/
Repository — añadir el método a la interfaz FamilyRepository y su implementación en apiRepository
Service — crear o añadir método en src/services/, con validación y coordinación
Command — crear src/commands/XCommand.ts con snapshot + execute + undo
UI — conectar con executeCommand(new XCommand(...)), nunca llamar al Service directamente

El orden importa: cada capa depende de la inferior, así que se construye de abajo hacia arriba y se conecta de arriba hacia abajo.

_______________________________________________________________________
📡 API ENDPOINTS
GET  /api/family                        → Cargar todo el árbol
POST /api/family/persons                → Crear persona
PUT  /api/family/persons/entity         → Actualizar persona
DEL  /api/family/persons/entity         → Eliminar persona
POST /api/family/relations              → Agregar relación
DEL  /api/family/relations              → Eliminar relación
POST /api/upload-avatar                 → Subir avatar

_______________________________________________________________________
📋 TIPOS PRINCIPALES
// ─── Person ───────────────────────────────────────────
interface Person {
  id: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  motherLastName?: string | null;
  birthPlace?: string | null;
  birthDate?: string | null;
  deathDate?: string | null;
  nationalities?: string[];
  city?: string | null;
  isAlive: boolean;
  generation: number;  // Ancla: 100000
  history?: string | null;
  photoUrl?: string | null;
  customFields?: CustomField[];
}

// ─── Relations ────────────────────────────────────────
type Relation = ParentChildRelation | CoupleRelation;

interface ParentChildRelation {
  id: string;
  personA: string; // parent
  personB: string; // child
  type: "parent_child";
}

interface CoupleRelation {
  id: string;
  personA: string;
  personB: string;
  type: "couple";
}

// ─── Family Dataset ──────────────────────────────────
interface FamilyData {
  persons: Person[];
  relations: Relation[];
}

// ─── Family Nucleus ──────────────────────────────────
interface FamilyNucleus {
  personId: string;
  coupleIds: [string, string] | null;
  parentIdsA: string[];
  parentIdsB: string[];
  childrenIds: string[];
}

_______________________________________________________________________
🔄 FLUJO COMPLETO DE DATOS

data/familyData.json
        ↓
/api/family (GET)
        ↓
familyRepository.getAll()
        ↓
useFamilyStore.initFamily()
        ↓
useFamilyStore.familyData = { persons, relations }
        ↓
┌─────────────────────────────────────────────┐
│  FamilyTree.tsx (Main orchestrator)          │
├─────────────────────────────────────────────┤
│  UI Layer                                    │
│  ├─ TreeCanvas (React Flow visualization)   │
│  │  ├─ PersonNode, CoupleNode               │
│  │  └─ ParentChildEdge, CoupleEdge          │
│  │                                           │
│  └─ FamilyNucleusPanel (Sidebar)            │
│     ├─ PersonForm (usePersonForm hook)      │
│     └─ PersonCard display (núcleo)          │
└─────────────────────────────────────────────┘
        ↓
        ← [USER SUBMITS FORM]
        ↓
PersonForm.onSubmit()
        ↓
store.executeCommand(
  new CreatePersonCommand(formData)
)
        ↓
Command.execute()
  ├─ Captura snapshot previo del store
  └─ Llama FamilyService.createPerson(formData)
        ↓
FamilyService.createPerson()
  ├─ validatePersonForm() → error?
  ├─ buildPersonPayload() → payload
  ├─ familyRepository.createPerson(payload)
  └─ Sincroniza relaciones si es necesario
        ↓
familyRepository.createPerson()
  ├─ POST /api/family/persons
  ├─ Retorna { id, firstName, lastName, ... }
  └─ CommandResult = { operation: "create", person }
        ↓
store.executeCommand() continúa
  ├─ Aplicar resultado optimistamente
  ├─ Agregar comando a commandHistory
  └─ Disparar actualización de layout
        ↓
useFamilyStore.familyData.persons = [..., newPerson]
useFamilyStore.commandHistory = [..., command]
        ↓
elkLayout.ts
  ├─ Recalcula posiciones con ELK.js
  └─ Retorna LayoutNode[]
        ↓
graphTransform.ts
  ├─ Transforma Person[] → React Flow nodes
  ├─ Transforma Relation[] → React Flow edges
  └─ Retorna { nodes: Node[], edges: Edge[] }
        ↓
useTreeStore.setNodes(nodes)
useTreeStore.setEdges(edges)
        ↓
TreeCanvas
  ├─ Rerender con nuevos nodes/edges
  ├─ Animación de entrada (fade-in)
  └─ Pan automático si está fuera de vista
        ↓
✅ USUARIO VE NUEVA PERSONA EN ÁRBOL

─────────────────────────────────────────────

[USER PRESIONA Ctrl+Z] → undo()
        ↓
store.undo()
  ├─ Extrae último comando
  ├─ Llama command.undo()
  ├─ Undo restaura snapshot previo
  └─ Recargar layout + rerender
        ↓
✅ PERSONA ELIMINADA VISUALMENTE, historial actualizado

_______________________________________________________________________
✨ CARACTERÍSTICAS CLAVE
✅ Visualización interactiva — árbol familiar con react-flow
✅ Nodos personalizados — PersonNode, CoupleNode con decoradores
✅ Sistema de generaciones — ancla 100000, cálculo relativo
✅ Layout automático — ELK.js hierarchical + manual pan/zoom
✅ CRUD completo — create/update/delete personas y relaciones
✅ Diseño tokens — variables CSS centralizadas en globals.css
✅ Componentes primitivos — Toggle, ChipInput, FieldRow, etc
✅ Type-safe — TypeScript estricto en todo el proyecto

_______________________________________________________________________
📦 CARACTERÍSTICAS IMPLEMENTADAS
✅ Visualización:

Árbol familiar interactivo con react-flow
Nodos personalizados (Persona, Pareja)
Aristas para relaciones (padre-hijo, pareja)
Layout automático con ELK.js

✅ Datos:
Sistema de generaciones (ancla 100000)
Relaciones padre-hijo y parejas
Campos personalizados dinámicos
Cálculo de núcleo familiar

✅ Estado:
Gestión centralizada con Zustand + Immer
Selección de persona/pareja
Caché de datos

✅ Extensibilidad:
DataProvider preparado para backend (REST, GraphQL, etc.)
Estructura modular y escalable
TypeScript estricto