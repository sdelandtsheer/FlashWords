# -*- coding: utf-8 -*-
"""
Speed-reading / recall trainer with fixation point (white dot).
- Black window + small white dot in the center (always visible).
- Wait a few seconds, play 3 beeps (1/s).
- After the last beep, flash a word for a brief time (default 100 ms), then black again.
- Entry field at bottom to type the word from memory.
- Press Enter to validate (shows green if correct, red if not).
- Press Space to go to next word (beeps + flash again).
- Press B to re-flash the SAME word immediately (no index advance).
- Press T to show the French translation of the current word (no index advance).

NOTE:
- We bind Enter and KP_Enter directly on the Entry widget for reliability.
- Space, B, and T are also bound on Entry so they trigger actions without inserting characters.
"""

import random
import sys
import tkinter as tk
from tkinter import font as tkfont

# --- YOUR WORDS GO HERE -------------------------------------------------------
WORDS = [
    "สวัสดี",   # bonjour
    "ขอบคุณ",   # merci
    "ใช่",       # oui
    "ไม่",       # non
    "ขอโทษ",    # désolé
    "ฉัน",       # je (femme)
    "ผม",        # je (homme)
    "คุณ",       # vous
    "เขา",       # il/elle
    "บ้าน",      # maison
    "โรงเรียน",  # école
    "น้ำ",       # eau
    "ข้าว",      # riz
    "หมา",       # chien
    "แมว",       # chat
    "เด็ก",      # enfant
    "รัก",       # aimer
    "ดี",        # bien
    "ร้อน",      # chaud
    "เย็น",      # froid
    "วัน",       # jour
    "คืน",       # nuit
    "หนึ่ง",     # un
    "สอง",       # deux
    "สาม",       # trois
    "สิบ",       # dix
    "อาหาร",     # nourriture
    "ตลาด",      # marché
    "เงิน",       # argent
    "รถ",        # voiture
    "มือ",       # main
    "หัวใจ",     # cœur
]

# --- TRANSLATIONS (Thai -> French) -------------------------------------------
TRANSLATIONS = {
    "สวัสดี": "bonjour",
    "ขอบคุณ": "merci",
    "ใช่": "oui",
    "ไม่": "non",
    "ขอโทษ": "désolé",
    "ฉัน": "je (femme)",
    "ผม": "je (homme)",
    "คุณ": "vous",
    "เขา": "il/elle",
    "บ้าน": "maison",
    "โรงเรียน": "école",
    "น้ำ": "eau",
    "ข้าว": "riz",
    "หมา": "chien",
    "แมว": "chat",
    "เด็ก": "enfant",
    "รัก": "aimer",
    "ดี": "bien",
    "ร้อน": "chaud",
    "เย็น": "froid",
    "วัน": "jour",
    "คืน": "nuit",
    "หนึ่ง": "un",
    "สอง": "deux",
    "สาม": "trois",
    "สิบ": "dix",
    "อาหาร": "nourriture",
    "ตลาด": "marché",
    "เงิน": "argent",
    "รถ": "voiture",
    "มือ": "main",
    "หัวใจ": "cœur",
}

# --- TIMING (milliseconds) ----------------------------------------------------
PRE_DELAY_MS = 500       # Wait before first beep
BEEP_INTERVAL_MS = 1000  # Interval between beeps
N_BEEPS = 0              # Number of beeps
FLASH_MS = 1000          # Word flash duration
TRANSLATION_MS = 2000    # How long the translation stays visible

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
        # Enter to validate
        self.entry.bind("<Return>", self.on_return)
        self.entry.bind("<KP_Enter>", self.on_return)  # numpad Enter

        # Space to next (prevent space char in entry)
        self.entry.bind("<space>", self.on_space)
        self.root.bind("<space>", self.on_space)

        # B to re-flash same word
        self.entry.bind("<KeyPress-b>", self.on_b)
        self.entry.bind("<KeyPress-B>", self.on_b)
        self.root.bind("<KeyPress-b>", self.on_b)
        self.root.bind("<KeyPress-B>", self.on_b)

        # T to show French translation
        self.entry.bind("<KeyPress-t>", self.on_t)
        self.entry.bind("<KeyPress-T>", self.on_t)
        self.root.bind("<KeyPress-t>", self.on_t)
        self.root.bind("<KeyPress-T>", self.on_t)

        # Internal scheduling state
        self._scheduled = []
        self._trial_active = False
        self._trans_sid = None  # hide-translation timer id

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

        # Also clear any pending translation hide
        if self._trans_sid is not None:
            try:
                self.root.after_cancel(self._trans_sid)
            except Exception:
                pass
            self._trans_sid = None

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

    def on_b(self, event=None):
        """Re-flash the SAME word immediately, without advancing the index."""
        if not self.current_word:
            return "break"

        # Cancel any pending scheduled callbacks (beeps/hide/queued flash)
        for sid in self._scheduled:
            try:
                self.root.after_cancel(sid)
            except Exception:
                pass
        self._scheduled.clear()

        # Show the same word again now and re-arm hide
        self.word_var.set(self.current_word)
        self._trial_active = True  # still same trial
        self._scheduled.append(self.root.after(FLASH_MS, self.hide_word))

        return "break"  # don't insert 'b' into the Entry

    def on_t(self, event=None):
        """Show French translation of the current word for TRANSLATION_MS."""
        if not self.current_word:
            return "break"

        # Cancel previous translation hide if any
        if self._trans_sid is not None:
            try:
                self.root.after_cancel(self._trans_sid)
            except Exception:
                pass
            self._trans_sid = None

        trans = TRANSLATIONS.get(self.current_word, "—")
        self.feedback_var.set(f"FR: {trans}")
        self.feedback_label.config(fg="#FFD600")  # yellow/amber

        # Auto-hide translation after a short delay
        self._trans_sid = self.root.after(TRANSLATION_MS, self._hide_translation)
        return "break"

    def _hide_translation(self):
        """Clear translation line and restore default color."""
        self.feedback_var.set("")
        self.feedback_label.config(fg="white")
        self._trans_sid = None


root = tk.Tk()
root.geometry("900x600")
root.configure(bg="black")
App(root)
root.mainloop()
