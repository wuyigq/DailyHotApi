import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const routesDirName = "routes";
const routesDirPath = path.join(__dirname, routesDirName);

export const excludeRoutes: string[] = [];

const findRouteFiles = (dirPath: string, allFiles: string[] = [], basePath: string = ""): string[] => {
  const items = fs.readdirSync(dirPath);

  items.forEach((item) => {
    const fullPath = path.join(dirPath, item);
    const relativePath = basePath ? path.posix.join(basePath, item) : item;
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      findRouteFiles(fullPath, allFiles, relativePath);
      return;
    }

    if (stat.isFile() && (item.endsWith(".ts") || item.endsWith(".js")) && !item.endsWith(".d.ts")) {
      allFiles.push(relativePath.replace(/\.(ts|js)$/, ""));
    }
  });

  return allFiles;
};

export const allRoutePath = (() => {
  if (!fs.existsSync(routesDirPath) || !fs.statSync(routesDirPath).isDirectory()) {
    console.error(`📂 The directory ${routesDirPath} does not exist or is not a directory`);
    return [];
  }

  return findRouteFiles(routesDirPath).sort((left, right) => left.localeCompare(right));
})();

export const routeCount = allRoutePath.length;
