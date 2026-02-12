import "./fonts.js";
import "./styles/reset.css";
import "./styles/variables.css";
import "./styles/layout.css";
import "./styles/typography.css";
import "./styles/controls.css";

const root = document.documentElement;

// Logo font selector
const logoSelect = document.getElementById("logoFont");
logoSelect.addEventListener("change", () => {
  root.style.setProperty("--font-logo", logoSelect.value);
});

// Header font selector (with weight handling for Archivo Black)
const headerSelect = document.getElementById("headerFont");
headerSelect.addEventListener("change", () => {
  const selected = headerSelect.options[headerSelect.selectedIndex];
  root.style.setProperty("--font-header", headerSelect.value);
  root.style.setProperty("--font-header-weight", selected.dataset.weight);
});

// Body font selector
const bodySelect = document.getElementById("bodyFont");
bodySelect.addEventListener("change", () => {
  root.style.setProperty("--font-body", bodySelect.value);
});

// Collapse toggle
const controls = document.getElementById("controls");
const collapseBtn = document.getElementById("collapseBtn");
collapseBtn.addEventListener("click", () => {
  controls.classList.toggle("collapsed");
  collapseBtn.textContent = controls.classList.contains("collapsed")
    ? "Expand"
    : "Collapse";
});
