const API_BASE = "http://localhost:4000/api";
const fallbackPathways = [
  {
    id: "npw-101",
    name: "Early Identification",
    description:
      "Screening guides and early support pathways for neurodivergent learners.",
  },
  {
    id: "npw-202",
    name: "Lifelong Support",
    description: "Ongoing care plans, resource tracking, and partnerships.",
  },
  {
    id: "npw-303",
    name: "Family & Care Team",
    description: "Shared goals, progress notes, and coordinated care.",
  },
];
const fallbackCheckins = [
  {
    id: "chk-1",
    memberName: "Jordan Lee",
    focus: "Sensory regulation",
    mood: "steady",
    createdAt: new Date().toISOString(),
  },
  {
    id: "chk-2",
    memberName: "Riley Chen",
    focus: "Community support touchpoint",
    mood: "encouraged",
    createdAt: new Date().toISOString(),
  },
];

const pathwaysEl = document.querySelector("#pathways");
const checkinsEl = document.querySelector("#checkins");
const pathwayCountEl = document.querySelector("#pathway-count");
const checkinCountEl = document.querySelector("#checkin-count");
const carePulseEl = document.querySelector("#care-pulse");

const refreshButton = document.querySelector("#refresh");
const createButton = document.querySelector("#create");

async function fetchJson(endpoint) {
  const response = await fetch(`${API_BASE}${endpoint}`);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json();
}

function renderPathways(pathways) {
  pathwaysEl.innerHTML = pathways
    .map(
      (pathway) => `
        <article class="tile">
          <h3>${pathway.name}</h3>
          <p>${pathway.description}</p>
          <span class="pill">${pathway.id}</span>
        </article>
      `,
    )
    .join("");
  pathwayCountEl.textContent = pathways.length;
}

function renderCheckins(checkins) {
  checkinsEl.innerHTML = checkins
    .map(
      (checkin) => `
        <article class="row">
          <div>
            <h3>${checkin.memberName}</h3>
            <p>${checkin.focus}</p>
          </div>
          <div class="meta">
            <span>${checkin.mood}</span>
            <time>${new Date(checkin.createdAt).toLocaleDateString()}</time>
          </div>
        </article>
      `,
    )
    .join("");
  checkinCountEl.textContent = checkins.length;
  carePulseEl.textContent = checkins[0]?.mood ?? "steady";
}

async function loadDashboard() {
  try {
    const [pathwayData, checkinData] = await Promise.all([
      fetchJson("/pathways"),
      fetchJson("/checkins"),
    ]);
    renderPathways(pathwayData.data);
    renderCheckins(checkinData.data);
  } catch (error) {
    renderPathways(fallbackPathways);
    renderCheckins(fallbackCheckins);
  }
}

async function createCheckin() {
  const payload = {
    memberName: "Avery Morgan",
    focus: "Communication supports",
    mood: "encouraged",
    nextStep: "Share progress with the speech therapist.",
  };

  await fetch(`${API_BASE}/checkins`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  await loadDashboard();
}

refreshButton.addEventListener("click", loadDashboard);
createButton.addEventListener("click", createCheckin);

loadDashboard();
