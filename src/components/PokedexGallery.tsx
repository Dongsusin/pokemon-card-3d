import React, { useEffect, useState, useRef } from "react";
import "./PokedexGallery.css";

type PokemonCard = {
  id: string;
  name: string;
  images: {
    small: string;
    large: string;
  };
  set: {
    name: string;
  };
  types?: string[];
};

export default function PokedexGallery() {
  const PAGE_SIZE = 10;
  const [page, setPage] = useState<number>(1);
  const [total, setTotal] = useState<number | null>(null);
  const [cards, setCards] = useState<PokemonCard[]>([]);
  const [cache, setCache] = useState<{ [page: number]: PokemonCard[] }>({});
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<PokemonCard | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);

  const API_KEY = import.meta.env.VITE_POKEMON_API_KEY;

  useEffect(() => {
    const controller = new AbortController();

    async function loadPage(pageNum: number) {
      if (cache[pageNum]) return cache[pageNum];
      const url = `https://api.pokemontcg.io/v2/cards?pageSize=${PAGE_SIZE}&page=${pageNum}`;
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { "X-Api-Key": API_KEY },
      });
      if (!res.ok) throw new Error("Failed to fetch cards");
      const data = await res.json();
      setCache((prev) => ({ ...prev, [pageNum]: data.data }));
      if (total === null) setTotal(data.totalCount);
      return data.data;
    }

    setLoading(true);
    loadPage(page)
      .then((cards) => setCards(cards))
      .catch((err) => {
        if (err.name !== "AbortError") console.error(err);
      })
      .finally(() => setLoading(false));

    if (total && page < Math.ceil(total / PAGE_SIZE)) {
      loadPage(page + 1).catch(() => {});
    }

    return () => controller.abort();
  }, [page, API_KEY]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const el = modalRef.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      const expanded = el.querySelector(".pg-expanded") as HTMLElement | null;
      if (expanded)
        expanded.style.transform = `rotateY(${x * 18}deg) rotateX(${
          -y * 12
        }deg) translateZ(40px)`;
    };
    const onLeave = () => {
      const expanded = el.querySelector(".pg-expanded") as HTMLElement | null;
      if (expanded)
        expanded.style.transform = `rotateY(0deg) rotateX(0deg) translateZ(40px)`;
    };
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, [selected]);

  const totalPages = total ? Math.ceil(total / PAGE_SIZE) : null;

  return (
    <div className="pg-wrap">
      <div className="pg-header">
        <div className="pg-title">
          포켓몬 카드 갤러리 — 페이지 {page}
          {totalPages ? ` / ${totalPages}` : ""}
        </div>
        <div className="pg-pagination">
          <button
            className="pg-btn"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Prev
          </button>
          <button
            className="pg-btn"
            onClick={() =>
              setPage((p) => (totalPages ? Math.min(totalPages, p + 1) : p + 1))
            }
            disabled={totalPages ? page >= totalPages : false}
          >
            Next
          </button>
        </div>
      </div>

      {loading ? (
        <div className="pokeball-loader">
          <img src="/pokeball.jpg" alt="loading-pokeball" />
        </div>
      ) : (
        <div className="pg-grid">
          {cards.map((card) => {
            const typeClass =
              card.types && card.types[0] ? card.types[0].toLowerCase() : "";
            return (
              <div
                key={card.id}
                className={`pg-card ${typeClass}`}
                onClick={() => setSelected(card)}
              >
                <div className="pg-image">
                  <img src={card.images.small} alt={card.name} loading="lazy" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selected && (
        <div className="pg-overlay" onClick={() => setSelected(null)}>
          <div
            className={`pg-modal`}
            onClick={(e) => e.stopPropagation()}
            ref={modalRef}
          >
            <button className="pg-close" onClick={() => setSelected(null)}>
              ✕
            </button>

            <div
              className={`pg-expanded ${
                selected.types && selected.types[0]
                  ? selected.types[0].toLowerCase()
                  : ""
              }`}
              style={{ transform: "translateZ(40px)" }}
            >
              <div className="pg-expanded-inner">
                <img src={selected.images.large} alt={selected.name} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
