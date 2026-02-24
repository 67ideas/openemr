import { tool } from "ai";
import { z } from "zod";

const BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/";

export type PubMedArticle = {
  pmid: string;
  title: string;
  abstract: string;
};

export type PubMedSearchResult = {
  articles: PubMedArticle[];
  total: number;
  source: "PubMed";
  error?: string;
};

export const pubmedSearchTool = tool({
  description:
    "Search PubMed biomedical literature using E-utilities. Supports Boolean operators (AND, OR, NOT), field tags like [mh] for MeSH, [tiab] for title/abstract, [pt] for publication type, and [dp] for date. Returns article titles and abstracts.",
  inputSchema: z.object({
    query: z
      .string()
      .describe(
        "PubMed query string. Supports field tags e.g. 'diabetes[tiab] AND 2024[dp]'"
      ),
    maxResults: z
      .number()
      .optional()
      .describe("Maximum number of articles to return (default 5, max 20)"),
  }),
  execute: async ({ query, maxResults = 5 }): Promise<PubMedSearchResult> => {
    const apiKey = process.env.PUBMED_API_KEY;
    const limit = Math.min(maxResults, 20);

    try {
      const searchParams = new URLSearchParams({
        db: "pubmed",
        term: query,
        retmax: String(limit),
        retmode: "json",
        usehistory: "y",
        ...(apiKey ? { api_key: apiKey } : {}),
      });

      const searchRes = await fetch(`${BASE}esearch.fcgi?${searchParams}`);
      if (!searchRes.ok) {
        throw new Error(`ESearch error: ${searchRes.status}`);
      }

      const searchData = (await searchRes.json()) as {
        esearchresult: {
          count: string;
          idlist: string[];
          querykey: string;
          webenv: string;
        };
      };

      const { count, idlist, querykey, webenv } =
        searchData.esearchresult;

      if (idlist.length === 0) {
        return { articles: [], total: Number(count), source: "PubMed" };
      }

      const fetchParams = new URLSearchParams({
        db: "pubmed",
        query_key: querykey,
        WebEnv: webenv,
        rettype: "abstract",
        retmode: "xml",
        retmax: String(limit),
        ...(apiKey ? { api_key: apiKey } : {}),
      });

      const fetchRes = await fetch(`${BASE}efetch.fcgi?${fetchParams}`);
      if (!fetchRes.ok) {
        throw new Error(`EFetch error: ${fetchRes.status}`);
      }

      const xml = await fetchRes.text();

      const articles: PubMedArticle[] = idlist.map((pmid) => {
        const articleBlock = extractBetween(
          xml,
          `<PMID Version="1">${pmid}</PMID>`,
          "</PubmedArticle>"
        );

        const title = stripTags(
          extractBetween(articleBlock, "<ArticleTitle>", "</ArticleTitle>")
        );

        const abstract = stripTags(
          extractBetween(articleBlock, "<AbstractText>", "</AbstractText>")
        );

        return { pmid, title: title || "(no title)", abstract: abstract || "(no abstract)" };
      });

      return { articles, total: Number(count), source: "PubMed" };
    } catch (err) {
      return {
        articles: [],
        total: 0,
        source: "PubMed",
        error: err instanceof Error ? err.message : "Unknown error",
      };
    }
  },
});

function extractBetween(text: string, open: string, close: string): string {
  const start = text.indexOf(open);
  if (start === -1) return "";
  const contentStart = start + open.length;
  const end = text.indexOf(close, contentStart);
  if (end === -1) return text.slice(contentStart);
  return text.slice(contentStart, end);
}

function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}
