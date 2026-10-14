import { readFile, lstat } from "node:fs/promises";
import { join } from "node:path";
import { createHash } from "node:crypto";
export const MODEL = "Xenova/paraphrase-multilingual-MiniLM-L12-v2";
export const MODEL_REVISION = "2c4055b12046f11709e9df2c122e59ffbdc2f900";
export const MODEL_FILES = [
  "config.json",
  "tokenizer.json",
  "tokenizer_config.json",
  "special_tokens_map.json",
  "onnx/model_quantized.onnx",
];
export const modelSignature = MODEL + "@" + MODEL_REVISION;
export function normalizeVector(value) {
  const v = Array.from(value, Number);
  if (!v.length || v.some((x) => !Number.isFinite(x)))
    throw Error("Invalid embedding vector");
  const norm = Math.hypot(...v);
  if (!norm) throw Error("Empty embedding vector");
  return v.map((x) => x / norm);
}
export function createLocalEmbedder(stateDir) {
  let pipelinePromise, extractor;
  const verified = new Map();
  const directory = join(stateDir, "models");
  return {
    signature: modelSignature,
    async embed(texts) {
      const manifest = JSON.parse(
        await readFile(join(directory, "manifest.json"), "utf8"),
      );
      if (manifest.model !== MODEL || manifest.revision !== MODEL_REVISION)
        throw Error("Pinned flow model manifest is missing or invalid");
      for (const file of MODEL_FILES) {
        const path = join(directory, MODEL, file),
          info = await lstat(path);
        if (!info.isFile()) throw Error("Invalid flow model asset");
        const stamp = [
          info.dev,
          info.ino,
          info.size,
          info.mtimeMs,
          info.ctimeMs,
          manifest.files[file],
        ].join(":");
        const hash =
          verified.get(path)?.stamp === stamp
            ? verified.get(path).hash
            : createHash("sha256")
                .update(await readFile(path))
                .digest("hex");
        verified.set(path, { stamp, hash });
        if (hash !== manifest.files[file])
          throw Error("Corrupt flow model asset: " + file);
      }
      pipelinePromise ??= (async () => {
        const { env, pipeline } = await import("@huggingface/transformers");
        env.allowRemoteModels = false;
        env.allowLocalModels = true;
        env.localModelPath = directory + "/";
        env.useBrowserCache = false;
        env.backends.onnx.wasm.wasmPaths = new URL(
          "./",
          import.meta.resolve("onnxruntime-web"),
        ).pathname;
        return pipeline("feature-extraction", MODEL, {
          device: "cpu",
          dtype: "q8",
          local_files_only: true,
        });
      })();
      extractor = await pipelinePromise;
      const vectors = [];
      for (const text of texts) {
        const output = await extractor(text, {
          pooling: "mean",
          normalize: true,
          truncation: true,
          max_length: 128,
        });
        vectors.push(normalizeVector(output.data));
      }
      return vectors;
    },
    split(text) {
      if (!extractor) throw Error("Flow tokenizer is unavailable");
      const tokens = extractor.tokenizer.encode(text, {
          add_special_tokens: false,
        }),
        chunks = [];
      for (let i = 0; i < tokens.length; ) {
        let end = Math.min(i + 126, tokens.length),
          chunk;
        do {
          chunk = extractor.tokenizer.decode(tokens.slice(i, end), {
            skip_special_tokens: true,
          });
          if (extractor.tokenizer.encode(chunk).length <= 128) break;
          end--;
        } while (end > i);
        if (end <= i) throw Error("A source token exceeds the model limit");
        chunks.push(chunk);
        i = end;
      }
      return chunks;
    },
  };
}
