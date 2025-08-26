// notes.js

// Sample notes data
const notes = [
    {
        title: "Data Structures Basics",
        subject: "cs",
        type: "digital",
        rating: 5,
        author: "Shalin",
        pdf: "notes/data-structures.pdf"
    },
    {
        title: "Calculus Summary",
        subject: "math",
        type: "summary",
        rating: 4,
        author: "Shital",
        pdf: "notes/calculus.pdf"
    },
    {
        title: "Physics Handwritten Notes",
        subject: "physics",
        type: "handwritten",
        rating: 3,
        author: "Prashant",
        pdf: "notes/physics.pdf"
    }
];

const notesGrid = document.getElementById("notes-grid");
const totalNotesEl = document.getElementById("total-notes");
const filteredNotesEl = document.getElementById("filtered-notes");
const noNotesEl = document.getElementById("no-notes");

const searchInput = document.getElementById("note-search");
const searchBtn = document.getElementById("search-btn");
const subjectFilter = document.getElementById("subject-filter");
const typeFilter = document.getElementById("type-filter");
const ratingFilter = document.getElementById("rating-filter");

// Modal
const modal = document.getElementById("note-modal");
const modalTitle = document.getElementById("note-modal-title");
const modalBody = document.getElementById("note-modal-body");
const closeModalBtn = document.querySelector(".close-modal");

// Render notes
function renderNotes(filteredNotes) {
    notesGrid.innerHTML = "";
    if (filteredNotes.length === 0) {
        noNotesEl.style.display = "block";
    } else {
        noNotesEl.style.display = "none";
        filteredNotes.forEach(note => {
            const card = document.createElement("div");
            card.classList.add("note-card");

            card.innerHTML = `
                <h3>${note.title}</h3>
                <p><b>Subject:</b> ${note.subject}</p>
                <p><b>Type:</b> ${note.type}</p>
                <p><b>Author:</b> ${note.author}</p>
                <p><b>Rating:</b> ${"⭐".repeat(note.rating)}</p>
                <button class="open-note">Open PDF</button>
            `;

            // Open PDF in modal
            card.querySelector(".open-note").addEventListener("click", () => {
                modal.style.display = "block";
                modalTitle.textContent = note.title;
                modalBody.innerHTML = `
                    <iframe src="${note.pdf}" width="100%" height="500px"></iframe>
                    <a href="${note.pdf}" download class="download-btn">Download PDF</a>
                `;
            });

            notesGrid.appendChild(card);
        });
    }

    totalNotesEl.textContent = notes.length;
    filteredNotesEl.textContent = filteredNotes.length;
}

// Filter function
function applyFilters() {
    const query = searchInput.value.toLowerCase();
    const subjectVal = subjectFilter.value;
    const typeVal = typeFilter.value;
    const ratingVal = ratingFilter.value;

    const filtered = notes.filter(note => {
        const matchesSearch = 
            note.title.toLowerCase().includes(query) ||
            note.subject.toLowerCase().includes(query) ||
            note.author.toLowerCase().includes(query);

        const matchesSubject = subjectVal === "all" || note.subject === subjectVal;
        const matchesType = typeVal === "all" || note.type === typeVal;
        const matchesRating = ratingVal === "all" || note.rating >= parseInt(ratingVal);

        return matchesSearch && matchesSubject && matchesType && matchesRating;
    });

    renderNotes(filtered);
}

// Event listeners
searchBtn.addEventListener("click", applyFilters);
searchInput.addEventListener("keyup", applyFilters);
subjectFilter.addEventListener("change", applyFilters);
typeFilter.addEventListener("change", applyFilters);
ratingFilter.addEventListener("change", applyFilters);

// Modal close
closeModalBtn.addEventListener("click", () => {
    modal.style.display = "none";
});

// Initial render
renderNotes(notes);
