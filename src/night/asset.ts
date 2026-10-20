// Every public asset goes through here so the static export works from any sub-path
export const asset = (p: string) => "./" + p.replace(/^\.?\/+/, "");
