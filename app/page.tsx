import { CatalogSection } from "@/components/CatalogSection";

export default function Home() {
  return (
    <div className="w-full">
      {/* ====================================================================
          1. SECCIÓN HERO
          Presentación principal con la identidad visual y mensaje de Re-Manga.
          ==================================================================== */}
      <section
        id="hero"
        className="min-h-[450px] sm:min-h-[500px] md:min-h-[600px] max-w-[var(--max-ancho)] mx-auto px-5 sm:px-6 md:px-[30px] py-[50px] sm:py-[70px] md:py-[100px] flex flex-col justify-center items-start"
      >
        <h1 className="max-w-[700px] text-[2.3rem] sm:text-[2.8rem] md:text-[3.5rem] font-bold leading-[1.1] mb-[25px] text-[var(--color-texto)]">
          Tu próximo manga puede tener una segunda historia
        </h1>
        <p className="max-w-[600px] text-[var(--color-texto-secundario)] text-base md:text-[1.2rem] leading-relaxed">
          Encuentra mangas de segunda mano en buen estado y dales una nueva vida.
        </p>
      </section>

      {/* ====================================================================
          2. SECCIÓN CATÁLOGO
          Catálogo interactivo con filtros por género, búsqueda en tiempo real,
          tarjetas visuales de manga y paginación con "Ver más".
          ==================================================================== */}
      <CatalogSection />

      {/* ====================================================================
          3. SECCIÓN CÓMO FUNCIONA
          Explica el proceso de compra y reutilización en 3 bloques estructurados.
          ==================================================================== */}
      <section
        id="como-funciona"
        className="max-w-[var(--max-ancho)] mx-auto px-5 sm:px-6 md:px-[30px] py-[50px] md:py-[var(--espacio-grande)] bg-[var(--color-blanco)] rounded-[var(--radio)] my-6 transition-colors duration-200"
      >
        <h2 className="text-[1.8rem] md:text-[2.2rem] font-bold mb-[15px] text-[var(--color-texto)]">
          Cómo funciona
        </h2>
        <p className="text-[var(--color-texto-secundario)]">
          Encuentra, elige y dale una nueva vida a tus mangas.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-[30px]">
          <article className="border border-[var(--color-borde)] rounded-[var(--radio)] p-6 bg-[var(--color-blanco)] transition-colors duration-200">
            <span className="block mb-3 text-[var(--color-principal)] font-extrabold text-base">
              01
            </span>
            <h3 className="mb-2 text-[1.2rem] font-bold text-[var(--color-texto)]">
              Explora
            </h3>
            <p className="text-[0.95rem] text-[var(--color-texto-secundario)] leading-relaxed">
              Encuentra el manga que estás buscando en nuestro catálogo.
            </p>
          </article>

          <article className="border border-[var(--color-borde)] rounded-[var(--radio)] p-6 bg-[var(--color-blanco)] transition-colors duration-200">
            <span className="block mb-3 text-[var(--color-principal)] font-extrabold text-base">
              02
            </span>
            <h3 className="mb-2 text-[1.2rem] font-bold text-[var(--color-texto)]">
              Elige
            </h3>
            <p className="text-[0.95rem] text-[var(--color-texto-secundario)] leading-relaxed">
              Revisa su estado, volumen y precio antes de agregarlo al carrito.
            </p>
          </article>

          <article className="border border-[var(--color-borde)] rounded-[var(--radio)] p-6 bg-[var(--color-blanco)] transition-colors duration-200">
            <span className="block mb-3 text-[var(--color-principal)] font-extrabold text-base">
              03
            </span>
            <h3 className="mb-2 text-[1.2rem] font-bold text-[var(--color-texto)]">
              Dale una nueva vida
            </h3>
            <p className="text-[0.95rem] text-[var(--color-texto-secundario)] leading-relaxed">
              Compra mangas de segunda mano y permite que otra persona vuelva a disfrutarlos.
            </p>
          </article>
        </div>
      </section>

      {/* ====================================================================
          4. SECCIÓN VENDER MANGA (ANCLAJE TEMPORAL)
          Conserva el identificador #vender y el encabezado original para evitar
          enlaces rotos en la navegación hasta su migración funcional completa.
          ==================================================================== */}
      <section
        id="vender"
        className="max-w-[var(--max-ancho)] mx-auto px-5 sm:px-6 md:px-[30px] py-[50px] md:py-[var(--espacio-grande)] text-center"
      >
        <h2 className="text-[1.8rem] md:text-[2.2rem] font-bold mb-[15px] text-[var(--color-texto)]">
          Vender manga
        </h2>
        <p className="max-w-[600px] mx-auto text-[var(--color-texto-secundario)] mb-8">
          ¿Tienes mangas que ya no lees? Puedes venderlos con nosotros.
        </p>

        <div className="max-w-[600px] mx-auto p-8 border border-dashed border-[var(--color-borde)] rounded-[var(--radio)] bg-[var(--color-blanco)] text-center transition-colors duration-200">
          <p className="text-base text-[var(--color-texto-secundario)]">
            El formulario de venta y solicitud para publicar mangas se integrará en las etapas posteriores de la migración.
          </p>
        </div>
      </section>
    </div>
  );
}
