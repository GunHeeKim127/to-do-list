export const DEFAULT_TAGS = ["할 일", "프로젝트", "미팅"] as const;
export type TagCategory = typeof DEFAULT_TAGS[number] | "기타";

export const isDefaultTag = (tag: string): tag is typeof DEFAULT_TAGS[number] =>
  DEFAULT_TAGS.some((item) => item === tag);

export const getTagCategory = (tag: string): TagCategory =>
  isDefaultTag(tag) ? tag : "기타";

export const getTagClassName = (tag: string) => {
  const category = getTagCategory(tag);
  if (category === "할 일") return "tag-todo";
  if (category === "프로젝트") return "tag-project";
  if (category === "미팅") return "tag-meeting";
  return "tag-other";
};
