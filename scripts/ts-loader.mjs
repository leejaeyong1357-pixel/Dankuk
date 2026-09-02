/** 검증 스크립트에서 TS 소스를 그대로 import 하기 위한 최소 로더 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const ROOT = process.cwd();

export async function resolve(specifier, context, next) {
  // "@/..." 는 프로젝트 루트 기준 절대 경로로 해석한다 (tsconfig paths 와 동일)
  if (specifier.startsWith("@/")) {
    return { url: pathToFileURL(path.join(ROOT, specifier.slice(2))).href, shortCircuit: true };
  }
  if ((specifier.startsWith("./") || specifier.startsWith("../")) && !/\.[a-z]+$/.test(specifier)) {
    return next(specifier + ".ts", context);
  }
  return next(specifier, context);
}

export async function load(url, context, next) {
  if (url.endsWith(".ts")) {
    const source = readFileSync(fileURLToPath(url), "utf8");
    const out = ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
    });
    return { format: "module", shortCircuit: true, source: out.outputText };
  }
  if (url.endsWith(".json")) {
    const source = readFileSync(fileURLToPath(url), "utf8");
    return { format: "module", shortCircuit: true, source: `export default ${source}` };
  }
  return next(url, context);
}
