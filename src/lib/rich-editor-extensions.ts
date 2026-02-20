import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import { Color, TextStyle } from "@tiptap/extension-text-style";
import Underline from "@tiptap/extension-underline";
import StarterKit from "@tiptap/starter-kit";

export const RichImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: "100%",
        parseHTML: (element) => {
          const width = (element as HTMLElement).style.width;
          return width && width.trim() ? width : "100%";
        },
        renderHTML: (attributes) => {
          const width =
            typeof attributes.width === "string" && attributes.width.trim()
              ? attributes.width
              : "100%";
          return {
            style: `width:${width};height:auto;display:block;`,
          };
        },
      },
    };
  },
});

export const richEditorExtensions = [
  StarterKit.configure({
    heading: { levels: [1, 2, 3] },
  }),
  Underline,
  TextStyle,
  Color,
  TextAlign.configure({ types: ["heading", "paragraph"] }),
  Link.configure({
    openOnClick: false,
    autolink: true,
    defaultProtocol: "https",
  }),
  RichImage.configure({
    inline: false,
    allowBase64: false,
  }),
];
