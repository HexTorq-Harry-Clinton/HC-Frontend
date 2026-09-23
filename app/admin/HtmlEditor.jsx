"use client";

import { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";

// Shared free rich-text editor (TipTap, MIT) for admin HTML fields:
// bold / italic / underline / link / lists + raw-HTML source toggle.
// Props: value (HTML string), onChange(html), placeholder, minHeight.
export default function HtmlEditor({ value, onChange, placeholder, minHeight = 120 }) {
  const [sourceMode, setSourceMode] = useState(false);
  const [source, setSource] = useState(value || "");
  // Tracks the last value WE emitted, so parent echoes don't reset the doc —
  // but a genuinely new external value (another row's prefill) does.
  const lastEmitted = useRef(value || "");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [3, 4] },
      }),
      Underline,
      Link.configure({ openOnClick: false, autolink: true }),
    ],
    content: value || "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "tiptap-body",
        placeholder: placeholder || "",
      },
    },
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML();
      lastEmitted.current = html;
      setSource(html);
      onChange?.(html);
    },
  });

  // External value resets (edit-popup prefill) replace the doc.
  useEffect(() => {
    if (!editor) return;
    const next = value || "";
    if (next !== lastEmitted.current) {
      lastEmitted.current = next;
      editor.commands.setContent(next, { emitUpdate: false });
      setSource(next);
    }
  }, [editor, value]);

  if (!editor) {
    return <div className=" border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-400" style={{ minHeight }}>Loading editor…</div>;
  }

  const btn = (active) =>
    `flex h-8 w-8 items-center justify-center  text-sm transition-colors ${
      active ? "bg-neutral-950 text-gold" : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950"
    }`;

  const setLink = () => {
    const prev = editor.getAttributes("link").href || "";
    const url = window.prompt("Link URL (https://… — empty removes the link)", prev);
    if (url === null) return;
    if (!url) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().setLink({ href: url }).run();
  };

  return (
    <div className="overflow-hidden  border border-neutral-300 bg-white shadow-sm focus-within:border-gold focus-within:ring-2 focus-within:ring-gold/25">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-neutral-200 bg-neutral-50 px-2 py-1.5">
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} title="Bold" className={btn(editor.isActive("bold"))}>
          <i className="bi bi-type-bold" />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic" className={btn(editor.isActive("italic"))}>
          <i className="bi bi-type-italic" />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline" className={btn(editor.isActive("underline"))}>
          <i className="bi bi-type-underline" />
        </button>
        <button type="button" onClick={setLink} title="Link" className={btn(editor.isActive("link"))}>
          <i className="bi bi-link-45deg" />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullets" className={btn(editor.isActive("bulletList"))}>
          <i className="bi bi-list-ul" />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Numbers" className={btn(editor.isActive("orderedList"))}>
          <i className="bi bi-list-ol" />
        </button>
        <button type="button" onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} title="Clear formatting" className={btn(false)}>
          <i className="bi bi-eraser" />
        </button>
        <span className="flex-1" />
        <button
          type="button"
          onClick={() => {
            if (!sourceMode) setSource(editor.getHTML());
            else editor.commands.setContent(source || "", { emitUpdate: false });
            setSourceMode((v) => !v);
          }}
          title="Toggle HTML source"
          className={`flex h-8 items-center gap-1  px-2 text-[11px] font-bold uppercase tracking-wider transition-colors ${
            sourceMode ? "bg-neutral-950 text-gold" : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950"
          }`}
        >
          <i className="bi bi-code-slash" /> HTML
        </button>
      </div>
      {sourceMode ? (
        <textarea
          value={source}
          onChange={(e) => {
            lastEmitted.current = e.target.value;
            setSource(e.target.value);
            onChange?.(e.target.value);
          }}
          rows={5}
          spellCheck={false}
          placeholder="<strong>Raw HTML…</strong>"
          className="w-full bg-neutral-950 px-3 py-2 font-mono text-xs text-green-300 focus:outline-none"
        />
      ) : (
        <EditorContent editor={editor} />
      )}
      <style jsx>{`
        .tiptap-body { min-height: ${minHeight}px; padding: 0.6rem 0.75rem; font-size: 0.875rem; color: #171717; }
        .tiptap-body:focus { outline: none; }
        .tiptap-body p { margin: 0 0 0.4em; }
        .tiptap-body ul, .tiptap-body ol { padding-left: 1.25rem; margin: 0 0 0.4em; }
        .tiptap-body a { color: #a8823f; text-decoration: underline; }
      `}</style>
    </div>
  );
}
