{
  lib,
  buildGoModule,
  callPackage,
  inputs,
}:
let
  repositoryRoot = inputs.self.outPath;
  root = /. + builtins.unsafeDiscardStringContext repositoryRoot;
  validator = callPackage ../../lib/validator.nix { inherit repositoryRoot; };
in
buildGoModule {
  pname = "se-adopt";
  version = "3.1.0";
  src = lib.fileset.toSource {
    inherit root;
    fileset = lib.fileset.unions (
      map (path: root + "/${path}") [
        "go.mod"
        "cmd/se-adopt"
        "internal/adopt"
        "src/archs"
        "src/utils/agents/skills"
        "docs/artifact-driven"
      ]
    );
  };
  vendorHash = null;
  subPackages = [ "cmd/se-adopt" ];
  preBuild = ''
    cp ${validator}/add-validate.mjs docs/artifact-driven/tools/add-validate.mjs
  '';
  checkPhase = ''
    runHook preCheck
    go test ./cmd/se-adopt ./internal/adopt
    runHook postCheck
  '';
  meta = {
    description = "Adopt the bundled ADD and story-driven knowledge architectures";
    homepage = "https://github.com/hieutran21198/software-engineering";
    mainProgram = "se-adopt";
    platforms = [
      "x86_64-linux"
      "aarch64-linux"
      "x86_64-darwin"
      "aarch64-darwin"
    ];
  };
}
