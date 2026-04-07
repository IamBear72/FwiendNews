const DATA_FILE = "posts.json";
const PREVIEW_STORAGE_KEY = "fwiend-world-preview-posts";
const STUDIO_ACCESS = {
  sessionKey: "fwiend-world-newsroom-unlocked",
  passwordHash: "f00922ed97dfc70f5a610e54917043fa510617838550a5061635a9bdab03e5fc"
};
const FILE_HANDLE_STORE = {
  dbName: "fwiend-world-newsroom-db",
  storeName: "handles",
  key: "posts-file"
};

const DEFAULT_POSTS = [
  {
    id: "city-garden-project-expands",
    title: "City Garden Project Expands Across Three More Blocks",
    subtitle: "Volunteers and local shops are backing a bigger community growing plan after months of strong turnout.",
    author: "Fwiend World News",
    tag: "Local",
    coverImage: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=1200&q=80",
    publishedAt: "2026-04-06T09:15:00.000Z",
    blocks: [
      {
        id: "garden-1",
        type: "text",
        content: "## Expansion approved\n\nA neighborhood garden effort is growing again after volunteers secured support for three more blocks of planting space. Organizers said the new area will include vegetables, flowers, and seating for weekend events."
      },
      {
        id: "garden-2",
        type: "image",
        url: "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=1200&q=80",
        caption: "Fresh planting beds are being added before the end of spring."
      },
      {
        id: "garden-3",
        type: "text",
        content: "### What happens next\n\nOrganizers say the next stage focuses on volunteer sign-ups, tool sharing, and a public weekend opening once the first round of planting is complete."
      }
    ]
  },
  {
    id: "evening-market-draws-crowds",
    title: "Evening Market Draws Crowds With Music, Food, and Late Shopping",
    subtitle: "Hundreds of visitors turned out for the first late-night market of the month, with vendors reporting strong sales.",
    author: "Fwiend World News",
    tag: "Culture",
    coverImage: "https://images.unsplash.com/photo-1481833761820-0509d3217039?auto=format&fit=crop&w=1200&q=80",
    publishedAt: "2026-04-05T18:45:00.000Z",
    blocks: [
      {
        id: "market-1",
        type: "text",
        content: "## Strong turnout after sunset\n\nThe city center stayed busy well into the evening as food stalls, handmade goods, and live performers filled the market route. Several vendors said the extra opening hours gave the event a more relaxed atmosphere."
      },
      {
        id: "market-2",
        type: "video",
        url: "https://www.youtube.com/watch?v=ScMzIvxBSi4",
        caption: "A short look at live music and the evening crowd."
      },
      {
        id: "market-3",
        type: "text",
        content: "> The biggest difference was time. People stayed longer, talked more, and really explored the stalls.\n\nEvent staff say more late markets are planned if attendance stays high."
      }
    ]
  },
  {
    id: "school-tech-lab-opens",
    title: "School Tech Lab Opens With New Video, Audio, and Coding Spaces",
    subtitle: "Students now have access to a refreshed media lab designed for creative projects and digital reporting.",
    author: "Fwiend World News",
    tag: "Education",
    coverImage: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
    publishedAt: "2026-04-03T14:00:00.000Z",
    blocks: [
      {
        id: "lab-1",
        type: "text",
        content: "## New creative spaces\n\nA refurbished school tech lab has officially opened, giving students access to updated computers, a small video corner, and audio recording equipment for multimedia projects."
      },
      {
        id: "lab-2",
        type: "image",
        url: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80",
        caption: "The upgraded room includes new equipment for digital storytelling."
      },
      {
        id: "lab-3",
        type: "text",
        content: "### Why it matters\n\nTeachers say the new space will help students create richer presentations, news updates, interviews, and project showcases across different subjects."
      }
    ]
  }
];

document.addEventListener("DOMContentLoaded", async () => {
  const page = document.body.dataset.page;

  if (page === "home") {
    await initHomePage();
  }

  if (page === "studio") {
    await initStudioPage();
  }
});

async function loadPublishedPosts() {
  try {
    const response = await fetch(`${DATA_FILE}?v=${Date.now()}`, {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`Could not load ${DATA_FILE}.`);
    }

    const parsed = await response.json();
    return {
      posts: normalizePosts(parsed),
      source: "file"
    };
  } catch (error) {
    const previewPosts = loadPreviewPosts();

    if (previewPosts) {
      return {
        posts: previewPosts,
        source: "preview",
        error
      };
    }

    return {
      posts: normalizePosts(DEFAULT_POSTS),
      source: "sample",
      error
    };
  }
}

function normalizePosts(value) {
  const list = Array.isArray(value) ? value : DEFAULT_POSTS;
  return sortPosts(list.map((post, index) => normalizePost(post, index)));
}

