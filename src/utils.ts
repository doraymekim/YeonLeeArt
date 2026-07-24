import { Client } from "@notionhq/client";
import type { ClientOptions } from "@notionhq/client/build/src/Client";

type NotionItem = { label: string; href: string };

export const getNotionItems = async (
  options: ClientOptions,
): Promise<NotionItem[]> => {
  const auth = options.auth ?? import.meta.env.NOTION_API_KEY ?? import.meta.env.NOTION_TOKEN;
  const databaseId = import.meta.env.DATABASE_ID ?? import.meta.env.NOTION_DATABASE_ID;

  if (!auth || !databaseId) {
    console.warn(
      "[Notion] Missing NOTION_API_KEY/NOTION_TOKEN or DATABASE_ID. Skipping gallery items.",
    );
    return [];
  }

  const notion = new Client({ ...options, auth });

  try {
    const response = await notion.databases.query({
      database_id: databaseId,
    });

    return response.results
      .map((page) => {
        if ("properties" in page) {
          const title = page.properties.Title;
          if (title && "type" in title && title.type === "title") {
            return {
              label: title.title.at(0)?.plain_text,
              href: title.title.at(1)?.plain_text,
            };
          }
        }
        return false;
      })
      .filter((item): item is NotionItem => !!item);
  } catch (error) {
    console.warn(
      "[Notion] Unable to load items. Check that your integration token and database ID are valid.",
      error,
    );
    return [];
  }
};
