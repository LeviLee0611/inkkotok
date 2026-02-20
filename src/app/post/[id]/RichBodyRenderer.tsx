"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import { richEditorExtensions } from "@/lib/rich-editor-extensions";
import type { RichDoc } from "@/lib/rich-content";

export default function RichBodyRenderer({ content }: { content: RichDoc }) {
  const editor = useEditor({
    extensions: richEditorExtensions,
    content,
    editable: false,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "ProseMirror prose prose-zinc max-w-none min-h-[120px] rounded-2xl border border-amber-100/90 bg-white/92 px-4 py-5 text-[15px] leading-8 text-zinc-700 outline-none [&_img]:mx-auto [&_img]:max-h-[460px] [&_img]:w-auto [&_img]:max-w-full",
      },
    },
  });

  return <EditorContent editor={editor} />;
}
