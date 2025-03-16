"use strict";
(function () {
    const katexStyle = {
        direction: "ltr",
        display: "inline-block",
        unicodeBidi: "isolate",
    };
    function applyKaTeXStyles(el) {
        el.style.direction = katexStyle.direction;
        el.style.display = katexStyle.display;
        el.style.unicodeBidi = katexStyle.unicodeBidi;
    }
    function applyLTRStyleToKaTeX() {
        const katexElements = document.querySelectorAll(".katex");
        katexElements.forEach((el) => applyKaTeXStyles(el));
    }
    // Apply styles on initial load
    applyLTRStyleToKaTeX();
    // Observer to apply styles to newly added KaTeX elements
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1) {
                    // Apply styles to the node itself if it's a KaTeX element
                    if (node.matches?.(".katex")) {
                        applyKaTeXStyles(node);
                    }
                    // Apply styles to all child KaTeX elements
                    node.querySelectorAll?.(".katex").forEach((el) => {
                        applyKaTeXStyles(el);
                    });
                }
            });
        });
    });
    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });
})();
