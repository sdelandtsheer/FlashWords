# -*- coding: utf-8 -*-
"""
Speed-reading / recall trainer with fixation point (white dot).
- Black window + small white dot in the center (always visible).
- Wait a few seconds, play 3 beeps (1/s).
- After the last beep, flash a word for a brief time (default 100 ms), then black again.
- Entry field at bottom to type the word from memory.
- Press Enter to validate (shows green if correct, red if not).
- Press Space to go to next word (beeps + flash again).

NOTE:
- We bind Enter and KP_Enter directly on the Entry widget for reliability.
- Space is also bound on Entry so it triggers "next" without inserting a space.
"""

import random
import sys
import tkinter as tk
from tkinter import font as tkfont

# --- YOUR WORDS GO HERE -------------------------------------------------------
WORDS = [
    "comme", "son", "que", "était", "pour", "sur", "sont", "avec",
    "ils", "être", "un", "avoir", "ce", "à partir de", "par", "chaud",
    "mot", "mais", "que", "certains", "est", "il", "vous", "ou", "eu", "la",
    "de", "à", "et", "un", "dans", "nous", "boîte", "dehors", "autre",
    "étaient", "qui", "faire", "leur", "temps", "si", "volonté", "comment",
    "dit", "un an", "chaque", "dire", "ne", "ensemble", "trois", "vouloir",
    "air", "bien", "aussi", "jouer", "petit", "fin", "mettre", "maison",
    "lire", "main", "port", "grand", "épeler", "ajouter", "même", "terre",
    "ici", "il faut", "grand", "haut", "tel", "suivre", "acte", "pourquoi",
    "interroger", "hommes", "changement", "est allé", "lumière", "genre", "besoin",
    "maison", "image", "essayer", "nous", "encore", "animal",
    "point", "mère", "monde", "près de", "construire", "soi", "terre", "père",
    "tout", "nouveau", "travail", "partie", "prendre", "obtenir", "lieu",
    "fabriqué", "vivre", "où", "après", "arrière", "peu", "seulement", "tour",
    "homme", "année", "est venu", "montrer", "tous", "bon", "moi", "donner",
    "notre", "sous", "nom", "très", "par", "juste", "forme", "phrase", "grand",
    "penser", "dire", "aider", "faible", "ligne", "différer", "tour", "cause",
    "beaucoup", "signifier", "avant", "déménagement", "droit", "garçon",
    "vieux", "trop", "même", "elle", "tous", "là", "quand", "jusqu’à",
    "utiliser", "votre", "manière", "sur", "beaucoup", "puis", "les", "écrire",
    "voudrais", "comme", "si", "ces", "son", "long", "faire", "chose", "voir",
    "lui", "deux", "regarder", "plus", "jour", "pourrait", "aller",
    "venir", "fait", "nombre", "son", "aucun", "plus", "personnes",
    "sur", "savoir", "eau", "que", "appel", "première", "qui", "peut",
    "vers le bas", "côté", "été", "maintenant", "trouver", "tête", "support",
    "propre", "page", "devrait", "pays", "trouvé", "réponse", "école", "croître",
    "étude", "encore", "apprendre", "plante", "couvrir", "nourriture", "soleil",
    "quatre", "entre", "état", "garder", "œil", "jamais", "dernier", "laisser",
    "pensée", "ville", "arbre", "traverser", "ferme", "dur", "début", "puissance",
    "histoire", "scie", "loin", "mer", "tirer", "gauche", "tard", "courir",
    "ne pas", "alors", "pendant", "presse", "fermer", "nuit", "réel", "vie",
    "peu", "nord", "livre", "porter", "a pris", "science", "manger", "chambre",
    "ami", "a commencé", "idée", "poisson", "montagne", "arrêter", "une fois",
    "base", "entendre", "cheval", "couper", "sûr", "regarder", "couleur",
    "face", "bois", "principal", "ouvert", "semble", "ensemble", "prochain",
    "blanc", "enfants", "commencer", "marcher", "exemple", "facilité",
    "papier", "groupe", "toujours", "musique", "ceux", "tous les deux",
    "marque", "souvent", "lettre", "jusqu’à", "mile", "rivière", "voiture",
    "pieds", "soins", "deuxième", "assez", "plaine", "fille", "habituel"
]

# --- TIMING (milliseconds) ----------------------------------------------------
PRE_DELAY_MS = 500      # Wait before first beep
BEEP_INTERVAL_MS = 1000  # Interval between beeps
N_BEEPS = 0              # Number of beeps
FLASH_MS = 50           # Word flash duration

# --- BEHAVIOR -----------------------------------------------------------------
SHUFFLE = True
CASE_SENSITIVE = False


