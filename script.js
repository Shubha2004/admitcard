let db = [];

const els = {
  form: document.getElementById("search-form"),
  admitNumber: document.getElementById("admit-number"),
  btn: document.getElementById("search-btn"),
  status: document.getElementById("status"),
  count: document.getElementById("result-count"),
  cards: document.getElementById("cards"),
  toast: document.getElementById("toast"),
  template: document.getElementById("card-template"),
};

const setBusy = (state) => {
  els.btn.disabled = state;
  els.status.textContent = state ? "Searching..." : "Ready";
  els.status.setAttribute("aria-busy", state ? "true" : "false");
};

const updateCount = (n) => {
  els.count.textContent = `${n} ${n === 1 ? "match" : "matches"}`;
};

const normalizeAdmitNumber = (value) => String(value || "").replace(/\s+/g, "").toLowerCase();

const getAdmitNumber = (row) => row.roll_no || row.roll || row.admit_card_no || row.admitCardNo || "";

const findAdmitCard = (admitNumber) => {
  const query = normalizeAdmitNumber(admitNumber);
  const hit = db.find((row) => normalizeAdmitNumber(getAdmitNumber(row)) === query);
  return hit ? [hit] : [];
};

const renderResults = (rows) => {
  els.cards.innerHTML = "";

  if (!rows.length) {
    els.cards.innerHTML =
      '<div class="panel empty">No admit card found for this number. Check the number and search again.</div>';
    return;
  }

  rows.forEach((row) => {
    const node = els.template.content.cloneNode(true);
    node.querySelector(".roll").textContent = getAdmitNumber(row) || "-";
    node.querySelector(".name").textContent = row.name || "-";
    node.querySelector(".exam").textContent = row.exam || "B.A. Semester-V Examination 2025";
    node.querySelector(".registration").textContent = row.registration_no || "-";
    node.querySelector(".center").textContent = row.center || row.college || "Exam center (TBD)";
    node.querySelector(".session").textContent = row.session || "-";
    node.querySelector(".category").textContent = row.category || "-";

    const btn = node.querySelector(".download");
    btn.addEventListener("click", () => downloadCard(row));

    els.cards.appendChild(node);
  });
};

const getPdfFileName = (value) => String(value || "admit").replace(/[^A-Za-z0-9_-]+/g, "_").replace(/^_+|_+$/g, "");

const downloadCard = (row) => {
  const admitNumber = getAdmitNumber(row) || "admit";
  const fileName = getPdfFileName(admitNumber);
  const a = document.createElement("a");
  a.href = `admitcards/${encodeURIComponent(fileName)}.pdf`;
  a.download = `AdmitCard_${fileName}.pdf`;
  a.click();
  showToast(`PDF admit card downloading for ${row.name || admitNumber}`);
};

let toastTimeout;
const showToast = (msg) => {
  clearTimeout(toastTimeout);
  els.toast.textContent = msg;
  els.toast.hidden = false;
  requestAnimationFrame(() => els.toast.classList.add("show"));
  toastTimeout = setTimeout(() => {
    els.toast.classList.remove("show");
    toastTimeout = setTimeout(() => {
      els.toast.hidden = true;
    }, 200);
  }, 2600);
};

els.form.addEventListener("submit", (e) => {
  e.preventDefault();
  const admitNumber = els.admitNumber.value.trim();

  if (!admitNumber) {
    els.status.textContent = "Enter admit card number to search";
    showToast("Add an admit card number first.");
    return;
  }

  setBusy(true);
  setTimeout(() => {
    const hits = findAdmitCard(admitNumber);
    updateCount(hits.length);
    renderResults(hits);
    setBusy(false);
    els.status.textContent = hits.length ? "Admit card ready to download" : "No results";
  }, 200);
});

const loadData = async () => {
  try {
    els.status.textContent = "Loading students...";
    const res = await fetch("students.json");
    db = await res.json();
    updateCount(0);
    els.cards.innerHTML = '<div class="panel empty">Enter your admit card number to view your admit card.</div>';
    els.status.textContent = "Enter admit card number";
  } catch (err) {
    console.error(err);
    els.status.textContent = "Could not load students.json";
    showToast("Failed to load student list.");
  }
};

loadData();
