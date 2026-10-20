{
  runCommand,
  nodejs_24,
  git,
  inputs,
  stdenv,
}:
let
  packages = inputs.self.packages.${stdenv.hostPlatform.system};
in
runCommand "package-smoke"
  {
    nativeBuildInputs = [
      nodejs_24
      git
    ];
  }
  ''
    node ${../../tests/smoke.mjs} ${packages.se-adopt}/bin/se-adopt ${packages.artifact-plane}
    touch "$out"
  ''
