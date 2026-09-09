import './style.css';
import { removeBackground } from '@imgly/background-removal';

const app = document.querySelector('#app');

app.innerHTML = `
  <main class="shell">
    <header class="topbar">
      <a class="brand" href="#" aria-label="ClearBG početna">
        <span class="brand-mark">C</span>
        <span>ClearBG</span>
      </a>
      <span class="privacy-pill">🔒 Slika ostaje na tvom uređaju</span>
    </header>

    <section class="hero">
      <div class="eyebrow">AI BACKGROUND REMOVER</div>
      <h1>Ukloni pozadinu.<br><span>Jednim klikom.</span></h1>
      <p>Bez računa, bez kredita i bez slanja slike na naš server.</p>
    </section>

    <section class="workspace">
      <div id="dropzone" class="dropzone" tabindex="0" role="button" aria-label="Odaberi sliku">
        <input id="fileInput" type="file" accept="image/png,image/jpeg,image/webp" hidden />
        <div class="upload-icon">↥</div>
        <h2>Ubaci sliku ovdje</h2>
        <p>ili odaberi JPG, PNG ili WEBP</p>
        <button id="chooseBtn" class="primary">Odaberi sliku</button>
        <small>Preporučeno do 20 MB</small>
      </div>

      <div id="editor" class="editor hidden">
        <div class="toolbar">
          <div>
            <strong id="filename">Slika</strong>
            <span id="status">Spremno za obradu</span>
          </div>
          <button id="newBtn" class="ghost">Nova slika</button>
        </div>

        <div class="preview-grid">
          <article class="preview-card">
            <div class="card-head"><span>Original</span></div>
            <div class="preview-stage original-bg">
              <img id="originalImg" alt="Originalna slika" />
            </div>
          </article>

          <article class="preview-card">
            <div class="card-head"><span>Bez pozadine</span><span id="resultBadge" class="badge">Čeka</span></div>
            <div class="preview-stage checkerboard">
              <img id="resultImg" class="hidden" alt="Slika bez pozadine" />
              <div id="resultEmpty" class="result-empty">Rezultat će se pojaviti ovdje</div>
            </div>
          </article>
        </div>

        <div id="progressWrap" class="progress-wrap hidden">
          <div class="progress-line"><span id="progressText">Učitavanje AI modela…</span><b id="progressPercent">0%</b></div>
          <div class="progress"><div id="progressBar"></div></div>
          <small>Prvi put može trajati duže jer browser preuzima AI model. Poslije ostaje u cacheu.</small>
        </div>

        <div class="actions">
          <button id="removeBtn" class="primary wide">✨ Ukloni pozadinu</button>
          <button id="downloadBtn" class="secondary wide" disabled>↓ Preuzmi PNG</button>
        </div>
      </div>
    </section>

    <section class="features">
      <div><b>100% lokalno</b><span>Obrada u browseru</span></div>
      <div><b>Besplatno</b><span>Bez kredita i limita</span></div>
      <div><b>PNG transparentan</b><span>Odmah spreman za download</span></div>
    </section>

    <footer>ClearBG · open-source starter</footer>
  </main>
`;

const els = {
  dropzone: document.querySelector('#dropzone'),
  fileInput: document.querySelector('#fileInput'),
  chooseBtn: document.querySelector('#chooseBtn'),
  editor: document.querySelector('#editor'),
  filename: document.querySelector('#filename'),
  status: document.querySelector('#status'),
  originalImg: document.querySelector('#originalImg'),
  resultImg: document.querySelector('#resultImg'),
  resultEmpty: document.querySelector('#resultEmpty'),
  resultBadge: document.querySelector('#resultBadge'),
  removeBtn: document.querySelector('#removeBtn'),
  downloadBtn: document.querySelector('#downloadBtn'),
  newBtn: document.querySelector('#newBtn'),
  progressWrap: document.querySelector('#progressWrap'),
  progressText: document.querySelector('#progressText'),
  progressPercent: document.querySelector('#progressPercent'),
  progressBar: document.querySelector('#progressBar')
};

let selectedFile = null;
let originalUrl = null;
let resultUrl = null;
let resultBlob = null;