function normalizePost(post, index) {
  const blocks = Array.isArray(post?.blocks)
    ? post.blocks.map((block, blockIndex) => normalizeBlock(block, blockIndex)).filter((block) => blockHasContent(block))
    : [];

  return {
    id: String(post?.id || slugify(post?.title || `article-${index + 1}`)),
    title: String(post?.title || `Untitled article ${index + 1}`).trim(),
    subtitle: String(post?.subtitle || "").trim(),
    author: String(post?.author || "Fwiend World News").trim(),
    tag: String(post?.tag || "News").trim(),
    coverImage: String(post?.coverImage || "").trim(),
    publishedAt: isValidDate(post?.publishedAt) ? new Date(post.publishedAt).toISOString() : new Date().toISOString(),
    blocks: blocks.length ? blocks : [
      {
        id: createId("text"),
        type: "text",
        content: "Add article text here."
      }
    ]
  };
}

function normalizeBlock(block, index) {
  if (block?.type === "text") {
    return {
      id: String(block.id || createId("text")),
      type: "text",
      content: String(block.content || "").trim()
    };
  }

  const type = block?.type === "video" ? "video" : "image";
  return {
    id: String(block?.id || createId(type)),
    type,
    url: String(block?.url || "").trim(),
    caption: String(block?.caption || "").trim()
  };
}

function sortPosts(posts) {
  return [...posts].sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
}

function isValidDate(value) {
  return !Number.isNaN(new Date(value).getTime());
}

function formatDate(dateString) {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    dateStyle: "long"
  });

  return formatter.format(new Date(dateString));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

