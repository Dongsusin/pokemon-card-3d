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
  // API에 types 배열이 있음(예: ["Fire"], ["Water"] 등). 없을 수도 있으니 optional로 둠
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
      // API 반환 구조에 따라 data.data 가 카드 배열입니다.
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

  // ESC로 모달 닫기
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // 모달 3D 효과 (마우스 무브)
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
        <div>로딩 중...</div>
      ) : (
        <div className="pg-grid">
          {cards.map((card) => {
            // types가 있으면 첫 타입을 소문자로 클래스에 추가 (예: "fire", "water", "grass")
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

            {/* 확대 영역에 선택된 카드의 타입 클래스를 붙여서 타입별 glow 적용 */}
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