function humanSize(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function setProgress(label, percent) {
  const value = Math.max(0, Math.min(100, Math.round(percent)));
  els.progressText.textContent = label;
  els.progressPercent.textContent = `${value}%`;
  els.progressBar.style.width = `${value}%`;
}

function cleanupUrls() {
  if (originalUrl) URL.revokeObjectURL(originalUrl);
  if (resultUrl) URL.revokeObjectURL(resultUrl);
  originalUrl = null;
  resultUrl = null;
}

function resetResult() {
  if (resultUrl) URL.revokeObjectURL(resultUrl);
  resultUrl = null;
  resultBlob = null;
  els.resultImg.src = '';
  els.resultImg.classList.add('hidden');
  els.resultEmpty.classList.remove('hidden');
  els.resultBadge.textContent = 'Čeka';
  els.resultBadge.classList.remove('done');
  els.downloadBtn.disabled = true;
  els.progressWrap.classList.add('hidden');
  setProgress('Učitavanje AI modela…', 0);
}

function loadFile(file) {
  if (!file || !file.type.startsWith('image/')) return;

  if (file.size > 20 * 1024 * 1024) {
    alert('Slika je veća od 20 MB. Probaj manju sliku.');
    return;
  }

  cleanupUrls();
  resetResult();
  selectedFile = file;
  originalUrl = URL.createObjectURL(file);
  els.originalImg.src = originalUrl;
  els.filename.textContent = file.name;
  els.status.textContent = `${humanSize(file.size)} · spremno`;
  els.dropzone.classList.add('hidden');
  els.editor.classList.remove('hidden');
}

async function processImage() {
  if (!selectedFile) return;

  els.removeBtn.disabled = true;
  els.downloadBtn.disabled = true;
  els.progressWrap.classList.remove('hidden');
  els.status.textContent = 'AI obrađuje sliku…';
  els.resultBadge.textContent = 'Obrada';
  setProgress('Pokretanje AI modela…', 3);

  try {
    const blob = await removeBackground(selectedFile, {
      model: 'isnet',
      output: {
        format: 'image/png',
        quality: 1
      },
      progress: (key, current, total) => {
        const stages = {
          'compute:decode': 'Čitanje slike…',
          'compute:inference': 'AI prepoznaje objekat…',
          'compute:mask': 'Uklanjanje pozadine…',
          'compute:encode': 'Priprema PNG-a…'
        };

        const base = key.startsWith('fetch:') ? 'Preuzimanje AI modela…' : (stages[key] || 'Obrada…');
        let percent = 10;
        if (Number.isFinite(current) && Number.isFinite(total) && total > 0) {
          percent = key.startsWith('fetch:')
            ? 5 + (current / total) * 35
            : 40 + (current / total) * 58;
        }
        setProgress(base, percent);
      }
    });

    resultBlob = blob;
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    resultUrl = URL.createObjectURL(blob);
    els.resultImg.src = resultUrl;
    els.resultImg.classList.remove('hidden');
    els.resultEmpty.classList.add('hidden');
    els.resultBadge.textContent = 'Gotovo';
    els.resultBadge.classList.add('done');
    els.downloadBtn.disabled = false;
    els.status.textContent = 'Pozadina uspješno uklonjena';
    setProgress('Gotovo', 100);
  } catch (error) {
    console.error(error);
    els.status.textContent = 'Greška pri obradi';
    els.resultBadge.textContent = 'Greška';
    setProgress('Nije uspjelo. Probaj ponovo ili drugu sliku.', 0);
  } finally {
    els.removeBtn.disabled = false;
  }
}

function downloadResult() {
  if (!resultBlob || !resultUrl) return;
  const link = document.createElement('a');
  const baseName = selectedFile?.name?.replace(/\.[^/.]+$/, '') || 'image';
  link.href = resultUrl;
  link.download = `${baseName}-no-bg.png`;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function startOver() {
  cleanupUrls();
  selectedFile = null;
  resultBlob = null;
  els.fileInput.value = '';
  els.editor.classList.add('hidden');
  els.dropzone.classList.remove('hidden');
  resetResult();
}

els.chooseBtn.addEventListener('click', (event) => {
  event.stopPropagation();
  els.fileInput.click();
});
els.dropzone.addEventListener('click', () => els.fileInput.click());
els.dropzone.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' || event.key === ' ') els.fileInput.click();
});
els.fileInput.addEventListener('change', () => loadFile(els.fileInput.files?.[0]));
els.removeBtn.addEventListener('click', processImage);
els.downloadBtn.addEventListener('click', downloadResult);
els.newBtn.addEventListener('click', startOver);

['dragenter', 'dragover'].forEach((name) => {
  els.dropzone.addEventListener(name, (event) => {
    event.preventDefault();
    els.dropzone.classList.add('dragging');
  });
});

['dragleave', 'drop'].forEach((name) => {
  els.dropzone.addEventListener(name, (event) => {
    event.preventDefault();
    els.dropzone.classList.remove('dragging');
  });
});

els.dropzone.addEventListener('drop', (event) => {
  loadFile(event.dataTransfer?.files?.[0]);
});

window.addEventListener('beforeunload', cleanupUrls);