function slugify(value) {
  return String(value ?? "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || `article-${Date.now()}`;
}

function createId(prefix = "block") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function excerptFromPost(post) {
  if (post.subtitle?.trim()) {
    return post.subtitle.trim();
  }

  const firstTextBlock = post.blocks.find((block) => block.type === "text" && block.content?.trim());
  const text = firstTextBlock ? firstTextBlock.content.replace(/^#{1,6}\s+/gm, "").replace(/^>\s*/gm, "") : "";
  return text.trim().slice(0, 140) + (text.trim().length > 140 ? "..." : "");
}

function buildTextBlockHtml(content) {
  const source = String(content ?? "").trim();

  if (!source) {
    return "<p>Add some text to this section.</p>";
  }

  const paragraphs = source.split(/\n\s*\n/);

  return paragraphs.map((paragraph) => {
    const trimmed = paragraph.trim();

    if (!trimmed) {
      return "";
    }

    if (trimmed.startsWith("### ")) {
      return `<h4>${escapeHtml(trimmed.slice(4))}</h4>`;
    }

    if (trimmed.startsWith("## ")) {
      return `<h3>${escapeHtml(trimmed.slice(3))}</h3>`;
    }

    if (trimmed.startsWith("> ")) {
      return `<blockquote>${escapeHtml(trimmed.slice(2)).replaceAll("\n", "<br>")}</blockquote>`;
    }

    return `<p>${escapeHtml(trimmed).replaceAll("\n", "<br>")}</p>`;
  }).join("");
}

function getYouTubeEmbed(url) {
  try {
    const parsed = new URL(url);

    if (parsed.hostname.includes("youtu.be")) {
      return `https://www.youtube.com/embed/${parsed.pathname.slice(1)}`;
    }

    if (parsed.hostname.includes("youtube.com")) {
      const videoId = parsed.searchParams.get("v");
      return videoId ? `https://www.youtube.com/embed/${videoId}` : "";
    }
  } catch (error) {
    return "";
  }

  return "";
}

function getVimeoEmbed(url) {
  try {
    const parsed = new URL(url);

    if (parsed.hostname.includes("vimeo.com")) {
      const id = parsed.pathname.split("/").filter(Boolean).pop();
      return id ? `https://player.vimeo.com/video/${id}` : "";
    }
  } catch (error) {
    return "";
  }

  return "";
}

function renderCoverMedia(url, title, fallbackClass = "post-cover-fallback") {
  if (url?.trim()) {
    return `<img src="${escapeHtml(url)}" alt="${escapeHtml(title)} cover image">`;
  }

  return `<div class="${fallbackClass}">${escapeHtml(title)}</div>`;
}

function renderMediaBlock(block, title) {
  if (block.type === "image") {
    if (!block.url?.trim()) {
      return "";
    }

    return `
      <figure class="content-block">
        <div class="media-frame">
          <img src="${escapeHtml(block.url)}" alt="${escapeHtml(block.caption || title)}">
        </div>
        ${block.caption?.trim() ? `<figcaption class="block-caption">${escapeHtml(block.caption)}</figcaption>` : ""}
      </figure>
    `;
  }

  if (block.type === "video") {
    if (!block.url?.trim()) {
      return "";
    }

    const youTube = getYouTubeEmbed(block.url);
    const vimeo = getVimeoEmbed(block.url);
    const directVideo = /\.(mp4|webm|ogg)(\?.*)?$/i.test(block.url);

    let mediaHtml = "";

    if (youTube || vimeo) {
      mediaHtml = `
        <iframe
          src="${escapeHtml(youTube || vimeo)}"
          title="${escapeHtml(block.caption || title)}"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen
        ></iframe>
      `;
    } else if (directVideo) {
      mediaHtml = `
        <video controls preload="metadata">
          <source src="${escapeHtml(block.url)}">
          Your browser does not support the video tag.
        </video>
      `;
    } else {
      mediaHtml = `
        <div class="post-cover-fallback">
          <a class="button button-secondary" href="${escapeHtml(block.url)}" target="_blank" rel="noreferrer">
            Open video link
          </a>
        </div>
      `;
    }

    return `
      <figure class="content-block">
        <div class="media-frame">
          ${mediaHtml}
        </div>
        ${block.caption?.trim() ? `<figcaption class="block-caption">${escapeHtml(block.caption)}</figcaption>` : ""}
      </figure>
    `;
  }

  return `
    <section class="content-block content-block-text">
      ${buildTextBlockHtml(block.content)}
    </section>
  `;
}

async function initHomePage() {
  const loadResult = await loadPublishedPosts();
  const posts = loadResult.posts;
  const postGrid = document.getElementById("post-grid");
  const emptyState = document.getElementById("empty-state");
  const postCount = document.getElementById("post-count");
  const articleSection = document.getElementById("article-section");
  const selectedPostId = new URLSearchParams(window.location.search).get("post");

  postCount.textContent = String(posts.length);
  emptyState.classList.toggle("hidden", Boolean(posts.length));

  postGrid.innerHTML = posts.map((post) => `
    <article class="post-card">
      <div class="post-cover">
        ${renderCoverMedia(post.coverImage, post.title)}
      </div>
      <div class="post-body">
        <div class="post-meta">
          <span class="post-tag">${escapeHtml(post.tag || "News")}</span>
          <span>${formatDate(post.publishedAt)}</span>
        </div>
        <h3>${escapeHtml(post.title)}</h3>
        <p>${escapeHtml(excerptFromPost(post))}</p>
        <a class="card-link" href="index.html?post=${encodeURIComponent(post.id)}">
          Read article
          <span aria-hidden="true">-&gt;</span>
        </a>
      </div>
    </article>
  `).join("");

  if (!selectedPostId) {
    return;
  }

  const post = posts.find((entry) => entry.id === selectedPostId);

  if (!post) {
    articleSection.classList.remove("hidden");
    articleSection.innerHTML = `
      <section class="article-shell">
        <article class="article-hero">
          <div>
            <div class="article-actions">
              <a class="button button-secondary" href="index.html">Back to news</a>
            </div>
            <p class="eyebrow">Article not found</p>
            <h1 class="article-title">That article is missing.</h1>
            <p class="article-intro">The article may have been removed or the link may be incorrect.</p>
          </div>
          <div class="article-cover">
            <div class="article-cover-fallback">Fwiend World News</div>
          </div>
        </article>
      </section>
    `;
    hideHomeOnlySections();
    return;
  }

  articleSection.classList.remove("hidden");
  articleSection.innerHTML = `
    <section class="article-shell">
      <article class="article-hero">
        <div>
          <div class="article-actions">
            <a class="button button-secondary" href="index.html">Back to news</a>
          </div>
          <div class="article-meta">
            <span class="meta-pill">${escapeHtml(post.tag || "News")}</span>
            <span>${formatDate(post.publishedAt)}</span>
            <span>By ${escapeHtml(post.author || "Fwiend World News")}</span>
          </div>
          <h1 class="article-title">${escapeHtml(post.title)}</h1>
          <p class="article-intro">${escapeHtml(post.subtitle || excerptFromPost(post))}</p>
        </div>
        <div class="article-cover">
          ${renderCoverMedia(post.coverImage, post.title, "article-cover-fallback")}
        </div>
      </article>
      <article class="article-content">
        ${post.blocks.map((block) => renderMediaBlock(block, post.title)).join("")}
      </article>
    </section>
  `;

  hideHomeOnlySections();
}

function hideHomeOnlySections() {
  document.querySelectorAll("[data-home-only]").forEach((section) => {
    section.classList.add("hidden");
  });
}

async function initStudioPage() {
  const elements = {
    gatePanel: document.getElementById("gate-panel"),
    gateForm: document.getElementById("gate-form"),
    gatePasscodeInput: document.getElementById("gate-passcode-input"),
    gateMessage: document.getElementById("gate-message"),
    dashboard: document.getElementById("dashboard"),
    fileConnectionStatus: document.getElementById("file-connection-status"),
    studioMessage: document.getElementById("studio-message"),
    newPostButton: document.getElementById("new-post-button"),
    openSiteFileButton: document.getElementById("open-site-file-button"),
    publishSiteFileButton: document.getElementById("publish-site-file-button"),
    downloadPostsButton: document.getElementById("download-posts-button"),
    importPostsInput: document.getElementById("import-posts-input"),
    lockNewsroomButton: document.getElementById("lock-newsroom-button"),
    postForm: document.getElementById("post-form"),
    editorTitle: document.getElementById("editor-title"),
    titleInput: document.getElementById("post-title"),
    tagInput: document.getElementById("post-tag"),
    subtitleInput: document.getElementById("post-subtitle"),
    authorInput: document.getElementById("post-author"),
    coverInput: document.getElementById("post-cover"),
    blockList: document.getElementById("block-list"),
    draftPreview: document.getElementById("draft-preview"),
    libraryList: document.getElementById("library-list"),
    resetEditorButton: document.getElementById("reset-editor-button")
  };

  const loadResult = await loadPublishedPosts();
  const state = {
    editingId: null,
    blocks: [],
    posts: loadResult.posts,
    connectedFileHandle: null,
    connectedFileName: "",
    importedFileName: "",
    fileLinkRemembered: false,
    unlocked: sessionStorage.getItem(STUDIO_ACCESS.sessionKey) === "true"
  };
  const supportsHashedAccess = Boolean(window.crypto?.subtle);
  const supportsOpenFilePicker = typeof window.showOpenFilePicker === "function";
  const supportsSaveFilePicker = typeof window.showSaveFilePicker === "function";
  const supportsStoredHandles = typeof window.indexedDB !== "undefined";
  const rememberedHandle = supportsStoredHandles ? await loadStoredFileHandle() : null;

  if (rememberedHandle) {
    state.connectedFileHandle = rememberedHandle;
    state.connectedFileName = rememberedHandle.name || DATA_FILE;
    state.fileLinkRemembered = true;

    const rememberedLoad = await tryReadPostsFromHandle(rememberedHandle);

    if (rememberedLoad.ok) {
      state.posts = rememberedLoad.posts;
    }
  }

  persistPreviewPosts(state.posts);
  renderLibrary();
  updateFileConnectionStatus();

  elements.gateForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!supportsHashedAccess) {
      showGateMessage("This browser cannot verify the newsroom key. Please use a modern browser like Edge or Chrome.");
      return;
    }

    const enteredKey = elements.gatePasscodeInput.value.trim();

    if (!enteredKey) {
      showGateMessage("Enter your newsroom key to continue.");
      return;
    }

    const enteredHash = await hashText(enteredKey);

    if (enteredHash !== STUDIO_ACCESS.passwordHash) {
      showGateMessage("That newsroom key is not correct.");
      return;
    }

    sessionStorage.setItem(STUDIO_ACCESS.sessionKey, "true");
    elements.gateForm.reset();
    unlockStudio(getInitialDeskMessage(loadResult));
  });

  elements.newPostButton.addEventListener("click", () => {
    startNewDraft("Fresh article draft ready.");
  });

  elements.openSiteFileButton.addEventListener("click", async () => {
    if (!supportsOpenFilePicker) {
      elements.importPostsInput.click();
      return;
    }

    try {
      const [handle] = await window.showOpenFilePicker({
        multiple: false,
        types: [
          {
            description: "JSON files",
            accept: {
              "application/json": [".json"]
            }
          }
        ]
      });
      const file = await handle.getFile();
      const parsedPosts = parseImportedPosts(await file.text());

      state.posts = normalizePosts(parsedPosts);
      state.connectedFileHandle = handle;
      state.connectedFileName = handle.name || file.name || DATA_FILE;
      state.importedFileName = "";
      state.fileLinkRemembered = await saveStoredFileHandle(handle);
      persistPreviewPosts(state.posts);
      renderLibrary();
      startNewDraft(`Linked ${state.connectedFileName}. Future publishing can reuse this file in this browser.`);
      updateFileConnectionStatus();
    } catch (error) {
      if (error.name !== "AbortError") {
        showStudioMessage("Could not open the selected posts.json file.");
      }
    }
  });

  elements.publishSiteFileButton.addEventListener("click", async () => {
    await publishPostsToFile();
  });

  elements.downloadPostsButton.addEventListener("click", () => {
    downloadPostsFile(state.posts);
    showStudioMessage("Backup downloaded. You can keep it or replace your site posts.json file with it manually.");
  });

  elements.importPostsInput.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      state.posts = normalizePosts(parseImportedPosts(await file.text()));
      state.connectedFileHandle = null;
      state.connectedFileName = "";
      state.importedFileName = file.name || DATA_FILE;
      state.fileLinkRemembered = false;
      await clearStoredFileHandle();
      persistPreviewPosts(state.posts);
      renderLibrary();
      startNewDraft(`Imported ${state.importedFileName}. Publish will ask where to save the updated file.`);
      updateFileConnectionStatus();
    } catch (error) {
      showStudioMessage("That file could not be read as valid article data.");
    } finally {
      event.target.value = "";
    }
  });

  elements.lockNewsroomButton.addEventListener("click", () => {
    sessionStorage.removeItem(STUDIO_ACCESS.sessionKey);
    state.unlocked = false;
    state.connectedFileHandle = null;
    state.connectedFileName = "";
    state.importedFileName = "";
    elements.dashboard.classList.add("hidden");
    elements.gatePanel.classList.remove("hidden");
    elements.gateForm.reset();
    showGateMessage("The newsroom is locked again.");
    showStudioMessage("");
    updateFileConnectionStatus();
  });

  elements.resetEditorButton.addEventListener("click", () => {
    startNewDraft("Draft cleared.");
  });

  elements.postForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const title = elements.titleInput.value.trim();
    const subtitle = elements.subtitleInput.value.trim();
    const author = elements.authorInput.value.trim() || "Fwiend World News";
    const tag = elements.tagInput.value.trim() || "News";
    const coverImage = elements.coverInput.value.trim();
    const validBlocks = state.blocks
      .map((block) => sanitizeBlock(block))
      .filter((block) => block && blockHasContent(block));

    if (!title) {
      showStudioMessage("Add a headline before saving.");
      elements.titleInput.focus();
      return;
    }

    if (!validBlocks.length) {
      showStudioMessage("Add at least one text, image, or video section before saving.");
      return;
    }

    const existingPost = state.posts.find((post) => post.id === state.editingId);
    const publishedAt = existingPost?.publishedAt || new Date().toISOString();
    const stableId = existingPost?.id || createPostId(title, state.posts);

    const nextPost = normalizePost({
      id: stableId,
      title,
      subtitle,
      author,
      tag,
      coverImage,
      publishedAt,
      blocks: validBlocks
    });

    state.posts = sortPosts(
      existingPost
        ? state.posts.map((post) => (post.id === state.editingId ? nextPost : post))
        : [...state.posts, nextPost]
    );

    state.editingId = nextPost.id;
    persistPreviewPosts(state.posts);
    renderLibrary();
    elements.editorTitle.textContent = `Editing: ${nextPost.title}`;
    showStudioMessage("Article saved in the newsroom. Use Publish to file when you are ready to update the live data file.");
  });

  elements.blockList.addEventListener("input", (event) => {
    const target = event.target;
    const blockId = target.closest(".block-editor")?.dataset.blockId;

    if (!blockId) {
      return;
    }

    const block = state.blocks.find((entry) => entry.id === blockId);

    if (!block) {
      return;
    }

    if (target.matches("[data-field='content']")) {
      block.content = target.value;
    }

    if (target.matches("[data-field='url']")) {
      block.url = target.value;
    }

    if (target.matches("[data-field='caption']")) {
      block.caption = target.value;
    }

    renderDraftPreview();
  });

  elements.blockList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");

    if (!button) {
      return;
    }

    const blockId = button.closest(".block-editor")?.dataset.blockId;
    const action = button.dataset.action;
    const index = state.blocks.findIndex((entry) => entry.id === blockId);

    if (index === -1) {
      return;
    }

    if (action === "remove") {
      state.blocks.splice(index, 1);
    }

    if (action === "move-up" && index > 0) {
      [state.blocks[index - 1], state.blocks[index]] = [state.blocks[index], state.blocks[index - 1]];
    }

    if (action === "move-down" && index < state.blocks.length - 1) {
      [state.blocks[index + 1], state.blocks[index]] = [state.blocks[index], state.blocks[index + 1]];
    }

    renderBlocks();
    renderDraftPreview();
  });

  document.querySelectorAll("[data-add-block]").forEach((button) => {
    button.addEventListener("click", () => {
      addBlock(button.dataset.addBlock);
    });
  });

  [
    elements.titleInput,
    elements.tagInput,
    elements.subtitleInput,
    elements.authorInput,
    elements.coverInput
  ].forEach((input) => {
    input.addEventListener("input", () => {
      renderDraftPreview();
    });
  });

  if (state.unlocked) {
    unlockStudio(getInitialDeskMessage(loadResult));
  } else {
    elements.dashboard.classList.add("hidden");
    elements.gatePanel.classList.remove("hidden");
    if (!supportsHashedAccess) {
      showGateMessage("This browser cannot verify the newsroom key. Please use a modern browser like Edge or Chrome.");
    }
  }

  function addBlock(type, values = {}) {
    const baseBlock = {
      id: createId(type),
      type,
      content: "",
      url: "",
      caption: ""
    };
    state.blocks.push({ ...baseBlock, ...values });
    renderBlocks();
    renderDraftPreview();
  }

  function renderBlocks() {
    if (!state.blocks.length) {
      elements.blockList.innerHTML = `
        <article class="block-editor">
          <strong>No sections yet</strong>
          <p class="block-note">Add a text, image, or video section to start building the article.</p>
        </article>
      `;
      return;
    }

    elements.blockList.innerHTML = state.blocks.map((block, index) => `
      <article class="block-editor" data-type="${escapeHtml(block.type)}" data-block-id="${escapeHtml(block.id)}">
        <div class="block-toolbar">
          <strong>${capitalize(block.type)} section ${index + 1}</strong>
          <div class="mini-actions">
            <button class="mini-button" type="button" data-action="move-up" aria-label="Move section up">Up</button>
            <button class="mini-button" type="button" data-action="move-down" aria-label="Move section down">Down</button>
            <button class="mini-button mini-button-danger" type="button" data-action="remove" aria-label="Remove section">Delete</button>
          </div>
        </div>

        ${renderBlockEditorFields(block)}
      </article>
    `).join("");
  }

  function renderBlockEditorFields(block) {
    if (block.type === "text") {
      return `
        <p class="block-note">Use blank lines to create paragraphs. Start a paragraph with <code>##</code> for a heading or <code>&gt;</code> for a quote.</p>
        <label class="field">
          <span>Text content</span>
          <textarea data-field="content" placeholder="Write the article section here...">${escapeHtml(block.content || "")}</textarea>
        </label>
      `;
    }

    const mediaLabel = block.type === "image" ? "Image URL" : "Video URL";
    const mediaPlaceholder = block.type === "image"
      ? "https://example.com/photo.jpg"
      : "https://youtube.com/watch?v=...";

    return `
      <div class="inline-fields">
        <label class="field field-wide">
          <span>${mediaLabel}</span>
          <input
            type="url"
            data-field="url"
            placeholder="${mediaPlaceholder}"
            value="${escapeHtml(block.url || "")}"
          >
        </label>
        <label class="field field-wide">
          <span>Caption</span>
          <input
            type="text"
            data-field="caption"
            placeholder="Add a caption or reporting note"
            value="${escapeHtml(block.caption || "")}"
          >
        </label>
      </div>
    `;
  }

  function renderDraftPreview() {
    const draft = buildDraftFromInputs();

    if (!draft.title && !draft.blocks.length) {
      elements.draftPreview.innerHTML = "<div class=\"draft-empty\">Your live article preview will appear here as you build the draft.</div>";
      return;
    }

    const blocksHtml = draft.blocks.length
      ? draft.blocks.map((block) => renderMediaBlock(block, draft.title || "Draft article")).join("")
      : "<div class=\"draft-empty\">Add a content section to preview the article layout.</div>";

    elements.draftPreview.innerHTML = `
      <div class="draft-preview-shell">
        <div class="article-meta">
          <span class="meta-pill">${escapeHtml(draft.tag || "News")}</span>
          <span>${formatDate(new Date().toISOString())}</span>
          <span>By ${escapeHtml(draft.author || "Fwiend World News")}</span>
        </div>
        <h3>${escapeHtml(draft.title || "Untitled article")}</h3>
        <p>${escapeHtml(draft.subtitle || "Add a short summary to introduce the article.")}</p>
        <div class="article-cover">
          ${renderCoverMedia(draft.coverImage, draft.title || "Draft article", "article-cover-fallback")}
        </div>
        ${blocksHtml}
      </div>
    `;
  }

  function renderLibrary() {
    if (!state.posts.length) {
      elements.libraryList.innerHTML = "<div class=\"library-empty\">No published articles yet. Save your first article to start the newsroom library.</div>";
      return;
    }

    elements.libraryList.innerHTML = state.posts.map((post) => `
      <article class="library-card">
        <div class="pill-row">
          <span class="post-tag">${escapeHtml(post.tag || "News")}</span>
          <span class="post-tag">${formatDate(post.publishedAt)}</span>
        </div>
        <h4>${escapeHtml(post.title)}</h4>
        <p>${escapeHtml(excerptFromPost(post))}</p>
        <div class="toolbar-actions">
          <button class="button button-secondary" type="button" data-library-action="edit" data-post-id="${escapeHtml(post.id)}">Edit</button>
          <button class="button button-secondary" type="button" data-library-action="delete" data-post-id="${escapeHtml(post.id)}">Delete</button>
          <a class="button button-secondary" href="index.html?post=${encodeURIComponent(post.id)}">View</a>
        </div>
      </article>
    `).join("");

    elements.libraryList.querySelectorAll("[data-library-action='edit']").forEach((button) => {
      button.addEventListener("click", () => {
        editPost(button.dataset.postId);
      });
    });

    elements.libraryList.querySelectorAll("[data-library-action='delete']").forEach((button) => {
      button.addEventListener("click", () => {
        deletePost(button.dataset.postId);
      });
    });
  }

  function editPost(postId) {
    const post = state.posts.find((entry) => entry.id === postId);

    if (!post) {
      showStudioMessage("That article could not be found.");
      return;
    }

    state.editingId = post.id;
    elements.titleInput.value = post.title || "";
    elements.tagInput.value = post.tag || "";
    elements.subtitleInput.value = post.subtitle || "";
    elements.authorInput.value = post.author || "";
    elements.coverInput.value = post.coverImage || "";
    state.blocks = post.blocks.map((block) => ({ ...block }));
    elements.editorTitle.textContent = `Editing: ${post.title}`;
    renderBlocks();
    renderDraftPreview();
    showStudioMessage(`Editing "${post.title}".`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function deletePost(postId) {
    const post = state.posts.find((entry) => entry.id === postId);

    if (!post) {
      showStudioMessage("That article could not be found.");
      return;
    }

    const confirmed = window.confirm(`Delete "${post.title}" from the newsroom library?`);

    if (!confirmed) {
      return;
    }

    state.posts = state.posts.filter((entry) => entry.id !== postId);
    persistPreviewPosts(state.posts);

    if (state.editingId === postId) {
      startNewDraft();
    } else {
      renderLibrary();
    }

    renderLibrary();
    showStudioMessage(`Deleted "${post.title}". Use Publish to file if you want that deletion written into the live data file.`);
  }

  function startNewDraft(message = "") {
    state.editingId = null;
    state.blocks = [];
    elements.postForm.reset();
    elements.authorInput.value = "Fwiend World News";
    elements.editorTitle.textContent = "Create a new article";
    renderBlocks();
    renderDraftPreview();
    showStudioMessage(message);
  }

  function buildDraftFromInputs() {
    return {
      title: elements.titleInput.value.trim(),
      subtitle: elements.subtitleInput.value.trim(),
      author: elements.authorInput.value.trim(),
      tag: elements.tagInput.value.trim(),
      coverImage: elements.coverInput.value.trim(),
      blocks: state.blocks
        .map((block) => sanitizeBlock(block))
        .filter((block) => block && blockHasContent(block))
    };
  }

  function showStudioMessage(message) {
    elements.studioMessage.textContent = message;
  }

  function showGateMessage(message) {
    elements.gateMessage.textContent = message;
  }

  function unlockStudio(message) {
    state.unlocked = true;
    elements.gatePanel.classList.add("hidden");
    elements.dashboard.classList.remove("hidden");
    showGateMessage("");
    renderLibrary();
    updateFileConnectionStatus();
    startNewDraft(message);
  }

  function updateFileConnectionStatus() {
    if (!elements.fileConnectionStatus) {
      return;
    }

    if (!state.unlocked) {
      elements.fileConnectionStatus.textContent = "";
      return;
    }

    const messages = [];

    if (state.connectedFileHandle) {
      messages.push(`Linked to ${state.connectedFileName}. Publish can reuse that file from this browser.`);
    } else if (state.importedFileName) {
      messages.push(`Imported from ${state.importedFileName}. Publish will ask where to save the updated file.`);
    } else if (supportsSaveFilePicker) {
      messages.push("No file is linked yet. Link posts.json once or let Publish ask where to save it.");
    } else {
      messages.push("This browser does not support direct file publishing. Use Download backup as your fallback.");
    }

    if (!supportsOpenFilePicker) {
      messages.push("Link posts.json falls back to manual import in this browser.");
    }

    if (state.fileLinkRemembered && state.connectedFileHandle) {
      messages.push("This link is remembered in this browser for faster publishing.");
    }

    elements.fileConnectionStatus.textContent = messages.join(" ");
  }

  function getInitialDeskMessage(result) {
    if (result.source === "file") {
      return "Loaded published article data from posts.json.";
    }

    if (result.source === "preview") {
      return "Loaded your latest browser preview copy. Link posts.json if you want to reconnect the remembered site file directly.";
    }

    if (rememberedHandle) {
      return "Remembered a linked posts.json file, but this browser has not granted access yet. Publish will ask for permission when needed.";
    }

    return "Could not load posts.json automatically. Link your file once or import a copy, then publish the updated data file.";
  }

  async function publishPostsToFile() {
    const content = JSON.stringify(sortPosts(state.posts), null, 2);

    if (state.connectedFileHandle) {
      try {
        const canWrite = await ensureHandlePermission(state.connectedFileHandle, true);

        if (!canWrite) {
          showStudioMessage("Permission to write the linked file was not granted.");
          return;
        }

        const writable = await state.connectedFileHandle.createWritable();
        await writable.write(content);
        await writable.close();
        persistPreviewPosts(state.posts);
        showStudioMessage(`Published directly to ${state.connectedFileName}.`);
        updateFileConnectionStatus();
        return;
      } catch (error) {
        showStudioMessage("Could not write to the connected file. You can still download a backup.");
        return;
      }
    }

    if (supportsSaveFilePicker) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: DATA_FILE,
          types: [
            {
              description: "JSON files",
              accept: {
                "application/json": [".json"]
              }
            }
          ]
        });
        const writable = await handle.createWritable();
        await writable.write(content);
        await writable.close();
        state.connectedFileHandle = handle;
        state.connectedFileName = handle.name || DATA_FILE;
        state.importedFileName = "";
        state.fileLinkRemembered = await saveStoredFileHandle(handle);
        persistPreviewPosts(state.posts);
        showStudioMessage(`Published to ${state.connectedFileName}. Future publishing can reuse this remembered file.`);
        updateFileConnectionStatus();
        return;
      } catch (error) {
        if (error.name !== "AbortError") {
          showStudioMessage("Could not save the updated posts.json file.");
        }
        return;
      }
    }

    downloadPostsFile(state.posts);
    showStudioMessage("Direct file publishing is not available here, so a backup download was created instead.");
  }
}