class App:
    def __init__(self, root):
        self.root = root
        self.root.title("Speed Reader")
        self.root.configure(bg="black")

        # Prepare word list / index
        self.words = list(WORDS)
        if SHUFFLE:
            random.shuffle(self.words)
        self.index = 0
        self.current_word = None

        # --- Main container ---
        self.container = tk.Frame(self.root, bg="black")
        self.container.pack(fill="both", expand=True)

        # --- FIXATION DOT LAYER ---
        self.dot_canvas = tk.Canvas(self.container, bg="black", highlightthickness=0)
        self.dot_canvas.pack(fill="both", expand=True)
        self.dot_canvas.bind("<Configure>", self._draw_dot)

        # --- WORD LABEL (on top of canvas, slightly above dot to keep dot visible) ---
        self.big_font = tkfont.Font(family="Helvetica", size=64, weight="bold")
        self.word_var = tk.StringVar(value="")
        self.word_label = tk.Label(
            self.dot_canvas,
            textvariable=self.word_var,
            bg="black",
            fg="white",
            font=self.big_font,
        )
        # Slightly above true center so the dot remains visible below the word
        self.word_label.place(relx=0.5, rely=0.45, anchor="center")

        # --- FEEDBACK + ENTRY ---
        self.feedback_var = tk.StringVar(value="")
        self.feedback_label = tk.Label(
            self.container,
            textvariable=self.feedback_var,
            bg="black",
            fg="white",
            font=("Helvetica", 18, "bold"),
        )
        self.feedback_label.pack(side="bottom", anchor="w", padx=12, pady=(0, 6))

        self.entry = tk.Entry(
            self.container,
            bg="black",
            fg="white",
            insertbackground="white",  # visible caret on black
            font=("Helvetica", 20),
        )
        self.entry.pack(side="bottom", fill="x", padx=12, pady=12)
        self.entry.focus_set()

        # --- KEY BINDINGS ---
        # Bind Enter to the entry widget (reliable across platforms)
        self.entry.bind("<Return>", self.on_return)
        self.entry.bind("<KP_Enter>", self.on_return)  # numpad Enter
        # Bind Space on entry so it doesn't insert a space
        self.entry.bind("<space>", self.on_space)

        # Also bind space globally for completeness (e.g., when entry loses focus)
        self.root.bind("<space>", self.on_space)

        # Internal scheduling state
        self._scheduled = []
        self._trial_active = False

        # Start the first trial
        self.start_trial()

    # ------------------------- Drawing / UI helpers ----------------------------
    def _draw_dot(self, event=None):
        """Draw a small white dot in the center of the canvas (fixation point)."""
        self.dot_canvas.delete("dot")
        w = self.dot_canvas.winfo_width()
        h = self.dot_canvas.winfo_height()
        r = 3  # radius of the dot
        self.dot_canvas.create_oval(
            w / 2 - r, h / 2 - r, w / 2 + r, h / 2 + r,
            fill="white", outline="white", tags="dot"
        )

    def clear_ui(self):
        """Reset visuals: hide word, clear feedback and entry."""
        self.word_var.set("")
        self.feedback_var.set("")
        self.feedback_label.config(fg="white")
        self.entry.delete(0, "end")

    # ------------------------- Trial lifecycle ---------------------------------
    def start_trial(self):
        """Prepare and schedule the beep + flash routine for the current word."""
        if self.index >= len(self.words):
            self.index = 0
        self.current_word = self.words[self.index]
        self._trial_active = True
        self.clear_ui()

        # Schedule N beeps one second apart, starting after PRE_DELAY_MS
        t0 = PRE_DELAY_MS
        for i in range(N_BEEPS):
            self._scheduled.append(
                self.root.after(t0 + i * BEEP_INTERVAL_MS, self.beep)
            )

        # Schedule the flash after the last beep
        flash_time = t0 + N_BEEPS * BEEP_INTERVAL_MS
        self._scheduled.append(self.root.after(flash_time, self.flash_word))

    def end_trial(self):
        """Stop any pending timers and advance the index."""
        for sid in self._scheduled:
            try:
                self.root.after_cancel(sid)
            except Exception:
                pass
        self._scheduled.clear()
        self._trial_active = False
        self.index += 1

    # ------------------------- Beep / flash logic ------------------------------
    def beep(self):
        """Play a short beep (best effort, cross-platform)."""
        try:
            import winsound  # Windows
            winsound.Beep(800, 200)
            return
        except Exception:
            pass

        try:
            self.root.bell()  # macOS/Linux if system bell enabled
            return
        except Exception:
            pass

        try:
            sys.stdout.write("\a")  # fallback ASCII bell
            sys.stdout.flush()
        except Exception:
            pass

    def flash_word(self):
        """Show the current word briefly, then hide it again."""
        self.word_var.set(self.current_word)
        self._scheduled.append(self.root.after(FLASH_MS, self.hide_word))

    def hide_word(self):
        """Hide the flashed word (back to black screen; dot still visible)."""
        self.word_var.set("")

    # ------------------------- User interactions -------------------------------
    def on_return(self, event=None):
        """Validate typed answer; show green/red feedback; stop current trial."""
        typed = self.entry.get().strip()
        target = self.current_word or ""  # guard if pressed too early

        correct = (
            typed == target if CASE_SENSITIVE else typed.lower() == target.lower()
        )

        if correct:
            self.feedback_var.set(f"✓ {target}")
            self.feedback_label.config(fg="#00C853")  # green
        else:
            # Show what was typed and the correct target
            self.feedback_var.set(f"✗ {typed}    →    {target}")
            self.feedback_label.config(fg="#FF1744")  # red

        self.end_trial()
        return "break"  # prevent any default Entry behavior pinging

    def on_space(self, event=None):
        """Move to next word immediately (even mid-beeps/flash)."""
        if self._trial_active:
            self.end_trial()
        self.start_trial()
        return "break"  # avoid inserting a space into the Entry


root = tk.Tk()
root.geometry("900x600")
root.configure(bg="black")
App(root)
root.mainloop()

