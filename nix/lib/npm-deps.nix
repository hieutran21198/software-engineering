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
  hash = "sha256-1bQQUpIiMqnCnx/1y0HQq8UUXHFJQ3LnnNLVNx51eL8=";
}