function sanitizeBlock(block) {
  if (!block) {
    return null;
  }

  if (block.type === "text") {
    return {
      id: block.id || createId("text"),
      type: "text",
      content: String(block.content ?? "").trim()
    };
  }

  return {
    id: block.id || createId(block.type),
    type: block.type,
    url: String(block.url ?? "").trim(),
    caption: String(block.caption ?? "").trim()
  };
}

function blockHasContent(block) {
  if (block.type === "text") {
    return Boolean(block.content);
  }

  return Boolean(block.url);
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function createPostId(title, posts) {
  const base = slugify(title);
  const existingIds = new Set(posts.map((post) => post.id));

  if (!existingIds.has(base)) {
    return base;
  }

  let suffix = 2;

  while (existingIds.has(`${base}-${suffix}`)) {
    suffix += 1;
  }

  return `${base}-${suffix}`;
}

function openHandleDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(FILE_HANDLE_STORE.dbName, 1);

    request.onupgradeneeded = () => {
      request.result.createObjectStore(FILE_HANDLE_STORE.storeName);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error || new Error("Could not open the file handle database."));
    };
  });
}

async function saveStoredFileHandle(handle) {
  if (!handle || typeof indexedDB === "undefined") {
    return false;
  }

  try {
    const database = await openHandleDatabase();

    await new Promise((resolve, reject) => {
      const transaction = database.transaction(FILE_HANDLE_STORE.storeName, "readwrite");
      transaction.objectStore(FILE_HANDLE_STORE.storeName).put(handle, FILE_HANDLE_STORE.key);
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error || new Error("Could not store the linked file handle."));
      transaction.onabort = () => reject(transaction.error || new Error("The linked file handle storage was aborted."));
    });

    database.close();
    return true;
  } catch (error) {
    return false;
  }
}

