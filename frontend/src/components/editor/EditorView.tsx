'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import FontFamily from '@tiptap/extension-font-family';
import Link from '@tiptap/extension-link';
import ImageExt from '@tiptap/extension-image';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import * as Y from 'yjs';
import * as awarenessProtocol from 'y-protocols/awareness';
import { useEffect, useRef } from 'react';
import { FontSize } from '@/lib/tiptap-font-size';
import { CommentMark } from '@/lib/tiptap-comment-mark';
import { Toolbar } from './Toolbar';

interface EditorViewProps {
  ydoc: Y.Doc;
  provider: { awareness: awarenessProtocol.Awareness };
  initialContent: string;
  canEdit: boolean;
  fullscreen: boolean;
  onToggleFullscreen: () => void;
  onAddComment: () => void;
  onCommentClick: (commentId: string) => void;
  onContentChange: (html: string) => void;
  onSelectionChange: (from: number, to: number, text: string) => void;
  onTyping: () => void;
}

export function EditorView({
  ydoc,
  provider,
  initialContent,
  canEdit,
  fullscreen,
  onToggleFullscreen,
  onAddComment,
  onCommentClick,
  onContentChange,
  onSelectionChange,
  onTyping,
}: EditorViewProps) {
  const hydrated = useRef(false);

  const editor = useEditor(
    {
      immediatelyRender: false,
      editable: canEdit,
      extensions: [
        StarterKit.configure({
          history: true,
        }),
        Underline,
        Highlight.configure({ multicolor: false }),
        TextStyle,
        Color,
        FontSize,
        FontFamily,
        CommentMark,
        Link.configure({ openOnClick: false, autolink: true }),
        ImageExt.configure({ inline: false }),
        Table.configure({ resizable: true }),
        TableRow,
        TableHeader,
        TableCell,
        TaskList,
        TaskItem.configure({ nested: true }),
        Placeholder.configure({ placeholder: 'Start writing, or type "/" for commands...' }),
        CharacterCount,
        Collaboration.configure({ document: ydoc }),
        CollaborationCursor.configure({
          provider,
          user: { name: 'Anonymous', color: '#6366f1' },
        }),
      ],
      editorProps: {
        attributes: {
          class: 'tiptap-content prose-slate mx-auto focus:outline-none',
        },
        handleClick: (view, pos, event) => {
          const target = event.target as HTMLElement;
          const commentEl = target.closest('[data-comment-id]') as HTMLElement | null;
          if (commentEl) {
            const commentId = commentEl.getAttribute('data-comment-id');
            if (commentId) onCommentClick(commentId);
          }
          return false;
        },
      },
      onUpdate: ({ editor }) => {
        onContentChange(editor.getHTML());
        onTyping();
      },
      onSelectionUpdate: ({ editor }) => {
        const { from, to } = editor.state.selection;
        const text = editor.state.doc.textBetween(from, to, ' ');
        onSelectionChange(from, to, text);
      },
    },
    [ydoc]
  );

  // Seed the Yjs fragment with initial DB content only once, only if the
  // fragment is empty (i.e. this is the first client to ever open the doc).
  useEffect(() => {
    if (!editor || hydrated.current) return;
    hydrated.current = true;

    const fragment = ydoc.getXmlFragment('default');
    if (fragment.length === 0 && initialContent && initialContent !== '<p></p>') {
      editor.commands.setContent(initialContent, false);
    }
  }, [editor, ydoc, initialContent]);

  useEffect(() => {
    if (editor) {
      editor.setEditable(canEdit);
    }
  }, [editor, canEdit]);

  return (
    <div className="flex h-full flex-col">
      <Toolbar
        editor={editor}
        fullscreen={fullscreen}
        onToggleFullscreen={onToggleFullscreen}
        onAddComment={onAddComment}
        canEdit={canEdit}
      />
      <div className="flex-1 overflow-y-auto px-6 py-10 sm:px-10">
        <div className="mx-auto max-w-[var(--editor-max-width)]">
          <EditorContent editor={editor} />
        </div>
      </div>
      {editor && (
        <div className="border-t border-slate-100 px-6 py-2 text-right text-xs text-slate-400 dark:border-slate-800">
          {editor.storage.characterCount.words()} words · {editor.storage.characterCount.characters()} characters
        </div>
      )}
    </div>
  );
}
