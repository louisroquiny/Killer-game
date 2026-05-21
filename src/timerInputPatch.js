function findTimerMinuteInput() {
  const labels = Array.from(document.querySelectorAll("label"));
  const label = labels.find((item) => item.textContent?.trim() === "Durée en minutes");
  const container = label?.parentElement;
  const input = container?.querySelector("input");
  return { container, input };
}

function setNativeInputValue(input, value) {
  const descriptor = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value");
  descriptor?.set?.call(input, String(value));
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

function changeMinutes(input, delta) {
  const current = Number.parseInt(input.value || "30", 10);
  const next = Math.max(1, (Number.isFinite(current) ? current : 30) + delta);
  setNativeInputValue(input, next);
}

function patchTimerMinuteInput() {
  const { container, input } = findTimerMinuteInput();
  if (!container || !input) return;

  input.setAttribute("type", "text");
  input.setAttribute("inputmode", "numeric");
  input.setAttribute("pattern", "[0-9]*");
  input.setAttribute("autocomplete", "off");
  input.setAttribute("enterkeyhint", "done");

  if (container.querySelector("[data-timer-minute-controls='true']")) return;

  const controls = document.createElement("div");
  controls.dataset.timerMinuteControls = "true";
  controls.className = "mt-2 grid grid-cols-2 gap-2";

  const minus = document.createElement("button");
  minus.type = "button";
  minus.textContent = "− 5 min";
  minus.className = "rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 font-bold text-white";
  minus.addEventListener("click", () => changeMinutes(input, -5));

  const plus = document.createElement("button");
  plus.type = "button";
  plus.textContent = "+ 5 min";
  plus.className = "rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 font-bold text-white";
  plus.addEventListener("click", () => changeMinutes(input, 5));

  controls.append(minus, plus);
  input.insertAdjacentElement("afterend", controls);
}

const observer = new MutationObserver(patchTimerMinuteInput);
observer.observe(document.documentElement, { childList: true, subtree: true });
window.addEventListener("load", patchTimerMinuteInput);
setTimeout(patchTimerMinuteInput, 0);
