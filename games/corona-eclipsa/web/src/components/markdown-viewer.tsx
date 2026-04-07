import Link from "next/link";
import type { MouseEvent } from "react";
import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { resolveMarkdownLink, slugifyHeading } from "@/lib/markdown-links";

type MarkdownViewerProps = {
  currentFile: string;
  markdown: string;
};

export function MarkdownViewer({ currentFile, markdown }: MarkdownViewerProps) {
  const headingIdsByLine = useMemo(() => extractHeadingIdsByLine(markdown), [markdown]);

  function getHeadingId(node?: { position?: { start?: { line?: number } } }) {
    const line = node?.position?.start?.line;
    if (!line) {
      return undefined;
    }

    return headingIdsByLine.get(line);
  }

  function getLineId(node?: { position?: { start?: { line?: number } } }) {
    const line = node?.position?.start?.line;
    if (!line) {
      return undefined;
    }

    return `line-${line}`;
  }

  function openLookup(term: string, event: MouseEvent<HTMLButtonElement>) {
    const query = term.trim();
    if (!query) {
      return;
    }

    window.dispatchEvent(
      new CustomEvent("corona-eclipsa-search", {
        detail: {
          query,
          x: event.clientX,
          y: event.clientY,
        },
      }),
    );
  }

  return (
    <div className="max-w-none text-[1.02rem] leading-8 text-stone-800">
      <ReactMarkdown
        components={{
          a({ children, href = "" }) {
            const resolved = resolveMarkdownLink(currentFile, href);
            const isInternal = resolved.startsWith("/?file=");

            if (isInternal) {
              return (
                <Link className="font-medium text-amber-800 no-underline hover:text-amber-600 hover:underline" href={resolved}>
                  {children}
                </Link>
              );
            }

            return (
              <a
                className="font-medium text-amber-800 no-underline hover:text-amber-600 hover:underline"
                href={href}
                rel="noreferrer"
                target={href.startsWith("http") ? "_blank" : undefined}
              >
                {children}
              </a>
            );
          },
          h1({ children, node }) {
            const id = getHeadingId(node);
            return (
              <div
                className="mb-10 scroll-mt-24 border-b border-stone-300 pb-5"
                id={id}
              >
                <h1 className="text-4xl font-semibold tracking-tight text-stone-950">
                  {children}
                </h1>
              </div>
            );
          },
          h2({ children, node }) {
            const id = getHeadingId(node);
            return (
              <div
                className="mt-12 mb-5 scroll-mt-24 border-t border-amber-700/30 pt-5"
                id={id}
              >
                <h2 className="text-2xl font-semibold tracking-tight text-stone-950">
                  {children}
                </h2>
              </div>
            );
          },
          h3({ children, node }) {
            const id = getHeadingId(node);
            return (
              <h3
                className="mt-8 mb-3 scroll-mt-24 text-xl font-semibold text-stone-900"
                id={id}
              >
                {children}
              </h3>
            );
          },
          p({ children, node }) {
            return (
              <p className="my-4 leading-8 text-stone-800" id={getLineId(node)}>
                {children}
              </p>
            );
          },
          ul({ children, node }) {
            return (
              <ul className="my-4 space-y-2 pl-5" id={getLineId(node)}>
                {children}
              </ul>
            );
          },
          ol({ children, node }) {
            return (
              <ol className="my-4 space-y-2 pl-5" id={getLineId(node)}>
                {children}
              </ol>
            );
          },
          li({ children, node }) {
            return (
              <li className="pl-1 marker:text-amber-700" id={getLineId(node)}>
                {children}
              </li>
            );
          },
          hr() {
            return <hr className="my-8 border-stone-300" />;
          },
          blockquote({ children, node }) {
            return (
              <blockquote
                className="my-6 border-l-4 border-amber-700 bg-amber-50/70 px-4 py-3 italic text-stone-700"
                id={getLineId(node)}
              >
                {children}
              </blockquote>
            );
          },
          table({ children, node }) {
            return (
              <div
                className="my-6 overflow-x-auto rounded-2xl border border-stone-300 bg-white shadow-sm"
                id={getLineId(node)}
              >
                <table className="min-w-full border-collapse text-sm">
                  {children}
                </table>
              </div>
            );
          },
          thead({ children }) {
            return <thead className="bg-stone-900 text-stone-100">{children}</thead>;
          },
          th({ children }) {
            return <th className="px-4 py-3 text-left font-semibold">{children}</th>;
          },
          td({ children }) {
            return <td className="border-t border-stone-200 px-4 py-3 align-top">{children}</td>;
          },
          code({ children, className }) {
            const content = String(children).replace(/\n$/, "");
            const isInline = !className && !content.includes("\n");

            if (!isInline) {
              return (
                <code className={className}>
                  {children}
                </code>
              );
            }

            return (
              <button
                className="cursor-pointer rounded-md bg-amber-100 px-1.5 py-0.5 text-[0.92em] text-amber-900 transition hover:bg-amber-200"
                onClick={(event) => openLookup(content, event)}
                type="button"
              >
                <code>{children}</code>
              </button>
            );
          },
          pre({ children, node }) {
            return (
              <pre
                className="my-6 overflow-x-auto rounded-2xl bg-stone-900 p-4 text-sm leading-7 text-stone-100 shadow-lg"
                id={getLineId(node)}
              >
                {children}
              </pre>
            );
          },
        }}
        remarkPlugins={[remarkGfm]}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}

function extractHeadingIdsByLine(markdown: string) {
  const matches = markdown.matchAll(/^(#{1,6})\s+(.+)$/gm);
  const seen = new Map<string, number>();
  const ids = new Map<number, string>();

  for (const match of matches) {
    const depth = match[1].length;
    if (depth < 1 || depth > 3) {
      continue;
    }

    const text = match[2].trim();
    const baseId = slugifyHeading(text);
    const count = seen.get(baseId) ?? 0;
    seen.set(baseId, count + 1);

    const id = count === 0 ? baseId : `${baseId}-${count + 1}`;
    const line = markdown.slice(0, match.index ?? 0).split("\n").length;
    ids.set(line, id);
  }

  return ids;
}