async function loadStoredFileHandle() {
  if (typeof indexedDB === "undefined") {
    return null;
  }

  try {
    const database = await openHandleDatabase();
    const handle = await new Promise((resolve, reject) => {
      const transaction = database.transaction(FILE_HANDLE_STORE.storeName, "readonly");
      const request = transaction.objectStore(FILE_HANDLE_STORE.storeName).get(FILE_HANDLE_STORE.key);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error || new Error("Could not load the stored file handle."));
    });

    database.close();
    return handle;
  } catch (error) {
    return null;
  }
}

async function clearStoredFileHandle() {
  if (typeof indexedDB === "undefined") {
    return false;
  }

  try {
    const database = await openHandleDatabase();

    await new Promise((resolve, reject) => {
      const transaction = database.transaction(FILE_HANDLE_STORE.storeName, "readwrite");
      transaction.objectStore(FILE_HANDLE_STORE.storeName).delete(FILE_HANDLE_STORE.key);
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error || new Error("Could not clear the stored file handle."));
      transaction.onabort = () => reject(transaction.error || new Error("Clearing the stored file handle was aborted."));
    });

    database.close();
    return true;
  } catch (error) {
    return false;
  }
}

async function ensureHandlePermission(handle, writeAccess = false) {
  if (!handle?.queryPermission || !handle?.requestPermission) {
    return true;
  }

  const options = writeAccess ? { mode: "readwrite" } : {};
  const currentPermission = await handle.queryPermission(options);

  if (currentPermission === "granted") {
    return true;
  }

  const requestedPermission = await handle.requestPermission(options);
  return requestedPermission === "granted";
}

