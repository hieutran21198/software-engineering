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
  hash = "sha256-D1sBFU8FdiVHGpeOOAbgyG3OwnceRsiM15ZqcOs5d38=";
}
