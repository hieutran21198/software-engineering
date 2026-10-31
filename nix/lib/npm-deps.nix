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
  hash = "sha256-0S0XjhTFYATqmzX0YesrYROEjHGFoX/o3XyCys79ZF0=";
}
