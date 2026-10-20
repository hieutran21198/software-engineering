{
  lib,
  stdenv,
  buildNpmPackage,
  callPackage,
  nodejs_24,
  makeWrapper,
  git,
  autoPatchelfHook,
  patchelfUnstable,
  inputs,
}:
buildNpmPackage {
  pname = "artifact-plane";
  version = (lib.importJSON "${inputs.self.outPath}/apps/artifact-plane/package.json").version;
  src = builtins.path {
    path = "${inputs.self.outPath}/apps/artifact-plane";
    name = "artifact-plane-source";
  };
  nodejs = nodejs_24;
  npmDeps = callPackage ../../lib/npm-deps.nix { repositoryRoot = inputs.self.outPath; };
  npmInstallFlags = [ "--ignore-scripts" ];
  npmRebuildFlags = [ "--ignore-scripts" ];
  nativeBuildInputs = [
    makeWrapper
  ]
  # patchelf 0.15 overwrites libvips initialization code when adding an RPATH.
  ++ lib.optionals stdenv.hostPlatform.isLinux [
    patchelfUnstable
    autoPatchelfHook
  ];
  buildInputs = lib.optionals stdenv.hostPlatform.isLinux [ stdenv.cc.cc.lib ];
  installPhase = ''
    runHook preInstall
    npm prune --omit=dev --ignore-scripts
    mkdir -p "$out/lib/artifact-plane" "$out/bin"
    cp -r server src scripts dist node_modules package.json "$out/lib/artifact-plane/"
    makeWrapper ${nodejs_24}/bin/node "$out/bin/artifact-plane" \
      --add-flags "$out/lib/artifact-plane/server/app.js" \
      --prefix PATH : ${lib.makeBinPath [ git ]}
    runHook postInstall
  '';
  preFixup =
    let
      platform = if stdenv.hostPlatform.isDarwin then "darwin" else "linux";
      architecture = if stdenv.hostPlatform.isAarch64 then "arm64" else "x64";
    in
    ''
      # The ONNX tarball includes several platforms; retain only this target.
      native="$out/lib/artifact-plane/node_modules/onnxruntime-node/bin/napi-v3"
      for platform in "$native"/*; do
        if [ "$(basename "$platform")" != "${platform}" ]; then
          rm -rf "$platform"
        fi
      done
      for architecture in "$native/${platform}"/*; do
        if [ "$(basename "$architecture")" != "${architecture}" ]; then
          rm -rf "$architecture"
        fi
      done
    '';
  meta = {
    description = "Local workbench and MCP server for ADD repositories";
    homepage = "https://github.com/hieutran21198/software-engineering";
    mainProgram = "artifact-plane";
    platforms = [
      "x86_64-linux"
      "aarch64-linux"
      "x86_64-darwin"
      "aarch64-darwin"
    ];
  };
}
