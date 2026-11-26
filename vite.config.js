import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const root = dirname(fileURLToPath(import.meta.url));
export default {
  build: {
    rollupOptions: {
      input: {
        main: resolve(root, "index.html"),
        syria: resolve(root, "syria/index.html"),
      },
    },
  },
};