async function tryReadPostsFromHandle(handle) {
  if (!handle) {
    return {
      ok: false
    };
  }

  try {
    const hasReadPermission = handle.queryPermission
      ? (await handle.queryPermission({ mode: "read" })) === "granted"
      : true;

    if (!hasReadPermission) {
      return {
        ok: false,
        permissionRequired: true
      };
    }

    const file = await handle.getFile();
    return {
      ok: true,
      posts: normalizePosts(parseImportedPosts(await file.text()))
    };
  } catch (error) {
    return {
      ok: false,
      error
    };
  }
}

function persistPreviewPosts(posts) {
  try {
    localStorage.setItem(PREVIEW_STORAGE_KEY, JSON.stringify(sortPosts(posts)));
  } catch (error) {
    // Ignore local storage failures so publishing still works.
  }
}

function loadPreviewPosts() {
  try {
    const raw = localStorage.getItem(PREVIEW_STORAGE_KEY);

    if (!raw) {
      return null;
    }

    return normalizePosts(JSON.parse(raw));
  } catch (error) {
    return null;
  }
}

async function hashText(value) {
  const bytes = new TextEncoder().encode(String(value));
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function parseImportedPosts(text) {
  const parsed = JSON.parse(text);

  if (!Array.isArray(parsed)) {
    throw new Error("Article data must be an array.");
  }

  return parsed;
}

function downloadPostsFile(posts) {
  const blob = new Blob([JSON.stringify(sortPosts(posts), null, 2)], {
    type: "application/json"
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = DATA_FILE;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 0);
}
