import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useState, useRef } from "react";
import "./PokedexGallery.css";
export default function PokedexGallery() {
    const PAGE_SIZE = 10;
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(null);
    const [cards, setCards] = useState([]);
    const [cache, setCache] = useState({});
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState(null);
    const modalRef = useRef(null);
    const API_KEY = import.meta.env.VITE_POKEMON_API_KEY;
    useEffect(() => {
        const controller = new AbortController();
        async function loadPage(pageNum) {
            if (cache[pageNum])
                return cache[pageNum];
            const url = `https://api.pokemontcg.io/v2/cards?pageSize=${PAGE_SIZE}&page=${pageNum}`;
            const res = await fetch(url, {
                signal: controller.signal,
                headers: { "X-Api-Key": API_KEY },
            });
            if (!res.ok)
                throw new Error("Failed to fetch cards");
            const data = await res.json();
            setCache((prev) => ({ ...prev, [pageNum]: data.data }));
            if (total === null)
                setTotal(data.totalCount);
            return data.data;
        }
        setLoading(true);
        loadPage(page)
            .then((cards) => setCards(cards))
            .catch((err) => {
            if (err.name !== "AbortError")
                console.error(err);
        })
            .finally(() => setLoading(false));
        if (total && page < Math.ceil(total / PAGE_SIZE)) {
            loadPage(page + 1).catch(() => { });
        }
        return () => controller.abort();
    }, [page, API_KEY]);
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === "Escape")
                setSelected(null);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);
    useEffect(() => {
        const el = modalRef.current;
        if (!el)
            return;
        const onMove = (e) => {
            const rect = el.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;
            const expanded = el.querySelector(".pg-expanded");
            if (expanded)
                expanded.style.transform = `rotateY(${x * 18}deg) rotateX(${-y * 12}deg) translateZ(40px)`;
        };
        const onLeave = () => {
            const expanded = el.querySelector(".pg-expanded");
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
    return (_jsxs("div", { className: "pg-wrap", children: [_jsxs("div", { className: "pg-header", children: [_jsxs("div", { className: "pg-title", children: ["\uD3EC\uCF13\uBAAC \uCE74\uB4DC \uAC24\uB7EC\uB9AC \u2014 \uD398\uC774\uC9C0 ", page, totalPages ? ` / ${totalPages}` : ""] }), _jsxs("div", { className: "pg-pagination", children: [_jsx("button", { className: "pg-btn", onClick: () => setPage((p) => Math.max(1, p - 1)), disabled: page === 1, children: "Prev" }), _jsx("button", { className: "pg-btn", onClick: () => setPage((p) => (totalPages ? Math.min(totalPages, p + 1) : p + 1)), disabled: totalPages ? page >= totalPages : false, children: "Next" })] })] }), loading ? (_jsx("div", { className: "pokeball-loader", children: _jsx("img", { src: "/pokeball.jpg", alt: "loading-pokeball" }) })) : (_jsx("div", { className: "pg-grid", children: cards.map((card) => {
                    const typeClass = card.types && card.types[0] ? card.types[0].toLowerCase() : "";
                    return (_jsx("div", { className: `pg-card ${typeClass}`, onClick: () => setSelected(card), children: _jsx("div", { className: "pg-image", children: _jsx("img", { src: card.images.small, alt: card.name, loading: "lazy" }) }) }, card.id));
                }) })), selected && (_jsx("div", { className: "pg-overlay", onClick: () => setSelected(null), children: _jsxs("div", { className: `pg-modal`, onClick: (e) => e.stopPropagation(), ref: modalRef, children: [_jsx("button", { className: "pg-close", onClick: () => setSelected(null), children: "\u2715" }), _jsx("div", { className: `pg-expanded ${selected.types && selected.types[0]
                                ? selected.types[0].toLowerCase()
                                : ""}`, style: { transform: "translateZ(40px)" }, children: _jsx("div", { className: "pg-expanded-inner", children: _jsx("img", { src: selected.images.large, alt: selected.name }) }) })] }) }))] }));
}
