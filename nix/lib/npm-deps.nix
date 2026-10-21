{
  fetchNpmDeps,
  repositoryRoot,
}:
fetchNpmDeps {
  name = "artifact-plane-npm-deps";
  src = builtins.path {
    path = "${repositoryRoot}/apps/artifact-plane";
    name = "artifact-plane-source";
  };
  hash = "sha256-qiGIcs/VDTNF3++273I2fFTs2qndyJEjFMEPJ9K86x8=";
}
