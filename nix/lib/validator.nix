{
  buildNpmPackage,
  callPackage,
  nodejs_24,
  repositoryRoot,
}:
buildNpmPackage {
  pname = "se-adopt-validator";
  version = "1.0.0";
  src = builtins.path {
    path = "${repositoryRoot}/apps/artifact-plane";
    name = "artifact-plane-source";
  };
  nodejs = nodejs_24;
  npmDeps = callPackage ./npm-deps.nix { inherit repositoryRoot; };
  npmInstallFlags = [ "--ignore-scripts" ];
  npmRebuildFlags = [ "--ignore-scripts" ];
  buildPhase = ''
    runHook preBuild
    node scripts/build-validator.mjs "$TMPDIR/validator"
    runHook postBuild
  '';
  installPhase = ''
    mkdir -p "$out"
    cp "$TMPDIR/validator/add-validate.mjs" "$out/"
  '';
}
