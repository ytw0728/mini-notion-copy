import Prism from 'prismjs';
import React, {
  useState, useCallback, useMemo, FC,
} from 'react';
import {
  Slate, Editable, withReact, RenderLeafProps,
} from 'slate-react';
import {
  Text, createEditor, Descendant, NodeEntry, BaseRange, Node,
} from 'slate';
import { withHistory } from 'slate-history';
import { css } from '@emotion/css';
import { CustomText } from 'type-declares/slate';

// eslint-disable-next-line
Prism.languages.markdown = Prism.languages.extend('markup', {});
Prism.languages.insertBefore('markdown', 'prolog', {
  blockquote: { pattern: /^>(?:[\t ]*>)*/m, alias: 'punctuation' },
  code: [{ pattern: /^(?: {4}|\t).+/m, alias: 'keyword' }, { pattern: /``.+?``|`[^`\n]+`/, alias: 'keyword' }],
  title: [{ pattern: /\w+.*(?:\r?\n|\r)(?:==+|--+)/, alias: 'important', inside: { punctuation: /==+$|--+$/ } }, {
    pattern: /(^\s*)#+.+/m, lookbehind: !0, alias: 'important', inside: { punctuation: /^#+|#+$/ },
  }],
  hr: { pattern: /(^\s*)([*-])([\t ]*\2){2,}(?=\s*$)/m, lookbehind: !0, alias: 'punctuation' },
  list: { pattern: /(^\s*)(?:[*+-]|\d+\.)(?=[\t ].)/m, lookbehind: !0, alias: 'punctuation' },
  'url-reference': { pattern: /!?\[[^\]]+\]:[\t ]+(?:\S+|<(?:\\.|[^>\\])+>)(?:[\t ]+(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\((?:\\.|[^)\\])*\)))?/, inside: { variable: { pattern: /^(!?\[)[^\]]+/, lookbehind: !0 }, string: /(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\((?:\\.|[^)\\])*\))$/, punctuation: /^[[\]!:]|[<>]/ }, alias: 'url' },
  bold: { pattern: /(^|[^\\])(\*\*|__)(?:(?:\r?\n|\r)(?!\r?\n|\r)|.)+?\2/, lookbehind: !0, inside: { punctuation: /^\*\*|^__|\*\*$|__$/ } },
  italic: { pattern: /(^|[^\\])([*_])(?:(?:\r?\n|\r)(?!\r?\n|\r)|.)+?\2/, lookbehind: !0, inside: { punctuation: /^[*_]|[*_]$/ } },
  url: { pattern: /!?\[[^\]]+\](?:\([^\s)]+(?:[\t ]+"(?:\\.|[^"\\])*")?\)| ?\[[^\]\n]*\])/, inside: { variable: { pattern: /(!?\[)[^\]]+(?=\]$)/, lookbehind: !0 }, string: { pattern: /"(?:\\.|[^"\\])*"(?=\)$)/ } } },
});
// eslint-disable-next-line
(Prism.languages.markdown as any).bold.inside.url = Prism.util.clone(Prism.languages.markdown.url);
// eslint-disable-next-line
(Prism.languages.markdown as any).italic.inside.url = Prism.util.clone(Prism.languages.markdown.url);
// eslint-disable-next-line
(Prism.languages.markdown as any).bold.inside.italic = Prism.util.clone(Prism.languages.markdown.italic);
// eslint-disable-next-line
(Prism.languages.markdown as any).italic.inside.bold = Prism.util.clone(Prism.languages.markdown.bold);

const CustomMarkdownEditor: FC = () => {
  const [value, setValue] = useState<Descendant[]>(initialValue);
  const renderLeaf = useCallback((props) => <Leaf {...props} />, []);
  const editor = useMemo(() => withHistory(withReact(createEditor())), []);
  const decorate = useCallback(([node, path]: NodeEntry<Node>): BaseRange[] => {
    const ranges: BaseRange[] = [];

    if (!Text.isText(node)) {
      return ranges;
    }

    const getLength = (token: Prism.Token | string): number => {
      if (typeof token === 'string') {
        return token.length;
      } if (typeof token.content === 'string') {
        return token.content.length;
      }
      return (token.content as Array<string | Prism.Token>).reduce((l, t) => l + getLength(t), 0);
    };

    const tokens = Prism.tokenize(node.text, Prism.languages.markdown);
    let start = 0;

    Object.values(tokens).forEach((token) => {
      const length = getLength(token);
      const end = start + length;

      if (typeof token !== 'string') {
        ranges.push({
          [token.type]: true,
          anchor: { path, offset: start },
          focus: { path, offset: end },
        });
      }

      start = end;
    });

    return ranges;
  }, []);

  return (
    <div style={{
      width: '100%', height: '500px', boxSizing: 'border-box', padding: 10, border: '1px solid black',
    }}
    >
      <Slate editor={editor} value={value} onChange={(v) => setValue(v)}>
        <Editable
          decorate={decorate}
          renderLeaf={renderLeaf}
          placeholder="Write some markdown..."
        />
      </Slate>
    </div>
  );
};

const Leaf = ({ attributes, children, leaf }: RenderLeafProps) => {
  const contentLeaf = leaf as CustomText;
  return (
    <span
      {...attributes}
      className={css`
          font-weight: ${contentLeaf.bold && 'bold'};
          font-style: ${contentLeaf.italic && 'italic'};
          text-decoration: ${contentLeaf.underlined && 'underline'};
          ${contentLeaf.title
            && css`
              display: inline-block;
              font-weight: bold;
              font-size: 20px;
              margin: 20px 0 10px 0;
            `}
          ${contentLeaf.list
            && css`
              padding-left: 10px;
              font-size: 20px;
              line-height: 10px;
            `}
          ${contentLeaf.hr
            && css`
              display: block;
              text-align: center;
              border-bottom: 2px solid #ddd;
            `}
          ${contentLeaf.blockquote
            && css`
              display: inline-block;
              border-left: 2px solid #ddd;
              padding-left: 10px;
              color: #aaa;
              font-style: italic;
            `}
          ${contentLeaf.code
            && css`
              font-family: monospace;
              background-color: #eee;
              padding: 3px;
            `}
        `}
    >
      {children}
    </span>
  );
};

const initialValue: Descendant[] = [
  {
    type: 'paragraph',
    children: [
      {
        text:
          'Slate is flexible enough to add **decorations** that can format text based on its content. For example, this editor has **Markdown** preview decorations on it, to make it _dead_ simple to make an editor with built-in Markdown previewing.',
      },
    ],
  },
  {
    type: 'paragraph',
    children: [{ text: '## Try it out!' }],
  },
  {
    type: 'paragraph',
    children: [{ text: 'Try it out for yourself!' }],
  },
];

export default CustomMarkdownEditor;
