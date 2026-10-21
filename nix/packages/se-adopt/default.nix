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
  # se-adopt releases carry the ADD version: tag v<current_version>.
  addVersion = lib.pipe "${repositoryRoot}/docs/artifacts/artifact-driven/README.md" [
    builtins.readFile
    (lib.splitString "\n")
    (map (builtins.match "current_version: ([0-9]+\\.[0-9]+\\.[0-9]+)"))
    (lib.findFirst (match: match != null) (throw "The ADD identity record has no current_version."))
    builtins.head
  ];
in
buildGoModule {
  pname = "se-adopt";
  version = addVersion;
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
