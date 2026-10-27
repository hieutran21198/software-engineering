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
  hash = "sha256-GtQrwy/S6o7Ue7C/8Dj4ICghbxaft1JA7yRr1+74fBs=";
}
