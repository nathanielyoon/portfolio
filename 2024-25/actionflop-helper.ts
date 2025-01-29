(function () {
  const click = (element: Element | null | undefined) =>
    element instanceof HTMLButtonElement && element.click();
  const number = (value: string | null) => +value!.replaceAll(",", "");
  click(
    document.querySelector("header")?.firstElementChild?.firstElementChild
      ?.firstElementChild?.nextElementSibling?.firstElementChild
      ?.firstElementChild,
  );
  const main = document.querySelector("main")?.firstElementChild
    ?.firstElementChild;
  main?.firstElementChild?.remove(), main?.lastElementChild?.remove();
  setTimeout(() =>
    click(
      main?.firstElementChild?.firstElementChild?.firstElementChild
        ?.firstElementChild?.firstElementChild?.nextElementSibling
        ?.firstElementChild,
    ), 100);
  setTimeout(() => {
    const div = main?.firstElementChild?.firstElementChild?.firstElementChild
      ?.appendChild(document.createElement("div"))!;
    div.style.display = "flex";
    div.style.gap = "0.25rem";
    div.style.overflow = "hidden";
    for (let z = 0; z < 32; ++z) {
      div.appendChild(document.createElement("span"));
    }
    const total = main?.firstElementChild?.firstElementChild?.firstElementChild
      ?.nextElementSibling?.nextElementSibling?.firstElementChild
      ?.nextElementSibling?.firstElementChild?.nextElementSibling!;
    new MutationObserver((node) => {
      const spans = div.querySelectorAll("span"), results = Array<string>(32);
      for (let z = 0; z < 32 - 1; ++z) {
        results[z + 1] = (spans[z].className.includes("red") ? "-" : "") +
          (spans[z].textContent ?? "");
      }
      const old_total = number(node[0].oldValue);
      const new_total = number(node[0].target.textContent);
      const ok =
        total?.firstElementChild?.nextElementSibling?.className.includes("red")
          ? old_total - new_total
          : new_total - old_total;
      if (ok && /\.00$/.test(results[0] = ok.toFixed(2)) && Math.abs(ok) <= 2) {
        results.shift(), results.push("");
      }
      for (let z = 0; z < 32; ++z) {
        const result = number(results[z]);
        spans[z].className = `text-${result < 0 ? "red" : "green"}-600`;
        spans[z].textContent = results[z].replace("-", "");
      }
    }).observe(total, { subtree: true, characterDataOldValue: true });
  }, 1000);
  addEventListener("keydown", (event) => {
    let index = 0;
    switch (event.key) {
      default:
        return;
      case ";":
        ++index;
      case "l":
        ++index;
      case "k":
        ++index;
      case "j":
    }
    click(
      main?.firstElementChild?.firstElementChild?.firstElementChild
        ?.firstElementChild?.firstElementChild?.firstElementChild
        ?.firstElementChild?.nextElementSibling?.nextElementSibling?.children
        ?.[index],
    );
  });
})();
